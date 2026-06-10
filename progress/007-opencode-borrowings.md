# 007 — opencode 借鉴落地 + TODO closure

**日期**: 2026-05-07 **周次**: 跨期 (W2 末尾, W3-W11 落地前) **主要 Owner**: 自己

## 本期目标

- **[x]** 调研 sst/opencode (开源 AI coding agent CLI), 输出"对 open-novel 的设计启发"分析报告
- **[x]** 把可借鉴的 7 个具体改动落地到 plan / spec (T1-T7)
- **[x]** 关闭 plan / spec 内累积的"待决策"TODO (spec/18 / spec/20 / spec/21 / spec/01 反馈表 schema) (T8)
- **[x]** 撰写本期 retro 日志 + 更新 progress/README.md 索引 (T9)

## 实际完成

### ✅ 调研产出: `.claude/plans/reactive-hatching-flute.md`

分析 opencode 6 个维度, 标记"借鉴 / 已自有 / 不适用":

- Agent 设计与编排: 借 mode 三态 / 内部任务 hidden agent / doom-loop 检测 / subagent task_id 续跑
- 上下文管理: 借锚定摘要 / prune-compact 分层 / compaction 当 checkpoint / prompt cache 头部稳定
- DeepSeek 适配: 借 reasoning_content 占位 / cache_control 标记 / variant=max / middleware 模式
- 资源利用: 借 tool 输出 truncate / SQLite 单文件持久化 / plugin trigger 钩子
- 整体架构: 借 Permission ruleset 思路 (但**撤回 cardinal-rules override** — 与"绝对不可违反"哲学矛盾)
- 不借: ReAct 主循环 / Effect-TS 全栈 / 文件操作工具 / OpenTelemetry / SKILL.md 全面引入

### ✅ 7 个落地 commit 树 (T1-T7) + 1 个 TODO closure (T8)

| commit | 改动 | 关键洞见 |
|---|---|---|
| `5da548b` T1 | spec/00 §C 模型守约 + §H/I/J 新增 3 项 audit | 禁 fallback v3/-reasoner; cache_control / Mastra middleware / embedding 都需 W3-W8 verify |
| `3f66dc7` T2 | plan/02 加 mode + reasoningEffort 列; plan/09 同步 | (随后被 T2 修正覆盖, 见下) |
| `c8c415e` T2 修正 | 混合分档 Pro+max / Flash+default | 用户纠正"全 max"理解错误; Flash 上 max 抹平成本优势 |
| `c217881` T3 | spec/22 DeepSeek middleware + 卷级锚定摘要 + tool 输出 prune | 解决 50+ 章 1M ctx 也吃紧的根本问题; 借 opencode compaction.ts 锚点累积模板 |
| `cd4ad4b` T4 | spec/02 工具输出 truncate + 6 个 hidden 内部 agent | TOOL_OUTPUT_MAX_CHARS=2000; HIDDEN_AGENT_REGISTRY 统一封装 callJsonAgent |
| `91466ed` T5 | spec/24 callJsonAgent 用 wrapLanguageModel + deepseekMiddleware | DeepSeek 特殊性透明化, agent 调用不感知 |
| `56ae0bf` T6 | spec/06 doom-loop 检测 | 同 chapter 连续 3 次 Writer 输出相似度 ≥ 0.9 → escalate; 借 opencode processor.ts:351-374 |
| `edc4296` T7 | spec/03 prompt stable+dynamic; plan/04 session_history.db; spec/01 反馈表 schema | 关注点分离: 产物=Markdown, 过程=SQLite |
| `c7e2f89` T8 | spec/18+20+21 TODO 关闭 | BGE-M3 锁定, token 用估算, Worldview 全量, Discuss=queryFacts→LLM, UI=Cmd+K modal |

### ✅ 用户反馈点 (5 项, 都已对应处理)

1. **"writer既要正文又要planning, 是否风格混淆?"** (plan/02 inline TODO) → T2 加段落说明: per-agent context builder 注入模式标记 + stable header 分模式指令; POC 单 Writer + 模式注入区分, 实测出现混淆则 W7+ 拆 SettingsAuthor + ChapterWriter
2. **"全都用 max"** (混合分档误解) → T2 修正: Pro+max / Flash+default 二档, Flash 上 max 抹平成本优势
3. **"file tree view"** (用户担心 SQLite 影响 file tree) → T7 plan/04 §设计原则 显式写"产物=Markdown / 过程=SQLite"关注点分离, 用户文件浏览不变
4. **"cardinal-rules override 没懂"** (P1 提议) → 撤回, plan 文件 §五 标"撤回条款", 与"绝对不可违反"哲学矛盾
5. **"plan/spec 留了一些我的 todo"** → T8 批量 closure: spec/18 / spec/20 / spec/21 / spec/01 narrative_feedback / spec/01 entity_match_feedback

## 关键决策

### opencode 借鉴的取舍逻辑

不是逐条照搬, 而是按"我们项目的核心约束"过滤:

- **一致性 > 效率**: opencode 大量优化是 token / latency 导向 (compaction 自动触发 / prune 自动清), 我们 1M ctx 下不缺 token, 借的更多是"如何在长跨度里保持一致" (锚定摘要 / checkpoint rehydrate / volume_summary)
- **多 agent cascade ≠ ReAct**: opencode 主循环是开放推理 (LLM 决定下一步), 我们是固定 cascade (Writer → Checker → Validator → ...)。三态 (continue/compact/stop) 不适用, 但 doom-loop 检测和 subagent 派发模式适用
- **DeepSeek-only**: opencode 的多 provider 抽象 90% 不需要, 但 DeepSeek 特殊适配 (reasoning_content 占位 / cache_control / V4 max variant) 要全盘吸收

### 关注点分离 — 产物 vs 过程 (T7 核心)

之前用户在 SQLite 决策时担心"file tree view 还能用吗", 这暴露了我设计文档里没明确这条原则:

- **产物 (Markdown)**: chapter.md / character.md / cardinal-rules.json — 用户面向, 走 git, 走 file tree
- **过程 (SQLite)**: llm_calls / json_retries / chapter_tool_runs / doom_loop_events — 开发者面向, 走 session_history.db, 用户不感知

两个数据库严格分库, 写入并发 / schema migration / 备份策略都更清晰。

### 混合分档的成本理性 (T2 修正)

最初我把"用户拍板成本可接受 → 全部 max"理解为字面全部, 用户纠正后才意识到:

- Pro+max 投入到长输出 + 质量核心 (Writer / Validator / Humanizer) = 投入有回报
- Flash+default 给短输出 (Router / Checker / Reflector / ReaderPanel) = 用 Flash 的低成本优势
- Flash+max 同价位升 Pro 更划算 — 这是反直觉的, 但确实如此

教训: 当用户说"成本可接受"时不要简单粗暴全开最贵档, 要按 agent 价值-成本比分档。

### TODO closure 的 W11 评估条件统一为"规模触发"

T8 关闭的 5 个待决策项, 升级条件全部基于"项目规模" (worldview > 200K token / 单 session > 20 次 discuss / 单 model 切换 > 1000 段重算) 而非"性能 / 成本驱动"。这与 plan/01 不变性 L13 一致性优先一致 — 只有规模真到了某个阈值, "智能选择 / 优化"才有价值; 之前优化反而引入错误源。

## 下期计划

### 短期 (W3 day-1 spec/00 audit 跑实查)

- **[ ]** §A npm 包真实最新版本 (mastra 1.4.x / @ai-sdk/deepseek 2.0.x / 等)
- **[ ]** §B AI SDK 6 needsApproval API 形态 (cookbook 模式 vs 一等字段)
- **[ ]** §H DeepSeek prompt cache 真实支持 (cache_control 字段是否被服务端识别)
- **[ ]** §I Mastra wrapLanguageModel + middleware 暴露情况 (T3 / T5 假设的前提)
- **[ ]** §J embedding provider verify 留待 W8 day-1

### 中期 (W3-W11 实施 T1-T7 设计)

按 plan/11 落地里程碑:

- W3-W6: 实施 T2 (agent mode + reasoningEffort) + T4 (hidden agents) + T7 (session_history.db)
- W6-W8: 实施 T3 (DeepSeek middleware + cache_control) + T5 (callJsonAgent) + T6 (doom-loop)
- W7+: 实施 T7 (prompt stable + dynamic 拆段, 配合 cache_control)
- W11: 实施 T3 卷级锚定摘要 + checkpoint rehydrate + tool 输出 prune (依赖前面跑通 + 真有 50+ 章数据)

### 已知风险

- **Mastra 不支持 wrapLanguageModel**: T5 fallback A/B 已写明 (绕过 Mastra Agent 直接 streamText), 但 fallback 选哪条未定 — W3 §I verify 后回写 spec/24 + spec/22
- **DeepSeek prompt cache 字段不被服务端识别**: T3 cache_control 标记策略降级为"仅头部稳定排布", 不阻塞功能但 token 成本上升 — W3 §H verify
- **doom-loop 相似度阈值 0.9 经验值**: W3+ 真跑起来后视实测调整, 太严格会无效 escalate 干扰用户, 太宽松会无限循环烧 token

## 关联 commit

- `5da548b` T1 — spec/00 DeepSeek 模型守约 + 3 项新 audit
- `3f66dc7` T2 (被 c8c415e 修正覆盖)
- `c8c415e` T2 修正 — 混合分档 Pro+max / Flash+default
- `c217881` T3 — spec/22 DeepSeek middleware + 卷级锚定摘要 + tool 输出 prune
- `cd4ad4b` T4 — spec/02 tool 输出 truncate + Hidden 内部 Agent 类别
- `91466ed` T5 — spec/24 callJsonAgent 用 wrapLanguageModel + deepseekMiddleware
- `56ae0bf` T6 — spec/06 Validator-Writer doom-loop 检测
- `edc4296` T7 — spec/03 prompt 拆段 + plan/04 SQLite session_history + spec/01 反馈表 schema
- `c7e2f89` T8 — spec/18 + spec/20 + spec/21 TODO closure
- `(本 commit)` T9 — progress/007 + progress/README 索引追加
