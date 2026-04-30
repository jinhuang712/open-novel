# 06 — Cascade 一致性与反馈学习

## Cascade 一致性

### 问题

用户的核心痛点之一:**"改了一个角色资料,后面写出来的章节自相矛盾"**。例如把主角性别从男改女后,后续章节里仍然用"兄弟"、"小子"等男性化称谓。

### 解决方案: Validator 主动扫描 + 用户审批 cascade

每次设定写入 (writeSetting 落盘后) 触发 Validator 反查:

```
writeSetting 完成 → Validator 入场
   │
   1. 读取本次变更的实体 (linId, fields_changed=['gender'])
   2. 用 entities 表查所有引用 → references 表的 source_file 列表
   3. 对每个 source_file 抽取相关段落,prompt Validator:
      "这段文字现在是否与 lin.gender=female 矛盾?
       若矛盾,提出修改建议 (snippet + suggested_replacement)"
   4. 收集所有 suggestion → cascadeChanges
   │
   ▼
Router 把 cascadeChanges 包进当前 ApprovalCard
   │
   ▼
用户决定:
   - 一键全过 → Writer 依次重写每段 → 各自走 needsApproval (但可以 batch approve)
   - 逐项审 → 一个一个看
   - 跳过 → 落盘的变更已生效,但下游不动
```

### Validator prompt 的关键约束

- **绝不静默修改文件**;只输出 `ChangeProposal[]`
- 每条 proposal 必须包含: `targetFile`, `from`, `to`, `currentText`, `proposedText`, `reason`
- 不确定时 (置信度低) 标记 `confidence: 'low'`,UI 用黄色警告提醒

### 性能考虑

- Validator 一次跑完整项目代价高,引入两层缓存:
  1. 基于 entity hash 的"已审过"标记 — 同样的实体未变就不重审
  2. 章节级 word_count + entity_count diff — 快速 short-circuit
- 重型项目 (>50 章) 提供"按章节范围审"开关,默认 ±5 章范围内

## React 式反馈学习

### 设计动机

用户希望系统**越用越懂自己**。直接微调模型代价过高 (DeepSeek 暂未开放微调),但我们可以把"经验"持久化为结构化数据,**自动注入到后续生成的 system prompt**,实现廉价但实用的"learning"。

### Reflector 触发时机 + 频率上限 (审计修正)

> audit 发现:每次审批闭环都 enqueue Reflector → 用户连点 20 个 cascade approve 就跑 20 次 LLM。Flash 模型也是钱。

每次以下事件后入队:
1. **审批闭环完成** (approve / reject + feedback)
2. **用户手动编辑了 Agent 生成的内容** (检测到 saved content 与 generated content 的 diff)

**频率上限**:
- **同一 cascade 链路内的 N 项审批合并为 1 次 reflect** — 整批数据丢给 Reflector 一次性提炼
- **每会话 (sessionId) Reflector 最多 5 次** — 超过则改用"批量"模式: 累积到下次 session 再跑
- **Reflector 调用本身有最小间隔** = 30s,防止快速连续审批导致并发 LLM
- 这些参数在 SettingsDialog → §模型分配中可调整 (advanced section)

入队伪码:

```ts
async function enqueueReflector(projectId: string, sessionId: string, items: ApprovalContext[]) {
  const recent = await db.reflectorJobs.findRecent(sessionId)
  if (recent.length >= 5) {
    // 改累积模式
    await db.reflectorJobs.appendDeferred(projectId, items)
    return
  }
  await reflectorQueue.add({ projectId, sessionId, items })
}
```

### Reflector 输入/输出

输入:
```json
{
  "context": {
    "agent": "writer",
    "mode": "write",
    "input": "...原始 prompt + 上下文...",
    "output": "...Agent 生成的内容...",
    "user_decision": "edited",
    "user_final_content": "...用户改后的内容...",
    "feedback_text": "短句太长,改短了"
  }
}
```

输出 (Zod 严格 schema):
```json
{
  "learnings": [
    {
      "scope": "project",
      "insight": "用户偏好≤25字短句,生成时多用句号少用逗号",
      "evidence": "本次将12处长句拆成短句",
      "applicable_agents": ["writer", "humanizer"]
    },
    {
      "scope": "project",
      "insight": "对话场景中尽量少用'地'字补语",
      "evidence": "用户删除了7处'XX地说'结构",
      "applicable_agents": ["writer"]
    }
  ]
}
```

### `learnings` 表 schema

```sql
CREATE TABLE learnings (
  id INTEGER PRIMARY KEY,
  project_id TEXT NOT NULL,
  scope TEXT NOT NULL,                  -- 'project' | 'global' | 'chapter:001'
  insight TEXT NOT NULL,
  evidence TEXT,
  applicable_agents TEXT,                -- JSON array
  weight REAL NOT NULL DEFAULT 1.0,      -- 命中加权,衰减老化
  hit_count INTEGER NOT NULL DEFAULT 0,
  last_hit_at TEXT,
  created_at TEXT NOT NULL
);
CREATE INDEX idx_learnings_scope ON learnings(project_id, scope);
```

### 注入策略

每次 Router 调用下游 Agent 前:
1. 取该 Agent applicable 的 learnings
2. 按 weight desc + recency 排序,取 top-K (默认 K=10)
3. 拼接为 system prompt section:
   ```
   ## 用户偏好 (从过往交互中学到的经验,请遵守)
   1. 用户偏好≤25字短句,生成时多用句号少用逗号 (命中12次)
   2. 对话场景中尽量少用'地'字补语 (命中7次)
   ...
   ```
4. 命中一次 weight += 0.5,长期不命中按周衰减 0.9

### 防止学坏

Reflector 输出经过用户审视:
- "已学到的偏好"面板可见所有 learnings,可手动删除/修改
- 每周自动汇总: "本周新学到 N 条经验,请检查"
- 经验冲突时 (insight 互斥),Reflector 自我合并或弹给用户决定

### 全局 vs 项目级 + Promote UI (审计补)

- `scope = 'project'`: 仅当前项目用 (默认)
- `scope = 'global'`: 跨项目,需要用户在面板上手动 promote

详细 promote UI 见 [spec/13-settings.md](../spec/13-settings.md) §学习偏好面板。要点:

- 项目级 → global 用 [⬆️ promote 全局] 按钮
- 同 insight 已有 global 时弹合并 dialog (新文本 / 旧文本 / merge / 取消)
- 全局 → 项目级用 [⬇️ 限定到当前项目]
- 删除是软删 (移到 `learnings_archive`,30 天可恢复)
- 每周新增 ≥ 5 条时自动弹"审视新偏好"提示

避免一个项目的特殊偏好污染其他风格不同的项目。

## 与 LLM 微调的对比

| 维度 | RAG 经验注入 (本方案) | 模型微调 |
|---|---|---|
| 启动成本 | 0 | 数据收集 + 训练 + 部署 |
| 增量学习 | 即时 | 需重新训练 |
| 可解释 | 全可见 | 黑盒 |
| 准确度 | 中 (受 prompt 长度限制) | 高 |
| 适合场景 | POC + 长尾 | 风格固化期 |

POC 阶段方案足够。后续如发现某些经验高度重复且稳定,可以 export 成数据集为微调做准备。
