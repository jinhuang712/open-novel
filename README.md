# Open Novel

> 像 VSCode 一样工作的 AI 中文长篇小说创作工作台 — 始终把用户放在驾驶位的创作助手

## 这是什么

一个面向番茄小说作者的 AI 创作工作台。你给一个粗略的故事种子,它配合你完成:

- **前置设定**: 世界观 / 大纲 / 角色 / 节奏 / 爽点的逐项生成与审阅
- **章节创作**: 一键章节概要 → 一键章节正文 → 一键去 AI 化
- **改完连带改**: 改了角色性别,系统列出确定性影响集合,把疑似受影响段落作为低置信候选补充给你,整批审批 + 落盘
- **边写边查**: 设定中的角色名 / 地点名自动高亮 + 跳转引用;`Shift+Shift` 打开统一搜索,角色、阵营、概念、章节片段与事实答案都从同一入口进入
- **多项目并行**: 单窗口内切换项目,active turn、待审卡、未保存编辑、最近记录和样例项目数据互不污染

它不是一键生成器,而是 Agent 提议 + 用户审定 + 系统持久的合伙人。

## 核心能力

- **AI 角色编辑部** — 七个分工明确的 AI 角色像编辑部一样围着你的书工作,各司其职、可单独调档、配置、按需触发或调整频率/权重,详见 [plan/06](./plan/06-agent-team.md)
- **三种协作姿态** — 讨论(只聊不写)/ 规划(只动设定)/ 写作(产出正文),界限分明,你随时知道 AI 此刻能动什么
- **审定必经** — AI 只提议,小修改就地确认,连带修改整批审定,没有静默改动
- **一致性守护** — 改一个设定,确定性影响集合完整列出,疑似语义影响作为低置信候选提示,一次看全、一次审完
- **五大网文守则** — 黄金三章 / 人设不崩 / 节奏不崩盘 / 期待感必兑现 / 金手指不依赖 自动检测;高风险改动须作者确认后才能通过
- **叙事力学诊断** — 节奏、爽点密度、章末钩子与角色弧光的持续体检与偏离预警
- **发布前读者预演** — 一组模拟读者(追更党 / 逻辑控 / 情感党 / 毒舌读者 / 潜水大佬)先于真实读者读完本章,给出弃书风险报告
- **越用越懂你** — 你的审定结果和明确反馈会形成可见经验候选,系统越写越合你的手感
- **过程透明** — AI 的工作日志、输入材料、动作记录、依据引用与可解释结论都可回看,每轮结束都有作者看得懂的回顾,不是黑盒出稿

## 技术栈

| 层 | 选型 | 备注 |
|---|---|---|
| 前后端 | Next.js 15 + React 19 + TypeScript 5.9 | 单仓单应用 |
| 桌面壳 | Tauri(多端 macOS / Windows / Linux) | 单实例单窗口;二次启动只聚焦既有窗口;执行宿主 sidecar 形态待 V03 实查 |
| Agent loop | Vercel AI SDK 6 (`generateText` / `streamText` + `stopWhen`) | 单一受控 Runner 契约承载七个 canonical AI 角色,不用 Agent 框架 |
| LLM | DeepSeek V4 Pro / Flash(直连 API) | Pro=max effort,Flash=default;ctx 1M,max output 384K,原生 JSON mode |
| 编辑器 | TipTap 3.x + ProseMirror Decorations + Aho-Corasick | 不用 Mention 节点 |
| 状态机 | XState v5 | 三模式闸门 |
| 数据库 | better-sqlite3 + Drizzle ORM | 同步 API,WAL mode |
| 向量 | sqlite-vec(loadExtension) | 与 SQLite 同库可 JOIN |
| 存储 | Markdown(产物) + SQLite 四库 | `runtime.db` 跨项目会话 / `project.db` 每项目真源账本 / `index.db` 每项目派生索引(可重建) / `session_history.db` 每项目过程数据 |
| 包管理 | pnpm | |

技术路线入口见 [spec/S00-system-contract](./spec/S00-system-contract.md)。表结构、schema、工具、prompt、测试和审计明细的归口见 [spec appendix](./spec/appendix/README.md)。

## 文档状态

本仓库的全部文档是纯 Markdown:`README.md`(本文件,导航入口)、`WORKFLOW.md`、`plan/*.md`、`spec/*.md`、`design/*.md`、`progress/*.md`、`TODO.md`、`CHANGELOG.md`。图表一律使用 mermaid 代码块,不允许 ASCII 框图。唯一的 HTML 例外是 `design/prototypes/*.html` — 浏览器直接打开的高保真界面原型(非文档站)。Agent 工作规范见 [AGENTS.md](./AGENTS.md)(与 `CLAUDE.md` 内容一致),文档更新流程见 [WORKFLOW.md](./WORKFLOW.md)。

当前实现方向已统一为:

- **AI 运行编排**: 单一受控 Runner 契约 + AI SDK `generateText` / `streamText`,不使用 Mastra / LangGraph 等 Agent 框架;运行信封使用 [M13](./spec/M13-agent-team-controls.md) 的七个 canonical role id,prompt、证据包、tool、harness 和 golden gate 各有系统主权层
- **桌面壳与执行宿主**: 桌面壳采用 Tauri(多端 macOS / Windows / Linux),应用单实例单窗口运行;二次启动只聚焦既有窗口,不创建第二窗口;常驻执行宿主以 Tauri 管理的 sidecar 进程承载,进程形态与 native binding 兼容性经 [V03](./spec/appendix/V03-external-spikes.md) 实查后落定,边界见 [I05](./spec/platform/I05-desktop-shell-contract.md)
- **核心 spec 编号**: 根层 `spec/` 使用 `S/M`;`spec/platform/` 使用 `I/R`;appendix 使用 `A/V`;progress 使用 `P`
- **系统设计**: `S00-S15` 写系统主权、跨层契约、运行时、存储、上下文、LLM 质量闭环和底层协议
- **能力闭环**: `M01-M18` 写用户可触发、可感知、可验收的完整能力
- **平台支撑契约**: 当前 `spec/platform/` 包含 I01/I02/I03/I05 四篇跨边界接入契约,以及 R01/R03/R04/R05 四篇生命周期、迁移、修复和诊断契约;I04/R02 已按用户裁决撤销并保留跳号
- **实现明细后置**: 表结构、JSON schema、事件枚举、工具参数、prompt、测试矩阵、golden cases 和迁移细节归口在 [spec/appendix](./spec/appendix/README.md);历史旧 spec 原文已清理,不再保留
- **运行时状态**: 应用层 memory 模块 + `~/.open-novel/runtime.db`;recent projects 可跨项目显示,项目内 recent/search/history 按 project id 分桶,详见 [spec/S01](./spec/S01-runtime-state.md) 与 [M16](./spec/M16-project-library-and-navigation.md)
- **项目存储主权**: 项目文件、真源库(`project.db`)与派生索引(`index.db`,可整库重建)的物理分库和落盘协议由 [spec/S14](./spec/S14-project-storage.md) 定义
- **决策与写入账本主权**: 审批裁定、写入账本、light apply、恢复记录、反向修正、危险操作审计和 Recap/Activity 投影由 [spec/S15](./spec/S15-journal-and-ledger.md) 定义
- **编排主权**: user turn / cascade / approval / cancel plan / forward-only 修正由 [spec/S03](./spec/S03-turn-orchestration.md) 定义
- **开发者诊断入口**: 真实作者包不显示、不可开启;是否编入或暴露由构建/打包配置决定
- **外部事实审计闸门**: 代码前的外部依赖和运行事实审计由 [spec/S00](./spec/S00-system-contract.md) 统筹,明细见 appendix

## 文档 lint

当前仓库没有根层 `package.json`,直接运行:

```bash
node scripts/docs-lint.js
```

该脚本检查 Markdown 相对链接、仓库内 Markdown 链接不得指向 `.html` 文件、活跃 TODO 编号声明唯一性和产品红线编号声明唯一性。

## 快速启动

当前仓库仍处于文档与 HTML 原型阶段,尚未包含根层 `package.json` 或应用工程目录。应用代码落仓后的目标启动方式是:

```bash
pnpm install
pnpm dev
# → http://localhost:3000
```

首次启动会引导你:
1. 选择或创建项目,首次可指定本机项目库位置(默认 `~/.open-novel/workspaces/`)
2. 填入模型服务凭据
3. 进入主界面;左上角可随时返回项目选择

项目切换发生在同一个窗口内。切换前若当前项目还有运行中的 turn、待审卡、未保存编辑或外部冲突,系统必须先让作者处理;recent objects、Search/query history、preview cache、session history 和样例项目数据都按 project id 隔离。

## 目录结构

```
.
├── README.md                  # 本文件,文档导航入口
├── WORKFLOW.md                # 文档与实现协作流程
├── AGENTS.md                  # Agent 工作规范(与 CLAUDE.md 内容一致)
├── CLAUDE.md                  # Claude 入口(与 AGENTS.md 内容一致)
├── TODO.md                    # 当前活跃验证项、裁决项、文档修复项与新增规则
├── CHANGELOG.md               # 跨文档变更流水线
├── plan/                      # 产品 PRD(纯产品定义)
├── spec/                      # 核心技术文档(S/M) + platform/ + appendix/
├── design/                    # 界面设计: 交互文档 + HTML 高保真原型(prototypes/)
├── progress/                  # 历史进度档案(只做追溯,不再承担 rolling plan)
├── scripts/                   # 轻量文档质量检查脚本
└── ~/.open-novel/workspaces/  # 你的小说项目数据(在用户目录,不在仓库)
```

未来应用工程落仓时会新增 `app/`、`components/`、`lib/` 等目标结构;当前工作树尚未包含这些目录。

## 文档导航

### 产品 PRD (plan/) — 产品设计 (What / Why)

纯产品定义:为谁而做、解决什么问题、产品长什么样、边界在哪里;零技术细节,技术实现收束在 spec/。

- [01-overview](./plan/01-overview.md) — 产品定位、要解决的问题、核心场景与能力一览
- [02-principles](./plan/02-principles.md) — 贯穿全部能力的产品价值观与取舍标准
- [03-guardrails](./plan/03-guardrails.md) — 产品红线与网文创作守则的唯一出处
- [04-goals-and-non-goals](./plan/04-goals-and-non-goals.md) — 为谁而做、做什么、明确不做什么
- [05-story-world](./plan/05-story-world.md) — 六维故事世界如何守住上百万字的前后一致
- [06-agent-team](./plan/06-agent-team.md) — 七个 AI 角色的分工、边界与调配
- [07-collaboration-and-modes](./plan/07-collaboration-and-modes.md) — 讨论 / 规划 / 写作三种协作方式及其边界
- [08-approval-and-cascade](./plan/08-approval-and-cascade.md) — 整批审批的形态,连带修改如何一次看全审完
- [09-narrative-and-reader](./plan/09-narrative-and-reader.md) — 叙事力学体检与发布前的模拟读者
- [10-memory-and-learning](./plan/10-memory-and-learning.md) — 系统如何记住这本书、记住你,越用越懂你

### 核心技术文档 (spec/) — 系统契约 (How / Boundaries)

根层 spec 是可直接阅读的技术设计。`S` 讲系统主权和跨层契约,`M` 讲用户可感知能力。`I/R` 放在 `spec/platform/`,承接跨边界接入、恢复、迁移和诊断等平台支撑契约。每篇按主题选择自己的骨架,先用场景、图表、表格和 FAQ 讲清系统主路径、职责边界、设计取舍、失败语义和用户可见结果;表结构、完整 JSON schema、事件字段、工具参数、prompt、测试矩阵和迁移细节统一后置到 appendix。界面原型与交互设计仍归 design/。

#### S · System Design

- [S00-system-contract](./spec/S00-system-contract.md) — 系统总图、三条系统律、跨层主权和审计闸门
- [S01-runtime-state](./spec/S01-runtime-state.md) — 会话、经验、活动记录、过程历史和 Reflector 生命周期
- [S02-agent-runner](./spec/S02-agent-runner.md) — 受控 runner 生命周期、结构化输出、tool loop、retry 和失败循环
- [S03-turn-orchestration](./spec/S03-turn-orchestration.md) — user turn 事务信封、cascade 泳道、审批、取消和 recap 触发语义
- [S04-streaming-ui-protocol](./spec/S04-streaming-ui-protocol.md) — 状态点、Trace、Recap ready、事件分层和断线恢复驾驶舱协议
- [S05-knowledge-graph](./spec/S05-knowledge-graph.md) — 正文到事实的图谱管线、锚点健康度和派生索引边界
- [S06-context-management](./spec/S06-context-management.md) — Agent 证据包、长篇分卷、影响分析裁判链、事实答案和超限决策
- [S07-prompt-system](./spec/S07-prompt-system.md) — prompt 分层、优先级、不可信内容围栏和 prompt 变更治理
- [S08-agent-tooling-boundary](./spec/S08-agent-tooling-boundary.md) — 工具白名单、读/提议/内部工具、工具失败和二次 LLM 调用边界
- [S09-llm-quality-harness](./spec/S09-llm-quality-harness.md) — 真实/模拟任务 replay、输入输出证据包和失败复现
- [S10-evaluation-and-golden-regression](./spec/S10-evaluation-and-golden-regression.md) — golden cases、回归门禁、质量指标和 prompt / 证据包改动验收
- [S11-creative-engine](./spec/S11-creative-engine.md) — 五大守则质检室、叙事诊断、读者面板和风险进入审批
- [S12-style-and-humanizer](./spec/S12-style-and-humanizer.md) — 表达层改写边界、风格来源、越权判定和差异说明
- [S13-editor-and-interaction](./spec/S13-editor-and-interaction.md) — 编辑器命令路由、焦点顺序、查询浮层和 undo / forward-only 修正边界
- [S14-project-storage](./spec/S14-project-storage.md) — 项目物理存储与落盘协议、分库、fencing 和 reindex 请求
- [S15-journal-and-ledger](./spec/S15-journal-and-ledger.md) — 决策与写入账本、恢复记录、反向修正和 Recap/Activity 投影

#### M · User-Facing Capability

- [M01-universal-search](./spec/M01-universal-search.md) — Shift+Shift 统一搜索、角色/阵营/概念/章节分组、悬停预览和降级语义
- [M02-command-palette-and-quick-open](./spec/M02-command-palette-and-quick-open.md) — 命令面板、快速打开、模式切换和快捷命令路由
- [M03-fact-query](./spec/M03-fact-query.md) — 统一搜索内的事实答案、来源跳转和只读证据解释
- [M04-discuss-mode](./spec/M04-discuss-mode.md) — 讨论模式只聊不写、只读上下文和升级到规划/写作的边界
- [M05-planning-mode](./spec/M05-planning-mode.md) — 规划模式如何改设定、大纲和结构,但不碰正文
- [M06-writing-mode](./spec/M06-writing-mode.md) — 写作模式如何产出章节内容并进入审批
- [M07-inline-rewrite-and-humanizer](./spec/M07-inline-rewrite-and-humanizer.md) — 选区改写、去 AI 味和表达层边界
- [M08-approval-cascade](./spec/M08-approval-cascade.md) — Approval Cascade 能力闭环、审批卡解释内容和 design 对接
- [M09-trace-observability](./spec/M09-trace-observability.md) — 用户可读过程证据、开发者诊断分层和可见条目结构
- [M10-knowledge-surface](./spec/M10-knowledge-surface.md) — 角色、阵营、概念和世界观的知识面板
- [M11-reader-panel](./spec/M11-reader-panel.md) — 读者面板报告闭环、读者画像边界和审批解释关系
- [M12-memory-learning-management](./spec/M12-memory-learning-management.md) — 经验可见、可调、可删和 Reflector 管理
- [M13-agent-team-controls](./spec/M13-agent-team-controls.md) — 七个 AI 角色的档位、调配和能力边界
- [M14-settings-and-developer-mode](./spec/M14-settings.md) — 设置面板:分区、助手语气边界、凭据用户语义和危险操作
- [M15-onboarding-and-new-book](./spec/M15-onboarding-and-new-book.md) — 首启、开书向导、样例项目和工作区初始化
- [M16-project-library-and-navigation](./spec/M16-project-library-and-navigation.md) — 项目库、章节轨、最近打开、单窗口项目切换和跨项目隔离
- [M17-turn-recap-and-continuation](./spec/M17-turn-recap-and-continuation.md) — Turn Recap、项目活动时间线、停止回执和续接入口
- [M18-developer-mode](./spec/M18-developer-mode.md) — 开发者诊断模式:可见内容分层、不绕审批和修复入口分工

#### Platform · I/R

- [platform README](./spec/platform/README.md) — `I/R` 平台支撑契约索引与更新规则
- [I01-llm-provider-contract](./spec/platform/I01-llm-provider-contract.md) — 模型 provider 能力、失败、审计和降级边界
- [I02-editor-adapter-contract](./spec/platform/I02-editor-adapter-contract.md) — 编辑器适配层的选择、锚点、选区和 undo 责任
- [I03-filesystem-and-watcher](./spec/platform/I03-filesystem-and-watcher.md) — 文件系统、外部编辑监听、原子写和冲突处理
- [I05-desktop-shell-contract](./spec/platform/I05-desktop-shell-contract.md) — 桌面壳、系统权限、窗口与本地路径契约

- [R01-project-lifecycle](./spec/platform/R01-project-lifecycle.md) — 项目创建、打开、关闭、归档和恢复入口
- [R03-migration-and-upgrade](./spec/platform/R03-migration-and-upgrade.md) — 文档、数据和索引迁移升级策略
- [R04-index-health-and-repair](./spec/platform/R04-index-health-and-repair.md) — 索引健康、重建、降级查询和修复体验
- [R05-diagnostics-and-debug-mode](./spec/platform/R05-diagnostics-and-debug-mode.md) — 诊断包、Debug Mode、导出边界和隐私保护

#### Appendix · A/V

- [appendix README](./spec/appendix/README.md) — `A/V` 明细索引与更新规则
- [A01-schema-tables](./spec/appendix/A01-schema-tables.md) — 表结构、字段字典、索引和迁移字段
- [A02-json-schemas](./spec/appendix/A02-json-schemas.md) — 结构化输出、报告对象、ChangeSet、回顾和证据包
- [A03-event-catalog](./spec/appendix/A03-event-catalog.md) — turn、stream、trace、approval、recap 和 UI 事件字段
- [A04-tool-catalog](./spec/appendix/A04-tool-catalog.md) — Agent 工具、查询工具、命令和快捷键明细
- [A05-prompt-templates](./spec/appendix/A05-prompt-templates.md) — prompt 模板和公共片段全文
- [A06-migration-notes](./spec/appendix/A06-migration-notes.md) — 外部事实审计、版本能力、native binding 和迁移说明
- [V01-test-matrix](./spec/appendix/V01-test-matrix.md) — 实施前验证、单测、集成、E2E 和 LLM golden
- [V02-golden-cases](./spec/appendix/V02-golden-cases.md) — 关键能力的 golden cases 和验收样例
- [V03-external-spikes](./spec/appendix/V03-external-spikes.md) — 外部依赖 spike、实查结果和替代路线

### 界面设计 (design/) — 交互与视觉 (Look & Feel)

每个核心界面一份交互设计文档 + 一份 HTML 高保真原型(`design/prototypes/`,浏览器直接打开 `index.html`,支持深浅双主题,嫩叶绿 accent · 素色低反差视觉语言)。

- [README](./design/README.md) — 设计原则、原型使用方式与导航
- [00-design-tokens](./design/00-design-tokens.md) — 设计 token:双主题色彩 / 字体 / 圆角 / 动效
- [01-main-layout](./design/01-main-layout.md) — 主界面:章节轨 · 纸面 · 状态点
- [02-approval-cascade](./design/02-approval-cascade.md) — ApprovalCard 整批审与 cascade
- [03-reader-panel](./design/03-reader-panel.md) — 读者面板章节风险报告
- [04-settings](./design/04-settings.md) — 设置对话框
- [05-onboarding](./design/05-onboarding.md) — 首启引导
- [06-command-palette](./design/06-command-palette.md) — 命令面板与快捷交互

### 历史进度 (progress/) — 迁移与决策历史 (When)

保留项目启动、阶段收尾、文档审计和架构收敛记录,用于追溯设计变化。

- [README](./progress/README.md) — 日志索引规则与模板
- [P000-init](./progress/P000-init.md) — 项目启动记录
- [P001-scaffolding](./progress/P001-scaffolding.md) — W2 期起始计划与收尾 retro
- [P002-narrative-reader](./progress/P002-narrative-reader.md) — 叙事引擎 + 读者仿真器
- [P003-shortcuts-and-settings](./progress/P003-shortcuts-and-settings.md) — 快捷键 + 设置体验治理
- [P004-docs-hardening](./progress/P004-docs-hardening.md) — W3 启动前 day-1 blocker 排查
- [P005-knowledge-graph](./progress/P005-knowledge-graph.md) — 知识图谱专攻(cascade + RAG 地基)
- [P006-memory-and-context](./progress/P006-memory-and-context.md) — 记忆 / 上下文 / JSON / 守则一致性优先重设计
- [P007-opencode-borrowings](./progress/P007-opencode-borrowings.md) — opencode 借鉴落地 + TODO closure
- [P008-plan-rewrite](./progress/P008-plan-rewrite.md) — plan/ 纯产品 PRD 重写实施计划
- [P009-pre-implementation-audit](./progress/P009-pre-implementation-audit.md) — 落地前全量架构与设计审计(79 文档通读 + 逐条验证)
- [P010-implementation-plan](./progress/P010-implementation-plan.md) — 从纯文档到可运行应用的实施计划快照

### 项目档案

- [TODO.md](./TODO.md) — 当前活跃验证项、裁决项、文档修复项与新增规则
- [CHANGELOG.md](./CHANGELOG.md) — 跨文档变更流水线
- [WORKFLOW.md](./WORKFLOW.md) — 文档与实现协作流程
- [AGENTS.md](./AGENTS.md) / [CLAUDE.md](./CLAUDE.md) — Agent 工作规范(两份内容一致)

## 设计原则

- **用户驾驶位** — AI 提议、作者审定、系统持久;任何写入作品的内容都要先被作者明确接受,没有静默改动
- **一致性大于一切** — 装齐一致性所需的全部上下文,前后自洽优先于成本节流
- **影响确定可解释** — 连锁影响的范围由确定性规则算出,AI 只做"是否真受影响"的复核,结果可解释可追溯
- **三模式严格分离** — 讨论不写、规划不碰正文、写作不碰设定
- **docs-before-code** — 任何代码之前对应 plan/spec 先有并经用户认可(已纳入 `CLAUDE.md` 工作规范)

完整产品原则见 [plan/02-principles.md](./plan/02-principles.md),红线与守则见 [plan/03-guardrails.md](./plan/03-guardrails.md)。

## 开发约定

1. **主会话/整合者负责 commit**(使用 git 直接命令);subagent/子代理不自行提交
2. **新功能先更新 plan/spec/**,代码后跟
3. **任何写入用户文件的操作必须经过作者显式审定**,轻量正文改写可就地接受;跨文件或连带变更必须进入 ApprovalCard / Cascade;Agent 不能 silent 落盘
4. 输出语言中文为主,可夹杂英文术语

## 非目标

明确不做的事(设计立场,不是排期):

- 联网研究与素材搜索
- 多用户协作与实时协同
- 云同步 / 多设备
- 移动端
- 平台自动发布(正文即本机文件,作者自行取用上传)
- 模型微调
- 跨项目共享记忆与经验
- 写作中实时干预
- 替作者决策的闸门化评分

每一条"为什么不该做"的理由与平台约束(本地单机、桌面平台、Windows 经兼容层)详见 [plan/04 §非目标](./plan/04-goals-and-non-goals.md#非目标);技术栈层面的取舍(如不使用 Mastra / LangGraph 等 Agent 框架)见 [spec/S00](./spec/S00-system-contract.md),完整历史明细见 [spec appendix](./spec/appendix/README.md)。

## 许可

当前仓库未随附开源许可证;默认不授权复制、分发、修改或商用。任何公开发布或复用授权必须以独立变更新增 LICENSE 后才生效。
