# M13 · Agent Team Controls

Agent Team Controls 定义作者如何理解和调配七个 AI 角色。它不是模型参数页,而是编辑部的可见控制面。

## Canonical role id

以下 id 是持久化、事件、Trace、用量归因和 prompt 名称的唯一角色标识。作者可见 UI 的主标签使用中文展示名;英文 id 只用于持久化、开发者视图、快捷键说明或必要括注,不能替代中文主标签。

| canonical id | 中文展示名 | 用户可见职责 |
|---|---|---|
| `router` | 调度员 | 理解意图、选择模式和动作入口。 |
| `writer` | 写手 | 生成章节草稿、段落扩写和写作 proposal。 |
| `checker` | 审稿人 | 发现节奏、爽点、守则和表达风险。 |
| `validator` | 一致性守护者 | 复核事实、依赖、连带影响和阻断级一致性。 |
| `reader_panel` | 读者评审团 | 用多类读者视角给出风险和反应。 |
| `humanizer` | 润色师 | 做表达层改写和去 AI 味。 |
| `reflector` | 反思学习者 | 从作者审定和明确反馈中沉淀经验。 |

Design token、prompt template、cost row、trace badge、schema enum 和 agent 配置项都必须派生自这组 id。不得在不同文档里另起 `ReaderPanel` / `Validator` / `Checker` 等混合命名作为持久化值。

这组 id 不是 runner 数量。Runner 执行契约由 [S02](./S02-agent-runner.md) 定义,同一个受控 Runner 可以按 run envelope 承载不同 role;文档不得用“13 个 runner”等未落主权清单的数字替代这里的角色枚举。

BeatAnalyzer 不是第八个 canonical role id。它是 `checker` 角色内部的结构诊断工具或 prompt 片段,用于节奏、爽点、承诺推进和章内结构分析。事件、Trace、用量、配置项和 prompt 名称仍归 `checker`;需要展示 BeatAnalyzer 时只能作为工具/步骤名,不能作为持久化角色值。

## 控制对象

| 角色 | 用户能做 |
|---|---|
| 调度员 | 查看调度结果和路由原因 |
| 写手 | 调整档位、写作强度和按需触发入口 |
| 审稿人 | 调整诊断灵敏度、运行频率和报告深度 |
| 一致性守护者 | 查看一致性守护、调整提示频率和证据展开程度 |
| 读者评审团 | 调整读者预演深度、运行时机和 persona 组合 |
| 润色师 | 按需调用、调整表达强度和适用范围 |
| 反思学习者 | 调整学习频率、确认策略和经验权重 |

## 控制边界

```mermaid
flowchart LR
  Settings[Agent Controls] --> Runtime[S02 Runtime]
  Settings --> Agent[S02 Agent Runner]
  Agent --> Trace[M09 Trace]
  Runtime --> Context[S06 Context Management]
```

Agent 控制只影响未来 turn。正在运行的 turn 按 [S03](./S03-turn-orchestration.md) 取消或完成,不能被设置页静默改写。作者不能关闭任何角色,只能调档、配置、按需触发,或调整频率、权重和展示深度;守则、审批和事实复核仍按系统契约执行。

## 失败收场

| 失败 | 用户看到 | 系统不能做 |
|---|---|---|
| 试图关闭角色 | 解释角色不可关闭,提供调档/降频/按需触发选项 | 绕过守则或隐藏角色 |
| 设置保存失败 | 保留原设置 | 显示已生效 |
| turn 运行中改设置 | 提示下轮生效或要求取消 | 半路替换 Agent |
| 模型不可用 | 降级/阻断说明 | 静默换旧模型 |

## Design

角色控制的产品承诺见 [plan/06](../plan/06-agent-team.md),控制面 UI 见 [design/04](../design/04-settings.md)。

## 测试清单

| 类型 | 场景 |
|---|---|
| 调档 | 每个角色可调档、配置、按需触发或调整频率/权重,但不可关闭 |
| 生效 | 设置变更只影响后续 turn |
| Trace | 每条建议可归因到角色 |
| 用量 | 用量按角色可见 |
| ID | schema、event、prompt、design token 使用同一 canonical id |

## FAQ

**Q: 为什么角色不能完全关闭?**

A: 因为它们共同承载路由、生成、守则、审批解释、读者预演、表达改写和学习闭环。控制面可以降低频率、调整强度或改为按需触发,但不能让系统绕过守则、审批或事实复核。

**Q: 运行中的 turn 能不能因为设置变化立刻换 Agent?**

A: 不能。设置变化默认影响下一轮;当前 turn 要么完成,要么按 S04 取消后重新开始。
