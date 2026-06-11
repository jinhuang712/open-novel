# Appendix · Event Catalog

本 appendix 索引流式事件、trace 事件、turn 事件和 cascade 过程事件。核心 spec 只定义事件服务于哪条用户可见路径。

## 流式与前端事件

- [details/04-streaming-protocol](./details/04-streaming-protocol.md) 保存流式协议、前端订阅和旧事件细节。

## Turn 与 cascade 事件

- [details/26-cascade-controller](./details/26-cascade-controller.md) 保存 user turn、action 队列、cancel 和 recovery 旧细节。
- [details/06-approval-flow](./details/06-approval-flow.md) 保存审批事件和回滚旧细节。
- [details/07-mode-state-machine](./details/07-mode-state-machine.md) 保存 UI 状态事件旧细节。

## 过程历史事件

- [details/27-session-history](./details/27-session-history.md) 保存 trace、tool run、LLM call 和成本事件旧细节。

## 使用边界

事件字段可以在 appendix 更新;事件是否改变 turn 结果、审批状态或用户可见状态,必须回写核心 spec。
