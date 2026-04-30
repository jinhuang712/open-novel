# 001 — W2: VSCode-Like Shell + EditorAdapter 骨架

**日期**: 2026-04-29 起
**周次**: W2
**主要 Owner**: jin.huang@klook.com
**状态**: 进行中

> 本条目按 docs-before-code 双 commit 规则于 W2 期前置。后续在末尾追加"实际完成 / 偏差 / 教训"作为 retro。

## 本期目标

把项目从纯文档骨架推进到一个**可以 `pnpm dev` 启动的 Web 应用**:
- Next.js 15 + React 19 + Tailwind v4 + shadcn/ui 项目骨架
- VSCode 风五区可拖拽布局空壳
- EditorAdapter 接口 + TipTap stub (能加载一个 .md 显示并编辑)
- SettingsDialog (持久化 DeepSeek API key 到 `~/.open-novel/settings.json`)
- 占位的 ChatBox / ThinkingPanel / DebugConsole / ApprovalCard
- Mastra / AI SDK 6 包**装但不接线** (W3 接线)

不在本期: 实际 Agent / Mastra 调用 / XState 状态机 / 实体高亮算法 / SQLite 索引层。

## 范围 (sub-commit 级别拆分)

W2 拆成 6 个独立 commit,每个可独立 `git bisect` 回退,且都附带 plan/spec 章节背书。

| # | commit | 类型 | plan/spec 依据 |
|---|---|---|---|
| 1 | `chore: nextjs 15 scaffold (manual config)` | code | plan/08 §锁定的库版本, spec/09 §项目结构常量 |
| 2 | `chore: tailwind 4 + shadcn/ui init` | code | plan/08 §Tailwind v4 vs v3, spec/09 §Tailwind v4 配置 |
| 3 | `feat: vscode-like five-region shell (resizable, empty)` | code | plan/07 §五区布局 |
| 3.5 | `docs(plan): bump tiptap to 3.x in editor-layer` | docs | (本身就是 docs) |
| 4 | `feat: editor adapter + tiptap stub (loads .md)` | code | plan/03 §TipTap 实现要点, spec/05 §TipTap 集成 |
| 5 | `feat: settings dialog + api key persistence` | code | plan/07 §SettingsDialog, spec/09 §文件路径治理 |

> 注: 上述每个 code commit **理应**先有对应的 docs commit;实际 commit 1 (324173c) 因初次理解偏差被先动了代码,本 docs commit 是补救——把 W2 期的 plan/spec 一次性补齐。后续 commit 2~5 严格走双 commit 节奏。

## 关键决策 (基于 Plan agent 调研)

1. **保持 Next.js 15 LTS,不切 v16** — LTS 到 2026-10,覆盖整个 POC 周期
2. **Tailwind v4** (而非 3.4) — 与 shadcn 最新模板一致,@theme inline + CSS 变量
3. **TipTap 3.x** (修正 plan/03 的 "TipTap 2.x" drift) — v2/v3 在我们的调用面兼容
4. **`serverExternalPackages` 提前固化在 commit 1** — 即使 Mastra 还没装,先把约定立起来
5. **SSL 拦截下不依赖 corepack/shadcn-CLI** — npm 强装 pnpm + 手写 shadcn 组件
6. **6 个独立 sub-commit 不 squash** — 用户已确认 (见 W2 plan §8 已确认项)
7. **plan/03 修正 TipTap 版本作为独立 docs commit (3.5)** — 用户已确认

## 风险与缓解

| 风险 | 缓解 |
|---|---|
| Tailwind v4 vs v3 教程混乱 | 严格遵循 plan/08 §Tailwind v4 vs v3 描述;若 v4 阻塞 >1h 降到 3.4 |
| Mastra native 包打包失败 | commit 1 先配 `serverExternalPackages`,即使 W2 不接线 |
| TipTap SSR 报警 | `'use client'` 全套 + `immediatelyRender: false` |
| LibSQL 路径默认值 bug (#4507) | `lib/storage/paths.ts` 强制 `os.homedir()` + 显式 `file:` URL |
| 企业 SSL 拦截外网工具下载 | npm 强装 pnpm 已绕过;shadcn 手写组件已绕过 |

## 验收脚本 (每个 sub-commit 后跑)

每个 code commit 后必须本地通过:

```bash
pnpm typecheck
pnpm build      # commit 5 之前可能不必每次都跑,但 commit 2 / 5 必跑
```

W2 整体收尾跑完整脚本,见 `.claude/plans/deepseek-v4-playful-quail.md` §W2-§5。

## 下期预告 (W3)

- Mastra 1.x 实例化 + globalThis 缓存模式落地
- LibSQL 索引层 (`lib/storage/db.ts` + schema migrations)
- Router agent + Discuss 模式 + 流式输出 (`/api/chat`)
- 三模式 XState 状态机
- API key 在 server 端读 → 注入 Mastra agent 配置

---

## 实际完成 / 偏差 / 教训 (W2 retro,期末再追加)

> 本节在 W2 全部 sub-commit 完成后追加。
