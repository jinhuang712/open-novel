# A02 · JSON Schemas

本 appendix 是结构化输出对象 schema 的归口。根层 spec 定义输出语义、失败处理和主权边界;这里按需展开字段、校验规则和样例。

## 归口内容

- Router actions。
- ChangeSet、dependency group、approval item、residual obligation、internal recovery result。
- approval queue item、approval invalidation、rejection redo request、no-change-evidence。
- context package、impact analysis result、fact query result。
- tool result envelope。
- narrative report、reader report、cardinal rules report。
- humanizer diff、style report、inline review suggestion。
- streaming control payload 和 recoverable error payload。
- turn recap payload、activity item、author note、correction request 和 continuation action。
- Universal Search query intent、result group、preview payload。
- Discuss Mode answer/report/switch suggestion payload。
- Trace step、degraded state、developer detail envelope。
- entity identity governance proposal、alias confirmation、merge/split result。

## 对应核心文档

- [S03 Agent Runner](../S03-agent-runner.md)
- [S04 Turn Orchestration](../S04-turn-orchestration.md)
- [S05 Streaming UI Protocol](../S05-streaming-ui-protocol.md)
- [S07 Context Management](../S07-context-management.md)
- [S08 Prompt System](../S08-prompt-system.md)
- [S09 Agent Tooling Boundary](../S09-agent-tooling-boundary.md)
- [S10 LLM Quality Harness](../S10-llm-quality-harness.md)
- [S11 Evaluation And Golden Regression](../S11-evaluation-and-golden-regression.md)
- [S12 Creative Engine](../S12-creative-engine.md)
- [S13 Style And Humanizer](../S13-style-and-humanizer.md)
- [S14 Editor And Interaction](../S14-editor-and-interaction.md)
- [M01 Universal Search](../M01-universal-search.md)
- [M04 Discuss Mode](../M04-discuss-mode.md)
- [M07 Inline Rewrite And Humanizer](../M07-inline-rewrite-and-humanizer.md)
- [M09 Trace Observability](../M09-trace-observability.md)
- [M11 ReaderPanel](../M11-reader-panel.md)
- [M17 Turn Recap And Continuation](../M17-turn-recap-and-continuation.md)

## 实现前 schema 覆盖矩阵

| 能力/平台 | schema 对象 |
|---|---|
| Router / Mode | router action、mode switch request、illegal action error |
| Context / Query | context package、evidence item、fact query result、source jump |
| Search / Command | search intent、result group、preview payload、command invocation |
| Writing / Planning / Approval | proposal draft、ChangeSet、dependency group、approval item、residual obligation、risk acknowledgement、decision payload |
| Approval Queue / Evidence | pending approval queue item、Invalidated reason、EditedAccepted recheck result、rejection redo payload、no-change-evidence |
| Inline Review / Humanizer | inline suggestion、diff hunk、near-text action、style report |
| Creative Engine / ReaderPanel | cardinal rule report、narrative report、reader persona report、aggregation summary |
| Knowledge / Identity | entity governance proposal、alias status、merge/split preview、obligation list item |
| Trace / Recap | trace step、developer detail envelope、recap payload、activity item、author note |
| Settings / Onboarding / Project Library | settings patch、danger action request、workspace bootstrap result、project list item |
| platform/Ixx/Rxx | provider capability, adapter event, import/export manifest, backup/restore result, migration result, diagnostic bundle manifest |

## 边界

schema 可在 appendix 细化;但如果某个字段缺失会改变 retry、approval、阻断级风险、内部恢复或用户可见风险,根层 spec 必须点名该字段的行为意义。
