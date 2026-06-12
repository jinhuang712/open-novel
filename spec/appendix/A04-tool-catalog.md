# A04 · Tool Catalog

本 appendix 是工具、命令、快捷键和查询能力参数的归口。[S09 · Agent Tooling Boundary](../S09-agent-tooling-boundary.md) 定义工具能做什么、不能做什么、失败如何处理、二次 LLM 调用如何受控和是否需要审批。

## 归口内容

- Agent 读取工具参数。
- proposal 工具参数。
- analyzeImpact、assembleContext、queryFacts 工具明细。
- reindex、anchor health、knowledge graph 查询工具。
- Validator、Checker 和 BeatAnalyzer 工具参数、风险输出和 failure envelope。
- Universal Search source fanout、ranker 参数、preview action 和快捷键。
- CommandRegistry、ShortcutRegistry、Quick Open、Discuss Mode 入口全表。
- Settings / Debug 只读诊断命令。

## 对应核心文档

- [S03 Agent Runner](../S03-agent-runner.md)
- [S04 Turn Orchestration](../S04-turn-orchestration.md)
- [S06 Knowledge Graph](../S06-knowledge-graph.md)
- [S07 Context Management](../S07-context-management.md)
- [S09 Agent Tooling Boundary](../S09-agent-tooling-boundary.md)
- [S14 Editor And Interaction](../S14-editor-and-interaction.md)
- [M01 Universal Search](../M01-universal-search.md)
- [M04 Discuss Mode](../M04-discuss-mode.md)
- [M08 Approval Cascade](../M08-approval-cascade.md)
- [M11 ReaderPanel](../M11-reader-panel.md)

## 实现前工具覆盖矩阵

| 工具/命令族 | 需要记录的明细 |
|---|---|
| read / query tools | 读取范围、项目边界、返回 source jump、失败降级 |
| proposal tools | 是否能构造 ChangeSet、审批前置条件、禁止直接写入的边界 |
| context / impact tools | 输入证据、候选范围、低置信标记、收敛条件 |
| writer / humanizer tools | 输出形态、diff 约束、守则风险注入、不可越权字段 |
| validator / checker tools | 检查范围、source refs、风险级别、阻断条件、needs-data/partial failure envelope |
| BeatAnalyzer | 作为 checker 内部工具记录结构诊断维度、趋势窗口和证据片段,不得作为 role id |
| search / command tools | 快捷键、命令 id、可用模式、pending approval 下的只读限制 |
| storage / reindex / recovery tools | 原子写边界、reindex 范围、内部恢复结果、用户可见收场 |
| platform tools | provider probe、watcher setup、import/export、backup/restore、diagnostic export 的命令与权限 |

## 边界

工具参数变化可以只改 appendix。工具是否允许读取、是否允许构造 proposal、是否可能写入、是否触发审批、是否允许二次 LLM 调用或内部恢复,必须在 [S09](../S09-agent-tooling-boundary.md) 及受影响的根层 spec 说明。
