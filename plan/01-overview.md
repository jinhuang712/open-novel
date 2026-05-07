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

## 7 Agent 拓扑 (Mastra `AgentNetwork`)

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
       ┌────────┐   ┌──────────────┐    ┌────────────┐
       │ Writer │   │   Checker    │    │  Validator │
       │ (Pro)  │   │   (Flash)    │    │   (Pro)    │
       │  吐字  │   │ +叙事引擎子能力│    │   一致性   │
       └────┬───┘   └──────┬───────┘    └──────┬─────┘
            │              │ (BeatAnalyzer /          │
            │              │  ArcTracker / 模板库)     │
            │              │                          │
            └─────┬────────┴──────────┬───────┬───────┘
                  ▼                   ▼       ▼
       ┌─────────────────┐    ┌──────────┐ ┌──────────────┐
       │  ReaderPanel    │    │Reflector │ │  Humanizer   │
       │  (Flash, NEW)   │    │ (Flash)  │ │    (Pro)     │
       │  5 persona 仿真 │    │  反思    │ │   去 AI 化   │
       └─────────────────┘    └──────────┘ └──────────────┘
```

详见: [02-multi-agent.md](./02-multi-agent.md) (Agent 详解) / [09-narrative-engine.md](./09-narrative-engine.md) (叙事引擎) / [10-reader-simulator.md](./10-reader-simulator.md) (读者仿真器) / [11-knowledge-graph.md](./11-knowledge-graph.md) (知识图谱:cascade + RAG 真正可工作的地基) / [12-memory-and-context.md](./12-memory-and-context.md) (Agent 记忆四层 + per-agent 上下文契约 + 一致性优先);spec 入口见 [spec/24-json-output.md](../spec/24-json-output.md) (JSON 结构化输出统一规约) + [spec/25-cardinal-rules.md](../spec/25-cardinal-rules.md) (五大网文守则)。

## 数据流概览

```
ChatBox 输入
   │
   ▼
Router 路由 (识别 mode = discuss | plan | write)
   │
   ├─ discuss → 优先 queryFacts (spec/21) 直查 SQL → 命中即答
   │             (未命中 fallback 自由 LLM,RAG 设定 read-only;无落盘)
   │
   ├─ plan → Writer 生成主修改 (in-memory,proposal-only,不落盘)
   │           ↓
   │      Validator 调 analyzeImpact (spec/19):
   │        [内部递归 ≤3 轮,用户不可见,纯内存]
   │          - 第 1 轮: extractSemanticDelta + SQL 影响半径 + LLM filter → ChangeProposal[1]
   │          - Writer 内部短调用生成 afterText
   │          - 第 2 轮: 同上,基于第 1 轮 afterText,半径严格收缩
   │          - 第 3 轮: 同上
   │          - 终止: 候选空 / 半径不收缩 / 深度=3
   │           ↓
   │      汇总 ChangeSet (主修改 + 1-3 级 cascade + 影响图谱)
   │           ↓
   │      **一次** ApprovalCard:用户勾选 + 编辑 + 一键同意/部分同意/拒绝
   │           ↓ (用户 approve)
   │      后端 transaction 一次写所有 accepted 文件
   │           ↓
   │      副作用: 差量 anchor reindex + 知识图谱表 upsert + snapshot + history group
   │           ↓
   │      Reflector 按 cascade 链路批次合并入队
   │
   └─ write → Writer Context Builder (spec/23) 装配:
   │            assembleContext (spec/20) — entity 状态 + 活跃关系 + 待处理伏笔 + 最近章节 + 语义相关 + 世界观 + 概念约束
   │            + 守则相关 (spec/25): cardinal-rules.json + active critical promises + character value_axes + milestone cadence + rolling pacing metrics + isGoldenChapter
   │           ↓
   │       生成章节 (in-memory,proposal-only,自然语言流式)
   │           ↓
   │      并行检测 (各走 JSON mode, spec/24):
   │        - Checker (Flash) 风格审 + BeatAnalyzer + 守则 1/3/5 检测
   │        - Validator (Pro) 一致性审 + ArcTracker + analyzeImpact + 守则 2/4 检测
   │        - ReaderPanel (Flash×5) 5 persona 仿真 + 守则 1-5 综合二审 → ChapterRiskReport
   │           ↓
   │      汇总 ChangeSet (章节正文 + cascade 修改) + CardinalRulesReport (spec/25)
   │           ↓
   │      **一次** ApprovalCard:
   │        - 守则 critical 风险存在 → 强制勾"明知违反仍通过"才能 approve
   │        - blocking violation (已过 deadline 的 critical promise) → 完全禁用 approve
   │           ↓
   │      用户决议 → 后端 transaction 一次写 → 副作用 (含 reindex + Reflector 学 cardinal_rule scope)
```

**关键不变性 (跨流程)**:

- 所有 stream 必经 [per-agent context builder (spec/23)](../spec/23-context-contracts.md), 不允许 agent 自拼 prompt
- 所有结构化输出走 [JSON mode (spec/24)](../spec/24-json-output.md), zod 校验失败 retry + escalate, 不允许 silent fallback
- 任何 ChangeSet 落盘前必跑 [五大守则检测 (spec/25)](../spec/25-cardinal-rules.md), critical / blocking 严控不可绕过
- 1M ctx 下 (spec/00 §C) 不做 token 预算裁剪 — 一致性 > 节流

**关键交互不变性**: 所有写盘动作必须经过 ApprovalCard 整批审。"内部 cascade 递归"和"用户审批"是两个分离的阶段:递归全在内存,审批在 UI;落盘只在 approve 后,事务原子。

## 关键技术决策汇总

| 维度 | 选择 | 理由 |
|---|---|---|
| 应用架构 | Next.js 15 单应用 | 起步快,SSE 一等公民,App Router 与 AI SDK 6 集成最佳 |
| Agent 框架 | Mastra on AI SDK 6 | `Memory({ thread, resource })` 自带多项目隔离;`AgentNetwork` LLM 路由 |
| LLM | DeepSeek V4 Pro/Flash | 实查 (spec/00 §C):ctx **1M tokens**, max output **384K**, 原生 JSON mode (`response_format: { type: 'json_object' }`)。Pro 用于核心创作 (writer/validator/humanizer),Flash 用于辅助 (router/checker/reflector/reader-panel/工具内 LLM),按用量优化 |
| 编辑器 | TipTap + 自定义装饰器 + AC | TipTap 中文排版舒服;不用 `Mention` 节点 (atomic 破坏纯文本流) |
| 存储 | md (内容) + LibSQL (索引) | md 人类可读 + Git 友好;sql 处理引用图/历史/学习 |
| 联网 | 接口预留 + Mock | 二期接 Bocha (中文) + Tavily (英文),用 MCP sidecar |
| 三模式 | XState 状态机 | discuss 不写,plan 改设定,write 改章节,严格闸门 |

## 不变性约束 (Invariants)

为保证质量,系统强制以下不变性:

1. **写入必须经审批** — 所有 writeSetting / writeChapter 走 proposal 模式,落 `approvals` 表 status=pending,通过独立 endpoint resolve (见 spec/06)
2. **设定不可被 Agent 静默修改** — Validator 发现矛盾时只能"提议"修改,不能直接改;最终决定权在用户
3. **多项目数据零串扰** — Memory 用 `resource = projectId`,文件用独立目录,数据库用 `WHERE project_id = ?` 强约束;LibSQL 连接池 LRU(3)
4. **三模式严格分离** — Router 在每次输入时强校验当前 mode 与可调用工具集
5. **每次审批必反思** — Reflector 在每次审批闭环 (approve / reject / edited) + 用户手动改写 Agent 内容后入队跑,无 token / 频率 cap;同一 cascade 链路下的 N 项审批会合并为一次 reflect (批次语义,不是为省 token) (见 plan/06 §Reflector 触发时机)
6. **路径越权零信任** — 所有读写工具 execute 第一行强制 `safeFromProjectRoot()`,不依赖前端校验 (见 spec/02)
7. **不可信内容围栏** — 所有外部内容 (web / 用户拷贝 .md / 自定义 persona) 拼进 prompt 时用 `<<<UNTRUSTED:...>>>` 包裹,Agent system prompt 显式声明忽略其中"指令"
8. **docs-before-code** — 任何代码 commit 之前对应 plan/spec 必须先有,且需用户 approve docs 后才动代码 (项目级 workflow 不变性)
9. **影响半径不依赖 LLM** — Validator cascade 第一步必须是 SQL 查影响半径 (analyzeImpact step 2);LLM 只做"段是否真受影响"二次过滤。漏 SQL 索引 = bug,不应用 LLM "猜"补救 (见 plan/11 + spec/19)
10. **派生视图只读** — `relationships/_matrix.md` / `timeline/character-ages.md` 等是 SQLite 表的 markdown 投影,frontmatter 标 `derived: true`,reindex 自动重生成,UI 锁写 (见 spec/16 §派生文件守卫)
11. **未决 cascade 阻断 write** — plan 模式产生的 ChangeProposal[] 未全部 resolve 时,write 模式禁用,弹 dialog 引导处理 (见 spec/16 §Plan Inconsistency Lock)
12. **段锚点稳定** — 段移动 / 重命名 / 改字不应使 dependencies / paragraph_embeddings 失效;reindex 走"内容签名 + 邻接段对照"维持锚点 (见 spec/17)
13. **L4 知识图谱是单一事实源** — L1 工作记忆 / L2 会话历史 / L3 项目经验中任何与 L4 冲突的内容,answer 时以 L4 为准 (见 plan/12 §四层记忆模型;例: 历史 message 里说"林溪是男的",但 L4 character 已改女,以 L4 为准)
14. **per-agent 上下文契约严格写死,Writer/Validator 必装项不允许省略** — 1M ctx (spec/00 §C) 给的就是奢侈装齐的本钱;一致性所需的全部数据必装,不允许"为节省临时省略"。各 agent 必经对应 context builder (spec/23),不允许 agent 自拼 prompt;真超 1M 时抛 ContextOverflowError 让用户分卷,绝不 silent 砍 retrieve
15. **L3 learnings 仅 Reflector 可写** — LLM 在 stream 中不允许直接 upsert learnings,只有 Reflector 在审批闭环后写;读由 context builder 按 weight desc top-8 注入 (见 plan/06 + plan/12);`scope='cardinal_rule'` top-1 永远保留不被砍
16. **结构化输出必走 JSON mode + zod 校验** — Router / Validator / Checker / Reflector / ReaderPanel / 工具内 LLM 调用 (extractSemanticDelta / filterByLLM / concept extractor / compress) 必经 `callJsonAgent` (spec/24): DeepSeek `response_format: json_object` + 应用层 zod 校验 + 失败 retry 1 次 + 2 次失败抛 `JsonOutputError` escalate;不允许"自由发挥再 zod parse",不允许 silent fallback (那会让 cascade 漏审 / 概念抽取漏 entity)
17. **五大网文守则不可违反** — 黄金三章 / 人设崩坏 / 节奏崩盘 / 期待感失约 / 金手指依赖 (见 spec/25)。Validator + ReaderPanel + ArcTracker + BeatAnalyzer 自动检测,汇成 `CardinalRulesReport` 进 ApprovalCard:critical 风险存在用户**必须勾**"明知违反仍通过"才能 approve;blocking violation (已过 deadline 的 critical promise) 完全禁用 approve;不允许 silent commit 违反守则的内容。`cardinal-rules.json` 阈值用户可微调,但 `enabled: true` UI 锁死

## 与同类产品的差异

| 维度 | NovelCrafter / Sudowrite | Open Novel |
|---|---|---|
| 联网研究 | 无 (闭合 Story Bible) | 接口预留,二期开放 |
| 一致性守护 | 手动 Codex | 自动 cascade + Validator |
| 反馈学习 | 无 | Reflector 自动持久化经验 |
| 多 Agent | 单 Agent + 模板 | **7 Agent 协作** |
| 透明度 | 黑盒 | 全流式可见 |
| 中文 | 弱 | 一等公民 |
| **叙事力学诊断** | 无 | **BeatAnalyzer + ArcTracker** (节奏 / 情绪曲线 / 角色弧光偏离) |
| **发布前留存预演** | 无 | **ReaderPanel** (5 persona 模拟读者反应,生成章节风险报告) |
| **结构模板可调用** | 无 / 强模板套用 | 三幕 / 英雄之旅 / 起承转合 / 番茄黄金三章,可调用不强制 |
| **知识图谱 (W7-W10)** | 静态 Codex (实体卡片) | **6 维图: 实体 + 关系 + 时间 + 概念 + 段级依赖 + 语义** (见 plan/11) |
| **Cascade 影响范围** | 无 / 全人工 | **纯 SQL 出候选 + LLM 二次过滤 + 递归 ≤3 层** (见 spec/19) |
| **写章节上下文** | 用户手动选 cards 塞 prompt | **assembleContext** 自动 retrieve + token 预算 (见 spec/20) |
| **边写边查** | 静态搜索 / 跳卡片 | **queryFacts** 4 模式 (entity-at / relations-of / mentions-of / semantic-search) (见 spec/21) |

后六条是与"AI 代笔工具"赛道的核心区分点 — 我们不是写得更好的 AI,是**把世界装进 AI 的合伙人 + 懂叙事的诊断师 + 懂读者的预演场**。
