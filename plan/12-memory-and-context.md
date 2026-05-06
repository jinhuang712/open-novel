# 12 — Agent 记忆与上下文治理

> 这一章补的是"Agent 自身的记忆与每次调用的 prompt 装配",不是"项目数据的知识图谱" (那是 plan/11)。两者经常被混为一谈,但是不同层。

## 头等优先级:**一致性 > 一切**

读者最大的弃书原因之一是"读到与前文不一致的内容,瞬间出戏下头"。所以本章的所有设计都围绕一个目标:**让 Agent 在生成 / 审查时,把"一致性所需的上下文"装齐**。

DeepSeek V4 (Pro & Flash) 的 ctx 是 **1M tokens**(实查见 spec/00 §C),这意味着:

- 普通章节场景下,全设定 + 全相关章节 + 全 entity timeline + 全 relations + 用户范文加起来通常 200K-500K,**远不到 1M**
- 不再需要"token 预算控制 / 降级链"这种以"省"为骨架的设计 — 它会主动制造一致性漏洞
- 取而代之的设计骨架: **每个 agent 各自定义"上下文契约" — 它的职责需要哪些数据,白纸黑字写清楚,该装的必装,不在限额内做选择**

> ⚠ **历史教训**: 在审计前曾把 ctx 假设为 128K,设计了 "6 agent × 7 用途 token 预算表" + "5 级降级链 (砍 messages → 丢 summary → 强裁 retrieve → 砍 learnings)"。这套基于错误数值的设计让 Validator/Writer 在限额下做"该不该装这条历史章节"的取舍 — 这是反一致性的。整套已撤,见 progress/006。

## 为什么要单独立章

之前的设计里 Memory 只有一句:

```ts
const memory = new Memory({ storage: new LibSQLStore({ url: '...' }) })
```

这是**远远不够的**。一个真实创作场景里,以下问题都没答案:

1. **对话历史能堆多大?** 长 session 几百条 messages,Mastra 自带 lastMessages 滑窗,但默认值要多大?
2. **跨进程恢复?** spec/07 状态机持久化了 mode 和 pendingApprovals,但**对话 messages** 在哪里恢复?
3. **Reflector learnings 怎么注入?** plan/06 写了"top-N 经验注入 system prompt",但 N 多大、按什么排、是否有 decay,全没定。
4. **多种记忆怎么分层?** 工作记忆 / 会话记忆 / 项目记忆 / 知识图谱 — 这 4 层各自归谁管,边界在哪?
5. **每个 agent 装的上下文相同吗?** 不!它们职责不同,需要的数据也不同 — 强行用同一套装配会让 Router 塞一堆它不需要的 entity timeline,Writer 又错过它该装的范文。

这章给出**四层记忆模型 + per-agent 上下文契约 + 跨进程恢复 + Reflector 注入策略**。

## 四层记忆模型

```
┌──────────────────────────────────────────────────────────────────┐
│  L4. 知识图谱 (Knowledge Graph) ★ 一致性的事实源                    │
│      规模: 全项目所有设定 + 章节 + 段锚 + entity_relations + 概念  │
│            + foreshadowings + cardinal-rules.json                │
│      位置: file (md) + LibSQL workspace.db                        │
│      访问: assembleContext (写) / queryFacts (读) / analyzeImpact │
│      生命周期: 永久 (项目存在则存在)                                 │
│      详见: plan/11 + spec/16-21 + spec/25                         │
└──────────────────────────────────────────────────────────────────┘
                                 ▲
                                 │ per-agent 契约 retrieve (按职责)
                                 │
┌──────────────────────────────────────────────────────────────────┐
│  L3. 项目记忆 (Project Memory) — Reflector 沉淀的经验                │
│      规模: ≤数百条 learnings + reflector_pending 队列              │
│      位置: LibSQL workspace.db (`learnings` 表)                   │
│      访问: 各 agent context builder 注入 system prompt              │
│      生命周期: 跨 session 永久 (用户可手动删除)                      │
│      详见: plan/06 + spec/22                                      │
└──────────────────────────────────────────────────────────────────┘
                                 ▲
                                 │ inject top-K by scope (按 agent 适用)
                                 │
┌──────────────────────────────────────────────────────────────────┐
│  L2. 会话记忆 (Session Memory) — Mastra Memory thread             │
│      规模: 单 session 内对话历史 + tool calls                      │
│      位置: LibSQL runtime.db (Mastra Memory 管的)                  │
│      访问: 自动 — Agent stream 时 Mastra 拼进 messages              │
│      生命周期: 单 session (默认 30 天不活动 GC)                      │
│      可选压缩: 长 session (>200 messages) 时启用 — POC 默认关       │
│      详见: spec/22                                                │
└──────────────────────────────────────────────────────────────────┘
                                 ▲
                                 │ append + lastMessages 滑窗
                                 │
┌──────────────────────────────────────────────────────────────────┐
│  L1. 工作记忆 (Working Memory) — 单 turn 内的装配后 prompt         │
│      规模: 当前 stream 的 system + retrieve + messages + user      │
│      位置: 内存 (装配后送入 LLM)                                    │
│      访问: 由各 agent context builder 装配 (spec/23)                │
│      生命周期: 单次 streamVNext 调用                                │
│      详见: spec/23 §per-agent 上下文契约                            │
└──────────────────────────────────────────────────────────────────┘
```

**关键不变性** (在 plan/01 §不变性 锁定为 L13-L15):

- **L4 是单一事实源**: L1-L3 任何与 L4 冲突的内容,answer 时以 L4 为准(例:历史 message 里说"林溪是男的",但 L4 character 已改女,以 L4 为准)
- **L3 写入仅 Reflector**: 不允许 LLM 在 stream 中直接 upsert learnings;只有 Reflector 在审批闭环后写入
- **L1 装配契约严格写死**: 各 agent 必装项不允许"为节省临时省略" — 1M ctx 给的就是奢侈装齐的本钱

## Mastra Memory 的角色边界

Mastra Memory 只管 **L2 (会话记忆)**:

- ✅ thread (`proj:X:session:Y`) 隔离
- ✅ resource (`X` = projectId) 隔离
- ✅ messageHistory 持久化 (LibSQL runtime.db)
- ✅ semantic recall (按 embedding 检索老消息) — POC 阶段**关闭** (见 spec/22 §semantic recall 决策)
- ❌ **不**管 L3 learnings (那在 workspace.db,我们应用层管)
- ❌ **不**管 L4 知识图谱 (那是项目 file + workspace.db)
- ❌ **不**管 L1 装配 (我们在 spec/23 自己装配)

> Mastra `Memory` 还有 working memory / scopes 等概念。POC 阶段我们只用最基础的 thread + resource,其余暂不开 — 见 spec/22 §配置决策。

## per-agent 上下文契约 (核心设计)

每个 agent 都有自己的 context builder,**根据职责定义"必装什么 / 不装什么"**。这是与之前"统一 buildPromptContext"反转的核心 — 详见 [spec/23 §per-agent 上下文契约](../spec/23-context-contracts.md)。

各 agent 装配概览:

| Agent | 关键职责 | 必装数据 |
|---|---|---|
| **Writer (write 模式)** | 生成章节,与 L4 完全一致 | 章节大纲 + 上一章末段 + 全相关 entity 完整状态 + 当前时间点 entity 快照 + 活跃关系 + 待处理伏笔 + 最近 3-5 章原文 + 世界观全文 + 概念约束 (taboo / invariant) + 章节弧光 + 用户范文 + cardinal-rules.json + active critical promises + 涉及角色 value_axes + 距上次 milestone + L3 learnings (style/narrative/worldview/character/cardinal_rule scope) |
| **Validator** | 找当前 ChangeProposal 与 L4 任何冲突 | 主修改 + analyzeImpact 候选半径 + 所有相关 entity 完整 timeline + 所有相关 relations 完整 history + 命中章节全文 + 概念表全部 + 待处理伏笔全部 + 已 resolved 伏笔近 N + 世界观全文 + cardinal-rules.json |
| **Checker** | 风格/节奏/情绪审查 | 当前章节 + 最近 5-10 章 (风格连贯) + 用户范文 + 章节弧光 + L3 learnings (style/narrative/pacing scope) + cardinal-rules.json |
| **Humanizer** | 去 AI 化 / 文本改写 | 当前章节 + 用户范文 + 用户口头禅 + project.json style + L3 learnings (style/voice scope) — 不需要 entity / relations |
| **ReaderPanel** | 5 persona 模拟读者反应 | 当前章节 + 5 persona 配置 + 概念约束 (taboo) + cardinal-rules.json + 项目"市场 hits"范文 (可选) |
| **Reflector** | 提炼经验 | 这次 ChangeSet 全文 + 用户决议 + 反馈文字 + 已有同 scope learnings (避免重复) — 不读项目数据 |
| **Router** | 意图分类 + 模式校验 | 用户输入 + 当前 mode + 最近 3-5 条 messages — 极简 |

每个 agent 的具体契约 (zod schema + retrieve 顺序 + system prompt 模板) 在 spec/23 落实。

**关键约束**:

- 各 agent 必装项**不允许"按 token 预算裁剪"**
- 如果某 agent 的总装配超出 ctx 上限 (1M),那是**项目数据真的太大**了 — 应该警报 + 让用户做项目分卷,不是悄悄省略

## L2 历史管理 (lastMessages + 可选压缩)

POC 阶段:

- Mastra `lastMessages: 30` (1M ctx 下放宽,与之前"为节省 token 卡到 12 条"的旧设计相反)
- `compressed_messages` 表保留(spec/22 设计),但**默认 disabled** — 长 session (>200 messages) 时由用户手动开启,或 W11 评估默认开启时机
- `semanticRecall: false` (与 spec/18 embedding 选型耦合,deferred)

**不做"自动压缩"是因为**:

- 1M ctx 下,30 条 messages × 平均 500 token = 15K,远不会挤压
- 摘要本身有损,不必要的有损会牺牲一致性
- 真到 200 条以上的极长 session,再用户主动触发,不影响主流程

## 跨进程恢复

| 层 | 恢复机制 |
|---|---|
| L1 工作记忆 | 不恢复 (单次 stream 内的纯内存) |
| L2 会话记忆 | Mastra Memory 自动恢复 (thread 在 LibSQL runtime.db) |
| L3 项目记忆 | LibSQL workspace.db 持久化,启动 `Router.boot()` 时按 projectId 加载 top-K learnings 进缓存 |
| L4 知识图谱 | LibSQL workspace.db + file system,按需 retrieve |
| 状态机 | spec/07 §持久化恢复 (`runtime/session.json` 恢复 mode + pendingApprovals;不恢复 messages — messages 走 L2) |

**协同**: 状态机恢复 + L2 messages 恢复要在同一个 thread。详见 spec/22 §跨进程 hydrate 实操。

## 与已有 spec 的边界 / 引用

- **plan/02 §多项目隔离 (Memory)**: 浅初始化 → 引用本章 + spec/22
- **plan/06 §learnings 表 + Reflector**: L3 数据怎么写。本章约束**怎么读** (top-K 注入 + decay)
- **spec/07 §持久化恢复**: 状态机 state — 与 L2 messages 的 thread 关联在 spec/22
- **spec/20 assembleContext**: L4 retrieve 的具体实现 — Writer / Validator / Checker / ReaderPanel context builder 都会调它
- **spec/21 queryFacts**: L4 read 工具,与 L1-L3 解耦,Agent 在 stream 中按需调
- **spec/22**: Mastra Memory 落地 (runtime.db schema / thread/resource lifecycle / GC / streamWithGuard)
- **spec/23**: per-agent 上下文契约具体实现 (各 agent context builder + retrieve 顺序)
- **spec/24**: JSON 输出规约 — 决定哪些 agent 输出走 JSON mode
- **spec/25**: 五大网文守则 — 决定 Writer / Validator / ReaderPanel 必装的额外数据 (cardinal-rules.json + active promises + value_axes + milestone)

## 关键参数 (POC 默认值,可在 SettingsDialog 改)

| 参数 | 默认值 | 调节范围 | 说明 |
|---|---|---|---|
| `mastraMemory.lastMessages` | 30 | 12 - 60 | 1M ctx 下不需要紧 |
| `mastraMemory.semanticRecall` | `false` | bool | POC 关,W11 评估 |
| `mastraMemory.compressedMessages.enabled` | `false` | bool | POC 关;长 session > 200 messages 用户主动开 |
| `learnings.topK` | 8 | 4 - 20 | 不是为省 token,是为模型注意力 — 注入 30 条经验反而稀释主任务 |
| `learnings.weightFloor` | 0.2 | 0.1 - 0.5 | < floor 不注入 |
| `learnings.weightDecay` | 0.95 / 30天 | 0.9-1.0 | 老经验衰减率 |
| `learnings.cardinalRuleProtect` | `true` | bool | scope='cardinal_rule' 的 top-1 永远不被砍 (spec/25) |
| `thread.gcAfterDays` | 30 | 7-90 | 不活动 thread 归档 |

## 与 Reflector 的协同 (回扣 plan/06)

Reflector 是 L3 的**唯一写入者**,本章是 L3 的**统一读取规则**:

```
审批闭环 → 入队 reflector_pending (按 cascade_group_id)
       → Reflector 出队 → 提炼 1-3 条 learnings (走 JSON mode, spec/24)
       → upsert 到 learnings 表
                                                            ↓
各 agent context builder (spec/23)
       → 取 learnings WHERE project_id=X AND scope IN (该 agent 适用) AND weight >= 0.2
       → ORDER BY weight DESC LIMIT 8
       → cardinal_rule scope 的 top-1 永远保留 (override 截断)
       → 注入 system prompt 的"经验"段
                                                            ↓
                                          Agent 用经验 + L4 数据生成
                                                            ↓
                                          用户审批 → 闭环 → Reflector 调整 weight
                                                            ↓
                                                   weight 衰减 (30天 0.95)
                                                  + 命中加权 (+0.5)
                                                  + 拒绝/edited (-0.3)
                                                  + < 0.2 自动归档
                                                  + cardinal_rule scope 阈值不能 LLM 调降
```

**weight 决策协议**(plan/06 §weight 调整协议 同步):

- 初始 1.0
- 该 learning 命中且**用户 approve** 不修改 → +0.5
- 该 learning 命中但**用户 reject 或大幅 edit** → -0.3
- 30 天没命中 → ×0.95 (decay)
- weight < 0.2 自动归档 (移到 `learnings_archive`,30 天可恢复)
- 用户面板可手动 +/-/删
- **cardinal_rule scope 例外**: 用户 reject 不降低 weight (那是用户拒绝的"违反守则的写法",不是拒绝"守则本身");只有用户在 SettingsDialog 显式调整阈值才生效

## 不解决的问题 / 待办

- **多用户协作**: 本架构纯单机单用户,不考虑两人共享 thread;后续如开放,thread 加 user_id 维度
- **跨项目记忆**: 不允许。两个项目的 learnings / messages 严格 resource 隔离 (合规 + 风格防漏)
- **embedding 选型未定**: spec/22 §semantic recall 默认关闭,等 spec/18 选型确定后再开
- **超大项目分卷**: 极少数项目可能确实超 1M ctx (50万字 + 全设定),需要"分卷加载"策略;W11 评估
- **DeepSeek V4 真实 tokenizer 待 spec/00 验证**: 1M 是 token 数,本身有估算误差 (tiktoken vs 真实 tokenizer)
