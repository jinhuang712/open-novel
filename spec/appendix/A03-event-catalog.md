# A03 · Event Catalog

本 appendix 是事件枚举、字段、去重键、状态版本和前端订阅细节的归口。根层 spec 定义事件服务哪条用户路径,以及事件不能替代持久状态。

## 归口内容

- stream progress / output / control / diagnostic 事件字段。
- turn lifecycle 事件。
- approval、cancel、internal recovery 事件。
- write/apply record、light apply、mode gate、interrupted run、manual recovery 事件。
- approval queue、approval invalidated、obligation opened/resolved/invalidated、rejection redo 事件。
- recap created、author note added、correction requested、continuation selected 事件。
- trace、tool run、LLM call、cost、canonical agent role 事件。
- Universal Search open/result/preview/action 事件。
- editor、inline review、query、command、focus、Discuss Mode、ReaderPanel 事件。
- 事件去重、乱序恢复和断线重连规则。

## 对应核心文档

- [S03 Turn Orchestration](../S03-turn-orchestration.md)
- [S04 Streaming UI Protocol](../S04-streaming-ui-protocol.md)
- [S13 Editor And Interaction](../S13-editor-and-interaction.md)
- [M07 Inline Rewrite And Humanizer](../M07-inline-rewrite-and-humanizer.md)
- [S01 Runtime State](../S01-runtime-state.md)
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
| Turn / Write Record / Recovery | write prepared/file-applied/committed、light apply accepted、mode changed/blocked、run interrupted、manual recovery opened |
| Approval / Cascade | changeset created、approval opened/closed、decision submitted、internal recovery needed、reindex state changed、apply failed/degraded |
| Approval Queue / Obligation | approval enqueued、approval focused、approval invalidated、obligation opened/snoozed/resolved/dismissed/invalidated、redo requested |
| Search / Command / Query | search opened、query submitted、preview requested、result action selected、command executed、light activity recorded |
| Inline Review / Editor | selection captured、suggestion rendered、near-text action selected、editor replace applied、undo bridge recorded |
| Trace / Recap / Activity | trace step appended、developer detail attached、recap created、author note added、continuation selected |
| Memory / Reflector / Agent Controls | learning candidate created、learning accepted/muted/deleted、agent tier/frequency/weight changed |
| Settings / Onboarding / Library | settings saved、danger action confirmed、workspace initialized、project opened/closed |
| platform/Ixx/Rxx | provider capability checked、watcher event received、migration/repair job updated、diagnostics exported |

## Recap / Activity 触发边界

事件流必须区分 UI 事件、轻量 activity 和 turn recap。Search、Quick Open、Command Palette 的本地打开/预览/跳转事件只是 UI 或 recent-state 事件;它们不能写项目 Activity 时间线,也不能触发 `recap created`。Fact Query 是例外:答案展示后写 `light activity recorded`,但不创建 turn recap。

| 触发 | 事件 | 项目 Activity | Recap |
|---|---|---|---|
| Universal Search 打开、输入、preview、结果打开/跳转 | `search opened`、`query submitted`、`preview requested`、`result action selected` | 不写 | 不创建 |
| Quick Open 预览、打开对象或路径 | `result action selected` | 不写 | 不创建 |
| Command Palette 本地 UI 命令 | `command executed` | 不写 | 不创建 |
| Fact Query 展示答案、无来源、stale 或普通失败 | `query submitted`、`light activity recorded` | 写轻量 activity | 不创建 |
| 命令或查询升级为 Agent / ReaderPanel / proposal / 写入 / 审批 | `turn created` 起始的 turn 事件族 | 按 turn 记录 | `recap created` |
| 已进入 turn 的长任务失败、停止、超时或 cancel plan 收口 | `state changed`、必要的 control / diagnostic 事件 | 按 turn 记录 | `recap created` |

## Agent role id 事件约束

所有 Agent 相关事件的 `role_id` 必须取自 M13 canonical id:`router`、`writer`、`checker`、`validator`、`reader_panel`、`humanizer`、`reflector`。事件可以额外带中文展示名,但展示名不能作为去重键、用量归因键或 prompt 名称。

## Turn terminal result 字段约束

所有表示 turn 最终结果的事件字段必须引用 [S03 · Canonical turn terminal enum](../S03-turn-orchestration.md#canonical-turn-terminal-enum),字段建议命名为 `terminal_result` 或 `canonical_turn_terminal_result`。合法值只有:`Completed`、`StoppedNoChange`、`Cancelled`、`Rejected`、`Applied`、`ApplyFailed`、`FailedTerminal`、`Interrupted`、`ManualRecoveryOpened`。

事件可以同时携带本层投影字段,例如 stream status、UI status、write phase、reindex health、runner run state 或 recovery note type;这些字段不能替代 canonical turn terminal result,也不能新增 `success`、`done`、`abandoned`、`errored`、`recovered` 等同义终态。`AwaitingApproval` 只能作为 pending activity/control state,不得写入 terminal result。

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
