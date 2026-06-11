# A03 · Event Catalog

本 appendix 是事件枚举、字段、去重键、状态版本和前端订阅细节的归口。根层 spec 定义事件服务哪条用户路径,以及事件不能替代持久状态。

## 归口内容

- stream progress / output / control / diagnostic 事件字段。
- turn lifecycle 事件。
- approval、cancel、rollback、recovery 事件。
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

## 边界

事件字段可在 appendix 更新;但事件是否改变 turn 结果、审批状态、取消结果或用户可见状态,必须由根层 spec 定义。
