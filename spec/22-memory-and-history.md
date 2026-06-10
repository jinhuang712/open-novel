# Spec 22 — Memory & History 落地细节

> **[info]** 本文件是四层记忆模型的主权文档,并定义 **L2 会话记忆** 的落地方式:应用层 memory 模块、`runtime.db` schema、thread/resource 隔离、历史压缩、卷级摘要、跨进程恢复与验证边界。当前结论是 **不依赖 Mastra Memory / LangChain Memory 等框架内置记忆抽象**。

## 设计目标

- **薄应用层**:只实现 thread / resource / messages / guard / recent fetch,不引入 Agent 框架记忆层。
- **多项目隔离**:所有 thread 必须以 `proj:{projectId}:` 开头,所有查询必须带 `resource = projectId`。
- **L4 优先**:历史消息只解释用户意图和对话上下文;一旦与设定、章节、知识图谱冲突,以 L4 为准。
- **可恢复但不自动有损**:默认保留原始 messages,压缩和语义召回都默认关闭。
- **可替换**:memory 模块只暴露稳定接口,未来换存储或 Agent runtime 不影响 context builder。

## 四层记忆模型

| 层 | 规模 | 位置 | 访问 | 生命周期 | 详见 |
|---|---|---|---|---|---|
| **L1 工作记忆** | 当前 stream 的 system + retrieve + messages + user | 内存 (装配后送入 LLM) | 各 agent context builder 装配 | 单次 generateText / streamText 调用 | [spec/23](./23-context-contracts.md) |
| **L2 会话记忆** | 单 session 对话历史 + tool calls | `runtime.db` messages 表 (跨项目共享文件, resource 隔离) | context builder 显式 `fetchRecent(threadId, limit)` | 单 session (默认 30 天不活动归档) | 本文件 |
| **L3 项目记忆** | ≤ 数百条 learnings (Reflector per-turn 写入) | `index.db` learnings 表 ([spec/01 §learnings](./01-storage-schema.md#learnings)) | 各 agent context builder 注入 system prompt | 跨 session 永久 (30 天自然衰减, 简化版无 archive) | [spec/23 §learnings 注入](./23-context-contracts.md) |
| **L4 知识图谱** | 全项目设定 + 章节 + 段锚 + relations + 概念 + foreshadowings + cardinal-rules.json | file (md) + `index.db` | assembleContext 写 / queryFacts 读 / analyzeImpact | 永久 (项目存在则存在) | spec/16-21 + spec/25 |

层间流动:L2 通过 append + lastMessages 滑窗进入 L1;L3 按 agent scope 取 top-K 注入 system prompt;L4 经 per-agent 契约 retrieve 装入 L1(均由 spec/23 context builder 完成)。

**关键不变性**:

- **L4 是单一事实源**:L1-L3 任何与 L4 冲突的内容,answer 时以 L4 为准(例:历史 message 里说"林溪是男的",但 L4 character 已改女,以 L4 为准)
- **L3 写入仅 Reflector**:不允许 LLM 在 stream 中直接 upsert learnings;只有 Reflector 在 `user_turns.status='done'` 时跑一次(per-turn 批次)
- **L1 装配契约严格写死**:各 agent 必装项不允许"为节省临时省略" — 1M ctx 给的就是奢侈装齐的本钱(spec/23)

## 数据库分工

| 存储 | 路径 | 职责 | 主权文档 |
|---|---|---|---|
| `runtime.db` | `~/.open-novel/runtime.db` | 跨项目会话库:threads / messages / compressed_messages / archived_threads。通过 resource 字段隔离项目。 | 本文件 |
| `index.db` | `~/.open-novel/workspaces/{projectId}/index.db` | 项目事实与派生索引:entities、timeline、relations、learnings、approvals、volume_summaries 等。 | [spec/01](./01-storage-schema.md#index-db-全表-schema-主权) |
| `session_history.db` | `~/.open-novel/workspaces/{projectId}/session_history.db` | 项目内过程数据:LLM 调用日志、tool run、成本、debug trace。不是 L2 message history。 | [spec/27](./27-session-history.md) |
| `runtime/session.json` | `~/.open-novel/workspaces/{projectId}/runtime/session.json` | 状态机恢复缓存:mode、currentTurnId、threadId、savedAt。approvals 仍以 index.db 为准。 | [spec/07](./07-mode-state-machine.md) |

## runtime.db schema

`runtime.db` 是全局单文件 SQLite,应用启动时开启 WAL、foreign_keys、busy_timeout。它不与项目 `index.db` 做跨库 JOIN;需要关联项目数据时由应用层用 `projectId` 分两次查询。

### threads

```sql
CREATE TABLE threads (
  id TEXT PRIMARY KEY,                     -- proj:{projectId}:session:{sessionId}
  resource TEXT NOT NULL,                  -- projectId
  title TEXT,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'archived')),
  metadata TEXT,                           -- JSON: mode / firstUserInput / tags
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,
  archived_at INTEGER
);
CREATE INDEX idx_threads_resource_updated ON threads(resource, updated_at DESC);
CREATE INDEX idx_threads_status ON threads(status, archived_at);
```

### messages

```sql
CREATE TABLE messages (
  id TEXT PRIMARY KEY,
  thread_id TEXT NOT NULL REFERENCES threads(id) ON DELETE CASCADE,
  resource TEXT NOT NULL,                  -- projectId,冗余字段用于 defense-in-depth
  turn_id TEXT,                            -- index.db user_turns.id,可空
  role TEXT NOT NULL CHECK (role IN ('system', 'user', 'assistant', 'tool')),
  content TEXT NOT NULL,                   -- JSON 序列化后的 ModelMessage content
  provider_metadata TEXT,                  -- JSON: reasoning_content / usage / finishReason
  tool_calls TEXT,                         -- JSON array,仅 assistant/tool 需要
  created_at INTEGER NOT NULL
);
CREATE INDEX idx_messages_thread_created ON messages(thread_id, created_at DESC);
CREATE INDEX idx_messages_resource_created ON messages(resource, created_at DESC);
CREATE INDEX idx_messages_turn ON messages(turn_id) WHERE turn_id IS NOT NULL;
```

### compressed_messages

长 session 的有损摘要缓存,默认关闭。字段语义沿用原设计:按 message 时间范围和 cascade_group_id 分块,保留 entity_names、paragraph_anchors、approval_ids 等锚点。

```sql
CREATE TABLE compressed_messages (
  id TEXT PRIMARY KEY,
  thread_id TEXT NOT NULL REFERENCES threads(id) ON DELETE CASCADE,
  resource TEXT NOT NULL,
  message_range_start INTEGER NOT NULL,
  message_range_end INTEGER NOT NULL,
  message_count INTEGER NOT NULL,
  cascade_group_id TEXT,
  approval_ids TEXT NOT NULL DEFAULT '[]',
  summary TEXT NOT NULL,
  preserved_anchors TEXT NOT NULL DEFAULT '{}',
  compressed_by TEXT NOT NULL,
  created_at INTEGER NOT NULL
);
CREATE INDEX idx_compressed_thread ON compressed_messages(thread_id, message_range_end DESC);
CREATE INDEX idx_compressed_resource ON compressed_messages(resource);
CREATE INDEX idx_compressed_cascade ON compressed_messages(cascade_group_id) WHERE cascade_group_id IS NOT NULL;
```

### archived_threads

归档审计表。归档不等于硬删;默认 30 天不活动的 thread 进入归档列表,用户可在 Settings 中恢复。

```sql
CREATE TABLE archived_threads (
  id TEXT PRIMARY KEY,
  resource TEXT NOT NULL,
  archived_at INTEGER NOT NULL,
  message_count INTEGER NOT NULL,
  metadata TEXT
);
CREATE INDEX idx_archived_resource ON archived_threads(resource, archived_at DESC);
```

## 应用层 memory 模块

模块位置建议为 `lib/agents/memory.ts`。它不负责 prompt 装配;只提供最小会话读写能力。

```ts
export type ThreadId = `proj:${string}:session:${string}`

export interface AppMemory {
  getOrCreateThread(input: {
    projectId: string
    sessionId: string
    title?: string
  }): Promise<{ threadId: ThreadId }>

  append(input: {
    projectId: string
    threadId: ThreadId
    messages: ModelMessage[]
    turnId?: string
  }): Promise<void>

  fetchRecent(input: {
    projectId: string
    threadId: ThreadId
    limit?: number
  }): Promise<ModelMessage[]>

  archiveInactive(cutoffDays: number): Promise<number>
}
```

### thread/resource guard

```ts
export function assertThreadResource(threadId: string, projectId: string): asserts threadId is ThreadId {
  if (!threadId.startsWith(`proj:${projectId}:`)) {
    throw new Error('thread/resource projectId mismatch')
  }
}

export async function fetchRecent({ projectId, threadId, limit = 30 }) {
  assertThreadResource(threadId, projectId)
  return runtimeDb.messages.findMany({
    where: { thread_id: threadId, resource: projectId },
    orderBy: { created_at: 'desc' },
    limit,
  }).then(rows => rows.reverse().map(deserializeModelMessage))
}
```

所有 L2 读取必须走 guard。禁止直接按 `thread_id` 查询而不带 `resource`。

## thread 命名与归属

```
main thread      = proj:{projectId}:session:{sessionId}
writer subthread = proj:{projectId}:session:{sessionId}:writer:{chapterId}
resource         = {projectId}
```

| 场景 | 是否写入 messages | thread | 理由 |
|---|---|---|---|
| 用户 ↔ Router / Writer / Humanizer 主对话 | 是 | main thread | 保留用户意图、生成结果、拒绝理由和后续追问上下文。 |
| Writer doom-loop 重写 | 是 | writer subthread | 让 Writer 看到 Validator 上次拒绝理由,但不污染主 thread。 |
| Checker / Validator / ReaderPanel / Reflector / hidden agents | 默认否 | 无 | 一次性分析结果进入业务表或 ApprovalCard;上下文由 spec/23 每次重装。 |
| LLM 调用 trace / tool run | 否 | 无 | 写入 per-project `session_history.db` 或 `trace/*.jsonl`。 |

## 写入时机

1. 用户发送输入后,先创建或恢复 thread,把 user message append 到 `runtime.db.messages`。
2. Router 结构化输出不作为普通 assistant message 持久化;只记录必要的模式/动作摘要和 trace。
3. Writer / Humanizer 自然语言流完成后 append assistant message;中途 chunk 不逐条入库。
4. ApprovalCard 决议写入 `index.db.approvals` 和 `index.db.user_turns`;同时把用户反馈摘要 append 到 thread,供后续“上次那个修改”可追溯。
5. Reflector 的 learnings 写 `index.db.learnings`,不写入 messages。

## 与 context builder 的边界

[spec/23](./23-context-contracts.md) 是 L1 prompt 装配主权。memory 模块只提供 `fetchRecent`;context builder 决定是否取 5 条、30 条、是否插入压缩摘要、是否把 L4 检索块放在 messages 前面。

```ts
const recentMessages = await appMemory.fetchRecent({
  projectId,
  threadId,
  limit: settings.memory.lastMessages,     // 默认 30
})

const messages: ModelMessage[] = [
  { role: 'system', content: systemPrompt },
  { role: 'system', content: retrievedBlock },
  ...optionalCompressedSummaries,
  ...recentMessages,
  { role: 'user', content: input.userInput },
]
```

如果 `recentMessages` 与 L4 冲突,system prompt 必须明确“以 L4 检索块为准”。

## DeepSeek 适配 middleware

DeepSeek 调用经 AI SDK model wrapper 统一处理 provider 特性,不把特殊逻辑散落在每个 agent 调用里。具体入口由 [spec/24](./24-json-output.md) 的 `callJsonAgent` / `callTextAgent` 使用。

- **reasoning_content round-trip**:历史 assistant message 缺 reasoning part 时注入空占位,避免下次请求失败。
- **provider metadata 保留**:assistant 完成后把 usage、finishReason、reasoning_content 摘要写入 `messages.provider_metadata`。
- **cache_control**:是否注入 `cache_control` 仍以 [spec/00 §H](./00-version-audit.md) 实查为准;不支持时删除该逻辑,功能不阻塞。

## 可选历史压缩

默认关闭。开启条件必须是用户显式启用,或后续产品决策把“长 session 压缩”设为可见开关。自动压缩会引入有损摘要,不能默默发生。

| 条件 | 行为 |
|---|---|
| `memory.compressedMessages.enabled = false` | 只取最近 N 条原始 messages。 |
| 开启且 thread 原始 messages > 200 | 后台 Flash 对非最新 30 条按 cascade 或固定大小分块摘要。 |
| 摘要失败 | 保留原文,记录 trace,不影响主流程。 |

摘要 schema 保留原设计:

```ts
const CompressionSummarySchema = z.object({
  summary: z.string().min(1).max(800),
  anchors: z.object({
    entity_names: z.array(z.string()).max(20),
    paragraph_anchors: z.array(z.string()).max(20),
    approval_ids: z.array(z.string()).max(10),
  }),
})
```

原始 messages 不删除。压缩只影响后续 prompt 装配,不影响 ChatBox 历史、Reflector 训练和调试。

## 卷级摘要

`volume_summaries` 属于项目长期事实辅助层,存放在 `index.db`,完整 schema 见 [spec/01 §volume_summaries](./01-storage-schema.md#volume-summaries)。它解决的是 50+ 章以后“早期章节原文不应每次全读”的问题,不是普通对话历史压缩。

| 维度 | compressed_messages | volume_summaries |
|---|---|---|
| 粒度 | 单 thread 对话片段 | 项目 / 卷 |
| 内容 | 用户改了什么、决议、锚点 | 主线进度、人设状态、伏笔、读者承诺、节奏阶段、守则状态 |
| 触发 | 长 session 且用户开启 | 每 20-30 章、接近 700K token、用户手动 |
| 注入 | 替代部分 old messages | 作为 spec/23 的长期上下文段 |

生成新卷级摘要时必须读取上一份摘要并做锚点累积;被跨卷 cascade 影响时,相关摘要标记 invalidated 并重建。

## tool output prune

tool 输出是中间产物,不是用户正文。保留策略:

| 章节区间 | 保留范围 |
|---|---|
| 最近 10 章 | 完整保留。 |
| 11-30 章 | 保留 cardinalRulesReport.summary、dropoffRisk、Validator contradictions 摘要。 |
| 30 章以前 | 只保留守则摘要和 dropoffRisk 数值;长期状态进入 volume_summary。 |

prune 不删除用户可见产物;只处理 `session_history.db` 或 `trace/` 中的大型 tool 结果。若需要调试原始 JSON,应在 prune 前导出。

## 跨进程恢复

```ts
export async function rehydrateSession(projectId: string): Promise<RehydratedSession> {
  const session = await readSessionJson(projectId).catch(() => ({}))
  const sessionId = session.sessionId ?? ulid()
  const { threadId } = await appMemory.getOrCreateThread({
    projectId,
    sessionId,
    title: session.title ?? '未命名对话',
  })

  const machine = await rehydrateMachine(projectId)       // approvals 以 index.db 为准
  const recentMessages = await appMemory.fetchRecent({ projectId, threadId, limit: 30 })
  const projectCheckpoint = await rehydrateProjectContext(projectId) // volume_summary + recent chapters

  await writeSessionJson(projectId, {
    ...session,
    sessionId,
    threadId,
    savedAt: new Date().toISOString(),
  })

  return { projectId, sessionId, threadId, machine, recentMessages, projectCheckpoint }
}
```

恢复顺序:先确认 thread/resource,再恢复状态机,再由 spec/23 在下一次调用时重新装配 L1。不要把旧的完整 prompt 快照当成可恢复状态。

## learnings 注入

`learnings` 属于 L3,存放在每项目 `index.db`,由 Reflector 写入,由 spec/23 context builder 注入 system prompt。它不写入 `runtime.db.messages`,也不由 memory 模块自动召回。

```ts
const learnings = await db.workspace(projectId).learnings.find({
  scope: { in: agentScopes(agentName) },
  weight: { gte: 0.2 },
}).orderBy('weight', 'desc').limit(8)
```

## semantic recall

默认关闭。只有同时满足以下条件时才允许打开:

- spec/18 的 embedding provider 和 sqlite-vec 路径已经跑通。
- 用户明确开启“语义历史召回(实验)”或项目达到长 session 症状。
- 召回范围限制在同一 thread + 同一 resource,不跨项目。

打开后召回结果只能作为补充消息放在压缩摘要之前;不能覆盖 L4 检索结果。

## 关键参数 (默认值, SettingsDialog 可调)

| 参数 | 默认值 | 调节范围 | 说明 |
|---|---|---|---|
| `memory.lastMessages` | 30 | 12 - 60 | 1M ctx 下不需要紧 |
| `memory.semanticRecall` | `false` | bool | 默认关 (见 §semantic recall) |
| `memory.compressedMessages.enabled` | `false` | bool | 默认关;长 session > 200 messages 用户主动开 |
| `thread.gcAfterDays` | 30 | 7 - 90 | 不活动 thread 归档 (进 `archived_threads`, 不硬删) |
| `learnings.topK` | 8 | 4 - 20 | 注入条数上限;不是为省 token,是为模型注意力 (注入 30 条经验反而稀释主任务) |
| `learnings.weightFloor` | 0.2 | 0.1 - 0.5 | < floor 不注入 (软过滤, 行保留) |
| `learnings.weightDecay` | 0.95 / 30 天 | 0.9 - 1.0 | 老经验衰减率 (后台 cron, 见 [spec/01 §learnings](./01-storage-schema.md#learnings)) |
| `learnings.cardinalRuleProtect` | `true` | bool | `scope='cardinal_rule'` 的 top-1 永远不被截断 ([spec/25](./25-cardinal-rules.md)) |

`memory.*` / `thread.*` 由本文件落地;`learnings.*` 的注入逻辑见 [spec/23 §learnings 注入](./23-context-contracts.md),weight 生命周期见 [spec/01 §learnings](./01-storage-schema.md#learnings)。

## 测试

```ts
describe('app memory', () => {
  it('thread/resource 不一致直接报错', () => {})
  it('fetchRecent 必须同时带 thread_id 和 resource', () => {})
  it('append 后按 created_at 恢复最近 30 条', () => {})
  it('compressedMessages 默认 disabled, 不写 compressed_messages', () => {})
  it('压缩摘要保留 entity 名、paragraph_anchor、approvalId', () => {})
  it('30 天不活动 thread 归档但不硬删 messages', () => {})
  it('rehydrateSession 使用 approvals 表恢复 pending 状态', () => {})
})
```

## 不解决的问题 / 待办

- **runtime.db schema 迁移编号**:首个代码落地 commit 需要确定 migration 文件命名和 user_version 策略。
- **compressed_messages 搜索**:当前可用 LIKE 或 JSON 过滤;entity 数量大后再评估 FTS5。
- **DeepSeek cache_control**:以 spec/00 §H 实查为准,不作为功能前置条件。
- **volume_summary invalidation**:跨卷设定 cascade 后的自动重建策略需要在实现时补测试。
- **多用户共享 thread**:POC 不支持。

## ADR

| 决策 | 结论 | 理由 |
|---|---|---|
| 是否使用框架内置 Memory | 不用;采用应用层 memory 模块 | thread/resource 隔离和 recent fetch 需求很小,自写更稳定,避免框架版本风险。 |
| messages 放哪里 | `~/.open-novel/runtime.db` | 跨项目会话统一管理,通过 resource 隔离;项目过程数据仍留在 per-project `session_history.db`。 |
| 是否默认压缩历史 | 不默认 | 1M ctx 下最近 30 条消息成本低;自动摘要有损,可能伤害一致性。 |
| 历史消息与 L4 冲突时谁优先 | L4 优先 | 读者看到的是最终设定与正文,不是旧对话中的中间想法。 |
