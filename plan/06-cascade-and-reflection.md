# 06 — Cascade 一致性与反馈学习

## Cascade 一致性

### 问题

用户的核心痛点之一:**"改了一个角色资料,后面写出来的章节自相矛盾"**。例如把主角性别从男改女后,后续章节里仍然用"兄弟"、"小子"等男性化称谓。

### 解决方案: 内部递归 cascade + 整批审批 (W9 升级)

> **W9 重大升级 (见 plan/11-knowledge-graph.md)**: 旧版 cascade 是"现场 LLM 推理影响范围",已被证实对概念级 / 关系级 / 时间级 / 伏笔级改动全部漏检。新链路改为"先 SQL 出影响半径,再 LLM 二次过滤,递归在审批前内部跑完,整批一次审"。
>
> ⚠ **关键交互模型**: writeSetting / writeChapter **不直接落盘** (proposal-only,见 spec/06)。Cascade 递归全部在审批前的内部循环里完成,用户只看到一次最终汇总的 ChangeSet。

```
用户发起修改意图 (e.g. "把林川性别改成女性")
   │
   ▼
Writer 生成主修改 (in-memory,未落盘)
   │
   ▼
[内部递归循环 — 用户不可见]
   │
   ├ 第 1 轮 analyzeImpact (基于 main delta,见 spec/19):
   │   step 1: extractSemanticDelta — frontmatter / 正文 diff → 结构化 delta
   │   step 2: computeImpactRadius — 纯 SQL 出候选段集
   │             - entity_refs / concept_refs 命中 (weight=100)
   │             - 关系上下游 1 跳 (weight=50-90)
   │             - dependencies 锚点上下游 (weight=70)
   │             - timeline 区间内引用 (weight=80)
   │             - 语义相关 (embeddings topK,weight=cos×100)
   │   step 3: filterByLLM — Pro 批 5 段过滤 → ChangeProposal[1]
   │
   ├ Writer 内部短调用: 对每条 needsChange=true 项生成 afterText (内存,未落盘)
   │
   ├ 第 2 轮 analyzeImpact (基于第 1 轮 afterText 为新 delta):
   │   再算 SQL 影响半径 (必须严格收缩,weight 阈值 30→60)
   │   再 LLM filter → ChangeProposal[2]
   │
   ├ 第 3 轮 (若仍有候选,weight 阈值 60→90)
   │
   └ 终止条件: 候选空 / 半径不严格收缩 / 深度 = 3 (见 spec/19 §递归终止)
   │
   ▼
汇总 ChangeSet (主修改 + 所有 cascade proposal,含二级)
   │
   ▼
**一次** ApprovalCard 呈现整批:
   - 顶部影响图谱 (节点 = entity / file / concept,边 = 影响传播)
   - 每条 proposal 一行 diff (默认展开,可折叠)
   - 每条 proposal 勾选框 (默认勾)
   - [全选] [全不选] [一键同意勾选项] [手动编辑某条] [拒绝全部]
   │
   ▼
用户决定 → POST /api/approvals/{id}/resolve { decision, accepted_items: [...] }
   │
   ▼
后端 transaction 一次写所有 accepted 文件 (主 + cascade)
   │
   ▼
触发副作用 (见 plan/04 §审批通过后的副作用): 差量 reindex / snapshot / history group / Reflector 入队
```

### Validator + analyzeImpact 的关键约束 (升级后)

- **不现场 LLM 推影响范围** — analyzeImpact step 2 的 SQL 已覆盖,LLM 只做二次判断
- **递归全部在审批前完成** — 用户审之前所有"二级 / 三级 cascade"已被算出并合入同一 ChangeSet
- **绝不静默修改文件** — 任何文件变更必须经过整批 ApprovalCard 用户勾选
- **每条 proposal 必须含**: `anchorId`, `targetFile`, `needsChange`, `proposedText` (needsChange=true 时), `reason`, `confidence`, `cascadeLevel` (1=主 / 2=一级 / 3=二级)
- **不确定时 confidence='low'**,UI 用黄色警告 + 默认不勾选
- **needsChange=false 也必须给 reason** (审计需要,展示在影响图谱中作为"已分析但无需改动")

### 性能策略 (升级后,治标策略已撤)

- ~~按章节范围 ±5 章~~ — 已撤,改为 SQL 出完整候选 + weight 排序 + LLM 顶部 50 个分批过滤
- ~~entity hash 已审过标记~~ — 已无意义 (LLM 二次过滤本就只对未审段调用)
- ~~章节级 word_count + entity_count short-circuit~~ — 改为 anchor diff 短路 (无段变化即跳过)
- 新性能保证: SQL 影响半径 < 100ms (5K 段规模),LLM 二次过滤每批 5 段 ~3-5s
- **内部递归 ≤ 3 轮典型耗时 15-45s** — UI 在 Writer 出主修改后立刻显示进度 ("正在分析影响范围... 第 1 轮 / 第 2 轮 / 第 3 轮"),作者可看到内部进度但不能干预,直到 ChangeSet 出来

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

输出 — 走 [DeepSeek JSON mode (spec/24)](../spec/24-json-output.md), zod schema 见 spec/24 §Reflector 经验提炼:

```json
{
  "learnings": [
    {
      "insight": "用户偏好≤25字短句,生成时多用句号少用逗号",
      "evidence": "本次将12处长句拆成短句",
      "scope": "style",
      "applicableAgents": ["writer", "humanizer"],
      "suggestedWeight": 1.5
    },
    {
      "insight": "对话场景中尽量少用'地'字补语",
      "evidence": "用户删除了7处'XX地说'结构",
      "scope": "style",
      "applicableAgents": ["writer"],
      "suggestedWeight": 1.0
    }
  ],
  "rootApprovalId": "ap_xyz"
}
```

scope 枚举值 (与 spec/24 一致): `style`, `narrative`, `pacing`, `voice`, `worldview`, `character`, `consistency`, `relations`, `cardinal_rule`, `intent`, `mode`。

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

> 注入由 [spec/23 §learnings 注入到 system prompt](../spec/23-context-contracts.md) 的 per-agent context builder 统一做,所有 Agent 共享同一逻辑。本节给出 weight 调整与 scope 决策协议。

每次 Agent stream 启动前 (经 context builder):

1. 按当前 Agent 的 scope 集合查 (见 [spec/23 §agentScopes](../spec/23-context-contracts.md))
2. `WHERE weight >= 0.2` (低于 0.2 视为已失效)
3. 按 `weight desc` 排序,取 **top-8** (与 plan/12 §关键参数一致 — **不是为省 token,是为模型注意力**:注入 30 条经验反而稀释主任务,top-8 是"用户最强偏好集中,模型注意力不分散"的平衡点)
4. **`scope='cardinal_rule'` top-1 永远保留** (无论 weight 排序如何;spec/25 五大守则学习不可被一般经验挤掉)
5. 拼接为 system prompt section:
   ```
   ## 用户偏好与项目经验 (Reflector 沉淀)
   以下经验来自历次审批反馈,优先级由高到低。**遇到冲突时这些经验优先于通用风格**。

   - 用户偏好≤25字短句,生成时多用句号少用逗号  (置信度 1.50)
   - 对话场景中尽量少用'地'字补语                 (置信度 1.20, 守则)
   ...
   ```

### weight 调整协议

| 触发 | 调整 | 说明 |
|---|---|---|
| 初始入库 | weight = 1.0 (或 Reflector suggestedWeight) | Reflector 写入时 |
| 该 learning 命中 + 用户 approve 不修改 | +0.5 | 经验有效 |
| 该 learning 命中 + 用户 reject 或大幅 edit | -0.3 | 经验失效信号 |
| 30 天没命中 | × 0.95 | 自然衰减 |
| weight < 0.2 | 自动归档 → `learnings_archive` | 软删 (30 天可恢复) |

**`scope='cardinal_rule'` 例外**: 用户 reject 不降低 weight (那是用户拒绝的"违反守则的写法",不是拒绝"守则本身");只有用户在 SettingsDialog 显式调整阈值才生效 (spec/25)。

"命中"判定:Reflector 在审批闭环里写 `last_hit_at` 时,把当时 context builder 装载的 learnings ids 列表关联到该 approval 的 metadata,审批落定后回写 hit_count + weight (见 spec/23 prompt_traces 表)。

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
