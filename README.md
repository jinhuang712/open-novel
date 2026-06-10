# Open Novel

> 像 VSCode 一样工作的 AI 中文长篇小说创作工作台 — 始终把用户放在驾驶位的创作助手

## 这是什么

一个面向番茄小说作者的 AI 创作工作台。你给一个粗略的故事种子,它配合你完成:

- **前置设定**: 世界观 / 大纲 / 角色 / 节奏 / 爽点的逐项生成与审阅
- **章节创作**: 一键章节概要 → 一键章节正文 → 一键去 AI 化
- **改完连带改**: 改了角色性别,系统自动找出所有相关章节段落,整批审批 + 落盘
- **边写边查**: 设定中的角色名 / 地点名自动高亮 + 跳转引用(像代码的 Goto Definition)
- **多项目并行**: 数据互不污染

它不是一键生成器,而是 Agent 提议 + 用户审批 + 系统持久的合伙人。

## 核心能力

- **多 Agent 协作** — 7 对外 Agent(Router / Writer / Checker / Validator / Reflector / Humanizer / ReaderPanel)+ 6 Hidden Agent(内部 LLM 工具,经 `callJsonAgent` 调用),详见 [plan/02](./plan/02-multi-agent.md)
- **三种工作模式** — Discuss(只读检索)/ Plan(设定编辑)/ Write(正文编辑),严格闸门
- **审批必须** — 所有写入走 proposal 模式,用户在 ApprovalCard 整批审 + 勾选 + 编辑;cascade 内部递归 ≤3 轮全在内存,落盘 transaction 原子
- **一致性守护** — cascade 影响半径由 SQL 出候选 + LLM 二次过滤,整批一次审完
- **五大网文守则** — 黄金三章 / 人设崩坏 / 节奏崩盘 / 期待感兑现 / 金手指依赖 自动检测;critical 风险用户必须确认才能 approve
- **叙事力学诊断** — BeatAnalyzer(章内节奏 / 钩子强度)+ ArcTracker(跨章弧光偏离)
- **发布前留存预演** — ReaderPanel 5 persona(追更党 / 逻辑控 / 情感党 / 毒舌读者 / 潜水大佬)并行模拟读者反应
- **反馈学习** — Reflector per-turn 提炼用户偏好,context builder 按 weight 注入,越用越懂你
- **流式透明** — Agent 推理过程、工具调用在右侧 ThinkingPanel 实时滚动
- **联网研究** — 接口预留 + Mock,二期接 Bocha(中文)+ Tavily(英文)

## 技术栈

| 层 | 选型 | 备注 |
|---|---|---|
| 前后端 | Next.js 15 + React 19 + TypeScript 5.9 | 单仓单应用 |
| Agent loop | Vercel AI SDK 6 (`generateText` / `streamText` + `stopWhen`) | 自定义 13 个 runner,不用 Agent 框架 |
| LLM | DeepSeek V4 Pro / Flash(直连 API) | Pro=max effort,Flash=default;ctx 1M,max output 384K,原生 JSON mode |
| 编辑器 | TipTap 3.x + ProseMirror Decorations + Aho-Corasick | 不用 Mention 节点 |
| 状态机 | XState v5 | 三模式闸门 |
| 数据库 | better-sqlite3 + Drizzle ORM | 同步 API,WAL mode |
| 向量 | sqlite-vec(loadExtension) | 与 SQLite 同库可 JOIN |
| 存储 | Markdown(产物) + SQLite 三库 | `runtime.db` 跨项目会话 / `index.db` 每项目知识图谱 / `session_history.db` 每项目过程数据 |
| 包管理 | pnpm | |

详见 [plan/08-tech-stack](./plan/08-tech-stack.md)。

## 文档状态

本仓库的全部文档是纯 Markdown:`README.md`(本文件,导航入口)、`plan/*.md`、`spec/*.md`、`design/*.md`、`progress/*.md`、`TODO.md`、`CHANGELOG.md`。图表一律使用 mermaid 代码块,不允许 ASCII 框图。唯一的 HTML 例外是 `design/prototypes/*.html` — 浏览器直接打开的高保真界面原型(非文档站)。Agent 工作规范见 [AGENTS.md](./AGENTS.md)(与 `CLAUDE.md` 内容一致)。

当前实现方向已统一为:

- **Agent runtime**: 自定义 runner + AI SDK `generateText` / `streamText`,不使用 Mastra / LangGraph 等 Agent 框架
- **L2 会话记忆**: 应用层 memory 模块 + `~/.open-novel/runtime.db`,详见 [spec/22](./spec/22-memory-and-history.md)
- **Schema 主权**: `spec/01` 维护 `index.db`;`spec/22` 维护 `runtime.db`;`spec/27` 维护每项目 `session_history.db`
- **编排主权**: `spec/26` 维护 cascade controller / `user_turn` actions / 取消恢复语义;`spec/06` 只维护审批 resolve / rollback endpoint
- **待实查闸门**: W3 代码前仍需执行 [spec/00](./spec/00-version-audit.md) 的版本与 native binding audit

## 快速启动

```bash
pnpm install
pnpm dev
# → http://localhost:3000
```

首次启动会引导你:
1. 选 Workspace 路径(默认 `~/.open-novel/workspaces/`)
2. 在 Settings 中填入 DeepSeek API key
3. 创建第一个项目

## 目录结构

```
.
├── README.md                  # 本文件,文档导航入口
├── AGENTS.md                  # Agent 工作规范(与 CLAUDE.md 内容一致)
├── CLAUDE.md                  # Claude 入口(与 AGENTS.md 内容一致)
├── TODO.md                    # TODO + 已知问题 + 未决问题
├── CHANGELOG.md               # 跨文档变更流水线
├── plan/                      # 半技术 PRD(产品向)
├── spec/                      # 核心技术文档(实施向)
├── design/                    # 界面设计: 交互文档 + HTML 高保真原型(prototypes/)
├── progress/                  # 历史进度档案(只做追溯,不再承担 rolling plan)
├── app/                       # Next.js 路由 + API
├── components/                # 前端组件
├── lib/                       # Agent / Tools / Storage / Editor
└── ~/.open-novel/workspaces/  # 你的小说项目数据(在用户目录,不在仓库)
```

## 文档导航

### 半技术 PRD (plan/) — 架构设计 (What / Why)

从创作工作流、Agent 拓扑、数据模型、模式闸门和 UI 布局解释为什么这样设计。

- [01-overview](./plan/01-overview.md) — 系统概览与关键决策
- [02-multi-agent](./plan/02-multi-agent.md) — 7 对外 + 6 Hidden Agent 拓扑与职责
- [03-editor-layer](./plan/03-editor-layer.md) — 编辑器分层与 EditorAdapter
- [04-storage-model](./plan/04-storage-model.md) — Markdown + SQLite 三库混合存储模型
- [05-modes-and-approval](./plan/05-modes-and-approval.md) — 三模式与审批流
- [06-cascade-and-reflection](./plan/06-cascade-and-reflection.md) — Cascade 一致性与反馈学习
- [07-ui-layout](./plan/07-ui-layout.md) — 五区 UI 布局
- [08-tech-stack](./plan/08-tech-stack.md) — 技术栈锁定
- [09-narrative-engine](./plan/09-narrative-engine.md) — 叙事引擎(BeatAnalyzer + ArcTracker + 模板库)
- [10-reader-simulator](./plan/10-reader-simulator.md) — 读者仿真器(5 persona ReaderPanel)
- [11-knowledge-graph](./plan/11-knowledge-graph.md) — 知识图谱与 cascade / RAG 地基
- [12-memory-and-context](./plan/12-memory-and-context.md) — Agent 记忆与上下文治理

### 核心技术文档 (spec/) — 实现细节 (How)

把存储 schema、Agent 工具、审批流、上下文装配、测试和发布闸门收束为可执行规格。界面原型与交互设计已移至 design/。

- [00-version-audit](./spec/00-version-audit.md) — W3 启动前版本 / DeepSeek / native binding 审计闸门
- [01-storage-schema](./spec/01-storage-schema.md) — SQLite schema 与 frontmatter 规范
- [02-agent-tools](./spec/02-agent-tools.md) — Agent 工具签名与契约
- [03-prompts](./spec/03-prompts.md) — Agent prompt 模板
- [04-streaming-protocol](./spec/04-streaming-protocol.md) — SSE 事件协议
- [05-entity-highlight](./spec/05-entity-highlight.md) — 实体高亮与跳转
- [06-approval-flow](./spec/06-approval-flow.md) — proposal + 独立 endpoint 审批
- [07-mode-state-machine](./spec/07-mode-state-machine.md) — XState 状态机
- [08-de-ai-pipeline](./spec/08-de-ai-pipeline.md) — 去 AI 化 pipeline
- [09-build-and-tooling](./spec/09-build-and-tooling.md) — 构建与工具链
- [10-narrative-engine](./spec/10-narrative-engine.md) — 叙事引擎实现(BeatAnalyzer / ArcTracker / 模板格式)
- [11-reader-personas](./spec/11-reader-personas.md) — ReaderPanel 实现
- [12-shortcuts](./spec/12-shortcuts.md) — 快捷键 Registry + CommandRegistry + IME 闸门 + 撤销栈语义
- [13-settings](./spec/13-settings.md) — SettingsDialog 8 section + 月度预算 + 项目生命周期
- [14-testing](./spec/14-testing.md) — 测试策略(vitest / playwright / LLM golden / CI)
- [15-onboarding](./spec/15-onboarding.md) — 首启引导
- [16-knowledge-schema](./spec/16-knowledge-schema.md) — 知识图谱 schema 与 frontmatter 升级
- [17-paragraph-anchors](./spec/17-paragraph-anchors.md) — 段级稳定 ID 与差量 reindex
- [18-embeddings](./spec/18-embeddings.md) — 段级 embedding 与语义检索
- [19-impact-analysis](./spec/19-impact-analysis.md) — 影响半径与 cascade 工具
- [20-context-assembly](./spec/20-context-assembly.md) — 上下文装配工具 assembleContext
- [21-fact-query](./spec/21-fact-query.md) — 事实查询工具 queryFacts
- [22-memory-and-history](./spec/22-memory-and-history.md) — runtime.db + 应用层 memory + 历史压缩 + 卷级摘要
- [23-context-contracts](./spec/23-context-contracts.md) — Per-agent 上下文契约
- [24-json-output](./spec/24-json-output.md) — JSON 结构化输出统一规约
- [25-cardinal-rules](./spec/25-cardinal-rules.md) — 五大网文守则
- [26-cascade-controller](./spec/26-cascade-controller.md) — user_turn actions、审批队列、取消与恢复的编排主权
- [27-session-history](./spec/27-session-history.md) — session_history.db 过程数据 schema 与保留策略

### 界面设计 (design/) — 交互与视觉 (Look & Feel)

每个核心界面一份交互设计文档 + 一份 HTML 高保真原型(`design/prototypes/`,浏览器直接打开 `index.html`,支持深浅双主题,Claude Desktop 风格)。

- [README](./design/README.md) — 设计原则、原型使用方式与导航
- [00-design-tokens](./design/00-design-tokens.md) — 设计 token:双主题色彩 / 字体 / 圆角 / 动效
- [01-main-layout](./design/01-main-layout.md) — 主界面五区布局交互
- [02-approval-cascade](./design/02-approval-cascade.md) — ApprovalCard 整批审与 cascade
- [03-reader-panel](./design/03-reader-panel.md) — ReaderPanel 章节风险报告
- [04-settings](./design/04-settings.md) — SettingsDialog
- [05-onboarding](./design/05-onboarding.md) — 首启引导
- [06-command-palette](./design/06-command-palette.md) — 命令面板与快捷交互

### 历史进度 (progress/) — 迁移与决策历史 (When)

保留项目启动、阶段收尾、文档审计和架构收敛记录,用于追溯设计变化。

- [README](./progress/README.md) — 日志索引规则与模板
- [000-init](./progress/000-init.md) — 项目启动记录
- [001-scaffolding](./progress/001-scaffolding.md) — W2 期起始计划与收尾 retro
- [002-narrative-reader](./progress/002-narrative-reader.md) — 叙事引擎 + 读者仿真器
- [003-shortcuts-and-settings](./progress/003-shortcuts-and-settings.md) — 快捷键 + Settings UX 治理
- [004-docs-hardening](./progress/004-docs-hardening.md) — W3 启动前 day-1 blocker 排查
- [005-knowledge-graph](./progress/005-knowledge-graph.md) — 知识图谱专攻(cascade + RAG 地基)
- [006-memory-and-context](./progress/006-memory-and-context.md) — 记忆 / 上下文 / JSON / 守则一致性优先重设计
- [007-opencode-borrowings](./progress/007-opencode-borrowings.md) — opencode 借鉴落地 + TODO closure

### 项目档案

- [TODO.md](./TODO.md) — TODO + 已知问题 + 未决问题
- [CHANGELOG.md](./CHANGELOG.md) — 跨文档变更流水线
- [AGENTS.md](./AGENTS.md) / [CLAUDE.md](./CLAUDE.md) — Agent 工作规范(两份内容一致)

## 设计原则

- **docs-before-code** — 任何代码 commit 之前,对应 plan/spec 必须先有,且用户 approve docs 后才动代码
- **用户主导** — Agent 提议、用户审批、系统持久;所有写盘动作必经 ApprovalCard
- **一致性 > 节流** — DeepSeek V4 1M ctx,装齐"一致性所需的全部上下文",不做 token 预算裁剪
- **影响半径不依赖 LLM** — cascade 候选必须是 SQL 算的,LLM 只做"是否真受影响"二次过滤
- **三模式严格分离** — discuss 不写,plan 不碰章节,write 不碰设定

完整不变性见 [plan/01 §不变性](./plan/01-overview.md#不变性约束-invariants)。

## 开发约定

1. **每次显著迭代必须 commit**(使用 git 直接命令)
2. **新功能先更新 plan/spec/**,代码后跟
3. **任何写入用户文件的操作必须经过 ApprovalCard**,Agent 不能 silent 落盘
4. 输出语言中文为主,可夹杂英文术语

## 不在 POC 范围

- 真实联网搜索(二期接入 Bocha + Tavily)
- 多用户 / 账号系统
- 番茄小说自动发布(导出 .md/.txt 让用户手动发)
- 实时协作(二期专项设计;POC 不预留 Yjs 接口)
- 移动端
- Windows 原生支持(POC macOS / Linux only;Windows 用户走 WSL)
- 云同步 / 多设备(本地单机优先;LibSQL 等带云同步能力的数据库栈已被砍)
- Mastra / LangGraph 等 Agent 框架(自定义 runner + AI SDK 6 `stopWhen` 已够;详见 [plan/08 ADR](./plan/08-tech-stack.md#adr--设计决策))

## 许可

当前仓库尚未声明开源许可证;发布或复用前需要由项目所有者补充正式 LICENSE。
