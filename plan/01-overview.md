# 01 — 系统概览

## 目标

为有志于在番茄小说发表作品的作者,提供一个**像 VSCode 一样工作的 AI 创作工作台**。它不是一键生成器,而是一个**始终把用户放在驾驶位的创作助手**:Agent 提议、用户审批、系统持久。

## 核心用户场景

```
1. 输入故事种子 → 生成世界观/大纲/角色等设定 → 用户逐项审阅、修改
2. 修改某个核心角色资料 → 系统自动扫所有相关章节/设定 → 用户审批 cascade 改动
3. 一键生成章节概要 → 审 → 一键生成章节正文 → 审 → 一键去 AI 化
4. 写作中点击角色名 → 跳转到角色资料 → 编辑 → 返回 → 系统已同步引用
5. 同时维护多个项目,互不污染
```

## 6 Agent 拓扑 (Mastra `AgentNetwork`)

```
                  ┌─────────────────┐
                  │  User (ChatBox) │
                  └────────┬────────┘
                           │  prompt + mode
                           ▼
                  ┌─────────────────┐
                  │  Router (Flash) │ ← 模式分流 + 意图识别
                  └────────┬────────┘
            ┌──────────────┼──────────────┐
            ▼              ▼              ▼
       ┌────────┐   ┌────────┐    ┌────────────┐
       │ Writer │   │Checker │    │  Validator │
       │ (Pro)  │   │(Flash) │    │   (Pro)    │
       └────┬───┘   └───┬────┘    └──────┬─────┘
            │           │                │
            └─────┬─────┴────────┬───────┘
                  ▼              ▼
             ┌─────────┐   ┌──────────────┐
             │Reflector│   │  Humanizer   │
             │ (Flash) │   │    (Pro)     │
             └─────────┘   └──────────────┘
```

## 数据流概览

```
ChatBox 输入
   │
   ▼
Router 路由 (识别 mode = discuss | plan | write)
   │
   ├─ discuss → 直接答复 (RAG 设定 read-only)
   │
   ├─ plan → Writer 生成设定草稿
   │           ↓
   │      Validator 校验一致性
   │           ↓
   │      diff → ApprovalCard
   │           ↓ (用户同意)
   │      落盘 (.md + index.db 索引刷新)
   │           ↓
   │      Reflector 提炼经验
   │
   └─ write → Writer 生成章节
              ↓
         Checker 风格审 + Validator 一致性审
              ↓
         diff → ApprovalCard → 落盘 → Reflector
```

## 关键技术决策汇总

| 维度 | 选择 | 理由 |
|---|---|---|
| 应用架构 | Next.js 15 单应用 | POC 起步快,SSE 一等公民,App Router 与 AI SDK 6 集成最佳 |
| Agent 框架 | Mastra on AI SDK 6 | `Memory({ thread, resource })` 自带多项目隔离;`AgentNetwork` LLM 路由 |
| LLM | DeepSeek V4 Pro/Flash | Pro 用于核心创作 (writer/validator/humanizer),Flash 用于辅助 (router/checker/reflector),按用量优化 |
| 编辑器 | TipTap + 自定义装饰器 + AC | TipTap 中文排版舒服;不用 `Mention` 节点 (atomic 破坏纯文本流) |
| 存储 | md (内容) + LibSQL (索引) | md 人类可读 + Git 友好;sql 处理引用图/历史/学习 |
| 联网 | 接口预留 + Mock | 二期接 Bocha (中文) + Tavily (英文),用 MCP sidecar |
| 三模式 | XState 状态机 | discuss 不写,plan 改设定,write 改章节,严格闸门 |

## 不变性约束 (Invariants)

为保证质量,系统强制以下不变性:

1. **写入必须经审批** — 所有 `writeSetting` / `writeChapter` 工具调用都带 `needsApproval: true`,前端拦截渲染 ApprovalCard
2. **设定不可被 Agent 静默修改** — Validator 发现矛盾时只能"提议"修改,不能直接改;最终决定权在用户
3. **多项目数据零串扰** — Memory 用 `resource = projectId`,文件用独立目录,数据库用 `WHERE project_id = ?` 强约束
4. **三模式严格分离** — Router 在每次输入时强校验当前 mode 与可调用工具集
5. **每次审批必反思** — Reflector 自动跑,经验落盘到 `learnings` 表,无静默丢失

## 与同类产品的差异

| 维度 | NovelCrafter / Sudowrite | Open Novel |
|---|---|---|
| 联网研究 | 无 (闭合 Story Bible) | 接口预留,二期开放 |
| 一致性守护 | 手动 Codex | 自动 cascade + Validator |
| 反馈学习 | 无 | Reflector 自动持久化经验 |
| 多 Agent | 单 Agent + 模板 | 6 Agent 协作 |
| 透明度 | 黑盒 | 全流式可见 |
| 中文 | 弱 | 一等公民 |
