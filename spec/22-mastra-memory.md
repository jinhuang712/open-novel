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

## Mastra Memory 自带 schema (本项目关注的最小子集)

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
    semanticRecall: false,   // 关闭, 见下
    workingMemory: false,    // 关闭, 与"L3 仅 Reflector 写"原则冲突
  },
})
```

### 决策 1: `lastMessages: 30`

DeepSeek V4 实测 ctx 上限 1M (spec/00 §C),30 条 messages × 平均 500 token ≈ 15K,**远不会挤压一致性 retrieve 的空间**。

历史包袱: 之前文档曾设 12,理由是"为省 token 防 ctx 爆";实查 V4 真实 ctx 后,这个理由作废。新值 30 给 plan / write 模式典型 session 提供完整对话历史,不至于"用户回头说'上次那个修改'已经被滑出窗口"。

### 决策 2: `semanticRecall: false`

关闭原因:

- 需要 embedding provider (BGE-M3 / DeepSeek / OpenAI),与 spec/18 决策耦合
- 关闭时 Mastra 用纯顺序 lastMessages,30 条够用
- 长 session 真的需要"按语义召回老消息"再打开

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

## DeepSeek 适配 middleware (借鉴 opencode `provider/transform.ts`)

DeepSeek 走 `@ai-sdk/openai-compatible`, 有两个**硬性 round-trip 要求**, 不处理直接 500 错误:

### 1. 历史 assistant 消息必须含 `reasoning_content` 字段(即使空)

opencode 实证 (`provider/transform.ts:273-289`): 任何 assistant 消息缺 `reasoning_content` 字段在下次回传时, DeepSeek API 报错。Mastra 把历史 messages 序列化回传给 DeepSeek 时, 默认未必保留这个字段。

**对策**: 在 `streamWithGuard` 之上加 transform middleware, 自动注入 `{ type: "reasoning", text: "" }` 占位:

```ts
// lib/agents/deepseek-middleware.ts
import { wrapLanguageModel, type LanguageModelV2Middleware } from 'ai'

export const deepseekMiddleware: LanguageModelV2Middleware = {
  transformParams: async ({ params }) => {
    if (params.type !== 'stream' && params.type !== 'generate') return params

    const prompt = params.prompt.map(msg => {
      if (msg.role !== 'assistant') return msg
      const content = Array.isArray(msg.content) ? msg.content : [{ type: 'text', text: msg.content }]
      const hasReasoning = content.some((p: any) => p.type === 'reasoning')
      if (hasReasoning) return msg
      return { ...msg, content: [...content, { type: 'reasoning', text: '' }] }
    })

    return { ...params, prompt }
  },
}

// 在 lib/agents/llm.ts 包裹 model
export const deepseekPro = wrapLanguageModel({
  model: createDeepSeekProvider(...).languageModel('deepseek-v4-pro'),
  middleware: [deepseekMiddleware],
})
```

**验证依赖 spec/00 §I**: Mastra `Agent` 是否接受 `wrapLanguageModel` 包装后的 model 实例。如不接受, **fallback** = 绕过 Mastra Agent, 直接用 Vercel AI SDK `streamText` / `generateObject`, Mastra 仅保留 Memory + Workflow 编排职能。

### 2. `reasoning_content` 字段透传

DeepSeek 把推理过程返回到 `providerOptions.openaiCompatible.reasoning_content` 字段。`@ai-sdk/openai-compatible` provider 自动设 `interleaved: { field: "reasoning_content" }`, 但 Mastra 在 messages 持久化时默认丢这个字段, 历史回传时缺失会报错。

**对策**: middleware 在 `transformParams` 入口把 `providerOptions.openaiCompatible.reasoning_content` 注入回 assistant 消息(若历史有保留)。具体实现见 callJsonAgent (spec/24)。

### 3. prompt cache_control 标记 (省 token)

DeepSeek prompt cache 是否真的支持 `cache_control: { type: "ephemeral" }` **待 spec/00 §H 实查**。假设支持, 标记策略 (借鉴 opencode `provider/transform.ts:328-377`):

```ts
// 在 deepseekMiddleware 内 (transformParams 阶段)
const system = prompt.filter(m => m.role === 'system').slice(0, 2)        // 前 2 段
const tail = prompt.filter(m => m.role !== 'system').slice(-2)            // 末尾 2 条

for (const msg of [...system, ...tail]) {
  if (Array.isArray(msg.content)) {
    const last = msg.content[msg.content.length - 1]
    if (last && last.type !== 'tool-approval-request') {
      last.providerOptions = {
        ...(last.providerOptions ?? {}),
        openaiCompatible: { cache_control: { type: 'ephemeral' } },
      }
    }
  } else {
    msg.providerOptions = {
      ...(msg.providerOptions ?? {}),
      openaiCompatible: { cache_control: { type: 'ephemeral' } },
    }
  }
}
```

**为什么是 system 前 2 段 + 末尾 2 条**:
- 前段: 五大守则文本 (spec/25, 几 KB) + agent stable header prompt (spec/03 T7), 这两段每次调用都不变, cache 命中率最高
- 末尾: 最近一次用户消息 + assistant 回复, 多轮对话场景下后续调用复用率高
- 中段不打: 中段是动态 retrieve (per-agent context contract spec/23 装配的产物), 每次调用都不一样, 打了也不命中, 浪费配额

**若 DeepSeek 不支持 cache_control 字段**: 删除 cache_control 注入逻辑, 仅靠 prompt 头部稳定排布 (spec/03 stable header) 争取客户端缓存或服务端可能的隐式缓存。功能不阻塞, 只是 token 成本更高。

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

## 可选历史压缩 (`compressed_messages` 表) — 默认关

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

**为什么默认关**:

- 1M ctx 下,30 条 mastra_messages 远不会挤压
- 摘要本身有损,主动制造的有损会牺牲一致性
- 历史已有 lastMessages 滑窗会自然丢弃极老消息(超出 30 条窗口的不进 prompt,但仍存 mastra_messages 用于 UI 翻看 + Reflector 训练)

**何时打开**:

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

## 卷级锚定摘要 (Volume-level Anchor Summary, 借鉴 opencode `compaction.ts:43-78`)

> 当一本网文写到 50+ 章, 即便 1M ctx 也开始吃紧 (50 章 × 章均 8K + 历史 cascade tool 输出 ≈ 700K tokens 接近上限)。锚定摘要把"本卷已立的设定 / 已埋的伏笔 / 读者承诺 / 节奏当前阶段"等**长期不变量**冻结成一份固定结构 Markdown, 后续生成只读摘要 + 最近 N 章原文, 不再翻 ch_001 到 ch_049 的全部历史。

### 与 compressed_messages 的区别

| 维度 | compressed_messages | volume_summary (本节新增) |
|---|---|---|
| 粒度 | 单 thread 内的对话片段 (按 cascade 分组) | 整个项目 / 整卷 |
| 内容 | 用户改了什么 + entity 名 + approvalId | 主线进度 + 人设状态 + 伏笔账本 + 守则状态 |
| 触发 | 用户主动 enable + 单 session > 200 条 messages | 每 20-30 章末 / 接近 700K token / 用户手动 |
| 写入方 | hidden `compaction` agent (复用 callJsonAgent) | hidden `volume-summarizer` agent |
| 存储 | runtime.db `compressed_messages` 表 | workspace.db `volume_summaries` 表 (项目级) |
| 注入位置 | mastra_messages 的滑窗替代 (替换原文) | spec/23 各 agent context builder 的"长期上下文"段 (与最近 N 章原文并列) |

### `volume_summaries` 表 (workspace.db)

```sql
CREATE TABLE volume_summaries (
  id TEXT PRIMARY KEY,
  volume_index INTEGER NOT NULL,                    -- 第几卷 (与 chapter.volume 对齐)
  chapter_range_start TEXT NOT NULL,                -- 例 ch_001
  chapter_range_end TEXT NOT NULL,                  -- 例 ch_030
  previous_summary_id TEXT,                         -- 上一份摘要 (锚点累积链)
  -- 固定结构 Markdown 各段
  main_line TEXT NOT NULL,                          -- ## 本卷主线进度
  established_personas TEXT NOT NULL,               -- ## 已建立人设 (角色名 → value_axes 当前状态)
  active_foreshadowings TEXT NOT NULL,              -- ## 待回收伏笔 (foreshadowing.id 列表 + deadline)
  worldview_invariants TEXT NOT NULL,               -- ## 关键世界观规则
  reader_promises TEXT NOT NULL,                    -- ## 待兑现读者承诺 (critical promise + deadline)
  pacing_phase TEXT NOT NULL,                       -- ## 节奏当前阶段 (开局/小高潮/转折/卷末/...)
  golden_chapter_set TEXT NOT NULL,                 -- ## 黄金三章已立设定 (前 3 章定下的不可违反基线, spec/25)
  cardinal_rule_state TEXT NOT NULL,                -- ## 五大守则当前状态 (各守则累计 finding 数 + last violation)
  raw_summary TEXT NOT NULL,                        -- 完整 Markdown (= 上述各段拼接, 用于直接注入 prompt)
  generated_by TEXT NOT NULL,                       -- 'deepseek-v4-flash'
  created_at INTEGER NOT NULL,
  approved_at INTEGER                               -- 用户在 SettingsDialog 审过摘要后置时间戳, 未审默认仍生效
);

CREATE INDEX idx_vol_summary_range ON volume_summaries(volume_index, chapter_range_end);
```

### 锚点累积 (借鉴 opencode `compaction.ts:124-135` 的 anchored summary)

新摘要生成时**读上一份摘要** (`previous_summary_id`), prompt 模板:

```
更新已锚定的摘要 (anchored summary) — 你需要把章节 ch_${range_start} 到 ch_${range_end} 这段时间的新事实合并进上一份摘要,
保留仍然成立的细节, 删除已经过时的细节, 不要重复发挥。

<previous-summary>
${previous_volume_summary.raw_summary}
</previous-summary>

<new-chapters>
${chapter_summaries_concat}    -- 不是原文, 是每章的 chapter_summary (chapter.md frontmatter)
</new-chapters>

输出格式 (固定 9 段 Markdown):
## 本卷主线进度
- ...

## 已建立人设
| 角色 | value_axes 当前状态 | 上次出场章节 |

## 待回收伏笔
| foreshadowing.id | 主题 | deadline | weight | 当前状态 |

## 关键世界观规则
- ...

## 待兑现读者承诺
| promise.id | 内容 | deadline | weight |

## 节奏当前阶段
[开局 | 小高潮 | 转折 | 卷末 | 完结前]

## 黄金三章已立设定
- 主角性格基线: ...
- 主线方向: ...
- 钩子类型: ...
(这部分一旦写定不能在后续摘要里改, 与五大守则 1 锚定)

## 五大守则当前状态
| 守则 | 累计 finding | 上次 critical 违反章节 |

## 关键决策与变更点
- 章节 ${ch_id}: ${决策}
```

### 触发时机

```ts
// 在 ChapterApproval 落盘后跑 (spec/06 onApprovalResolved hook)
async function maybeGenerateVolumeSummary(projectId: string, justApprovedChapter: ChapterId) {
  const lastSummary = await db.workspace(projectId).volumeSummaries.findLast()
  const chaptersAfter = lastSummary
    ? await db.workspace(projectId).chapters.countAfter(lastSummary.chapter_range_end)
    : await db.workspace(projectId).chapters.count()

  // 触发条件 (任一)
  const reachedChapterThreshold = chaptersAfter >= settings.volumeSummary.everyNChapters    // 默认 20
  const reachedTokenThreshold = await estimateContextTokens(projectId) > 700_000
  const userManualTrigger = false  // 由 SettingsDialog 按钮触发

  if (!reachedChapterThreshold && !reachedTokenThreshold && !userManualTrigger) return

  await runVolumeSummarizer(projectId, lastSummary?.chapter_range_end, justApprovedChapter)
}
```

### checkpoint-aware rehydrate (借鉴 opencode `v2/session.ts:234-265` `context()` 用 compaction 当 checkpoint)

opencode 的 `Session.context()` 取"最后一次 compaction 标记之后的所有消息" — 把 compaction 当成天然断点。我们对应版本: **rehydrate 时只读最后一份 volume_summary 之后的章节** + summary 本身, 不读更早的章节 / mastra_messages。

```ts
// lib/boot/rehydrate-session.ts (§跨进程恢复实操)
export async function rehydrateProjectContext(projectId: string) {
  const lastSummary = await db.workspace(projectId).volumeSummaries.findLast()
  const checkpointChapter = lastSummary?.chapter_range_end
  const recentChapters = checkpointChapter
    ? await db.workspace(projectId).chapters.findAfter(checkpointChapter)
    : await db.workspace(projectId).chapters.findAll()

  return {
    longTermContext: lastSummary?.raw_summary,                  // 注入 spec/23 各 agent 的"长期上下文"段
    recentRawChapters: recentChapters,                          // 注入 spec/23 "最近 N 章原文"段
    lastCheckpointChapter: checkpointChapter,
  }
}
```

**O(1) 恢复成本**: 不论项目写了多少章, rehydrate 只需读 1 份 summary + ≤ everyNChapters 章原文。

## prune 老章节 tool 输出 (借鉴 opencode `compaction.ts:300-344`)

> 我们的 cascade 流每章会产出几十 KB 的 tool 输出 (Checker JSON + Validator JSON + ReaderPanel 5 persona JSON + ArcTracker JSON + 等)。当一本书写到 50+ 章, 这些 tool 输出累计若全部进上下文是浪费。learn opencode 的分层策略: **prune (廉价) 在 compact (昂贵) 之前**。

### 策略

| 章节区间 (相对最新章) | tool 输出保留范围 |
|---|---|
| 最近 10 章 | 全保留 (cascade 链路完整, 用户可能回头复盘) |
| 11-30 章 | 仅保留 cardinalRulesReport.summary + dropoffRisk + Validator contradictions 摘要; 原始 candidate 列表 / persona naturalLanguageReaction 全文 prune |
| 30 章以前 | 仅保留 cardinalRulesReport.summary 一句话 + dropoffRisk 数值; 其余原始 JSON 全删 (体现在 volume_summary 的"五大守则当前状态"段) |

**与 PRUNE_PROTECTED_TOOLS 对应**: opencode 把 `["skill"]` tool 的输出永远不 prune (因为 skill 内容是上下文核心)。我们的对应永久保留集 = `["cardinalRulesReport"]` + `["volumeSummary"]` (这两个是后续生成的根锚)。

### 表设计 (workspace.db)

```sql
ALTER TABLE chapter_tool_runs ADD COLUMN pruned_at INTEGER;        -- prune 时间戳, NULL = 未 prune
ALTER TABLE chapter_tool_runs ADD COLUMN pruned_summary TEXT;       -- prune 后保留的摘要 (cardinalRulesReport.summary 等)

CREATE INDEX idx_tool_runs_pruned ON chapter_tool_runs(chapter_id, pruned_at);
```

(`chapter_tool_runs` 表的完整定义见 plan/04 §SQLite 过程数据库)

### 触发时机

```ts
async function maybePruneOldToolRuns(projectId: string) {
  const settings = await readSettings(projectId)
  if (!settings.toolOutputPrune.enabled) return    // 默认 true

  const recent10 = await db.workspace(projectId).chapters.findRecent(10)
  const next20 = await db.workspace(projectId).chapters.findRange(11, 30)
  const olderThan30 = await db.workspace(projectId).chapters.findOlderThan(30)

  await pruneToolRuns(next20, { keepFields: ['cardinalRulesReport.summary', 'dropoffRisk', 'contradictions[].kind+entityRef'] })
  await pruneToolRuns(olderThan30, { keepFields: ['cardinalRulesReport.summary', 'dropoffRisk'] })
}
```

每次 ApprovalCard resolve 后串行跑一次 (低优先级队列, 不阻塞主流程)。

### prune 不可逆 ⚠

prune 删原始 JSON 后, 仅保留 summary。**用户在 SettingsDialog "已修剪 Tool 输出"页面可以看摘要**, 但原 JSON 找不回。这与 chapter.md 是反的 (chapter.md 走 git, 永远可恢复)。

理由: tool 输出本质是中间产物, 用户审阅闸门 (ApprovalCard) 已经保证了正确性, 留全文只是"未来可能要 debug" — 不为这个保留几十倍存储。

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

## semantic recall 何时打开

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

- **Mastra Memory schema 真实表名以 1.4.x sdk 为准**
- **compressed_messages 的搜索**: 现在 `LIKE '%林溪%'` naïve;若 entity 多可加 FTS5
- **W11 时 semantic recall 与 paragraph_embeddings 的 embedding 复用边界**: 同 provider 但不同 namespace
- **多用户共享 thread**: 不支持 (plan/12 §不解决)
- **DeepSeek prompt cache 字段** (spec/00 §H): cache_control 字段服务端识别情况未定; 若不支持降级为仅头部稳定排布
- **Mastra middleware 暴露口子** (spec/00 §I): deepseekMiddleware 假设 Mastra 接受 wrapLanguageModel 包装; 若不接受则绕过 Mastra Agent 直接用 streamText / generateObject
- **volume_summarizer 的"用户改设定后摘要过时"边界**: 若用户在 ch_050 时回头改 ch_010 的设定, 现存 volume_summary 中那段已锚的状态可能不准。策略: 检测到 setting cascade 跨过 summary 范围时自动 invalidate 该 summary 并重生成
