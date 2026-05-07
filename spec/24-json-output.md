# Spec 24 — JSON 结构化输出统一规约

> 项目里所有"分析 / 路由 / 抽取 / 仿真 / 反思"类 Agent 输出**必走 DeepSeek 原生 JSON mode**;只有"创作 / 改写 / 对话"类走自然语言。这一章把"何时走 / 怎么走 / 失败怎么办"写死,后续所有 spec 引用本章。

## 设计原则

| 原则 | 内容 |
|---|---|
| **强制 JSON mode** | 输出本质结构化的 Agent 必启用 `response_format: { type: 'json_object' }`,不允许"自由发挥再 zod parse" |
| **应用层 zod 校验** | DeepSeek 不强 schema(只保证合法 JSON),字段语义由 zod 校验 + retry |
| **max_tokens 必估算** | 基于 zod schema 字段大小估算,**不允许填默认 4096 完事**(防截断风险 + 浪费) |
| **system prompt 必含示例** | "请以 JSON 格式输出,严格符合以下示例的字段结构" + 示例 JSON,不允许"模型自由发挥结构" |
| **失败有兜底** | 空 content / 截断 / schema 失败一律 retry 1 次,2 次仍败抛错 escalate 给用户 |
| **streaming 区别处理** | JSON mode 流式时中间 chunks 不展示给用户;Writer / Humanizer 自然语言流照常展示 |

## 启用方式 (Vercel AI SDK 6 + @ai-sdk/deepseek)

```ts
import { deepseek } from '@ai-sdk/deepseek'
import { generateText } from 'ai'

const result = await generateText({
  model: deepseek('deepseek-v4-flash'),
  messages,
  providerOptions: {
    deepseek: {
      response_format: { type: 'json_object' },
    },
  },
  maxTokens: <由 schema 估算>,
})
```

**system prompt 必须模板**:

```
你的输出必须是合法的 JSON 对象,严格符合以下示例字段结构。不要在 JSON 之外输出任何文字。

示例:
{
  "intent": "modify_setting",
  "mode": "plan",
  "reasoning": "用户说'把林溪改成女'是改设定意图"
}

请只输出 JSON 对象,不要 markdown 代码块,不要前后说明。
```

**关键约束**:

- system 或 user prompt **必须含 "json" 字样** (DeepSeek 文档明确要求)
- 必须含**示例 JSON** (不让模型自由发挥结构)
- 不允许 markdown 代码块包裹 (我们 zod parse 会失败,反例:模型回 ` ```json\n{...}\n``` `)

## 各场景 zod schema 对照表

| 场景 | Agent / 工具 | model | maxTokens 估算 |
|---|---|---|---|
| 路由意图 | Router | flash | 256 |
| 一致性审 | Validator | pro | 16K (proposals 多时) |
| analyzeImpact LLM filter | Validator (内部) | flash (per batch) | 2K (5 段一批) |
| extractSemanticDelta | Validator (内部) | flash | 1K |
| 节奏报告 (BeatAnalyzer) | Checker | flash | 4K |
| 弧光报告 (ArcTracker) | Validator | pro | 4K |
| 5 persona 仿真 | ReaderPanel | flash | 8K |
| 经验提炼 | Reflector | flash | 2K |
| 概念抽取 | concept extractor (工具) | flash | 4K |

详见下面各 schema 章节。

### Router 输出

```ts
import { z } from 'zod'

export const RouterOutputSchema = z.object({
  intent: z.enum([
    'discuss_question',     // discuss 模式 - 提问
    'discuss_search',       // discuss 模式 - 检索请求
    'plan_modify',          // plan 模式 - 改设定
    'plan_create',          // plan 模式 - 新增设定
    'write_chapter',        // write 模式 - 写新章
    'write_continue',       // write 模式 - 续写
    'unclear',              // 不明确
  ]),
  mode: z.enum(['discuss', 'plan', 'write']),
  modeMatchesCurrentMode: z.boolean(),       // 用户当前 mode 与意图是否匹配
  reasoning: z.string().min(1).max(200),
})

export type RouterOutput = z.infer<typeof RouterOutputSchema>
```

**maxTokens**: 256(field 数固定 + reasoning ≤ 200 中文 ≈ 200 token)

### Validator 一致性审 输出

```ts
export const ChangeProposalSchema = z.object({
  anchorId: z.string(),                       // 段锚点 ID (spec/17)
  targetFile: z.string(),                     // 相对 workspace 的 path
  needsChange: z.boolean(),
  proposedText: z.string().optional(),        // needsChange=true 必须给
  reason: z.string().min(1).max(500),
  confidence: z.enum(['high', 'medium', 'low']),
  cascadeLevel: z.union([z.literal(1), z.literal(2), z.literal(3)]),
  violationType: z.enum([
    'character_promise',     // 违反 reader_promises
    'character_taboo',       // 违反 taboos
    'character_value_axis',  // 违反 value_axes
    'timeline',              // 时间线矛盾
    'relation_state',        // 关系状态矛盾
    'concept',               // 违反 concept (taboo / invariant)
    'foreshadowing',         // 伏笔失约
    'cardinal_rule',         // 五大网文守则违反 (spec/25)
    'other',
  ]).optional(),
})

export const ValidatorOutputSchema = z.object({
  violations: z.array(z.object({
    type: z.string(),           // 同 violationType
    anchor: z.string(),         // 段锚点
    expected: z.string(),       // 应该是什么 (来自 L4)
    actual: z.string(),         // 实际是什么 (从生成内容)
    severity: z.enum(['critical', 'major', 'minor']),
  })),
  proposals: z.array(ChangeProposalSchema),
  cardinalRulesReport: z.object({                // 五大守则检测 (spec/25)
    goldenChapters: z.object({ violated: z.boolean(), details: z.array(z.string()) }),
    characterIntegrity: z.object({ violated: z.boolean(), details: z.array(z.string()) }),
    pacing: z.object({ violated: z.boolean(), details: z.array(z.string()) }),
    promiseAccountability: z.object({ violated: z.boolean(), details: z.array(z.string()) }),
    protagonistAgency: z.object({ violated: z.boolean(), details: z.array(z.string()) }),
  }).optional(),
})
```

**maxTokens**: 16K(每个 proposal ≈ 200 token,可能 50+ proposals;cardinalRulesReport ≈ 500 token)

### analyzeImpact LLM filter (spec/19 step 3)

```ts
export const ImpactFilterCandidateSchema = z.object({
  anchorId: z.string(),
  affected: z.boolean(),
  confidence: z.enum(['high', 'medium', 'low']),
  reason: z.string().max(200),
})

export const ImpactFilterBatchOutputSchema = z.object({
  candidates: z.array(ImpactFilterCandidateSchema).max(5),  // 每批 5 段
})
```

**maxTokens**: 2K (5 candidates × ≈ 300 token)

**为什么用 Flash 而不 Pro**: 二次过滤是"段是否真受影响"二元判断,Flash 完全够用;Pro 留给最终 Validator 一致性审。

### extractSemanticDelta (spec/19 step 1)

```ts
export const SemanticDeltaItemSchema = z.object({
  field: z.string(),                          // 'gender' / 'name' / 'occupation' / 'paragraph[5]' 等
  before: z.string(),
  after: z.string(),
  semanticChange: z.string().max(200),        // "性别从男改女, 涉及称谓 / 人称代词 / 容貌描写"
  impactDimensions: z.array(z.enum([
    'identity', 'state', 'relation', 'capability', 'timeline', 'concept', 'narrative',
  ])),
})

export const SemanticDeltaOutputSchema = z.object({
  delta: z.array(SemanticDeltaItemSchema),
})
```

**maxTokens**: 1K (典型修改 ≤ 5 个 field, ≈ 200 token/field)

### Checker / BeatAnalyzer 节奏报告

```ts
export const BeatSchema = z.object({
  anchorId: z.string(),
  type: z.enum(['hook', 'conflict', 'climax', 'resolution', 'transition', 'description', 'dialogue']),
  intensity: z.number().min(0).max(1),         // 情绪强度
  paceCategory: z.enum(['fast', 'medium', 'slow']),
})

export const BeatAnalyzerOutputSchema = z.object({
  beats: z.array(BeatSchema),
  pacingScore: z.number().min(0).max(100),
  hookStrength: z.number().min(0).max(100),     // 黄金三章特别看
  issues: z.array(z.object({
    anchor: z.string(),
    severity: z.enum(['critical', 'major', 'minor']),
    type: z.enum(['stall', 'rushed', 'no_hook', 'dialogue_heavy', 'description_heavy', 'side_line_dominant']),
    suggestion: z.string().max(200),
  })),
})
```

**maxTokens**: 4K

### ArcTracker 弧光报告

```ts
export const ArcTrackerOutputSchema = z.object({
  characterArcs: z.array(z.object({
    characterName: z.string(),
    expectedArc: z.string(),                    // 来自 character.md
    currentPosition: z.enum(['intro', 'development', 'crisis', 'climax', 'resolution']),
    deviation: z.number().min(0).max(1),        // 偏离基线 (0=完美, 1=完全 OOC)
    issues: z.array(z.string()),
  })),
  storyMilestones: z.object({
    chaptersSinceLast: z.number(),               // 距上次 milestone 章数
    expectedMaxGap: z.number(),                  // 项目 cardinal-rules 配置
    overdue: z.boolean(),
  }),
  protagonistAgency: z.object({                  // 守则 5: 金手指过度依赖
    activeRatio: z.number().min(0).max(1),       // 主动决策段比例
    threshold: z.number(),                       // 配置 (默认 0.3)
    underThreshold: z.boolean(),
  }),
})
```

**maxTokens**: 4K

### ReaderPanel 5 persona 仿真

```ts
export const PersonaResponseSchema = z.object({
  personaId: z.enum(['veteran_reader', 'casual_reader', 'rational_reader', 'genre_fan', 'new_reader']),
  reaction: z.string().max(500),                 // 阅读到当前章节的反应
  emotionalArc: z.array(z.enum(['intrigued', 'bored', 'confused', 'satisfied', 'angry', 'amused'])),
  dropoffRisk: z.number().min(0).max(1),         // 0=完全留住, 1=立刻弃书
  cardinalRulesFlags: z.array(z.enum([           // 守则违反检测 (spec/25)
    'golden_chapters_drift',
    'character_collapse',
    'pacing_stall',
    'promise_betrayal',
    'system_dependency_overflow',
  ])),
  suggestion: z.string().max(300),
})

export const ReaderPanelOutputSchema = z.object({
  personaResponses: z.array(PersonaResponseSchema).length(5),
  averageDropoffRisk: z.number().min(0).max(1),
  summary: z.string().max(500),
  topConcerns: z.array(z.string()).max(5),
})
```

**maxTokens**: 8K (5 persona × ≈ 1.5K)

### Reflector 经验提炼

```ts
export const LearningItemSchema = z.object({
  insight: z.string().min(1).max(300),
  evidence: z.string().max(500),
  scope: z.enum([
    'style', 'narrative', 'pacing', 'voice',
    'worldview', 'character', 'consistency', 'relations',
    'cardinal_rule',                              // 守则违反学习
    'intent', 'mode',
  ]),
  applicableAgents: z.array(z.enum([
    'writer', 'router', 'validator', 'checker', 'humanizer', 'reader-panel',
  ])).min(1),
  suggestedWeight: z.number().min(0.5).max(2.0).default(1.0),
})

export const ReflectorOutputSchema = z.object({
  learnings: z.array(LearningItemSchema).max(3),  // 每次最多 3 条
  rootApprovalId: z.string().optional(),          // cascade 链合并时填
})
```

**maxTokens**: 2K

### concept extractor (spec/16 工具内 LLM)

```ts
export const ConceptItemSchema = z.object({
  name: z.string().min(1).max(50),
  type: z.enum(['rule', 'taboo', 'invariant', 'theme', 'capability', 'cardinal_rule']),
  definition: z.string().min(1).max(500),
  source: z.string(),                              // 'worldview/' / 'characters/lin.md' / 'plot/main.md'
  refs: z.array(z.string()),                       // anchor IDs 引用了该概念的段
})

export const ConceptExtractorOutputSchema = z.object({
  concepts: z.array(ConceptItemSchema),
})
```

**maxTokens**: 4K

## DeepSeek middleware 集成 (T5 — 借鉴 opencode `session/llm.ts:391-405`)

> opencode 用 `wrapLanguageModel + transformParams middleware` 注入 DeepSeek round-trip (`provider/transform.ts`), 而不是在每个 agent 调用里 if-else 处理 reasoning_content / cache_control。**我们采用同一 pattern**: model 实例本身就是包装好的, callJsonAgent 不感知 DeepSeek 特殊性。

### 抽象 deepseekMiddleware (定义在 spec/22 §DeepSeek 适配 middleware)

spec/22 T3 已定义 `deepseekMiddleware: LanguageModelV2Middleware`, 负责:

1. `transformParams` 阶段: 历史 assistant 消息缺 `reasoning_content` 时注入空占位
2. `transformParams` 阶段: `providerOptions.openaiCompatible.cache_control` 标记 system 前 2 段 + 末尾 2 条 (依赖 spec/00 §H verify)

### 各 model 实例统一包装

```ts
// lib/agents/llm.ts
import { wrapLanguageModel } from 'ai'
import { createOpenAICompatible } from '@ai-sdk/openai-compatible'
import { deepseekMiddleware } from './deepseek-middleware'   // spec/22

const deepseek = createOpenAICompatible({
  name: 'deepseek',
  apiKey: process.env.DEEPSEEK_API_KEY!,
  baseURL: 'https://api.deepseek.com/v1',
})

export const deepseekProMax = wrapLanguageModel({
  model: deepseek.languageModel('deepseek-v4-pro'),
  middleware: [deepseekMiddleware],
})

export const deepseekFlash = wrapLanguageModel({
  model: deepseek.languageModel('deepseek-v4-flash'),
  middleware: [deepseekMiddleware],
})
```

callJsonAgent 接受这些包装后的 model 实例, 不再自己处理 DeepSeek 特殊字段。

### fallback (spec/00 §I 验证不通过)

如果 Mastra Agent 不接受 wrapLanguageModel 包装后的 model:

- **方案 A** (优先): callJsonAgent 已经直调 Vercel AI SDK `generateText`, 不走 Mastra Agent。fallback 路径 = 全部走 callJsonAgent (Mastra 仅保留 Memory + Workflow), Writer / Humanizer 这两个 NL 流式 agent 也包一层 callTextAgent (本节扩展) 直接走 streamText。
- **方案 B**: 不用 middleware, 在 callJsonAgent 内部手动调 `transformParams` 等价逻辑, 每次调用前修改 messages。

最终选哪条 W3 实施前回写本节。

## 失败处理 (统一 retry 策略)

```ts
// lib/agents/json-output.ts
export async function callJsonAgent<T>({
  model, messages, schema, maxTokens, label, threadId,
}: {
  model: LanguageModel                             // 已经是 wrapLanguageModel 包装后的实例
  messages: ModelMessage[]
  schema: z.ZodSchema<T>
  maxTokens: number
  label: string                                    // 用于 trace / 错误信息
  threadId?: string                                // 可选 — 续 thread (subagent task_id 续跑模式, 借 opencode tool/task.ts)
}): Promise<T> {
  for (let attempt = 1; attempt <= 2; attempt++) {
    const result = await generateText({
      model,                                       // wrapLanguageModel 已注入 deepseekMiddleware
      messages: attempt === 1 ? messages : [
        ...messages,
        { role: 'user', content: '上次返回不合法或为空,请确保返回**非空**且**字段完整**的 JSON 对象,严格符合示例结构。' },
      ],
      providerOptions: { deepseek: { response_format: { type: 'json_object' } } },
      maxTokens,
    })

    // 1. 空 content 检测
    if (!result.text || result.text.trim() === '') {
      if (attempt === 2) throw new JsonOutputError(label, 'empty_content_after_retry')
      continue
    }

    // 2. 截断检测 (JSON 中途切断)
    if (result.finishReason === 'length') {
      if (attempt === 2) throw new JsonOutputError(label, 'truncated_after_retry', { increase_max_tokens: maxTokens * 2 })
      continue
    }

    // 3. JSON parse
    let parsed: unknown
    try {
      parsed = JSON.parse(result.text)
    } catch {
      if (attempt === 2) throw new JsonOutputError(label, 'invalid_json_after_retry', { rawText: result.text })
      continue
    }

    // 4. zod 校验
    const validation = schema.safeParse(parsed)
    if (!validation.success) {
      if (attempt === 2) throw new JsonOutputError(label, 'schema_violation_after_retry', { issues: validation.error.issues })
      continue
    }

    return validation.data
  }
  throw new JsonOutputError(label, 'unreachable')
}

class JsonOutputError extends Error {
  constructor(public label: string, public kind: string, public details?: unknown) {
    super(`JSON agent "${label}" failed: ${kind}`)
  }
}
```

## escalate 策略 (2 次仍败时)

| 失败类型 | UI 表现 | 用户可选 |
|---|---|---|
| `empty_content_after_retry` | toast: "{label} 返回空,请检查网络或重试" | [重试] / [取消] |
| `truncated_after_retry` | toast: "{label} 输出过长被截断" | [继续 (放宽 max_tokens)] / [取消] |
| `invalid_json_after_retry` | toast + 折叠区显示原文 | [复制原文反馈] / [取消] |
| `schema_violation_after_retry` | toast + 折叠区显示 zod 错误 + 原文 | [上报 issue] / [取消] |

不允许"silent fallback to 空 result"— 因为这会让 Validator 漏审、Router 错路由,导致一致性事故。

## streaming 模式衔接 (与 spec/04 协同)

JSON mode 在 streaming 时:

```ts
const stream = streamText({ model, messages, providerOptions: { deepseek: { response_format: { type: 'json_object' } } }, maxTokens })

let buffer = ''
for await (const chunk of stream.textStream) {
  buffer += chunk
  // 中间 chunks 不展示给用户 (除 Writer / Humanizer 例外)
  // UI 可显示"正在分析..." spinner
}

// stream 完成后再 parse
const parsed = JSON.parse(buffer)
const validated = schema.parse(parsed)
```

**spec/04 streaming protocol** 要新增 chunk 类型 `analyzing`,前端识别这种 stream 显示 spinner 而非逐字渲染。

## 何时**不**用 JSON mode

| 场景 | Agent | 原因 |
|---|---|---|
| Writer 写章节 | writer (write 模式) | 章节正文是自然语言,流式逐字给用户 |
| Humanizer 改写 | humanizer | 改写后文本是自然语言 |
| discuss 模式回答 | router (discuss) | 用户阅读对话 |
| compressed_messages summarize | (后台) | 摘要文本,自然语言最适 |

这些场景**不**传 `response_format: { type: 'json_object' }`,正常 streaming 输出文本。

## 与 spec/03 prompts 的协同

spec/03 各 Agent 的 system prompt 模板**必须包含**:

- 输出格式声明 (是 JSON 还是自然语言)
- JSON 格式时,示例 JSON + "请只输出 JSON 对象,不要 markdown 代码块,不要前后说明"
- 自然语言时,正常 prompt

spec/03 在 T5 commit 同步落地。

## 测试 (与 spec/14 对齐)

```ts
describe('json output spec', () => {
  it('Router 路由意图返回合法 JSON 且符合 schema', () => { /* ... */ })
  it('Validator proposals 字段全填', () => { /* ... */ })
  it('空 content 自动 retry 1 次', () => { /* ... */ })
  it('截断检测 (finishReason=length) 自动 retry', () => { /* ... */ })
  it('zod 失败自动 retry', () => { /* ... */ })
  it('2 次仍败抛 JsonOutputError', () => { /* ... */ })
  it('streaming 模式中间 chunks 不渲染给用户', () => { /* ... */ })
})
```

## 不解决的问题 / 待办

- **Streaming 中实时校验中间 JSON**: 目前是流完再 parse;若需要实时(如 ReaderPanel persona 一个一个出),需要 incremental JSON parser (e.g. partial-json) — POC 不做
- **schema 自动估算 maxTokens**: 现在手填,有遗漏风险;后续可写一个 `estimateMaxTokensFromSchema(schema)` 工具,W11 看
- **JSON mode 与 Mastra Memory 的 message 序列化**: Mastra 自动把 assistant content 写进 mastra_messages,JSON 字符串正常存,UI 翻看历史时需要 pretty-print(spec/22 §UI 翻看历史细节)
