# 06 — Cascade 一致性与反馈学习

## Cascade 一致性

### 问题

用户的核心痛点之一:**"改了一个角色资料,后面写出来的章节自相矛盾"**。例如把主角性别从男改女后,后续章节里仍然用"兄弟"、"小子"等男性化称谓。

### 解决方案: Validator 调 analyzeImpact + 用户审批 cascade (W9 升级)

> **W9 重大升级 (见 plan/11-knowledge-graph.md)**: 旧版 cascade 是"现场 LLM 推理影响范围",已被证实对概念级 / 关系级 / 时间级 / 伏笔级改动全部漏检。新链路改为"先 SQL 出影响半径,再 LLM 二次过滤"。

每次设定写入 (writeSetting 落盘后) 触发 Validator 反查:

```
writeSetting 完成 → Validator agent 入场
   │
   ▼
调 analyzeImpact 工具 (见 spec/19)
   │
   step 1: extractSemanticDelta — frontmatter / 正文 diff 翻译为结构化 delta
           (entity-attribute / entity-relation-add / concept-add / paragraph-rewrite ...)
   │
   step 2: computeImpactRadius — 纯 SQL 出候选段集
           - 直接 entity_refs / concept_refs 命中 (weight=100)
           - 关系上下游 1 跳 (weight=50-90)
           - dependencies 锚点上下游 (weight=70)
           - timeline 区间内的引用 (weight=80)
           - 语义相关 (embeddings.search topK,weight=cos×100)
   │
   step 3: filterByLLM — Pro 模型批量逐段过滤 (5 段一批)
           "原 X 改动,这段是否真需要改?给出 proposedText / reason / confidence"
   │
   step 4: 输出 ChangeProposal[] + 影响图谱 (UI 可视化)
   │
   ▼
Router 把 ChangeProposal[] + 影响图谱包进当前 ApprovalCard
   │
   ▼
用户决定:
   - 一键全过 → Writer 依次重写每段 → 各自走 needsApproval (可 batch approve)
   - 逐项审 → 一个一个看 (可看影响图谱定位"为什么这段被列出")
   - 跳过 → 落盘的变更已生效,但下游不动 (UI 提示"X 段未处理,Validator 已记录")
   │
   ▼
Writer 重写 → 触发递归 analyzeImpact (≤3 层,半径单调下降终止;见 spec/19 §递归终止)
```

### Validator prompt 的关键约束 (升级后)

- **不再现场 LLM 推影响范围** — analyzeImpact step 2 的 SQL 已覆盖,LLM 只做二次判断
- **绝不静默修改文件** — 只输出 `ChangeProposal[]`,落 ApprovalCard 待用户审
- 每条 proposal 必须包含: `anchorId`, `targetFile`, `needsChange`, `proposedText`(needsChange=true 时), `reason`, `confidence`
- 不确定时 confidence='low',UI 用黄色警告提醒
- `needsChange=false` 也必须给 reason (审计需要)

### 性能策略 (升级后,治标策略已撤)

- ~~按章节范围 ±5 章~~ — 已撤,改为 SQL 出完整候选 + weight 排序 + LLM 顶部 50 个分批过滤
- ~~entity hash 已审过标记~~ — 已无意义 (LLM 二次过滤本就只对未审段调用)
- ~~章节级 word_count + entity_count short-circuit~~ — 改为 anchor diff 短路 (无段变化即跳过)
- 新性能保证: SQL 影响半径 < 100ms (5K 段规模),LLM 二次过滤每批 5 段 ~3-5s,典型 cascade 总耗时 5-15s

## React 式反馈学习

### 设计动机

用户希望系统**越用越懂自己**。直接微调模型代价过高 (DeepSeek 暂未开放微调),但我们可以把"经验"持久化为结构化数据,**自动注入到后续生成的 system prompt**,实现廉价但实用的"learning"。

### Reflector 触发时机

每次以下事件后入队:
1. **审批闭环完成** (approve / reject + feedback)
2. **用户手动编辑了 Agent 生成的内容** (检测到 saved content 与 generated content 的 diff)

**唯一合并规则 — 不是频率上限,而是批次语义**:
- **同一 cascade 链路内的 N 项审批合并为 1 次 reflect** — 整批数据丢给 Reflector 一次性提炼,得到的 learnings 质量更高 (上下文完整),不是为省 token
- 决定一组审批是否同链路: 它们共享同一个 root `approval_id` (cascade 提议时的根审批),Worker 端按 root 聚合
- 批次窗口: cascade 链全部 resolve (approve/reject/dismiss 全决) 后立即跑;单次审批无 cascade 时直接跑

**不再设**:
- ~~每会话 ≤ 5 次~~ — 用户不在意 Flash 模型 token,合理就该跑
- ~~30s 最小间隔~~ — Reflector 入队是异步,本来就不阻塞
- ~~累积到下次 session~~ — 阻碍即时学习

入队伪码:

```ts
async function enqueueReflector(projectId: string, sessionId: string, items: ApprovalContext[]) {
  const rootApprovalId = items[0].cascadeRootApprovalId ?? items[0].approvalId
  // 同 root 的等齐: 等链路上所有 approval 都 resolved 才入队
  const allResolved = await db.approvals.allResolved(rootApprovalId)
  if (!allResolved) {
    await db.reflectorPending.upsert({ rootApprovalId, projectId, sessionId, items })
    return  // 等下次 resolve 事件来再 check
  }
  const fullBatch = await db.reflectorPending.drain(rootApprovalId)
  await reflectorQueue.add({ projectId, sessionId, items: fullBatch })
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
