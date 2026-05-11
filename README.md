# Open Novel

> 基于 DeepSeek V4 的多 Agent 中文长篇小说自动创作系统 — 面向番茄小说平台的"AI IDE"

## 这是什么

一个像 VSCode 一样工作的 AI 小说创作工作台。你只需要给一个粗略的故事种子,系统就能配合你完成:

- 世界观、大纲、主角资料、章节节奏、爽点安排等**前置设定**的逐项生成与审阅
- 框选文字 → 让 AI 局部修改
- 设定中的角色名/地点名**自动高亮 + 跳转引用** (像代码里的 Goto Definition)
- 一键生成**章节概要 → 章节正文**
- 一键**去 AI 化**,适配番茄读者口味
- 多项目并行,数据互不污染

## 核心特性

- **多 Agent 协作**: Router / Writer / Checker / Validator / Reflector / Humanizer / **ReaderPanel** 7 个 Agent 各司其职
- **三种工作模式**: Discuss (检索/对话) / Plan (设定编辑) / Write (正文编辑),Agent 行为严格区分
- **审批必须**: 任何写入设定/正文的操作都必须先 diff 后落盘,用户点头才生效
- **一致性守门**: 改了角色性别?Validator 自动扫所有章节列出受影响段落,逐项审批后才落盘
- **叙事力学诊断**: BeatAnalyzer 输出节奏 / 情绪曲线 / 钩子强度;ArcTracker 检测角色弧光偏离;可调用三幕 / 英雄之旅 / 番茄黄金三章等结构模板
- **发布前留存预演**: ReaderPanel 5 persona (追更党 / 逻辑控 / 情感党 / 毒舌读者 / 潜水大佬) 并行模拟读者反应,生成章节风险报告
- **React 式反馈学习**: 每次审批闭环后 Reflector 提炼经验,后续生成自动注入,越用越懂你
- **流式透明化**: Agent 推理过程、工具调用、子 Agent 切换在右侧 ThinkingPanel 实时滚动
- **可定制风格/性格**: Agent 性格、文风、断句节奏全部可调
- **联网搜索接口预留**: POC 阶段 Mock,二期接入 Bocha (中文) + Tavily (英文)

## 技术栈

| 层 | 选型 | 备注 |
|---|---|---|
| 前后端 | Next.js 15 (App Router) + React 19 + TypeScript 5 | 单仓单应用 |
| Agent 框架 | Mastra 1.x on Vercel AI SDK 6 | `AgentNetwork` + `needsApproval` |
| LLM | DeepSeek V4 Pro / Flash (via Vercel AI Gateway) | Pro 跑核心创作,Flash 跑路由/检查 |
| 编辑器 | TipTap 3.x + ProseMirror Decorations + Aho-Corasick | 不用 `Mention` 节点 |
| 状态机 | XState | 三模式闸门 |
| 存储 | `.md` (内容) + LibSQL `index.db` (索引/历史/学习) | 用户不可见 sql |
| 包管理 | pnpm | |

## 快速启动

```bash
pnpm install
pnpm dev
# → http://localhost:3000
```

首次启动会引导你:
1. 选 Workspace 路径 (默认 `~/.open-novel/workspaces/`)
2. 在 Settings 中填入 DeepSeek API key
3. 创建第一个项目

## 目录结构

```
.
├── README.md                  # 你正在看的这个
├── plan/                      # 架构设计 (What / Why)
├── spec/                      # 实现细节 (How)
├── assets/                    # 文档样式与统一资产
├── progress/                  # 实施进度 (When / 进展)
├── app/                       # Next.js 路由 + API
├── components/                # 前端组件
├── lib/                       # Agent / Tools / Storage / Editor
└── ~/.open-novel/workspaces/  # 你的小说项目数据 (在用户目录,不在仓库)
```

## 文档导航

### 设计 (plan/)
- [01-overview.html](./plan/01-overview.html) — 系统概览与关键决策
- [02-multi-agent.html](./plan/02-multi-agent.html) — 7 Agent 拓扑与职责
- [03-editor-layer.html](./plan/03-editor-layer.html) — 编辑器分层与 EditorAdapter
- [04-storage-model.html](./plan/04-storage-model.html) — md+sql 混合存储模型
- [05-modes-and-approval.html](./plan/05-modes-and-approval.html) — 三模式与审批流
- [06-cascade-and-reflection.html](./plan/06-cascade-and-reflection.html) — Cascade 一致性与反馈学习
- [07-ui-layout.html](./plan/07-ui-layout.html) — 五区 UI 布局
- [08-tech-stack.html](./plan/08-tech-stack.html) — 技术栈锁定与版本策略
- [09-narrative-engine.html](./plan/09-narrative-engine.html) — 叙事引擎 (BeatAnalyzer + ArcTracker + 模板库)
- [10-reader-simulator.html](./plan/10-reader-simulator.html) — 读者仿真器 (5 persona ReaderPanel)
- [11-knowledge-graph.html](./plan/11-knowledge-graph.html) — 知识图谱与 cascade / RAG 地基
- [12-memory-and-context.html](./plan/12-memory-and-context.html) — Agent 记忆与上下文治理

### 实现 (spec/)
- [00-version-audit.html](./spec/00-version-audit.html) — **W3 启动前版本审计闸门** (npm 实查 / DeepSeek model id / AI SDK API 形态)
- [01-storage-schema.html](./spec/01-storage-schema.html) — SQLite schema 与 frontmatter 规范 (含 zod 强校验 / 编码归一化 / WAL / 连接池)
- [02-agent-tools.html](./spec/02-agent-tools.html) — Agent 工具签名与契约 (含路径越权防御 / 不可信围栏 / 续写协议 / 结构化输出修复)
- [03-prompts.html](./spec/03-prompts.html) — Agent prompt 模板
- [04-streaming-protocol.html](./spec/04-streaming-protocol.html) — SSE 事件协议 (含取消/刷新/重连 + 错误 UX 表 + 长任务进度)
- [05-entity-highlight.html](./spec/05-entity-highlight.html) — 实体高亮与跳转 (含中文边界 / IME 安全 / trie 重建)
- [06-approval-flow.html](./spec/06-approval-flow.html) — 审批流 (proposal + 独立 endpoint 模式)
- [07-mode-state-machine.html](./spec/07-mode-state-machine.html) — XState 状态机 (含 USER_INPUT 处理 + cascade queue)
- [08-de-ai-pipeline.html](./spec/08-de-ai-pipeline.html) — 去 AI 化 pipeline
- [09-build-and-tooling.html](./spec/09-build-and-tooling.html) — 构建与工具链
- [10-narrative-engine.html](./spec/10-narrative-engine.html) — 叙事引擎实现 (BeatAnalyzer / ArcTracker / 模板格式)
- [11-reader-personas.html](./spec/11-reader-personas.html) — 读者 Persona 与 ReaderPanel 实现 (含失败聚合 + persona 安全围栏)
- [12-shortcuts.html](./spec/12-shortcuts.html) — 快捷键 Registry + CommandRegistry + IME 闸门 + @file 引用 + 撤销栈语义
- [13-settings.html](./spec/13-settings.html) — SettingsDialog 8 section + 月度预算 + 项目生命周期 + 学习偏好面板
- [14-testing.html](./spec/14-testing.html) — 测试策略 (vitest / playwright / LLM golden / CI)
- [15-onboarding.html](./spec/15-onboarding.html) — 首启引导 (4 步 wizard + 渐进 tooltip + 样例项目)
- [16-knowledge-schema.html](./spec/16-knowledge-schema.html) — 知识图谱 schema 与 frontmatter 升级
- [17-paragraph-anchors.html](./spec/17-paragraph-anchors.html) — 段级稳定 ID 与差量 reindex
- [18-embeddings.html](./spec/18-embeddings.html) — 段级 embedding 与语义检索
- [19-impact-analysis.html](./spec/19-impact-analysis.html) — 影响半径与 cascade 工具
- [20-context-assembly.html](./spec/20-context-assembly.html) — 上下文装配工具 assembleContext
- [21-fact-query.html](./spec/21-fact-query.html) — 事实查询工具 queryFacts
- [22-mastra-memory.html](./spec/22-mastra-memory.html) — Mastra Memory 落地细节
- [23-context-contracts.html](./spec/23-context-contracts.html) — Per-agent 上下文契约
- [24-json-output.html](./spec/24-json-output.html) — JSON 结构化输出统一规约
- [25-cardinal-rules.html](./spec/25-cardinal-rules.html) — 五大网文守则

### 进度 (progress/)
- [README.md](./progress/README.md) — 日志索引规则
- [000-init.md](./progress/000-init.md) — 项目启动记录
- [001-scaffolding.md](./progress/001-scaffolding.md) — W2 期 (起始计划 / 收尾 retro)
- [002-narrative-reader.md](./progress/002-narrative-reader.md) — 战略升级: 纳入叙事引擎 + 读者仿真器
- [003-shortcuts-and-settings.md](./progress/003-shortcuts-and-settings.md) — UX 治理: Tab 切模式 + 快捷键 Registry + SettingsDialog 重设计
- [004-docs-hardening.md](./progress/004-docs-hardening.md) — 文档审计加固 (W3 启动前的 day-1 blocker 排查 + 32 个补丁)

## 开发约定

1. **每次显著迭代必须 commit**,使用 `git` 直接命令 (不使用 yummy/ym)
2. **新功能先更新 plan/spec/**,再写代码;实现完成后 progress/ 追加一条
3. **任何写入用户文件的操作必须经过 ApprovalCard**,不允许 Agent 自动落盘
4. 三模式严格分离: discuss 不写,plan 不碰章节,write 不碰设定
5. 输出语言**中文为主**,可夹杂英文术语,但不影响阅读

## 不在 POC 范围

- 真实联网搜索 (二期接入)
- 多用户 / 账号系统
- 番茄小说自动发布 (导出 .md/.txt 让用户手动发)
- 实时协作 (二期专项设计;POC 不预留 Yjs 接口)
- 移动端
- Windows 原生支持 (POC macOS/Linux only;Windows 用户可走 WSL)
