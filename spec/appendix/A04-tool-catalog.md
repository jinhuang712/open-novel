# A04 · Tool Catalog

本 appendix 是工具、命令、快捷键和查询能力参数的归口。根层 spec 定义工具能做什么、不能做什么、失败如何处理和是否需要审批。

## 归口内容

- Agent 读取工具参数。
- proposal 工具参数。
- analyzeImpact、assembleContext、queryFacts 工具明细。
- reindex、anchor health、knowledge graph 查询工具。
- Universal Search source fanout、ranker 参数、preview action 和快捷键。
- CommandRegistry、ShortcutRegistry、Quick Open、Discuss Mode 入口全表。
- Settings / Debug 只读诊断命令。

## 对应核心文档

- [S03 Agent Runtime](../S03-agent-runtime.md)
- [S04 Turn Orchestration](../S04-turn-orchestration.md)
- [S06 Knowledge Graph](../S06-knowledge-graph.md)
- [S07 Context And Query](../S07-context-and-query.md)
- [S10 Editor And Interaction](../S10-editor-and-interaction.md)
- [M01 Universal Search](../M01-universal-search.md)
- [M04 Discuss Mode](../M04-discuss-mode.md)
- [M08 Approval Cascade](../M08-approval-cascade.md)
- [M11 ReaderPanel](../M11-reader-panel.md)

## 边界

工具参数变化可以只改 appendix。工具是否允许读取、是否允许构造 proposal、是否可能写入、是否触发审批或内部恢复,必须在根层 spec 说明。
