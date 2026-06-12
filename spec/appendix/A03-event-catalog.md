# A03 · Event Catalog

本 appendix 是事件枚举、字段、去重键、状态版本和前端订阅细节的归口。根层 spec 定义事件服务哪条用户路径,以及事件不能替代持久状态。

## 归口内容

- stream progress / output / control / diagnostic 事件字段。
- turn lifecycle 事件。
- approval、cancel、internal recovery 事件。
- apply journal、light apply、mode gate、interrupted run、manual recovery 事件。
- approval queue、approval invalidated、obligation opened/resolved/invalidated、rejection redo 事件。
- recap created、author note added、correction requested、continuation selected 事件。
- trace、tool run、LLM call、cost、canonical agent role 事件。
- Universal Search open/result/preview/action 事件。
- editor、inline review、query、command、focus、Discuss Mode、ReaderPanel 事件。
- 事件去重、乱序恢复和断线重连规则。

## 对应核心文档

- [S04 Turn Orchestration](../S04-turn-orchestration.md)
- [S05 Streaming UI Protocol](../S05-streaming-ui-protocol.md)
- [S14 Editor And Interaction](../S14-editor-and-interaction.md)
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
| Turn / Journal / Recovery | apply prepared/file-applied/committed、light apply accepted、mode changed/blocked、run interrupted、manual recovery opened |
| Approval / Cascade | changeset created、approval opened/closed、decision submitted、internal recovery needed、reindex state changed、apply failed/degraded |
| Approval Queue / Obligation | approval enqueued、approval focused、approval invalidated、obligation opened/snoozed/resolved/dismissed/invalidated、redo requested |
| Search / Command / Query | search opened、query submitted、preview requested、result action selected、command executed |
| Inline Review / Editor | selection captured、suggestion rendered、near-text action selected、editor replace applied、undo bridge recorded |
| Trace / Recap / Activity | trace step appended、developer detail attached、recap created、author note added、continuation selected |
| Memory / Reflector / Agent Controls | learning candidate created、learning accepted/muted/deleted、agent toggled、tier changed |
| Settings / Onboarding / Library | settings saved、danger action confirmed、workspace initialized、project opened/closed |
| platform/Ixx/Rxx | provider capability checked、watcher event received、import/export completed、backup/restore completed、migration/repair job updated、diagnostics exported |

## Agent role id 事件约束

所有 Agent 相关事件的 `role_id` 必须取自 M13 canonical id:`router`、`writer`、`checker`、`validator`、`reader_panel`、`humanizer`、`reflector`。事件可以额外带中文展示名,但展示名不能作为去重键、用量归因键或 prompt 名称。

## 去重键

stream 事件是有损通知,不是业务事实源。每条可渲染事件必须带稳定去重身份:

| 字段 | 用途 |
|---|---|
| `project_id` | 隔离项目,防止跨项目事件串扰。 |
| `turn_id` | 归属当前持久 turn。 |
| `attempt_id` | 区分同一 turn 的重试、恢复或重新生成。 |
| `step_id` | 归属一次模型调用、工具调用、审批投影或恢复步骤。 |
| `seq` | step 内递增序号,用于 text delta 和乱序恢复。 |
| `delta_id` | 绑定 step 内 text delta,防止重连后重复拼接。 |
| `event_kind` | 区分 progress、output、control、diagnostic。 |

UI 插入文本、审批项或 Trace 行时必须以这些字段去重。客户端去重键至少由 `project_id + turn_id + attempt_id + step_id + seq + event_kind` 组成;text delta 还必须带 `delta_id`。缺少去重身份的事件只能作为临时诊断,不能改变可见业务状态。乱序或重复事件只能修正 UI 投影,不能替代 S02/S04/S05 的持久状态读取。

## 边界

事件字段可在 appendix 更新;但事件是否改变 turn 结果、审批状态、取消结果或用户可见状态,必须由根层 spec 定义。
