# Spec 00 — 版本审计闸门 (W3 启动前必跑)

> **[info]** 本文档替代旧 plan/08-tech-stack(已并入 spec/28)中的"猜版本"做法,把 W3 接线日的版本号从训练数据预测改为 npm 实查。**任何 W3+ 代码 commit 之前必须先过这一关。**

技术栈锁定主文档(锁定版本表 / 集成关键点 / 设计取舍)见 [spec/28](./28-tech-stack.md)。

## 为什么要有这个

文档 audit 后发现的最高优先级风险: 技术栈文档(现 spec/28)与 spec 全栈所引用的版本号 (`next`、`react`、`ai`、`@ai-sdk/deepseek`、`better-sqlite3`、`drizzle-orm`、`sqlite-vec`、模型 ID `deepseek-v4-pro`) 是基于训练数据 + 调研文章的"应然"假设,**没有任何 commit 把 npm 真实可装版本写下来过**。一旦 W3 第一次 `pnpm add` 失败、native binding 装不上或 model API 返回 404,整个时间表立刻崩。

把版本审计前置到 W3 启动前**单独一次性跑完**,产出一张确定表,写回 spec/28 后再动代码。

## 审计清单

### A. npm 包真实最新版本

逐条命令,把输出粘进 `progress/00X-version-audit.md` 的"实查结果"表:

```bash
# 框架核心
npm view next versions --json | jq '.[-5:]'              # 期望 15.5.x 仍是 LTS
npm view react versions --json | jq '.[-5:]'             # 期望 19.x stable
npm view typescript versions --json | jq '.[-3:]'

# 编辑器
npm view @tiptap/react versions --json | jq '.[-5:]'     # 期望 3.x
npm view @tiptap/pm versions --json | jq '.[-5:]'
npm view @tiptap/starter-kit versions --json | jq '.[-5:]'

# 样式
npm view tailwindcss versions --json | jq '.[-5:]'       # 期望 4.x
npm view @tailwindcss/postcss versions --json | jq '.[-5:]'

# AI SDK ★ 最高风险
npm view ai versions --json | jq '.[-10:]'                # v6 是否 stable?
npm view @ai-sdk/react versions --json | jq '.[-10:]'
npm view @ai-sdk/deepseek versions --json | jq '.[-10:]'  # 期望 2.x

# 存储 ★ 最高风险
npm view better-sqlite3 versions --json | jq '.[-10:]'
npm view drizzle-orm versions --json | jq '.[-10:]'
npm view drizzle-kit versions --json | jq '.[-10:]'
npm view sqlite-vec versions --json | jq '.[-10:]'

# 状态/工具
npm view xstate versions --json | jq '.[-3:]'
npm view zustand versions --json | jq '.[-3:]'
npm view react-resizable-panels versions --json | jq '.[-3:]'
npm view ahocorasick versions --json | jq '.[-3:]'
```

### B. AI SDK 6 的 `needsApproval` API 形态

**关键**: spec/02 / spec/06 全栈假设 `tool({ needsApproval: true })` 是 AI SDK 6 一等字段。**很可能不是**。

需要实查:

1. 查阅 Vercel AI SDK 6 官方 Human-in-the-Loop cookbook ([https://ai-sdk.dev](https://ai-sdk.dev) 的 cookbook 索引)
2. 在 W3 用最小可运行代码 reproduce: proposal 工具返回 `{ kind: 'proposal' }` → `stopWhen` 终止 → 客户端 `onToolCall` 展示 ApprovalCard → 用户决议调用独立 endpoint
3. 把真实 API 形态写入 `spec/06-approval-flow.md` (保留 proposal-only + 独立 endpoint,只调整 AI SDK 钩子细节)

无论 SDK 是否有 `needsApproval` 一等字段,用户决议都走独立 endpoint;SDK 差异只影响前端如何识别 proposal tool-call。

### C. DeepSeek 模型 ID 与定价

**问题**: spec/03 / spec/13 / README 都写 `deepseek/deepseek-v4-pro` `deepseek/deepseek-v4-flash`。这两个具体型号名是基于"DeepSeek 类比 OpenAI Pro/Flash 命名"的猜测,真实 model id 必须实查。

**实查结果** (来源: [https://api-docs.deepseek.com/zh-cn/quick_start/pricing/](https://api-docs.deepseek.com/zh-cn/quick_start/pricing/)):

| Agent 用途 | 训练数据假设 | 真实 model id | ctx 上限 | max output | 备注 |
|---|---|---|---|---|---|
| Pro 系 (Writer/Validator/Humanizer) | `deepseek/deepseek-v4-pro` | **`deepseek-v4-pro`** | **1M tokens** | **384K tokens** | 单价见官方;Pro/Flash 分级确认存在 |
| Flash 系 (Router/Checker/Reflector/ReaderPanel) | `deepseek/deepseek-v4-flash` | **`deepseek-v4-flash`** | **1M tokens** | **384K tokens** | Flash 含 thinking / non-thinking 两档 |
| 旧名 | `deepseek-chat` / `deepseek-reasoner` | (即将弃用) | — | — | 官方说明: 旧名将被映射到 V4-Flash 的 non-thinking / thinking 模式后弃用,新代码不要用 |

**关键修正** (与之前训练数据假设的偏差):

- **ctx 上限**: **1M tokens**。设计骨架 = per-agent 上下文契约 + 一致性优先 (spec/23),不做 token 预算裁剪
- **max output**: 之前没考虑 → **384K tokens**(对 Writer 单次写超长章节非常友好,但 JSON mode 必须配套设 `max_tokens` 防截断,见 §G)
- **模型命名**: 实查证实 `deepseek-v4-pro` / `deepseek-v4-flash` 是真实 ID(无 `deepseek/` 前缀,纯 model 名)
- **reasoning**: 没有独立 reasoning model;V4-Flash 自带 thinking 模式,通过参数切换;不需要再为 ArcTracker / Validator 单独选 reasoner

**模型选型守约**:

> **[info]** ❌ **禁止 fallback 到 `deepseek-chat` / `deepseek-reasoner` / `deepseek-r1` / `deepseek-v3`** — 这些旧模型没有 reasoning effort 控制,也没有 V4 的 `max` variant,与 [spec/13 §模型分配](./13-settings.md) 的混合分档设计 (`v4-pro + max` / `v4-flash + default`) 冲突。一旦 V4 临时不可用,直接 escalate 到用户而非静默回退到 V3/旧版,因为旧模型行为差异会让 cardinal-rules 检测精度劣化。

### G. DeepSeek JSON 输出模式

**问题**: 我们大量 Agent (Router / Validator / Checker / ArcTracker / ReaderPanel / Reflector / concept extractor / extractSemanticDelta / filterByLLM) 输出本质结构化,过去用"prompt 嘱咐 + zod 解析自然语言"会反复出现"模型回了一段话和 JSON 混在一起"的解析失败。需要确认 DeepSeek 是否原生支持 JSON 输出模式。

**实查结果** (来源: [https://api-docs.deepseek.com/zh-cn/guides/json_mode](https://api-docs.deepseek.com/zh-cn/guides/json_mode)):

| 维度 | 实查结论 |
|---|---|
| 启用方式 | `response_format: { type: 'json_object' }` |
| Prompt 要求 | system 或 user 必须含 "json" 字样 + 提供示例 JSON |
| Schema enforcement | ❌ **不强制 schema** (不像 OpenAI structured outputs);只保证返回**合法 JSON**,字段语义要应用层 zod 校验 |
| Streaming 支持 | 文档未明说,但官方示例为 streaming 形式,可用;客户端要拼完整 chunks 后再 parse |
| Tool calling 关系 | 是分开的两个独立 feature |
| 模型支持 | 文档示例用 V4-Pro,V4-Flash 应该也支持(W3 实测) |
| 失败行为 | 偶尔返回**空 content** (官方明说);**`max_tokens` 没设好会中途截断 JSON**(大坑) |

**集成约束** (后续 spec/24 详写):

- DeepSeek 不强 schema → 我们端 zod 校验失败必须 retry 1 次,2 次仍败 escalate
- `max_tokens` 必须基于 zod schema 字段大小估算(防截断),不允许"塞个大数完事"
- system prompt 强制含示例 JSON,不允许"模型自由发挥结构"
- streaming 模式下中间 chunks 不展示给用户(除 Writer / Humanizer 自然语言流外)
- 空 content 检测 → retry + 加 "请确保返回非空 JSON" 后缀

### D. Vercel AI Gateway 路由策略

实查:

1. AI Gateway 是否对接 DeepSeek (sdk.vercel.ai/providers 列表)
2. 计费走 Gateway 还是直连 DeepSeek?
3. 是否需要 Gateway?(直连可能更省钱,Gateway 的优势是多 provider 切换,单 provider 不需要)

如果 Gateway 不必要,改成直连 `@ai-sdk/deepseek` + 直接 `process.env.DEEPSEEK_API_KEY`,spec/28 §技术决策总览删 "via Vercel AI Gateway" 字样。

### E. better-sqlite3 / sqlite-vec 与 native binding

实查:

1. `better-sqlite3` 当前版本在 macOS arm64 / Linux x64 是否可安装、可 build、可被 Next.js Route Handler 使用
2. `sqlite-vec` 当前包是否提供可加载 extension 路径; `better-sqlite3` 中 `loadExtension` / 包装 helper 是否可用
3. Drizzle raw SQL 与 `vec0` virtual table 是否能一起工作
4. dev hot-reload 下 globalThis 缓存是否避免 connection 泄漏

如果 sqlite-vec extension 加载失败,按 [spec/18](18-embeddings.md) 的 fallback 顺序降级到朴素 cosine 或独立向量索引,并回写 spec/28 / spec/18。

### F. Tailwind 4 + shadcn/ui 兼容性

实查:

1. shadcn/ui 当前模板 (`pnpm dlx shadcn@latest init`) 是否已支持 Tailwind v4
2. (我们手写组件,但仍要确认 `tw-animate-css` 等周边包能用)

### H. DeepSeek prompt cache 真实支持情况

**问题**: spec/22 / spec/24 允许通过 AI SDK middleware 给 DeepSeek 请求标记 `providerOptions.openaiCompatible.cache_control: { type: "ephemeral" }`,但 DeepSeek 服务端不一定识别这个字段。必须先验证字段真被 DeepSeek 端识别。

实查:

1. 看 DeepSeek 官方文档 ([https://api-docs.deepseek.com/zh-cn](https://api-docs.deepseek.com/zh-cn)) 是否有 prompt cache / context cache 章节
2. 如有,字段名是 `cache_control` (OpenAI-compatible) 还是 DeepSeek 自定义?是否需要额外 header / endpoint 切换?
3. 如无,确认是否走自动缓存(部分 provider 如 Anthropic 是 opt-in,部分如 Gemini context cache 是显式 API 创建)
4. 若真不支持,**spec/22 的 cache_control 策略要降级为"prompt 头部稳定排布"** — 仅靠头部稳定争取后续可能的客户端缓存,不依赖服务端。

**结果回写**: spec/22 §DeepSeek prompt cache 标记策略 + spec/28 §DeepSeek V4 配置。

### I. AI SDK `wrapLanguageModel` + middleware 实测

**问题**: spec/22 和 spec/24 假设可用 `wrapLanguageModel + transformParams middleware` 注入 DeepSeek 特殊 round-trip (强制 `reasoning_content` 占位 + provider metadata 透传)。必须用当前 AI SDK 版本最小复现。

实查:

1. 确认 `wrapLanguageModel` 在 AI SDK 6 中的 import 路径、middleware 类型名和 `transformParams` 参数结构
2. 用 `generateText` 和 `streamText` 各跑一次,确认包装后的 model 能同时用于 JSON mode 与自然语言流
3. 确认 providerOptions 的最终请求体形态,避免把 DeepSeek 不识别的字段误传到错误命名空间

**fallback 路径**: 如果 middleware API 不稳定,在 `callJsonAgent` / `callTextAgent` 内部手动 transform messages 和 providerOptions。不要引入 Agent 框架来解决 provider 适配问题。

### J. embedding provider 选型与 vector 索引

**问题**: spec/18 列了 BGE-M3 / DeepSeek embedding / OpenAI text-embedding-3-small 三选一的对比表,作者推荐 BGE-M3 本地。**默认锁 BGE-M3 (见 spec/18 §决议依据),W8 启动前需在此 audit 里 verify 实施前提**.

实查 (W8 day-1):

1. Ollama 当前最新版是否仍稳定提供 `bge-m3` 模型 (`ollama pull bge-m3`)
2. transformers.js (Web 端 fallback) 是否支持 BGE-M3 ONNX 导出版本
3. `paragraph_embeddings` 走 sqlite-vec `vec0` virtual table 还是朴素 cosine fallback — 实查当前 `sqlite-vec` 与 `better-sqlite3` 的加载路径
4. DeepSeek embedding API 是否已开放 (备用 fallback;开放则单独标 endpoint + dim)

**结果回写**: spec/18 §3 vector 索引路径 + spec/18 §选型对比。

## 实查产出格式

W3 启动第一日,**先开 `progress/00X-version-audit.md`**,按以下结构填:

```markdown
# 00X — Version Audit

**日期**: YYYY-MM-DD
**周次**: W3 day-1

## 实查结果

### npm 包

| 包 | 文档假设 | 实查最新稳定版 | 决定锁的版本 | 决定理由 |
|---|---|---|---|---|
| next | 15.5.x | (实查输出) | (决定) | (理由) |
| ... |

### AI SDK 6 needsApproval

- 是 / 否 一等字段
- 真实 API 形态 (粘 cookbook 链接 + 关键代码)
- 改写哪些 spec 文件: ...

### DeepSeek 模型

| Agent | 真实 model id | 单价 | 备注 |
| ... |

### Gateway 决策

- 用 / 不用 Vercel AI Gateway
- 改写哪些文档: ...

### better-sqlite3 / sqlite-vec

- better-sqlite3 install/build: ...
- sqlite-vec loadExtension: ...
- vec0 CRUD + JOIN: ...
- fallback 决策: ...

### Tailwind 4 + shadcn

- 兼容 / 不兼容
- 备选方案: ...

## 改写文档清单 (实查后)

- [ ] spec/28 §锁定的库版本 — 替换为实查表
- [ ] spec/28 §技术决策总览 — 修正"via Vercel AI Gateway"语
- [ ] spec/13 §模型分配 (模型选择策略已并入) — 修正模型 id
- [ ] spec/02 §writeSetting / writeChapter — 改写为 cookbook 形态
- [ ] spec/06 §服务端实现 — 重写
- [ ] spec/03 §模型偏好注入 — 修正 model id
- [ ] README.md §技术栈表 — 同步
- [ ] spec/22 §DeepSeek prompt cache — 按 §H 实查结果调整 cache_control 字段或降级
- [ ] spec/22 + spec/24 §middleware 注入 — 按 §I 结果决定 (middleware / helper 内手动 transform)
- [ ] spec/18 §选型对比 + §vector 索引 — 按 §J 结果定稿
```

## 不变性

1. **没跑过 audit,不允许动 W3 代码** (即使 W2 已经写完 5 个 commit)
2. **audit 出来与 plan 不一致时,必须更新 plan,不许 plan 不动直接照"现实"写代码** — 文档先行原则不可破
3. **如果实查发现某依赖根本不存在或 native binding 不可用**,立刻停下来,与用户对齐降级路径 (e.g. sqlite-vec 失败时先用朴素 cosine,AI SDK middleware 失败时在 helper 内手动 transform)

## 与 spec/28 的关系

- spec/28 表格中的版本号在 audit 跑完前**视为占位**
- audit 跑完后,spec/28 完全重写为实查产物
- 后续每次 dependency bump 单独 commit (chore deps),只在主版本切换时回头更新 spec/28
