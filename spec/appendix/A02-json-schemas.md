# A02 · JSON Schemas

本 appendix 是结构化输出对象 schema 的归口。根层 spec 定义输出语义、失败处理和主权边界;这里按需展开字段、校验规则和样例。

## 归口内容

- Router actions。
- ChangeSet、approval item、internal recovery result。
- context package、impact analysis result、fact query result。
- tool result envelope。
- narrative report、reader report、cardinal rules report。
- humanizer diff、style report、inline review suggestion。
- streaming control payload 和 recoverable error payload。
- turn recap payload、activity item、author note、correction request 和 continuation action。
- Universal Search query intent、result group、preview payload。
- Discuss Mode answer/report/switch suggestion payload。
- Trace step、degraded state、developer detail envelope。

## 对应核心文档

- [S03 Agent Runtime](../S03-agent-runtime.md)
- [S04 Turn Orchestration](../S04-turn-orchestration.md)
- [S05 Streaming UI Protocol](../S05-streaming-ui-protocol.md)
- [S07 Context And Query](../S07-context-and-query.md)
- [S08 Creative Engine](../S08-creative-engine.md)
- [S09 Style And Humanizer](../S09-style-and-humanizer.md)
- [S10 Editor And Interaction](../S10-editor-and-interaction.md)
- [M01 Universal Search](../M01-universal-search.md)
- [M04 Discuss Mode](../M04-discuss-mode.md)
- [M07 Inline Rewrite And Humanizer](../M07-inline-rewrite-and-humanizer.md)
- [M09 Trace Observability](../M09-trace-observability.md)
- [M11 ReaderPanel](../M11-reader-panel.md)
- [M17 Turn Recap And Continuation](../M17-turn-recap-and-continuation.md)

## 边界

schema 可在 appendix 细化;但如果某个字段缺失会改变 retry、approval、blocking、内部恢复或用户可见风险,根层 spec 必须点名该字段的行为意义。
