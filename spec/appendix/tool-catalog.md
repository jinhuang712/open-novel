# Appendix · Tool Catalog

本 appendix 是工具、命令、快捷键和查询能力参数的归口。根层 spec 定义工具能做什么、不能做什么、失败如何处理和是否需要审批。

## 归口内容

- Agent 读取工具参数。
- proposal 工具参数。
- analyzeImpact、assembleContext、queryFacts 工具明细。
- reindex、anchor health、knowledge graph 查询工具。
- CommandRegistry 与 ShortcutRegistry 全表。
- Settings / Debug 只读诊断命令。

## 对应核心文档

- [03 Agent Runtime](../03-agent-runtime.md)
- [04 Turn Orchestration](../04-turn-orchestration.md)
- [06 Knowledge Graph](../06-knowledge-graph.md)
- [07 Context And Query](../07-context-and-query.md)
- [10 Editor And Interaction](../10-editor-and-interaction.md)

## 边界

工具参数变化可以只改 appendix。工具是否允许读取、是否允许构造 proposal、是否可能写入、是否触发审批或 rollback,必须在根层 spec 说明。
