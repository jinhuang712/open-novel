# Spec 23 — Per-agent 上下文契约 (Per-agent Context Contracts)

> 与 [plan/12 §per-agent 上下文契约](../plan/12-memory-and-context.md) 对齐 — 这一篇是 **L1 (工作记忆)** 的具体落地。每个 agent 有自己的 context builder,根据职责定义"必装什么 / 不装什么";一致性所需的全部数据必装,不在限额内做选择。

## 设计原则

| 原则 | 说明 |
|---|---|
| **一致性 > 一切** | 读者最大弃书原因之一是"读到与前文不一致"。该装的必装,不省 |
| **per-agent 契约** | 7 个 agent 各自一个 context builder,根据职责装不同数据 |
| **不做 token 预算裁剪** | DeepSeek V4 ctx 1M (spec/00 §C),普通章节场景远不到上限;不允许"省略某段必装项" |
| **超 800K 警报** | 软警报 + 详细诊断,引导用户分卷或调小项目;不允许 silent 砍 retrieve |
| **不允许 agent 自拼 prompt** | 必经 context builder;直接调 streamVNext 是反模式 |
| **JSON 输出走 JSON mode** | 见 spec/24,不在本章重复 |

## 共享基础设施

所有 agent context builder 共享:

```ts
// lib/agents/context/base.ts
export interface BaseContextInput {
  projectId: string
  sessionId: string
  threadId: string
  userInput: string
  pendingApprovals: string[]
  cascadeContext?: { rootApprovalId: string; cascadeLevel: 0 | 1 | 2 | 3 }
  rejectionFeedback?: string
}

export interface BaseContextOutput {
  systemPrompt: string                // 含基础 + agent 特化 + L3 learnings 注入
  messages: ModelMessage[]            // [system, ...recent_messages, user_input]
  tokenReport: {
    system: number
    retrieve: number
    messages: number
    userInput: number
    total: number
    estimatedCtxRemaining: number     // 1M - total - max_output_reservation
  }
  metadata: {
    learningsApplied: { id: string; text: string; weight: number; scope: string }[]
    retrievedKeys: string[]           // 哪些 L4 数据被装入 (entity:lin / chapter:001 / ...)
    jsonMode: boolean                  // 这次输出是否走 JSON mode
  }
}

export async function buildBaseContext(input: BaseContextInput, agentName: string): Promise<{
  learnings: Learning[]
  recentMessages: ModelMessage[]
}> {
  // 1. L3 learnings 注入 (按 agent scope)
  const allLearnings = await db.workspace(input.projectId).learnings.find({
    scope: { in: agentScopes(agentName) },
    weight: { gte: 0.2 },
  }).orderBy('weight', 'desc').limit(8)

  // 2. cardinal_rule scope 永远保留 top-1 (与 spec/25 + plan/12 一致)
  const cardinalRuleLearnings = allLearnings.filter(l => l.scope === 'cardinal_rule')
  const others = allLearnings.filter(l => l.scope !== 'cardinal_rule')
  const learnings = [...cardinalRuleLearnings.slice(0, 1), ...others].slice(0, 8)

  // 3. L2 mastra_messages (lastMessages 30, 见 spec/22)
  const recentMessages = await mastraMemory.fetchRecent({
    threadId: input.threadId,
    limit: settings.mastraMemory.lastMessages,
  })

  return { learnings, recentMessages }
}

export function agentScopes(agentName: string): string[] {
  return {
    writer: ['style', 'narrative', 'worldview', 'character', 'cardinal_rule'],
    validator: ['consistency', 'worldview', 'character', 'relations', 'cardinal_rule'],
    checker: ['style', 'narrative', 'pacing', 'cardinal_rule'],
    humanizer: ['style', 'voice'],
    'reader-panel': ['narrative', 'pacing', 'cardinal_rule'],
    router: ['intent', 'mode'],
    reflector: [],                       // Reflector 不读 learnings
  }[agentName] ?? []
}
```

## 验算与警报 (软警报,不硬限)

```ts
const TOTAL_CTX = 1_000_000                // DeepSeek V4 1M
const MAX_OUTPUT_RESERVATION = 60_000      // Writer 写章节预留;其他 agent 实际占用更小
const SOFT_WARN_THRESHOLD = 800_000        // 80% 警报

function checkContextSize(report: TokenReport, agentName: string) {
  const used = report.total + (agentName === 'writer' ? MAX_OUTPUT_RESERVATION : 16_000)
  if (used > TOTAL_CTX) {
    throw new ContextOverflowError({
      agentName,
      used,
      ctx: TOTAL_CTX,
      hint: '项目数据规模已超 1M ctx, 必须分卷或调减 retrieve 范围',
      diagnostic: report,
    })
  }
  if (used > SOFT_WARN_THRESHOLD) {
    logger.warn('context approaching ctx limit', { agentName, used, ratio: used / TOTAL_CTX })
    // UI 上 toast: "本次装配 {ratio}% ctx, 接近上限, 建议查看 prompt 装配诊断"
  }
}
```

**关键约束**:

- `ContextOverflowError` 只在**真的超 1M** 时才抛 — 不是"快到了就先砍"。砍是反一致性的
- 警报阈值 800K 是 UX 提示,不影响装配决策
- 错误抛出时给详细诊断 (各部分占用 + 建议) 让用户决定怎么处理 (分卷 / 缩 retrieve / 排查异常 entity)

## per-agent 契约

### 1. Writer (write 模式)

**装配目标**: 让 Writer 写出与 L4 完全一致的章节,且不踩五大网文守则。

**必装项** (按 retrieve 顺序):

```ts
async function buildWriterWriteContext(input: WriterInput): Promise<BuildOutput> {
  const base = await buildBaseContext(input, 'writer')

  // L4 retrieve (调 spec/20 assembleContext + 加守则相关数据)
  const retrieved = {
    chapterOutline: await readChapterOutline(input.projectId, input.chapterIndex),
    previousChapterTail: await readPreviousChapterTail(input.projectId, input.chapterIndex, { paragraphs: 3 }),
    entityStates: await assembleContext.getEntityStates({
      projectId: input.projectId,
      chapterIndex: input.chapterIndex,
      povCharacters: input.pov,
    }),
    activeRelations: await assembleContext.getActiveRelations({
      projectId: input.projectId,
      chapterIndex: input.chapterIndex,
      involvedCharacters: input.pov,
    }),
    activeForeshadowings: await assembleContext.getActiveForeshadowings({
      projectId: input.projectId,
      includeCriticalOverDeadlineWarning: true,
    }),
    recentChapters: await readRecentChapters(input.projectId, input.chapterIndex, { count: 5 }),
    worldviewFull: await readWorldviewFull(input.projectId),
    conceptConstraints: await db.concepts.find({ projectId: input.projectId, type: { in: ['taboo', 'invariant', 'cardinal_rule'] } }),
    chapterArc: await readChapterArc(input.projectId, input.chapterIndex),
    userExemplars: await readUserExemplars(input.projectId),
    // 五大守则相关 (spec/25)
    cardinalRulesConfig: await readCardinalRulesConfig(input.projectId),
    valueAxesForInvolvedCharacters: await readCharacterValueAxes(input.projectId, input.pov),
    chaptersSinceLastMilestone: await getChaptersSinceLastMilestone(input.projectId),
    rollingMainSideRatio: await getRollingMainSideRatio(input.projectId, { window: 10 }),
    isGoldenChapter: input.chapterIndex >= 1 && input.chapterIndex <= 3,
  }

  // System prompt 装配 (spec/03 模板)
  const systemPrompt = buildWriterSystemPrompt({
    base: WRITER_BASE_PROMPT,
    learnings: base.learnings,
    cardinalRules: retrieved.cardinalRulesConfig,
    valueAxes: retrieved.valueAxesForInvolvedCharacters,
    activeForeshadowings: retrieved.activeForeshadowings,
    isGoldenChapter: retrieved.isGoldenChapter,
    style: project.style,
  })

  // assembled context 拼成 retrieve block (system 第二段)
  const retrievedBlock = formatRetrievedForWriter(retrieved)

  const messages: ModelMessage[] = [
    { role: 'system', content: systemPrompt },
    { role: 'system', content: retrievedBlock },
    { role: 'assistant', content: '<历史摘要>\n...' /* 仅当 compressed_messages 启用 */ },
    ...base.recentMessages,
    ...(input.rejectionFeedback ? [{ role: 'user' as const, content: `(上次提议被拒, 原因: ${input.rejectionFeedback})` }] : []),
    { role: 'user', content: input.userInput },
  ]

  const tokenReport = computeTokenReport(messages, retrieved)
  checkContextSize(tokenReport, 'writer')

  return { systemPrompt, messages, tokenReport, metadata: { jsonMode: false /* Writer 输出自然语言 */, ... } }
}
```

**输出形态**: 自然语言流式 (不走 JSON mode)
**maxTokens**: 不显式设(Writer 章节正文流式输出),交给 Mastra 自然结束 (`finishReason='stop'`)

**典型 token 占用** (估算):

- chapter outline + previous tail: ≈ 4K
- 全 entity 状态 (≈ 30 角色) + relations + timeline: ≈ 50K
- 最近 5 章: ≈ 30K
- 世界观全文: ≈ 30K
- 概念约束 + 章节弧光 + 范文 + 守则: ≈ 30K
- learnings + recent_messages: ≈ 20K
- **小计**: ≈ 165K (16% of 1M, 远不接近警报阈值)

### 2. Validator

**装配目标**: 找当前 ChangeProposal 与 L4 任何冲突。这是 anti-不一致的兜底 agent,**最该装齐**。

**必装项**:

```ts
async function buildValidatorContext(input: ValidatorInput): Promise<BuildOutput> {
  const base = await buildBaseContext(input, 'validator')

  const retrieved = {
    mainProposal: input.changeSet.main,
    cascadeProposals: input.changeSet.cascade,
    impactRadius: await analyzeImpact.computeImpactRadius(input.projectId, input.delta),  // spec/19 step 2
    // 完整 timeline (不只当前时间点)
    fullEntityTimelines: await db.entityTimeline.findAll({
      projectId: input.projectId,
      entityIds: input.affectedEntityIds,
    }),
    // 完整 relations history
    fullRelationsHistory: await db.entityRelations.findAllHistory({
      projectId: input.projectId,
      entityIds: input.affectedEntityIds,
    }),
    // 命中章节全文 (有 entity_refs/concept_refs 命中的 chapters)
    affectedChaptersFullText: await readChapters(input.projectId, input.affectedChapterIds),
    // 概念表全部
    allConcepts: await db.concepts.find({ projectId: input.projectId }),
    // 待处理伏笔全部 + 已 resolved 近 N 个
    foreshadowingsAll: await db.foreshadowings.find({ projectId: input.projectId, status: { in: ['planted', 'resolved_recent_20'] } }),
    // 世界观全文
    worldviewFull: await readWorldviewFull(input.projectId),
    cardinalRulesConfig: await readCardinalRulesConfig(input.projectId),
  }

  const systemPrompt = buildValidatorSystemPrompt({
    base: VALIDATOR_BASE_PROMPT,
    learnings: base.learnings,
    cardinalRules: retrieved.cardinalRulesConfig,
  })

  const retrievedBlock = formatRetrievedForValidator(retrieved)

  const messages: ModelMessage[] = [
    { role: 'system', content: systemPrompt },
    { role: 'system', content: retrievedBlock },
    ...base.recentMessages,
    { role: 'user', content: input.userInput },
  ]

  const tokenReport = computeTokenReport(messages, retrieved)
  checkContextSize(tokenReport, 'validator')

  return { systemPrompt, messages, tokenReport, metadata: { jsonMode: true /* Validator 输出 JSON */, ... } }
}
```

**输出形态**: JSON mode (见 spec/24 §Validator 一致性审 输出 schema)
**maxTokens**: 16K (proposals 多时,见 spec/24)

**典型 token 占用**:

- mainProposal + cascade + impactRadius: ≈ 10K
- full entity timelines + relations history: ≈ 80K
- affected chapters full text: ≈ 60K
- concepts + foreshadowings + worldview + cardinal-rules: ≈ 50K
- **小计**: ≈ 200K (20%)

### 3. Checker (含 BeatAnalyzer)

**装配目标**: 检查节奏 / 情绪 / 短句 / 语气是否符合用户偏好,并跑 BeatAnalyzer 节奏报告。

**必装项**:

```ts
async function buildCheckerContext(input: CheckerInput): Promise<BuildOutput> {
  const base = await buildBaseContext(input, 'checker')

  const retrieved = {
    currentChapter: input.chapterContent,
    previousChapters: await readRecentChapters(input.projectId, input.chapterIndex, { count: 8 }),
    userExemplars: await readUserExemplars(input.projectId),
    chapterArc: await readChapterArc(input.projectId, input.chapterIndex),
    cardinalRulesConfig: await readCardinalRulesConfig(input.projectId),
    isGoldenChapter: input.chapterIndex >= 1 && input.chapterIndex <= 3,
  }

  // ... (类似 Writer/Validator 装配)

  return { ..., metadata: { jsonMode: true /* BeatAnalyzer 输出 JSON, spec/24 */, ... } }
}
```

**输出形态**: JSON mode
**maxTokens**: 4K

**典型 token 占用**: ≈ 60K (10%)

### 4. Humanizer

**装配目标**: 把生成痕迹改成自然口语;不需要设定。

**必装项**:

```ts
async function buildHumanizerContext(input: HumanizerInput): Promise<BuildOutput> {
  const base = await buildBaseContext(input, 'humanizer')

  const retrieved = {
    targetText: input.text,
    userExemplars: await readUserExemplars(input.projectId),
    userIdioms: await readUserIdioms(input.projectId),       // 用户口头禅 / 风格约束
    projectStyle: await readProjectStyle(input.projectId),
  }
  // 注意: 不 retrieve entity / relations / timeline / 章节 — Humanizer 不需要
  // ...
  return { ..., metadata: { jsonMode: false /* 输出自然语言改写后文本 */, ... } }
}
```

**输出形态**: 自然语言流式
**maxTokens**: 不显式设

**典型 token 占用**: ≈ 30K (3%, 极简)

### 5. ReaderPanel

**装配目标**: 5 persona 站在读者角度反应当前章节,生成风险报告。

**必装项**:

```ts
async function buildReaderPanelContext(input: ReaderPanelInput): Promise<BuildOutput> {
  const base = await buildBaseContext(input, 'reader-panel')

  const retrieved = {
    currentChapter: input.chapterContent,
    personas: await readPersonas(input.projectId),                // 5 persona 配置
    conceptTaboos: await db.concepts.find({ projectId: input.projectId, type: 'taboo' }),
    cardinalRulesConfig: await readCardinalRulesConfig(input.projectId),
    activeForeshadowings: await assembleContext.getActiveForeshadowings({
      projectId: input.projectId,
      includeCriticalOverDeadlineWarning: true,                   // 守则 4: 期待感兑现
    }),
    rollingPacingMetrics: await getRollingPacingMetrics(input.projectId, { window: 10 }),
    chapterIndex: input.chapterIndex,
    isGoldenChapter: input.chapterIndex >= 1 && input.chapterIndex <= 3,
  }

  return { ..., metadata: { jsonMode: true /* ReaderPanel 输出 JSON, spec/24 */, ... } }
}
```

**输出形态**: JSON mode
**maxTokens**: 8K

**典型 token 占用**: ≈ 40K (4%)

### 6. Reflector

**装配目标**: 提炼经验,不读项目数据。

**必装项**:

```ts
async function buildReflectorContext(input: ReflectorInput): Promise<BuildOutput> {
  // Reflector 不调用 buildBaseContext (它不需要 learnings 注入 — 它是 learnings 的写入者)
  const retrieved = {
    changeSetFull: input.changeSetFullData,
    userDecision: input.userDecision,                              // approve / reject / partial / edited
    userFeedback: input.feedback,
    existingLearningsInScope: await db.learnings.find({            // 避免重复学习
      projectId: input.projectId,
      scope: { in: input.suggestedScopes },
    }),
    cascadeChainSiblings: input.cascadeChainSiblingApprovals,      // 同 cascade 链路其他审批
  }

  // 不装 mastra_messages, 不装 L4 — 纯学习场景
  const systemPrompt = buildReflectorSystemPrompt(REFLECTOR_BASE_PROMPT, retrieved)

  const messages: ModelMessage[] = [
    { role: 'system', content: systemPrompt },
    { role: 'user', content: formatChangeSetForReflector(retrieved) },
  ]

  return { systemPrompt, messages, tokenReport, metadata: { jsonMode: true /* spec/24 */, ... } }
}
```

**输出形态**: JSON mode
**maxTokens**: 2K

**典型 token 占用**: ≈ 15K (1.5%, 极简)

### 7. Router

**装配目标**: 路由意图 + 模式校验,极简上下文。

**必装项**:

```ts
async function buildRouterContext(input: RouterInput): Promise<BuildOutput> {
  const base = await buildBaseContext(input, 'router')

  // 不 retrieve 任何 L4 — Router 不需要项目数据
  // 仅用 base.recentMessages (最近 30 条) + 当前 mode + user input

  const systemPrompt = buildRouterSystemPrompt(ROUTER_BASE_PROMPT, base.learnings, input.currentMode)

  const messages: ModelMessage[] = [
    { role: 'system', content: systemPrompt },
    ...base.recentMessages.slice(-5),                              // Router 只看最近 5 条够了
    { role: 'user', content: input.userInput },
  ]

  return { ..., metadata: { jsonMode: true /* Router 输出 JSON, spec/24 */, ... } }
}
```

**输出形态**: JSON mode
**maxTokens**: 256

**典型 token 占用**: ≈ 4K (0.4%)

## 装配后的 messages 顺序 (固定)

每个 context builder 装出的 messages 数组,顺序统一:

```ts
[
  { role: 'system', content: systemPrompt },                       // base + agent 特化 + L3 learnings
  { role: 'system', content: retrievedBlock },                     // L4 retrieve (按 agent 契约)
  { role: 'assistant', content: '<历史摘要>...' },                  // optional, 仅 compressedMessages.enabled 时
  ...recentMessages,                                                // L2 mastra_messages 最近 N 条
  { role: 'user', content: '(上次提议被拒, 原因: ...)' },           // optional rejection
  { role: 'user', content: userInput },
]
```

## token 计算实现

用 tiktoken cl100k_base (≈ GPT-4 tokenizer) 估算,加 5% 安全 margin:

```ts
import { encoding_for_model } from 'tiktoken'
const enc = encoding_for_model('gpt-4')

export function countTokens(text: string): number {
  return Math.ceil(enc.encode(text).length * 1.05)        // 5% 安全 margin
}

export function countMessageTokens(msg: ModelMessage): number {
  return countTokens(JSON.stringify(msg)) + 4              // OpenAI 公式 overhead
}
```

> ⚠ DeepSeek V4 真实 tokenizer 与 GPT-4 略有差异 (中文 token 化更紧),tiktoken 估算误差 ±5%。加 margin 够用,后续切换到 DeepSeek 官方 tokenizer (如提供)。

## learnings 注入到 system prompt

```ts
function buildSystemPromptWithLearnings(base: string, learnings: Learning[]): string {
  if (learnings.length === 0) return base

  const block = learnings
    .map(l => `- ${l.text}  (置信度 ${l.weight.toFixed(2)}${l.scope === 'cardinal_rule' ? ', 守则' : ''})`)
    .join('\n')

  return `${base}

## 用户偏好与项目经验 (Reflector 沉淀)
以下经验来自历次审批反馈,优先级由高到低。**遇到冲突时这些经验优先于通用风格**。

${block}`
}
```

`agentScopes(agentName)` 详见 `lib/agents/context/base.ts` (本章顶部代码)。

## 调试与遥测

每次 context builder 调用,在 LibSQL 写一条 trace:

```sql
CREATE TABLE prompt_traces (
  id TEXT PRIMARY KEY,
  thread_id TEXT,
  agent_name TEXT,
  mode TEXT,
  json_mode INTEGER,                -- bool
  token_report TEXT,                -- json
  metadata TEXT,                    -- json (learningsApplied / retrievedKeys / jsonMode / etc.)
  duration_ms INTEGER,
  created_at INTEGER
);
```

Settings → "Prompt 装配诊断"面板:

- 列出最近 50 条 prompt_traces
- 点击展开看完整 system prompt + 装配的各部分 token 占比 (饼图)
- "导出 prompt 装配快照" 用于 bug report
- 警示色: total > 800K 黄色,> 950K 红色

(开发期工具,生产可关 — `settings.dev.tracePrompts`)

## 与 Mastra streamVNext 的衔接

```ts
import { streamWithGuard } from '@/lib/agents/memory-guard'

const ctx = await buildWriterWriteContext(input)

const stream = await streamWithGuard(writerAgent, ctx.messages, {
  memory: { thread: ctx.threadId, resource: projectId },
  providerOptions: ctx.metadata.jsonMode
    ? { deepseek: { response_format: { type: 'json_object' } } }
    : undefined,
  // system 已经在 messages[0] 了, 不再传 system 参数
})

await db.runtime.prompt_traces.insert({
  id: ulid(),
  thread_id: ctx.threadId,
  agent_name: input.agentName,
  mode: input.mode,
  json_mode: ctx.metadata.jsonMode ? 1 : 0,
  token_report: JSON.stringify(ctx.tokenReport),
  metadata: JSON.stringify(ctx.metadata),
  duration_ms: Date.now() - startedAt,
  created_at: Date.now(),
})
```

**注意**:`streamVNext` 时**不**自己再 inject lastMessages — 因为我们已经手工塞 recent_messages 了。具体策略:Mastra `lastMessages: 30` 配置只用于其他直接调 streamVNext 的场景(若有);通过 context builder 装配的 messages 数组要求 Mastra **不重复 append**。详见 spec/22 §与 Mastra 的衔接细节。

## 与 Mastra 1.4.x lastMessages 重复风险

> spec/00 audit 项: `Memory.options.lastMessages: 30` 与 streamVNext 显式传 messages 数组的交互。如果 Mastra 会 dedupe 那 OK;如果会重复 append 30 条历史就要切到 `lastMessages: 0` + 自己装配。

默认 Mastra 不重复(基于其设计意图),如发现重复则切换。

## 与五大守则的协同 (spec/25)

Writer / Validator / Checker / ReaderPanel 的 context builder 都装配了 `cardinalRulesConfig` + 相关派生数据 (chaptersSinceLastMilestone / valueAxes / activeForeshadowings + 等)。这些数据进入 system prompt 后,模型生成时即"看见"守则约束。

后续 Validator + ReaderPanel + ArcTracker + BeatAnalyzer 跑检测器,产出 `CardinalRulesReport` (spec/25 §风险报告输出) 进 ApprovalCard。

## 测试 (与 spec/14 对齐)

```ts
describe('per-agent context builders', () => {
  it('Writer write 模式装配后, total token < 1M', () => { /* ... */ })
  it('Writer 黄金三章 (1-3) 装配 cardinalRulesConfig + isGoldenChapter=true', () => { /* ... */ })
  it('Validator 装 full timeline 不漏一个相关 entity', () => { /* ... */ })
  it('Checker 不装 entity / relations / timeline (它不需要)', () => { /* ... */ })
  it('Humanizer 不装 entity / relations / timeline (它不需要)', () => { /* ... */ })
  it('Reflector 不装 mastra_messages (它是写入者)', () => { /* ... */ })
  it('Router 仅装最近 5 条 messages', () => { /* ... */ })
  it('总 token > 1M 时抛 ContextOverflowError + 详细诊断', () => { /* ... */ })
  it('总 token > 800K 时 logger.warn + UI toast', () => { /* ... */ })
  it('cardinal_rule scope learning top-1 永远保留', () => { /* ... */ })
  it('jsonMode metadata 标记正确 (Writer/Humanizer false, 其他 true)', () => { /* ... */ })
})
```

## 不解决的问题 / 待办

- **DeepSeek V4 真实 tokenizer**: 默认 tiktoken + 5% margin,实查 (spec/00 §A) 后微调
- **Mastra `lastMessages` 与显式 messages 重复风险**: spec/00 audit 一并核对
- **超长章节的 retrieve 实操**: 单章 50K+ 字时 readRecentChapters 5 章可能 250K+,context builder 不裁但要监控;若高频触发警报再开 spec/26 专题
- **streaming 中途的 token 监控**: 装配前算 total;若 tool call 后台返回大量数据可能再次接近上限,设计 `onToolCall` hook 在结果回写前对超大 tool result 做摘要 (W11+)
- **多模态 (图)**: 完全不考虑,纯文本
