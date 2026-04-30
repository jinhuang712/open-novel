# Spec 09 — 构建与工具链

实操层面的工具链规范。所有项目维护者与 CI 都按此执行。

## 包管理器

**pnpm 9.x** (我们装的是 9.15.9)。

不用 npm / yarn / bun:
- pnpm 速度快,content-addressable store 共享多项目
- 与 Mastra / Next.js 兼容良好
- 单 lockfile (`pnpm-lock.yaml`) 入库

## Node 版本

**Node 22 LTS 或更高**。开发机当前是 Node 23.11 实测可用。

`@types/node` 锁 22.x 与 LTS 保持一致 (即使运行时是 23,类型沿用 22 LTS 更稳)。

## 安装陷阱

### corepack pnpm 在企业 SSL 环境下不可用

公司环境会拦截 SSL,导致 corepack 内置的 pnpm shim 第一次调用时无法从 npmjs 下载实际 pnpm。**回避方案**:

```bash
npm install -g pnpm@9 --force
# --force 覆盖 corepack 的 shim
```

`npm` 自身受 `~/.npmrc` 中 `strict-ssl=false` 控制,不走 corepack 路径,可以下载成功。

### shadcn/ui CLI 也走外网

`pnpm dlx shadcn@latest init` 会从 `ui.shadcn.com` 拉模板,**同样会被 SSL 拦截**。我们的对策:**手写所有 shadcn 组件**,只保留 `components.json` 元数据让未来本地有网时可以 `add`。

各组件按官方 New York 风格的 RSC + Tailwind v4 形态实现,版本与 React 19 / Tailwind v4 / Radix UI 保持兼容。

## 项目结构常量

```
/Users/jin.huang/dev/projects/open-novel/
├── package.json              # 单包,声明 type=module
├── pnpm-workspace.yaml       # 单成员工作区,留 monorepo 余地
├── pnpm-lock.yaml            # 入仓
├── tsconfig.json             # ES2022 + Bundler resolution + paths @/*
├── next.config.ts            # serverExternalPackages 声明 mastra
├── postcss.config.mjs        # Tailwind v4 PostCSS plugin
├── components.json           # shadcn 元数据
├── .eslintrc.json            # next/core-web-vitals
├── .env.example              # 占位说明 (key 走 UI 不走 env)
├── .gitignore                # 含 node_modules/.next/workspaces/*.db
├── next-env.d.ts             # Next 自动生成,**入库** (Next 文档要求)
├── app/                      # Next.js App Router
├── components/               # UI 组件
├── lib/                      # 业务代码
└── public/                   # 静态资源
```

用户数据在 `~/.open-novel/`,**绝不**进项目仓库 (`.gitignore` 兜底 `/workspaces/` `*.db`)。

## TypeScript 配置要点

```jsonc
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "moduleResolution": "Bundler",  // Next.js 推荐
    "jsx": "preserve",                // Next 自身处理 JSX 编译
    "strict": true,
    "noEmit": true,
    "isolatedModules": true,
    "incremental": true,
    "plugins": [{ "name": "next" }],
    "paths": { "@/*": ["./*"] }
  }
}
```

`paths` `@/*` 让所有内部 import 走绝对路径而非相对路径。

## ESLint 配置

```json
{ "extends": "next/core-web-vitals" }
```

不引入 `prettier` (Next/Tailwind 自带格式化建议已足够)。

未来扩展规则放在 `.eslintrc.json` 的 `rules` 字段,**不要**改动 `extends`。

## 命令约定

| 命令 | 用途 | 何时跑 |
|---|---|---|
| `pnpm install` | 装/更新依赖 | 每次 lockfile 变化 |
| `pnpm dev` | dev server | 开发期 |
| `pnpm build` | production build | 每次 commit 验收 |
| `pnpm typecheck` | tsc --noEmit | 每次 commit 验收 |
| `pnpm lint` | next lint | 每次 commit 验收 |

CI 验收等价于本地: `pnpm install && pnpm typecheck && pnpm lint && pnpm build`。

## Next.js 配置

```ts
// next.config.ts
import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  serverExternalPackages: [
    'mastra',
    '@mastra/core',
    '@mastra/memory',
    '@mastra/libsql',
  ],
  experimental: {
    typedRoutes: true,
  },
}

export default nextConfig
```

- **`serverExternalPackages`**: native bindings 不被打包 (libsql / better-sqlite3 等)
- **`typedRoutes`**: 让 `Link` 与 `router.push` 享受 route 路径类型校验
- 不开 `experimental.turbo` (15.5 Turbopack dev 默认开,build 仍需 webpack)

## Tailwind v4 配置 (在 CSS 里,不在 TS 里)

`app/globals.css` 顶部:

```css
@import 'tailwindcss';
@import 'tw-animate-css';

@custom-variant dark (&:is(.dark *));

@theme inline {
  --color-background: var(--background);
  /* ... 见 globals.css 完整定义 */
}

:root { /* light theme CSS vars */ }
.dark { /* dark theme CSS vars */ }
```

主题 token 用 `oklch()` (Tailwind v4 建议),颜色感知更线性,适合明暗切换。

## Route Handler 不变性

所有需要文件系统 / Mastra 的 Route 必须:

```ts
// app/api/X/route.ts
export const runtime = 'nodejs'  // 显式声明,即使是默认值

import { /* ... */ } from '@/lib/storage/paths'
// ...
```

这样:
- 通过 grep 轻松审计哪些 route 用了 nodejs 运行时
- 防止某天有人加 `export const runtime = 'edge'` 不知不觉破坏

## 文件路径治理

`lib/storage/paths.ts` 是所有路径来源:

```ts
import os from 'node:os'
import path from 'node:path'

export const getOpenNovelHome = () => path.join(os.homedir(), '.open-novel')
export const getSettingsPath = () => path.join(getOpenNovelHome(), 'settings.json')
export const getRuntimeDbPath = () => path.join(getOpenNovelHome(), 'runtime.db')
export const getWorkspacesRoot = () => path.join(getOpenNovelHome(), 'workspaces')
export const getProjectDir = (projectId: string) =>
  path.join(getWorkspacesRoot(), projectId)

// 安全防御: 任何用户提供的 path 必须以 home 为前缀
export function assertUnderHome(p: string): void {
  const abs = path.resolve(p)
  if (!abs.startsWith(getOpenNovelHome())) {
    throw new Error(`路径越权: ${p}`)
  }
}
```

任何 Route Handler 接收到 `?path=...` 请求都先调 `assertUnderHome`。

## 常见问题排查

| 现象 | 排查路径 |
|---|---|
| `pnpm install` 卡在 SSL 错误 | 检查 `~/.npmrc` 是否有 `strict-ssl=false` |
| `pnpm dev` 启不来,报 "tailwindcss directly as PostCSS plugin" | `postcss.config.mjs` 没用 `@tailwindcss/postcss` plugin |
| TipTap "hydration mismatch" 警告 | `useEditor` 没传 `immediatelyRender: false` |
| Mastra 包打包错误 (libsql 找不到 .node 文件) | `next.config.ts` 缺少 `serverExternalPackages` |
| API Route "fs is not available" | Route 没有 `export const runtime = 'nodejs'` |
| dev hot-reload 后 LibSQL 连接异常 | `lib/mastra/index.ts` 没用 `globalThis` 缓存 |
