# A04 · Tool Catalog

本 appendix 是工具、命令、快捷键和查询能力参数的归口。[S08 · Agent Tooling Boundary](../S08-agent-tooling-boundary.md) 定义工具能做什么、不能做什么、失败如何处理、二次 LLM 调用如何受控和是否需要审批。

工具/命令族不是 Agent 角色或 runner 清单。工具调用归 S09 授权、S03 执行记录,角色 id 仍以 [M13 · Agent Team Controls](../M13-agent-team-controls.md) 的七个 canonical id 为准。

## 归口内容

- Agent 读取工具参数。
- proposal 工具参数。
- analyzeImpact、assembleContext、queryFacts 工具明细。
- reindex、anchor health、knowledge graph 查询工具。
- Validator、Checker 和 BeatAnalyzer 工具参数、风险输出和 failure envelope。
- Universal Search source fanout、ranker 参数、fact answer/source view、preview action 和快捷键。
- CommandRegistry、ShortcutRegistry、Quick Open、Discuss Mode 入口全表。
- Settings 只读/受限命令、dev build gated Debug 只读诊断命令。

## 对应核心文档

- [S02 Agent Runner](../S02-agent-runner.md)
- [S03 Turn Orchestration](../S03-turn-orchestration.md)
- [S05 Knowledge Graph](../S05-knowledge-graph.md)
- [S06 Context Management](../S06-context-management.md)
- [S08 Agent Tooling Boundary](../S08-agent-tooling-boundary.md)
- [S13 Editor And Interaction](../S13-editor-and-interaction.md)
- [M01 Universal Search](../M01-universal-search.md)
- [M04 Discuss Mode](../M04-discuss-mode.md)
- [M08 Approval Cascade](../M08-approval-cascade.md)
- [M11 ReaderPanel](../M11-reader-panel.md)
- [M13 Agent Team Controls](../M13-agent-team-controls.md)

## 实现前工具覆盖矩阵

| 工具/命令族 | 需要记录的明细 |
|---|---|
| read / query tools | 读取范围、项目边界、返回 source jump、失败降级 |
| proposal tools | 是否能构造 ChangeSet、审批前置条件、禁止直接写入的边界 |
| context / impact tools | 输入证据、候选范围、低置信标记、收敛条件 |
| writer / humanizer tools | 输出形态、diff 约束、守则风险注入、不可越权字段 |
| validator / checker tools | 检查范围、source refs、风险级别、阻断条件、needs-data/partial failure envelope |
| BeatAnalyzer | 作为 checker 内部工具记录结构诊断维度、趋势窗口和证据片段,不得作为 role id |
| search / command tools | 快捷键、命令 id、可用模式、pending approval 下的只读限制;Universal Search 是唯一作者侧顶层搜索入口,Quick Open 只做高级打开 |
| storage / reindex / recovery tools | 原子写边界、reindex 范围、内部恢复结果、用户可见收场 |
| platform tools | provider probe、watcher setup、diagnostic export、dev build gate 的命令与权限 |

## 边界

工具参数变化可以只改 appendix。工具是否允许读取、是否允许构造 proposal、是否可能写入、是否触发审批、是否允许二次 LLM 调用或内部恢复,必须在 [S08](../S08-agent-tooling-boundary.md) 及受影响的根层 spec 说明。

作者可见 UI 命令主标签使用中文。英文 command id 只用于持久化、开发者视图、快捷键说明或必要括注。

## 用户可见默认值登记

散落在 design 文案里的产品行为默认值在此统一登记。默认值在此登记,design 文案引用此表;调整默认值改这里并同步 design。

| 参数 | 默认值 | 语义 | 主权文档 |
|---|---|---|---|
| 自动重做收敛上限 | 连续 3 轮 | 写手与一致性守护者连续 3 轮未收敛即停止升级,转人工裁决 | [design/02 §状态矩阵](../../design/02-approval-cascade.md#状态矩阵) |
| ReaderPanel 最少成功 persona 数 | ≥3 | ≥3 个 persona 成功才聚合报告;<3 标 `insufficient`,不出分类建议 | [design/03 §进行态](../../design/03-reader-panel.md#进行态长任务) |
| 章节过短阈值 | <800 字 | 章节不足 800 字不跑读者预演,展示空态与继续写作引导 | [design/03 §状态矩阵](../../design/03-reader-panel.md#状态矩阵) |
| 审批聚焦卡按键忽略窗口 | 600ms | 审批卡自动出现后的 600ms 内忽略 `Y/E/N` 单字母键,防误触 | [design/01 §审批聚焦卡](../../design/01-main-layout.md#审批聚焦卡) |
| toast 自动消退 | 4s | toast 出现后 4s 自动消退 | [design/01](../../design/01-main-layout.md) |
| toast 同屏上限 | 3 条 | 同屏最多 3 条 toast,超出排队 | [design/01](../../design/01-main-layout.md) |
| hover 旁注出现延迟 | 100ms | hover 100ms 后展示旁注 | [design/01](../../design/01-main-layout.md) |
| hover 旁注收回延迟 | 200ms | 鼠标移出 200ms 后收回旁注 | [design/01](../../design/01-main-layout.md) |
