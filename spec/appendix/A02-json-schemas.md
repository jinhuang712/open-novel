# A02 · JSON Schemas

本 appendix 是结构化输出对象 schema 的归口。根层 spec 定义输出语义、失败处理和主权边界;这里按需展开字段、校验规则和样例。

## 归口内容

- Router actions。
- ChangeSet、dependency group、approval item、residual obligation、internal recovery result。
- approval queue item、approval invalidation、rejection redo request、no-change-evidence。
- ledger entry、decision record、write/apply record、light apply transaction、recovery record、correction record、projection record、mode gate、cancel plan、interrupted run、obligation state。
- file version baseline、edit safety state、revalidation result、protected ledger envelope。
- context package、impact analysis result、fact query result。
- prompt budget envelope、provider failure envelope、embedding capability envelope。
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

- [S02 Agent Runner](../S02-agent-runner.md)
- [S03 Turn Orchestration](../S03-turn-orchestration.md)
- [S04 Streaming UI Protocol](../S04-streaming-ui-protocol.md)
- [S06 Context Management](../S06-context-management.md)
- [S07 Prompt System](../S07-prompt-system.md)
- [S08 Agent Tooling Boundary](../S08-agent-tooling-boundary.md)
- [S09 LLM Quality Harness](../S09-llm-quality-harness.md)
- [S10 Evaluation And Golden Regression](../S10-evaluation-and-golden-regression.md)
- [S11 Creative Engine](../S11-creative-engine.md)
- [S12 Style And Humanizer](../S12-style-and-humanizer.md)
- [S13 Editor And Interaction](../S13-editor-and-interaction.md)
- [S15 Journal And Ledger](../S15-journal-and-ledger.md)
- [S16 File Version And Edit Safety](../S16-file-version-and-edit-safety.md)
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
| Turn / Ledger / Recovery | ledger entry、decision record、write/apply record、light apply transaction、recovery record、correction record、projection record、turn state、mode gate、cancel plan、manual recovery、interrupted run |
| File Version / Edit Safety | file version baseline、external edit conflict、edit safety state、approval invalidation、suggestion invalidation、revalidation result、protected ledger envelope |
| Inline Review / Humanizer | inline suggestion、diff hunk、near-text action、style report |
| Creative Engine / ReaderPanel | cardinal rule report、narrative report、reader persona report、aggregation summary |
| Knowledge / Identity | entity governance proposal、alias status、merge/split preview、obligation list item |
| Provider / Budget | prompt budget envelope、provider failure envelope、embedding capability envelope、context overflow envelope |
| Trace / Recap | trace step、developer detail envelope、S15 projection payload、recap payload、activity item、author note |
| Settings / Onboarding / Project Library | settings patch、danger action request、workspace bootstrap result、project list item |
| platform/Ixx/Rxx | provider capability, adapter event, manual copy acknowledgement, migration result, diagnostic bundle manifest |

## 边界

schema 可在 appendix 细化;但如果某个字段缺失会改变 retry、approval、阻断级风险、内部恢复或用户可见风险,根层 spec 必须点名该字段的行为意义。
