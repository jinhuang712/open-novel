# Appendix · JSON Schemas

本 appendix 是结构化输出对象 schema 的归口。根层 spec 定义输出语义、失败处理和主权边界;这里按需展开字段、校验规则和样例。

## 归口内容

- Router actions。
- ChangeSet、approval item、rollback result。
- context package、impact analysis result、fact query result。
- tool result envelope。
- narrative report、reader report、cardinal rules report。
- humanizer diff 和 style report。
- streaming control payload 和 recoverable error payload。

## 对应核心文档

- [03 Agent Runtime](../03-agent-runtime.md)
- [04 Turn Orchestration](../04-turn-orchestration.md)
- [05 Streaming UI Protocol](../05-streaming-ui-protocol.md)
- [07 Context And Query](../07-context-and-query.md)
- [08 Creative Engine](../08-creative-engine.md)
- [09 Style And Humanizer](../09-style-and-humanizer.md)

## 边界

schema 可在 appendix 细化;但如果某个字段缺失会改变 retry、approval、blocking、rollback 或用户可见风险,根层 spec 必须点名该字段的行为意义。
