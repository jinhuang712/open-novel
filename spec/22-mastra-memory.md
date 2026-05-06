# Spec 22 — Mastra Memory 落地细节

> 与 [plan/12 §四层记忆模型](../plan/12-memory-and-context.md) 对齐 — 这一篇是 **L2 (会话记忆)** 的具体落地。L3 learnings 在 spec/01 + plan/06,L4 知识图谱在 spec/16-21,L1 装配在 spec/23。

## 数据库分工 (与 spec/01 边界)

| 数据库 | 路径 | 内容 | 维护方 |
|---|---|---|---|
| `runtime.db` | `~/.open-novel/runtime.db` | Mastra Memory 全部 thread + messages | Mastra 自动 schema |
| `workspace.db` | `~/.open-novel/workspaces/{projectId}/workspace.db` | 项目数据: chapters, settings, entities, relations, learnings, approvals, history, dependencies, paragraph_anchors, paragraph_embeddings, concepts, concept_refs, foreshadowings | 应用层 (见 spec/01) |
| `compressed_messages` 表 | `runtime.db` 内,**应用层扩展** | 老消息 summarize 后的缓存 (见 §可选历史压缩) | 应用层 |

**关键边界**:

- `runtime.db` 是 **跨项目共享**(单文件)但**逻辑隔离**: thread 名字带 projectId,resource 字段也带 projectId。Mastra `Memory` 内部按 resource filter。
- `workspace.db` 是 **每项目一文件** (LRU(3) 连接池,见 plan/04)。两个 db 不混。
- 唯一例外: **spec/07 状态机** 的 session.json 是文件 (`~/.open-novel/workspaces/{X}/runtime/session.json`),不进任何 db。

## Mastra Memory 自带 schema (POC 关注的最小子集)

`@mastra/memory@1.4.x` 默认建以下表 (具体表名以实际 sdk 为准):

- `mastra_threads` — `id, resource, title, metadata, created_at, updated_at`
- `mastra_messages` — `id, thread_id, role, content (json), tool_calls (json), created_at`

## 配置决策

```ts
// lib/agents/memory.ts
import { Memory } from '@mastra/memory'
import { LibSQLStore } from '@mastra/libsql'

export const memory = new Memory({
  storage: new LibSQLStore({
    url: 'file:' + path.join(os.homedir(), '.open-novel', 'runtime.db'),
  }),
  options: {
    lastMessages: 30,        // 1M ctx 下放宽 (旧设计 12 是基于 128K ctx 假设的错误产物)
    semanticRecall: false,   // POC 关闭, 见下
    workingMemory: false,    // POC 关闭, 与"L3 仅 Reflector 写"原则冲突
  },
})
```

### 决策 1: `lastMessages: 30`

DeepSeek V4 实测 ctx 上限 1M (spec/00 §C),30 条 messages × 平均 500 token ≈ 15K,**远不会挤压一致性 retrieve 的空间**。

历史包袱: 之前文档曾设 12,理由是"为省 token 防 ctx 爆";实查 V4 真实 ctx 后,这个理由作废。新值 30 给 plan / write 模式典型 session 提供完整对话历史,不至于"用户回头说'上次那个修改'已经被滑出窗口"。

### 决策 2: `semanticRecall: false` (POC 关闭)

关闭原因:

- 需要 embedding provider (BGE-M3 / DeepSeek / OpenAI),与 spec/18 决策耦合,而 spec/18 标 deferred
- 关闭时 Mastra 用纯顺序 lastMessages,30 条够 POC 用
- 长 session 真的需要"按语义召回老消息"再打开 — W11 评估窗口

打开时 (W11+):

```ts
semanticRecall: {
  topK: 4,
  messageRange: { before: 1, after: 1 },
  scope: 'thread',           // 仅本 thread,不跨 thread
}
```

### 决策 3: `workingMemory: false`

Mastra working memory 是把 LLM 摘要存为单条永久 markdown,这与 plan/12 的 "L3 仅 Reflector 写入"原则冲突 — 不允许 LLM 在 stream 中直接 upsert。所以关。

替代:用 `compressed_messages` 表 (见下),**仅在长 session 用户主动开启时**由后台 Flash 异步 summarize,而非 LLM stream 中。

## thread 与 resource 命名规则

```
thread id   = `proj:${projectId}:session:${sessionId}`
resource id = `${projectId}`
```

- `projectId` = workspace 目录名 (uuid v7)
- `sessionId` = 用户每次"新建对话"或"重启 app" 创建一个新 sessionId (uuid v7)

**isolation 强约束**:

- 所有 streamVNext 必须传 `memory: { thread, resource }`,不传报错 (见 plan/02 §多项目隔离)
- 我们再加一层 wrapper `streamWithGuard` 二次校验 (见 §保证 resource 隔离)

## 保证 resource 隔离 (defense-in-depth)

Mastra 内部按 resource filter,但我们再加一层:

```ts
// lib/agents/memory-guard.ts
export async function streamWithGuard(agent, messages, opts) {
  if (!opts.memory?.thread || !opts.memory?.resource) {
    throw new Error('memory.thread + memory.resource is required')
  }
  if (!opts.memory.thread.startsWith(`proj:${opts.memory.resource}:`)) {
    throw new Error('thread/resource projectId mismatch')
  }
  return agent.streamVNext(messages, opts)
}
```

所有 Agent 调用必须经 `streamWithGuard`,直接调 `streamVNext` 在 lint 中报错 (见 spec/14 §测试规约)。

## sessionId 的 lifecycle

- **创建**: 用户首次进项目 / 点"新对话"按钮 / 启动 app 时无活动 session → 生成新 sessionId
- **保留**: 写入 `~/.open-novel/workspaces/{X}/runtime/session.json`
- **恢复**: 启动时读 session.json,验证 thread 在 runtime.db 还在 → 接续;否则起新
- **GC**: 30 天没活动的 thread 自动 archive (见下)

## thread GC

```sql
-- 每周自动跑一次 (W11 实现)
DELETE FROM mastra_messages
WHERE thread_id IN (
  SELECT id FROM mastra_threads
  WHERE updated_at < datetime('now', '-30 days')
)
```

archive 而非真删:

```sql
CREATE TABLE archived_threads (
  id TEXT PRIMARY KEY,
  resource TEXT,
  archived_at INTEGER,
  message_count INTEGER,
  metadata TEXT
)
```

archived 后,前端 thread 列表按 `archived_at IS NULL` 过滤;Settings 里有"恢复已归档对话"入口。

## 可选历史压缩 (`compressed_messages` 表) — POC 默认关

放在 `runtime.db` (与 mastra_messages 同库),让 cross-thread join 简单:

```sql
CREATE TABLE compressed_messages (
  id TEXT PRIMARY KEY,
  thread_id TEXT NOT NULL,
  resource TEXT NOT NULL,
  message_range_start INTEGER NOT NULL,
  message_range_end INTEGER NOT NULL,
  message_count INTEGER NOT NULL,
  cascade_group_id TEXT,
  approval_ids TEXT,                       -- json array
  summary TEXT NOT NULL,
  preserved_anchors TEXT NOT NULL,         -- json: { entity_names, paragraph_anchors, approval_ids }
  compressed_by TEXT NOT NULL,
  created_at INTEGER NOT NULL
);

CREATE INDEX idx_compressed_thread ON compressed_messages(thread_id);
CREATE INDEX idx_compressed_resource ON compressed_messages(resource);
CREATE INDEX idx_compressed_cascade ON compressed_messages(cascade_group_id) WHERE cascade_group_id IS NOT NULL;
```

**为什么 POC 默认关**:

- 1M ctx 下,30 条 mastra_messages 远不会挤压
- 摘要本身有损,主动制造的有损会牺牲一致性
- 历史已有 lastMessages 滑窗会自然丢弃极老消息(超出 30 条窗口的不进 prompt,但仍存 mastra_messages 用于 UI 翻看 + Reflector 训练)

**何时打开** (用户主动 / W11 评估):

- 单 session 累计 > 200 条 messages,用户感觉"AI 忘了早期讨论的设定" → SettingsDialog 开启 `mastraMemory.compressedMessages.enabled = true`
- 开启后,任何 Agent stream 启动前若发现 mastra_messages > 60 条 (= lastMessages*2 buffer),触发后台 Flash summarize,把"非最新 30 条"按 cascade_group_id 分块写入 `compressed_messages`

**字段语义**:

- `message_range_start/end` — 用 `mastra_messages.created_at` 的 unix timestamp,而非 message id 范围
- `preserved_anchors` — 让"用户提到上次那个修改"能被 grep:`SELECT * FROM compressed_messages WHERE preserved_anchors LIKE '%林溪%'`
- `cascade_group_id` — 若该批 messages 都属于同一 cascade chain,记下来

**保留原文**:原 `mastra_messages` **不删**,只是后续 prompt 装载时若 compressed_messages 启用就用 summary 替代该范围内的原文。原文保留供:

- 用户在 ChatBox 翻看历史 (UI 直接读原 messages)
- Reflector 训练 (读原文 + 决定 + 反馈)
- 调试

## 历史压缩流程 (`compressOldMessages`,仅 enabled 时跑)

```ts
// lib/agents/compress-messages.ts
export async function compressOldMessages(threadId: string, projectId: string) {
  if (!settings.mastraMemory.compressedMessages.enabled) return

  const allMsgs = await db.runtime.mastraMessages.findByThread(threadId)
  const compressed = await db.runtime.compressedMessages.findByThread(threadId)
  const coveredEnd = compressed.length > 0
    ? Math.max(...compressed.map(c => c.message_range_end))
    : 0
  const uncompressed = allMsgs.filter(m => m.created_at > coveredEnd)

  const RECENT_KEEP = settings.mastraMemory.lastMessages       // 默认 30
  const needCompress = uncompressed.slice(0, Math.max(0, uncompressed.length - RECENT_KEEP))
  if (needCompress.length === 0) return

  const blocks = groupByCascadeOrSize(needCompress, { fallbackSize: 8 })

  for (const block of blocks) {
    const summary = await callJsonAgent({                       // spec/24
      label: 'compress-messages',
      model: deepseekFlash,
      schema: CompressionSummarySchema,                          // 见下
      maxTokens: 600,
      messages: [
        { role: 'system', content: SUMMARIZE_SYSTEM_PROMPT },
        { role: 'user', content: formatMessagesForSummary(block.messages) },
      ],
    })
    await db.runtime.compressedMessages.insert({
      id: ulid(),
      thread_id: threadId,
      resource: projectId,
      message_range_start: block.messages[0].created_at,
      message_range_end: block.messages.at(-1)!.created_at,
      message_count: block.messages.length,
      cascade_group_id: block.cascadeGroupId,
      approval_ids: JSON.stringify(block.approvalIds),
      summary: summary.summary,
      preserved_anchors: JSON.stringify(summary.anchors),
      compressed_by: 'deepseek-v4-flash',
      created_at: Date.now(),
    })
  }
}
```

`CompressionSummarySchema` (走 JSON mode, spec/24):

```ts
const CompressionSummarySchema = z.object({
  summary: z.string().min(1).max(800),                     // 1-2 句中文摘要
  anchors: z.object({
    entity_names: z.array(z.string()).max(20),
    paragraph_anchors: z.array(z.string()).max(20),
    approval_ids: z.array(z.string()).max(10),
  }),
})
```

**`SUMMARIZE_SYSTEM_PROMPT`** 模板 (spec/03):

```
你是对话摘要器。给你 N 条用户/助手/工具消息,用 1-2 句中文摘要保留:
- 用户的诉求 (改了什么 / 决定了什么)
- 关键 entity / paragraph_anchor / approvalId 的名称 (原样保留, 写入 anchors)
- 决议 (approve / reject / 部分同意)
不要总结 LLM 的废话和复读;不要发挥;失败的尝试要保留 (反例对未来 Reflector 也有用)。

输出 JSON 格式 (示例):
{
  "summary": "用户改林溪性别为女, approve 主修改 + 7 项 cascade, reject 1 项 (称谓微调), 反馈 '语气还是男性化'",
  "anchors": {
    "entity_names": ["林溪", "王伟"],
    "paragraph_anchors": ["ch_001#§5", "ch_001#§12"],
    "approval_ids": ["ap_xyz123"]
  }
}
请只输出 JSON 对象, 不要 markdown 代码块, 不要前后说明。
```

## 跨进程恢复实操

```ts
// lib/boot/rehydrate-session.ts
export async function rehydrateSession(projectId: string): Promise<RehydratedSession> {
  // 1. 读 session.json
  const sessionPath = path.join(workspaceRoot(projectId), 'runtime', 'session.json')
  const session = JSON.parse(await fs.readFile(sessionPath, 'utf-8').catch(() => '{}'))

  // 2. 恢复 / 创建 thread
  const threadId = session.threadId ?? `proj:${projectId}:session:${ulid()}`
  await mastraMemory.getOrCreateThread({
    id: threadId,
    resource: projectId,
    title: session.title ?? '未命名对话',
  })

  // 3. 恢复状态机 (spec/07)
  const machine = await rehydrateMachine(projectId)

  // 4. 恢复 pending approvals (spec/07 §source-of-truth)
  const pendingFromDb = await db.workspace(projectId).approvals.findPending({ since: now() - 24h })

  // 5. 写回 session.json (新增 threadId 若为新建)
  if (session.threadId !== threadId) {
    await fs.writeFile(sessionPath, JSON.stringify({ ...session, threadId }, null, 2))
  }

  return { threadId, projectId, machine, pendingApprovals: pendingFromDb }
}
```

`session.json` 字段:

```json
{
  "threadId": "proj:abc:session:01HX...",
  "machineState": "planning.awaitingApproval",
  "context": { "mode": "plan", "pendingApprovals": ["call_xyz"] },
  "title": "重写林溪角色设定",
  "savedAt": "2026-04-29T12:30:45Z"
}
```

## 与 spec/07 状态机的协同

spec/07 §持久化恢复 之前只描述了 machineState,本节补全了 threadId 字段。

`session.json` 的写入时机:

- 任何状态机迁移完成后 (`machine.subscribe` 在每次 transition 写入)
- threadId 不变就只更新 machineState 和 savedAt
- 状态机的 events (USER_INPUT / SWITCH_MODE / ...) 同时也是 mastra_messages 的写入触发点

## learnings 的注入(plan/06 + plan/12 §与 Reflector 协同)

learnings 在 `workspace.db`,**不**在 mastra_messages 里。注入是装配阶段做的,不是 Memory 自动:

```ts
// 在 spec/23 各 agent context builder 内部:
const learnings = await db.workspace(projectId).learnings.find({
  scope: { in: agentScopes(agentName) },           // 见 spec/23
  weight: { gte: 0.2 },
}).orderBy('weight', 'desc').limit(8)

const cardinalRuleLearnings = learnings.filter(l => l.scope === 'cardinal_rule')
// cardinal_rule scope 永远 top-1 不被裁 (与 spec/23 装配契约一致, spec/25)

const learningsBlock = learnings
  .map(l => `- ${l.text} (置信度: ${l.weight.toFixed(2)})`)
  .join('\n')

systemPrompt = baseSystemPrompt + `\n\n## 已学到的偏好 (项目级)\n${learningsBlock}`
```

注入的不是 mastra Memory thread 的一部分,所以**不持久化到 messages**;每次装配重新拼,反映最新的 learnings 状态。

## semantic recall 何时打开 (W11 评估)

打开条件 (任一):

- 用户单 session 累计原 messages > 200 条 + compressedMessages 已开启 + 仍经常错过历史细节
- spec/18 embedding 选型确定,且 paragraph_embeddings 跑通
- 用户主动在 SettingsDialog 开启"语义历史召回 (实验)"

打开后:

- 用 `paragraph_embeddings` 同款 provider (复用 embedding 调用,省 token)
- top K = 4,scope = thread (不跨 thread)
- recall 出来的老 messages 拼在 `compressed_messages` 之前 (作为补充而非替代)

## 测试 (与 spec/14 对齐)

```ts
describe('mastra memory', () => {
  it('thread/resource 不一致直接报错 (memory-guard)', () => { /* ... */ })
  it('compressOldMessages 默认 disabled, 不动 mastra_messages', () => { /* ... */ })
  it('compressOldMessages 开启后保留 entity 名 + approvalId', () => { /* ... */ })
  it('lastMessages=30 时, 30 条以下不触发任何裁剪', () => { /* ... */ })
  it('跨进程 rehydrate 后 threadId 与 session.json 一致', () => { /* ... */ })
  it('30 天 archive 后 thread 列表不显示但能恢复', () => { /* ... */ })
  it('learnings 按 weight 排序 + scope=cardinal_rule top-1 永远保留', () => { /* ... */ })
})
```

## 不解决的问题 / 待办

- **Mastra Memory schema 真实表名以 1.4.x sdk 为准**: spec/00 audit 里再核对一次,本节按逻辑视图描述
- **compressed_messages 的搜索**: 现在 `LIKE '%林溪%'` naïve;若 entity 多可加 FTS5
- **W11 时 semantic recall 与 paragraph_embeddings 的 embedding 复用边界**: 同 provider 但不同 namespace
- **多用户共享 thread**: 不支持 (plan/12 §不解决)
