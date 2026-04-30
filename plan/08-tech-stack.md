# 08 — 技术栈锁定与版本策略

> 本文档在 W2 期前置,作为后续所有代码 commit 的依据。每次升级主版本时必须先更新此文档再升级。

## 锁定的库版本 (2026-04 基线)

通过 Plan agent 并行调研 (Vercel/AI SDK/Mastra/Tailwind/TipTap/shadcn 官方文档 + 各项目 GitHub release notes + 2025-2026 比较文章) 得出。

| Package | 版本 | 锁定策略 | 关键说明 |
|---|---|---|---|
| `next` | `15.5.x` | 锁主线 (LTS 到 2026-10) | 不切 v16,v15 LTS 覆盖整个 POC 周期 |
| `react` / `react-dom` | `19.2.x` | 锁主线 | Next 15.5 + TipTap 3 + AI SDK 6 共同要求 |
| `typescript` | `^5.9` | caret | XState v5 / AI SDK 6 ergonomics 在 5.6+ 最佳 |
| `tailwindcss` | `4.2.x` | 锁主线 | Oxide 重写后 GA,与 v3 不兼容 |
| `@tailwindcss/postcss` | `4.2.x` | 锁主线 | v4 拆分出的独立 PostCSS plugin |
| `@tiptap/{react,pm,starter-kit}` | `3.16.x` | 锁主线 | v3 与 v2 在我们调用面兼容,SSR 需 `immediatelyRender: false` |
| `mastra` / `@mastra/core` | `1.4.x` | 锁主线 | 1.0 在 2026-01 发布,1.x 仍在演进,需密切跟踪 |
| `@mastra/libsql` | `0.16.x` | 锁主线 | 仍是 0.x;**注意 issue #4507 — 必须显式给 `file:` URL,绝不用默认路径** |
| `@mastra/memory` | `1.4.x` | 锁主线 | thread+resource 隔离的实现 |
| `ai` (Vercel AI SDK) | `^6.0` | caret | v6 已稳,minor 增量;`needsApproval` 在核心包 |
| `@ai-sdk/react` | `^6.0` | caret | `useChat` / `addToolResult` / `onToolCall` |
| `@ai-sdk/deepseek` | `2.0.x` | 锁主线 | 周更频繁;DeepSeek V4 Pro/Flash 一等公民 |
| `xstate` / `@xstate/react` | `^5.0` | caret | 三模式状态机用 |
| `zustand` | `^5.0` | caret | 客户端 store |
| `react-resizable-panels` | `4.10.x` | 锁主线 | 五区可拖拽布局 |
| `ahocorasick` (BrunoRB) | `^1.0` | caret | 10KB JS,实体高亮的字符串多模匹配 |
| `gray-matter` / `unified` / `remark-*` | latest | caret | Markdown frontmatter + AST 处理 |
| `lucide-react` | latest | caret | shadcn 默认图标库 |
| `cva` / `clsx` / `tailwind-merge` | latest | caret | shadcn 三件套 |
| `sonner` | `^2.0` | caret | shadcn 推荐的 toast 库 |
| `tw-animate-css` | latest | caret | Tailwind v4 era 的 shadcn 动画 |

## 锁定策略原则

- **锁主线 (无 caret)**: 0.x 包、快速演进的 1.x 包、直接决定渲染输出/native binding 的包 — 任何 minor 漂移都可能引起破坏性变更
- **caret (`^`)**: 类型包、稳定版 v5/v6 主流框架包、生态边缘工具
- `pnpm-lock.yaml` 入库,作为 single-source-of-truth — 任何团队成员安装得到一致的依赖树

## 集成关键点

### Next.js + Mastra

- **`next.config.ts`** 必须包含 `serverExternalPackages: ['mastra', '@mastra/core', '@mastra/memory', '@mastra/libsql']` — 否则 bundler 会试图打包 libsql 的 native 绑定,失败
- **所有触 Mastra 的 Route Handler 必须** `export const runtime = 'nodejs'` (Edge runtime 不支持 fs / native bindings)
- **globalThis 缓存模式**: dev hot-reload 会反复实例化 mastra,导致 LibSQL 连接泄漏。在 `lib/mastra/index.ts` 用 `globalThis.__openNovelMastra` 缓存,模仿 Prisma 的 Next.js dev 范式

### Next.js + TipTap (v3)

- **`'use client'` 边界**: TipTap 的 `useEditor`、`@tiptap/pm`、`@tiptap/starter-kit` 间接 touch `window`,host 组件 + adapter 实现都必须 `'use client'`
- **`immediatelyRender: false`** 是 TipTap 3 在 SSR 下的默认要求,不加会出 hydration warning
- **不用 `next/dynamic({ ssr: false })`**: 单 `'use client'` 已足够,dynamic import 仅在 FCP 出现压力时再考虑

### Tailwind v4 vs v3 的行为变化

- **配置位置**: 不再有 `tailwind.config.ts`;主题、CSS 变量、颜色都在 `app/globals.css` 的 `@theme inline { ... }` 块中
- **PostCSS plugin**: 从 `tailwindcss` 主包拆出 — 必须额外装 `@tailwindcss/postcss`
- **指令变化**: `@tailwind base/components/utilities` → 单一 `@import 'tailwindcss';`
- **`@custom-variant dark`**: dark mode variant 通过 `@custom-variant dark (&:is(.dark *))` 显式声明
- **回退方案**: 若 v4 在某场景阻塞 (>1h),可降到 3.4.x — 改动量约 30 分钟

### shadcn/ui v4 era

- 跑 `pnpm dlx shadcn@latest init` 自动识别 Tailwind v4 (但**注意**: 因企业 SSL 拦截 ui.shadcn.com,我们手工写组件,不依赖 CLI fetch)
- 锁定的初始化参数: Style=new-york / RSC=true / TSX=true / baseColor=slate / cssVariables=true / iconLibrary=lucide
- **`components.json`** 仍要写,作为 shadcn `add` 命令未来可用的元数据
- 初始最小集: `button card dialog input label resizable scroll-area separator tabs textarea`

### LibSQL 路径治理 (issue #4507 兜底)

- **绝不**用 `~` 字面量 (Node fs 不展开),始终用 `os.homedir()`
- **始终**给 LibSQL `file:${absPath}` 形式 URL,绝不让它走默认 `.mastra/mastra.db` (有删档 bug)
- 写 `lib/storage/paths.ts` 集中所有路径解析,W3 直接 import,不重新计算

## 版本升级流程 (未来)

- 单一 minor bump (e.g. `next 15.5.4 → 15.5.7`):测试 + lockfile 更新 + commit `chore(deps): bump next 15.5.7`,无需 doc 更新
- 主版本切换 (e.g. `next 15 → 16`):必须先 PR 更新本文档 + plan/spec 受影响章节 + 跑全套验收,然后再 code commit
- 从 caret 收紧到锁主线 (生产准备时):整体走一遍 doc commit `docs(plan/08): tighten version locks for production`

## 不在本期范围

- 私有包注册表 / npm proxy 配置 (POC localhost,直连 npmjs)
- 多 lockfile 共存 (Yarn / npm) — 强制 pnpm
- 跨平台兼容 (我们只测 macOS;Windows / Linux 留待二期)
