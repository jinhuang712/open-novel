# A03 · Event Catalog

本 appendix 是事件枚举、字段、去重键、状态版本和前端订阅细节的归口。根层 spec 定义事件服务哪条用户路径,以及事件不能替代持久状态。

## 归口内容

- stream progress / output / control / diagnostic 事件字段。
- turn lifecycle 事件。
- approval、cancel、internal recovery 事件。
- recap created、author note added、correction requested、continuation selected 事件。
- trace、tool run、LLM call、cost 事件。
- Universal Search open/result/preview/action 事件。
- editor、inline review、query、command、focus、Discuss Mode、ReaderPanel 事件。
- 事件去重、乱序恢复和断线重连规则。

## 对应核心文档

- [S04 Turn Orchestration](../S04-turn-orchestration.md)
- [S05 Streaming UI Protocol](../S05-streaming-ui-protocol.md)
- [S10 Editor And Interaction](../S10-editor-and-interaction.md)
- [M07 Inline Rewrite And Humanizer](../M07-inline-rewrite-and-humanizer.md)
- [S02 Runtime State](../S02-runtime-state.md)
- [M01 Universal Search](../M01-universal-search.md)
- [M04 Discuss Mode](../M04-discuss-mode.md)
- [M09 Trace Observability](../M09-trace-observability.md)
- [M08 Approval Cascade](../M08-approval-cascade.md)
- [M11 ReaderPanel](../M11-reader-panel.md)
- [M17 Turn Recap And Continuation](../M17-turn-recap-and-continuation.md)

## 实现前事件覆盖矩阵

| 能力/平台 | 事件族 |
|---|---|
| Turn / Stream | turn created、state changed、step started/finished、control emitted、stream recovered |
| Approval / Cascade | changeset created、approval opened/closed、decision submitted、internal recovery needed、reindex state changed |
| Search / Command / Query | search opened、query submitted、preview requested、result action selected、command executed |
| Inline Review / Editor | selection captured、suggestion rendered、near-text action selected、editor replace applied、undo bridge recorded |
| Trace / Recap / Activity | trace step appended、developer detail attached、recap created、author note added、continuation selected |
| Memory / Reflector / Agent Controls | learning candidate created、learning accepted/muted/deleted、agent toggled、budget changed |
| Settings / Onboarding / Library | settings saved、danger action confirmed、workspace initialized、project opened/closed |
| platform/Ixx/Rxx | provider capability checked、watcher event received、import/export completed、backup/restore completed、migration/repair job updated、diagnostics exported |

## 边界

事件字段可在 appendix 更新;但事件是否改变 turn 结果、审批状态、取消结果或用户可见状态,必须由根层 spec 定义。
