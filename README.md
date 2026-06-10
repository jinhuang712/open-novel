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

- **AI 角色编辑部** — 七个分工明确的 AI 角色像编辑部一样围着你的书工作,各司其职、可单独开关,详见 [plan/05](./plan/05-agent-team.md)
- **三种协作姿态** — 讨论(只聊不写)/ 规划(只动设定)/ 写作(产出正文),界限分明,你随时知道 AI 此刻能动什么
- **审批必经** — AI 只提议,任何写入作品的内容都先经你整批审定、可勾选可编辑,没有静默改动
- **一致性守护** — 改一个设定,全部连锁影响自动找全,一次看全、一次审完
- **五大网文守则** — 黄金三章 / 人设不崩 / 节奏不崩盘 / 期待感必兑现 / 金手指不依赖 自动检测;高风险改动须作者确认后才能通过
- **叙事力学诊断** — 节奏、爽点密度、章末钩子与角色弧光的持续体检与偏离预警
- **发布前读者预演** — 一组模拟读者(追更党 / 逻辑控 / 情感党 / 毒舌读者 / 潜水大佬)先于真实读者读完本章,给出弃书风险报告
- **越用越懂你** — 你的每一次修改、采纳与否决都被记住,系统越写越合你的手感
- **过程透明** — AI 的每一步提议、依据与影响都在侧栏实时可见,不是黑盒出稿

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

详见 [spec/28-tech-stack](./spec/28-tech-stack.md)。

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
├── plan/                      # 产品 PRD(纯产品定义)
├── spec/                      # 核心技术文档(实施向)
├── design/                    # 界面设计: 交互文档 + HTML 高保真原型(prototypes/)
├── progress/                  # 历史进度档案(只做追溯,不再承担 rolling plan)
├── app/                       # Next.js 路由 + API
├── components/                # 前端组件
├── lib/                       # Agent / Tools / Storage / Editor
└── ~/.open-novel/workspaces/  # 你的小说项目数据(在用户目录,不在仓库)
```

## 文档导航

### 产品 PRD (plan/) — 产品设计 (What / Why)

纯产品定义:为谁而做、解决什么问题、产品长什么样、边界在哪里;零技术细节,技术实现收束在 spec/。

- [01-overview](./plan/01-overview.md) — 产品定位、要解决的问题、核心场景与能力一览
- [02-principles](./plan/02-principles.md) — 贯穿全部能力的产品价值观与取舍标准
- [03-guardrails](./plan/03-guardrails.md) — 产品红线与网文创作守则的唯一出处
- [04-goals-and-non-goals](./plan/04-goals-and-non-goals.md) — 为谁而做、做什么、明确不做什么
- [05-agent-team](./plan/05-agent-team.md) — 七个 AI 角色的分工、边界与开关
- [06-collaboration-and-modes](./plan/06-collaboration-and-modes.md) — 讨论 / 规划 / 写作三种协作方式及其边界
- [07-approval-and-cascade](./plan/07-approval-and-cascade.md) — 整批审批的形态,连带修改如何一次看全审完
- [08-story-world](./plan/08-story-world.md) — 六维故事世界如何守住上百万字的前后一致
- [09-memory-and-learning](./plan/09-memory-and-learning.md) — 系统如何记住这本书、记住你,越用越懂你
- [10-narrative-and-reader](./plan/10-narrative-and-reader.md) — 叙事力学体检与发布前的模拟读者

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
- [28-tech-stack](./spec/28-tech-stack.md) — 技术栈锁定与集成关键点

### 界面设计 (design/) — 交互与视觉 (Look & Feel)

每个核心界面一份交互设计文档 + 一份 HTML 高保真原型(`design/prototypes/`,浏览器直接打开 `index.html`,支持深浅双主题,嫩叶绿 accent · 素色低反差视觉语言)。

- [README](./design/README.md) — 设计原则、原型使用方式与导航
- [00-design-tokens](./design/00-design-tokens.md) — 设计 token:双主题色彩 / 字体 / 圆角 / 动效
- [01-main-layout](./design/01-main-layout.md) — 主界面:章节轨 · 纸面 · 状态点
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

- **用户驾驶位** — AI 提议、作者审定、系统持久;任何写入作品的内容必经审批,没有静默改动
- **一致性大于一切** — 装齐一致性所需的全部上下文,前后自洽优先于成本节流
- **影响确定可解释** — 连锁影响的范围由确定性规则算出,AI 只做"是否真受影响"的复核,结果可解释可追溯
- **三模式严格分离** — 讨论不写、规划不碰正文、写作不碰设定
- **docs-before-code** — 任何代码之前对应 plan/spec 先有并经用户认可(已纳入 `CLAUDE.md` 工作规范)

完整产品原则见 [plan/02-principles.md](./plan/02-principles.md),红线与守则见 [plan/03-guardrails.md](./plan/03-guardrails.md)。

## 开发约定

1. **每次显著迭代必须 commit**(使用 git 直接命令)
2. **新功能先更新 plan/spec/**,代码后跟
3. **任何写入用户文件的操作必须经过 ApprovalCard**,Agent 不能 silent 落盘
4. 输出语言中文为主,可夹杂英文术语

## 非目标

明确不做的事(设计立场,不是排期):

- 联网研究与素材搜索
- 多用户协作与实时协同
- 云同步 / 多设备
- 移动端
- 平台自动发布(导出成稿,作者自行上传)
- 模型微调
- 跨项目共享记忆与经验
- 写作中实时干预
- 替作者决策的闸门化评分

每一条"为什么不该做"的理由与平台约束(本地单机、桌面平台、Windows 经 WSL)详见 [plan/04 §非目标](./plan/04-goals-and-non-goals.md#非目标);技术栈层面的取舍(如不使用 Mastra / LangGraph 等 Agent 框架)见 [spec/28 §设计取舍](./spec/28-tech-stack.md#设计取舍)。

## 许可

当前仓库尚未声明开源许可证;发布或复用前需要由项目所有者补充正式 LICENSE。
