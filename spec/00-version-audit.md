# Spec 00 — 版本审计闸门 (W3 启动前必跑)

> 本文档替代 plan/08 中的"猜版本"做法,把 W3 接线日的版本号从训练数据预测改为 npm 实查。**任何 W3+ 代码 commit 之前必须先过这一关。**

## 为什么要有这个

文档 audit 后发现的最高优先级风险: plan/08 / spec 全栈所引用的版本号 (`mastra 1.4.x`、`@mastra/libsql 0.16.x`、`ai ^6.0`、`@ai-sdk/deepseek 2.0.x`、模型 ID `deepseek/deepseek-v4-pro`) 是基于训练数据 + 调研文章的"应然"假设,**没有任何 commit 把 npm 真实可装版本写下来过**。一旦 W3 第一次 `pnpm add` 失败或 model API 返回 404,整个时间表立刻崩。

把版本审计前置到 W3 启动前**单独一次性跑完**,产出一张确定表,写回 plan/08 后再动代码。

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

# Agent 框架 ★ 最高风险
npm view mastra versions --json | jq '.[-10:]'            # 是否真有 1.x?
npm view @mastra/core versions --json | jq '.[-10:]'      # 同上
npm view @mastra/libsql versions --json | jq '.[-10:]'    # 0.x?
npm view @mastra/memory versions --json | jq '.[-10:]'

# AI SDK ★ 最高风险
npm view ai versions --json | jq '.[-10:]'                # v6 是否 stable?
npm view @ai-sdk/react versions --json | jq '.[-10:]'
npm view @ai-sdk/deepseek versions --json | jq '.[-10:]'  # 期望 2.x

# 状态/工具
npm view xstate versions --json | jq '.[-3:]'
npm view zustand versions --json | jq '.[-3:]'
npm view react-resizable-panels versions --json | jq '.[-3:]'
npm view ahocorasick versions --json | jq '.[-3:]'
```

### B. AI SDK 6 的 `needsApproval` API 形态

**关键**: plan/05 / spec/02 / spec/06 全栈假设 `tool({ needsApproval: true })` 是 AI SDK 6 一等字段。**很可能不是**。

需要实查:

1. 查阅 Vercel AI SDK 6 官方 Human-in-the-Loop cookbook (https://ai-sdk.dev 的 cookbook 索引)
2. 在 W3 用最小可运行代码 reproduce: 一个工具 emit → 客户端 `onToolCall` 拦截 → 用户决议 → `addToolResult` 注入
3. 把真实 API 形态写入 `spec/06-approval-flow.md` (替换 `needsApproval: true` 为 cookbook 标准链路)

如果 SDK 真有 `needsApproval` 一等字段,就走那条路;否则按 cookbook 模式重写 spec/02 + spec/06 + plan/05 三处。

### C. DeepSeek 模型 ID 与定价

**问题**: spec/03 / plan/02 / README 都写 `deepseek/deepseek-v4-pro` `deepseek/deepseek-v4-flash`。这两个具体型号名是基于"DeepSeek 类比 OpenAI Pro/Flash 命名"的猜测,**真实 model id 必须实查**。

需要实查 (任一来源即可):

1. DeepSeek 官方 API 文档 (platform.deepseek.com/api-docs)
2. Vercel AI Gateway 的 DeepSeek 模型清单 (sdk.vercel.ai/gateway-docs)
3. `@ai-sdk/deepseek` 包的 README / 类型定义 (`pnpm view @ai-sdk/deepseek` 后看 supported models 字段)

实查产出一张表:

| Agent 用途 | 训练数据假设的 ID | 实查后的真实 ID | 单价 (input / output) | 备注 |
|---|---|---|---|---|
| Pro 系 (Writer/Validator/Humanizer) | `deepseek/deepseek-v4-pro` | (待填) | (待填) | |
| Flash 系 (Router/Checker/Reflector/ReaderPanel) | `deepseek/deepseek-v4-flash` | (待填) | (待填) | |
| Reasoning 系 (可选,若 V4 有 reasoning 模型) | (假设 `deepseek-reasoner`) | (待填) | (待填) | 适合 ArcTracker / Validator 复杂推理 |

如果 V4 没有 Pro/Flash 分级,只有单一 chat + reasoner 两档,需要回写整个 plan/02 §模型选择策略 — 全用同一档 + 是否引入 reasoner 区分。

### D. Vercel AI Gateway 路由策略

实查:

1. AI Gateway 是否对接 DeepSeek (sdk.vercel.ai/providers 列表)
2. 计费走 Gateway 还是直连 DeepSeek?
3. POC 阶段是否需要 Gateway?(直连可能更省钱,Gateway 的优势是多 provider 切换,POC 单 provider 不需要)

如果 Gateway 不必要,改成直连 `@ai-sdk/deepseek` + 直接 `process.env.DEEPSEEK_API_KEY`,plan/01 §关键决策表 + plan/08 删 "via Vercel AI Gateway" 字样。

### E. LibSQL #4507 与 native binding

实查:

1. 当前 `@mastra/libsql` 最新版是否仍有 #4507 (默认路径删档 bug)
2. `serverExternalPackages: ['@mastra/libsql']` 在 Next.js 15.5 实际 build 是否成功
3. macOS arm64 (M 系列) 上 native .node 文件是否在 install 时正确拉到

如果 (1) 已修,删 plan/08 的 #4507 兜底语;若仍存在,加固 `lib/storage/paths.ts` 的覆盖逻辑。

### F. Tailwind 4 + shadcn/ui 兼容性

实查:

1. shadcn/ui 当前模板 (`pnpm dlx shadcn@latest init`) 是否已支持 Tailwind v4
2. (我们手写组件,但仍要确认 `tw-animate-css` 等周边包能用)

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

### LibSQL #4507

- 仍存在 / 已修
- 兜底措施: ...

### Tailwind 4 + shadcn

- 兼容 / 不兼容
- 备选方案: ...

## 改写文档清单 (实查后)

- [ ] plan/08 §锁定的库版本 — 替换为实查表
- [ ] plan/01 §关键技术决策汇总 — 修正"via Vercel AI Gateway"语
- [ ] plan/02 §模型选择策略 — 修正模型 id
- [ ] spec/02 §writeSetting / writeChapter — 改写为 cookbook 形态
- [ ] spec/06 §服务端实现 — 重写
- [ ] spec/03 §模型偏好注入 — 修正 model id
- [ ] README.md §技术栈表 — 同步

## 改写后单独一个 docs commit

`docs(plan/spec): post-audit version lock + hitl realignment`

## 完成后才允许进入

- W3 commit 1: ...
```

## 不变性

1. **没跑过 audit,不允许动 W3 代码** (即使 W2 已经写完 5 个 commit)
2. **audit 出来与 plan 不一致时,必须更新 plan,不许 plan 不动直接照"现实"写代码** — 文档先行原则不可破
3. **如果实查发现某依赖根本不存在 (如 mastra 1.x 仍未 release)**,立刻停下来,与用户对齐降级路径 (e.g. 直接用 AI SDK 6 不上 Mastra,把 Memory 隔离自己实现)

## 与 plan/08 的关系

- plan/08 表格中的版本号在 audit 跑完前**视为占位**
- audit 跑完后,plan/08 完全重写为实查产物
- 后续每次 dependency bump 单独 commit (chore deps),只在主版本切换时回头更新 plan/08
