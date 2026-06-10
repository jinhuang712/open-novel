# 006 — 记忆 / 上下文 / JSON 输出 / 五大守则: 一致性优先重设计

**日期**: 2026-05-06 **周次**: 跨期 (W2 末尾, W3-W11 落地前) **主要 Owner**: 自己 **Commit tree**: T1 → T2 → T3 → T4 → T5 → T6 (6 commits, 在 push 前 `c6d870e` 之后顺序提交;原拟 T7 progress 与 T6 不变性总束合并入同一 commit)

## 本期来源 (用户 5 个反馈点)

005 (知识图谱) + cascade flow 修正后,用户阅读发现"上下文 / memory 工程动作完全没有"。在补的过程中,用户连续给了 5 个根本性的设计反馈,每个都让前一个版本的设计反转:

1. **DeepSeek V4 ctx 实查 1M tokens** (spec/00 §C) — 早期估算偏低,设计骨架必须按 1M 重定位
2. **不要 token 预算控制** — 优化目标错了。读者最大弃书原因之一是不一致;一致性 > 节流;该装齐就装齐
3. **每个 agent 不应共用上下文装配** — 它们职责不同,需要的数据不同;统一装配会让 Router 塞一堆没用的 timeline,Writer 又错过该装的范文
4. **DeepSeek 原生支持 JSON mode** — 用上,Validator/Router/Reflector/ReaderPanel/Checker 输出本质结构化,过去用"自由发挥再 zod parse"是反模式
5. **五大网文守则要做绝对守则** — 黄金三章 / 人设崩 / 节奏崩盘 / 期待感失约 / 金手指依赖,要可机器化检测,不可被 agent 绕过

这一轮的工作是把这 5 个反馈点全部对齐到所有 plan/spec, 形成可机器执行的硬约束。

## 撤掉的错误工作

提交过 `75beb2f docs(plan/spec/progress): memory & context — 4-layer model + buildPromptContext + token budget` (本地未 push)。它的核心思路被反馈 1+2+3 全部否定:

- ❌ 6 agent × 7 用途的 token 预算分配表 — 1M ctx 下让 agent 做"限额内取舍"主动制造一致性漏洞
- ❌ 5 级降级链 (砍 messages → 丢 summary → 强裁 retrieve → 砍 learnings → 抛 PromptOverflowError) — 这是反一致性的, 主动制造一致性漏洞
- ❌ 统一 buildPromptContext 10 步装配 — 不该一刀切

T0 reset 撤掉后重新干。可保留的部分: 四层模型 (L1-L4) / streamWithGuard / 跨进程 hydrate / Mastra 配置约束等,在 T4 重写 plan/12 + spec/22-23 时迁过来。

## 6 个 commit 的内容

### T1 (`5c6f8a7`): DeepSeek V4 真实能力实查

- spec/00 §C 状态从"待实查"改为"已实查 ✓ 2026-05-06":model ID `deepseek-v4-pro` / `deepseek-v4-flash`,ctx **1M**, max output **384K**
- spec/00 §G (新增): JSON 输出模式审计 — `response_format: { type: 'json_object' }`,不强 schema (要应用层 zod),system/user 必含 'json' 字样,max_tokens 没设好会中途截断 JSON
- plan/08 ⚠ 警告 + ai-sdk/deepseek 行同步,集成关键点加 §DeepSeek V4 配置 + §Mastra Memory 配置

### T2 (`7d27dbe`): spec/24 JSON 结构化输出统一规约

新建 `spec/24-json-output.md`:

- 6 大设计原则 (强制 JSON mode / zod 校验 / max_tokens 必估算 / system prompt 必含示例 / 失败 retry / streaming 区别处理)
- 9 大场景的完整 zod schema (Router / Validator / analyzeImpact filter / extractSemanticDelta / BeatAnalyzer / ArcTracker / ReaderPanel / Reflector / concept extractor)
- 各场景 maxTokens 估算
- 统一 `callJsonAgent` retry 函数 (空 content / 截断 / parse 失败 / schema 失败 各自 retry 1 次, 2 次失败 escalate)
- escalate UI 策略 (不允许 silent fallback)
- streaming 模式衔接 (中间 chunks 不展示给用户,流完再 parse)
- 与 spec/03 / spec/04 / spec/14 的引用

### T3 (`1a83ca6`): spec/25 五大网文守则可机器化定义

新建 `spec/25-cardinal-rules.md`:

- 5 条守则各自可观察化指标 + 默认阈值表
- `cardinal-rules.json` 项目级配置 (enabled UI 锁死, 阈值可微调)
- chapter.md / character.md frontmatter 必填字段 (POV / pov_breakdown / hook_type / main_line / progress_milestone / agency_breakdown / value_axes / intelligence_axis)
- 5 个检测器伪码 (`goldenChaptersCheck` / `characterIntegrityCheck` / `pacingCheck` / `promiseAccountabilityCheck` / `protagonistAgencyCheck`)
- foreshadowings 表 metadata 增强 (deadline_chapter / weight critical|major|minor / expected_resolution_pattern)
- `CardinalRulesReport` zod schema (含 `blocking` 字段)
- ApprovalCard 集成: critical 必勾 "明知违反仍通过", blocking 禁用 approve
- Writer 1-3 章特殊 prompt + 反例
- Reflector scope='cardinal_rule' learning, top-1 不可被砍
- SettingsDialog 阈值面板 (enabled UI 锁死)

### T4 (`1c26601`): plan/12 + spec/22 + spec/23 重设计

3 文件全重写,基于 T1 (1M ctx) 反转之前以"省 token"为骨架的设计:

**plan/12**:

- 头等优先级改为"一致性 > 一切"
- 四层模型 L1-L4 保留, 但 L1-L3 重定位为"为 L4 一致性服务的支持层"
- per-agent 上下文契约 (7 个 agent 各自必装项概览)
- 关键参数表删 token budget 项, 加 cardinalRuleProtect / lastMessages 30+
- L2 历史压缩从"必装"降级为"长 session 可选, POC 默认关"

**spec/22**:

- lastMessages 12 → **30** (1M ctx 下放宽)
- compressed_messages 表保留, **默认 disabled** (用户主动开)
- compressOldMessages 改用 callJsonAgent (spec/24)
- semantic recall 决策 / workingMemory false / streamWithGuard 保留
- 跨进程 hydrate + session.json threadId 字段补完

**spec/23 (改名 token-budget.md → context-contracts.md)**:

- 删 6 agent × 7 用途的 token 预算表
- 删 5 级降级链
- 改为 7 个 agent context builder, 各自定义"必装什么"
- 共享 buildBaseContext (learnings + recent_messages) + agentScopes 表
- ContextOverflowError 只在真超 1M 时抛, 软警报 800K
- learnings cardinal_rule scope top-1 永远保留 (与 spec/25 协同)
- prompt_traces 表 + Settings 装配诊断面板
- 每个 agent 标记 jsonMode (Writer/Humanizer false, 其他 true)

### T5 (`e49ee06`): 全 agent 集成 (14 文件)

把 T2-T4 的基础落地到所有相关 plan/spec:

| 文件 | 改动核心 |
|---|---|
| plan/02 | Agent 总览表加输出形态列 (JSON / NL); 5 守则检测分工表; Memory 段引用 plan/12 + spec/22-23 |
| plan/04 | character.md v3 加 value_axes / intelligence_axis; chapter.md v2 加 8 守则字段; 新增 cardinal-rules.json 配置 |
| plan/06 | Reflector 输出 JSON; learnings 注入策略改"top-8 因模型注意力" + cardinal_rule scope top-1 永远保留 + weight 调整协议 5 条 + cardinal_rule 例外 |
| plan/09 | CheckerReport / ValidatorReport 加 cardinal contributions |
| plan/10 | PersonaReaction / ChapterRiskReport 加 dropoffRisk + cardinalRulesFlags + cardinalRulesFindings |
| spec/02 | 工具内部 LLM 调用规约: extractSemanticDelta / filterByLLM / concept extractor / compress 必经 callJsonAgent |
| spec/03 | 公共片段 8 输出形态; Writer prompt 加 5 守则 + 黄金三章特殊版 + 反例 |
| spec/04 | 4 个新 chunk 类型 (analyzing / json-result / json-retry / json-failed) + JSON streaming 衔接代码 |
| spec/06 | ApprovalCard 加 CardinalRulesReportPanel + critical 必勾 + blocking 禁用 |
| spec/10 | BeatAnalyzer + ArcTracker 都走 callJsonAgent + 加 cardinal contributions |
| spec/11 | personaReactionSchema 加 dropoffRisk + cardinalRulesFlags; report 加 cardinalRulesFindings |
| spec/16 | character.md zod v3; foreshadowings metadata deadline / weight / pattern |
| spec/19 | filterByLLM 走 callJsonAgent + ImpactFilterBatchOutputSchema; cascade 与守则衔接节 (改 promises/taboos/value_axes/foreshadowings 触发全章节守则重扫) |
| spec/20 | assembleContext 默认装 5 类守则数据; tokenBudget 上限 800K (1M ctx); truncated 应永远空 |

### T6 (本 commit): plan/01 不变性总更新 L13-L17 + progress 总束

把 5 个反馈点定锚为系统级不变性:

- L13 L4 是单一事实源
- L14 per-agent 装配契约严格写死, 不允许 agent 自拼, 真超 1M 抛 ContextOverflowError 让用户分卷
- L15 L3 仅 Reflector 写, 读 context builder top-8, cardinal_rule scope top-1 永远保留
- L16 结构化输出必走 JSON mode + zod, 失败 retry + escalate, 不允许 silent fallback
- L17 五大网文守则不可违反, critical 必勾 / blocking 禁用, cardinal-rules.json enabled 锁死

附: LLM 决策表加 V4 实查值, 详见链接 + plan/12 + spec/24 + spec/25, write 模式数据流加 per-agent context builder + 守则装配 + JSON mode + 风险报告

附 (本 commit 包含):

- plan/01 §不变性 5 条新增 (L13-L17)
- LLM 决策表加 V4 实查值 (1M ctx + 384K + JSON mode)
- write 模式数据流加 per-agent context builder + 守则装配 + JSON mode + 风险报告
- progress/006 (本文) + progress/README 索引

## 关键决策

### 决策 1: 优化目标从"省 token"到"装齐一致性所需"

读者读到不一致内容立刻出戏弃书。1M ctx 下,普通章节场景 200K-500K 远不到上限。把"该装的全装齐"作为头等优先级 — 不再"在限额内做取舍"。这是反 75beb2f 错误设计的核心。

### 决策 2: per-agent 上下文契约 vs 统一 buildPromptContext

每个 agent 职责不同,装的也不同:

- Writer 重创作向: 全设定 + 当前章上下文 + 范文 + 风格 learnings + 守则
- Validator 重一致性向: 全 entity timeline + relations history + 命中章节全文 + 概念全表 + 伏笔全表 + 守则
- Checker 风格连贯向: 近期章节 + 范文 + 风格 learnings
- Humanizer 文本改写向: 当前章节 + 范文 + 用户口头禅 (不需要设定)
- ReaderPanel 读者反应向: 章节 + 5 persona + 概念雷点 + 守则
- Reflector 经验提炼向: ChangeSet + 决议 + 反馈 + 已有 learnings (不读项目数据)
- Router 路由向: 用户输入 + mode + 最近 3-5 条 (极简)

强行用同一套装配会两头不讨好。per-agent context builder 让每个职责清楚地说"我需要 X Y Z"。

### 决策 3: JSON mode 的应用边界

按"输出是否本质结构化"分:

- ✅ JSON mode: Router / Validator / Checker / ReaderPanel / Reflector / 工具内 LLM 调用 (extractSemanticDelta / filterByLLM / concept extractor / compress)
- ❌ JSON mode: Writer 章节正文 / Humanizer 改写 / discuss 模式回答 / compressed_messages 摘要 (虽然 compressed_messages summarize 走 JSON, 因为要 anchors 字段)

不允许 silent fallback — 解析失败必 escalate, 防 cascade 漏审 / 概念抽取漏 entity 直接破坏一致性。

### 决策 4: 五大守则不可绕过

`cardinal-rules.json` 阈值可微调 (例: 节奏阈值 5 章 → 6 章), 但 `enabled: true` UI 锁死。critical 风险用户**必须勾** "明知违反仍通过" 才能 approve, 不允许 silent commit。blocking violation (已过 deadline 的 critical promise) 完全禁用 approve, 用户必须先解决 promise 或调整 deadline。

### 决策 5: cardinal_rule scope learning 反向 weight 例外

普通 learning 用户 reject 会扣 weight (-0.3, 经验失效信号);但 `scope='cardinal_rule'` 不扣 — 那是用户拒绝"违反守则的写法",不是拒绝"守则本身"。守则阈值只能用户在 SettingsDialog 显式调,LLM 学不到反向降低守则严格度。

### 决策 6: 撤掉错误 commit 而非小修小补

75beb2f 的核心思路 (token budget + 5 级降级 + 统一装配) 被 3 个反馈点否定。强行修补会留下混乱痕迹。git reset --mixed 撤回 + 用 7 个有清晰主题的 commits 重做。

## 下期计划

### 短期 (W3 启动前还要做)

- spec/00 audit 时核对:
  - DeepSeek V4 真实 tokenizer (是否提供官方;暂用 tiktoken + 5% margin)
  - Mastra 1.4.x `Memory.options.lastMessages: 30` 与 streamVNext 显式 messages 数组的交互 (是否会重复 append)
  - Mastra `getOrCreateThread` 真实 API 名

### 中期 (W3-W11 落地)

- W3 实现 lib/agents/memory.ts + streamWithGuard + lib/agents/json-output.ts (callJsonAgent)
- W4 实现 7 个 agent context builder (Writer / Validator / Checker / Humanizer / ReaderPanel / Reflector / Router)
- W5 实现 5 个守则检测器 (goldenChaptersCheck / characterIntegrityCheck / pacingCheck / promiseAccountabilityCheck / protagonistAgencyCheck)
- W6 实现 callJsonAgent retry + JsonOutputError + escalate UI
- W7-W10 知识图谱 cascade + 守则相关字段衔接 (character v3 / foreshadowings deadline / chapter v2 派生)
- W11 prompt_traces 诊断面板 + 装配优化评估 + semanticRecall 评估

### 已知风险

- **风险 1**: Mastra 1.x 演进快 — `Memory` API 可能 1.5/1.6 变化。Mitigation: streamWithGuard 包装层吸收变化。
- **风险 2**: DeepSeek tokenizer 估算偏差 — 实际 token 比 tiktoken 多 10% 时偶发警报。Mitigation: 已加 5% safety margin, W2 实测调整。
- **风险 3**: JSON mode 中途截断 — `max_tokens` 估算偏小可能截断 JSON。Mitigation: spec/24 各场景估算表;监控 finishReason='length' 自动 retry + 加大 maxTokens。
- **风险 4**: 守则检测假阳性 — value_axes / fakeStrategy / dualStandard 这类语义判断 LLM 可能误判。Mitigation: critical 不直接 block, 只是强制用户勾 "明知违反仍通过";用户可在 SettingsDialog 微调阈值;Reflector 学习用户拒绝模式 (但不能降守则严格度)。
- **风险 5**: 1M ctx 仍可能不够 — 极长项目 (50万字+全设定) 真有可能超。Mitigation: ContextOverflowError 详细诊断;W11 评估"分卷加载"策略。

## 关联 commit (本批)

| Commit | 内容 |
|---|---|
| `5c6f8a7` (T1) | DeepSeek V4 真实能力实查 (1M ctx + JSON mode + 模型命名) |
| `7d27dbe` (T2) | spec/24 JSON 结构化输出统一规约 |
| `1a83ca6` (T3) | spec/25 五大网文守则可机器化定义 |
| `1c26601` (T4) | plan/12 + spec/22-23 重设计 (一致性优先 + per-agent 契约) |
| `e49ee06` (T5) | 全 agent 集成 (14 文件: 守则 + JSON mode + per-agent 落地) |
| (T6, 本 commit) | plan/01 不变性总更新 L13-L17 + progress/006 + README 总束 |

## 与之前 progress 的关系

- **005 (knowledge graph)**: 给 L4 (项目数据本身) 的能力 (assembleContext / queryFacts / analyzeImpact)
- **006 (本期)**: 给 L1-L3 (Agent 自身) 的治理框架 + 上下文装配契约 + 输出规范化 + 内容质量绝对守则

两者咬合点: 各 agent context builder (spec/23) 第 N 步调 spec/20 的 assembleContext, 把 L4 的 retrieve 结果 + 守则数据装入 L1。
