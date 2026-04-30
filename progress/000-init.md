# 000 — 项目启动: 文档骨架

**日期**: 2026-04-29
**周次**: W1
**主要 Owner**: jin.huang@klook.com

## 本期目标

- [x] 完成需求澄清 (与 AI 协作多轮对齐)
- [x] 调研多 Agent JS 框架 (Mastra vs AI SDK vs LangGraph.js vs OpenAI Agents SDK)
- [x] 调研主流 AI 应用的联网搜索方案 (DeepSeek / Doubao / ChatGPT / Claude / opencode / OpenHands / Sudowrite / NovelCrafter)
- [x] 调研 TipTap + ProseMirror Decorations 实现实体高亮的方案
- [x] 输出项目级 plan/ 目录 (7 个架构文档)
- [x] 输出项目级 spec/ 目录 (8 个实现细节文档)
- [x] 输出 README.md
- [x] git init + 首次 commit

## 实际完成

✅ 全部完成。本期产出:

- `README.md` — 项目总览、快速启动、文档导航
- `plan/01-overview.md` — 系统概览与关键决策
- `plan/02-multi-agent.md` — 6 Agent 拓扑与职责
- `plan/03-editor-layer.md` — 编辑器分层与 EditorAdapter
- `plan/04-storage-model.md` — md+sql 混合存储模型
- `plan/05-modes-and-approval.md` — 三模式与审批流
- `plan/06-cascade-and-reflection.md` — Cascade 一致性与反馈学习
- `plan/07-ui-layout.md` — 五区 UI 布局
- `spec/01-storage-schema.md` — SQLite schema 与 frontmatter 规范
- `spec/02-agent-tools.md` — Agent 工具签名与契约
- `spec/03-prompts.md` — Agent prompt 模板
- `spec/04-streaming-protocol.md` — SSE 事件协议
- `spec/05-entity-highlight.md` — 实体高亮与跳转
- `spec/06-approval-flow.md` — 审批流接入 needsApproval
- `spec/07-mode-state-machine.md` — XState 状态机
- `spec/08-de-ai-pipeline.md` — 去 AI 化 pipeline

## 关键决策

| 决策 | 选择 | 关键理由 |
|---|---|---|
| 应用架构 | Next.js 15 单仓 | POC 起步快,SSE 一等公民 |
| Agent 框架 | Mastra 1.x on Vercel AI SDK 6 | `Memory` thread+resource 隔离;`AgentNetwork` LLM 路由;`needsApproval` |
| LLM | DeepSeek V4 Pro/Flash | Pro 跑创作,Flash 跑路由/检查;Vercel AI Gateway 一站接入 |
| 编辑器 | TipTap + 自定义 ProseMirror Decorations + Aho-Corasick | 不用 `Mention` 节点;参考 fork `prosemirror-link-plugin` |
| 存储 | `~/.open-novel/workspaces/{projectId}/` 内 .md + LibSQL | 内容人类可读;索引/历史 sql 不可见 |
| 联网 | POC 阶段仅接口预留 + Mock | 二期接 Bocha 中文主 + Tavily 英文兜底,MCP sidecar 形态 |
| 三模式 | XState 状态机 | discuss/plan/write 严格闸门 |
| 审批 | AI SDK 6 `needsApproval` | 写入操作必须用户审,拒绝带反馈 |
| 反馈学习 | Reflector + learnings 表 + RAG 注入 | 廉价但实用,无需微调 |

## 关键调研发现

1. **Mastra 1.x** (Jan 2026 release) 在多 Agent + Memory + 流式输出三方面比 plain AI SDK 6 更好用,但 SOC 2 暂无 (POC localhost 不影响)。
2. **opencode + OpenHands** 是开源 Agent 联网最规范的两个参考项目,都用 MCP 抽离搜索能力。我们二期借鉴。
3. **TipTap `Mention` 节点不适合"已写就的名字识别"场景** — 它是 atomic 显式标记节点。社区 (TipTap discussion #2295) 推荐用 `addProseMirrorPlugins` + Decorations。
4. **NovelCrafter Codex** 的 UX (canonical name + aliases + 大小写敏感开关 + exclusion list + mention heatmap) 接近最佳实践,直接借鉴。
5. **番茄小说 (ByteDance)** 已要求 AI 生成内容必须披露 (2025 年 9 月新规),所以引用追溯不仅是 UX,还是合规需求 (二期联网时尤其重要)。

## 下期计划 (W2)

- Next.js 15 项目骨架 (`pnpm create next-app`)
- 安装核心依赖: TipTap, Mastra, Vercel AI SDK 6, @ai-sdk/deepseek, XState, Zustand, Tailwind, shadcn/ui, react-resizable-panels
- 实现 AppShell 五区布局 (空壳)
- 实现 EditorAdapter 接口 + TipTap 空实现 (能加载 .md)
- 实现 SettingsDialog (API key 持久化到 `~/.open-novel/settings.json`)
- 占位的 ChatBox + ThinkingPanel (硬编码消息)
- W2 commit: `feat: vscode-like shell + editor adapter`

## 已知风险

- Mastra 1.x API 仍在迭代,2026 Q2 可能再有 minor break — 缓解: 锁版本 + agent-core 包封装
- DeepSeek V4 Vercel Gateway 可用性不确定 — 备选: 直连 DeepSeek API + `@ai-sdk/openai-compatible`
- TipTap + 长章节性能 — 缓解: Worker 兜底已设计

## 关联 commit

- `cdc626d` init: scaffolding & docs (W1)

## Retro 注 (2026-04-30 追加)

- **Agent 数量**: 本日志记的 "6 Agent 拓扑" 在 progress/002-narrative-reader (战略升级) 后扩到 7 (新增 ReaderPanel)。最新拓扑见 plan/01 §7 Agent 拓扑
- **时间表**: 原计划 ~12 周;002 升级后 ~14 周;004 docs 加固未变更代码工作量,仍按 14 周
- **W1 spec 集**: 当时仅 8 个 spec,后续 W2 docs 期扩到 13;004 docs 加固再扩到 16 (新增 spec/00 spec/14 spec/15)
