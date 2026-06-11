# 05 · Streaming UI Protocol

本文档定义系统运行过程如何被前端看见。读完本篇应能理解:事件流只是可观测通道,不是事实源;前端如何展示运行、等待审批、错误、取消和恢复;JSON 分析态为什么不能把半成品当成功展示。

## 要解决的问题

Agent 运行时间可能很长,中间会检索、分析、调用工具、生成文本、等待审批或失败。用户需要看见过程,但写作主体不能被日志淹没。因此 Streaming UI Protocol 只做一件事:把真实 turn 状态和过程事件翻译成前端可消费的反馈。

## 主权对象

Streaming UI Protocol 拥有:

- 运行事件。
- 状态点状态。
- Trace 片段。
- 进度事件。
- 审批提示事件。
- 错误、取消和恢复提示。

它不拥有业务结果。turn 是否完成、审批是否生效、作品是否写入,以 [04](./04-turn-orchestration.md) 和 [01](./01-project-storage.md) 的持久状态为准。

## 事件类型

事件分为四类:

| 类型 | 说明 |
|---|---|
| progress | 系统正在路由、检索、生成、分析、reindex |
| output | 文本片段、报告摘要、可展示结果 |
| control | 待审批、取消、恢复、重试、完成 |
| diagnostic | tool run、LLM call、JSON 校验、错误和成本 |

完整字段属于 appendix。根层契约只要求每个事件都能追溯到 turn、step 或 trace 身份,以便去重、恢复和解释。

## UI 状态点

主界面只需要少量状态:

- idle:没有 active turn。
- running:系统正在执行。
- awaiting approval:用户需要审定。
- error:turn 失败或需要人工处理。

状态点来自持久 turn 状态,不是单个流式事件。事件只推动 UI 更新;刷新后 UI 必须能重新从持久状态得到同一结论。

## 流式文本

自然语言输出可以流式展示。结构化分析不能把半截 JSON 逐字展示给用户,也不能在校验前进入业务状态。

当 Agent 需要先分析再给结果时,UI 展示“正在分析”或 Trace 摘要;只有校验通过的结构化结果才能变成报告、ChangeSet 或审批提示。

## Trace

Trace 面板展示过程,不是主界面正文。Trace 可包含:

- 选择了哪个 Agent。
- 装配了哪些上下文来源。
- 调用了哪些工具。
- 哪一步重试或失败。
- 哪些能力降级。
- 大致成本与耗时。

Trace 写入失败不应阻断作品写入,但 UI 应说明本次诊断不完整。

## 断线与恢复

断线后前端不能靠内存继续判断。恢复路径是:

1. 读取当前 project 和 turn。
2. 查询持久 turn 状态。
3. 查询 pending approval 或已完成结果。
4. 根据需要补读 session history 中的 Trace。
5. 重新订阅后续事件。

如果事件重复,以前端可识别的事件身份去重;如果事件乱序,以持久状态为最终判断。

## 取消

取消事件只表示用户请求或系统开始取消。真正取消结果由 turn orchestration 决定。UI 不能在收到 abort 后立刻显示“已取消”并丢弃 pending rollback 状态。

如果取消需要 rollback,UI 必须进入“正在撤销”或“需要处理”的状态。

## 失败语义

| 失败 | UI 行为 |
|---|---|
| stream 断开 | 进入恢复状态,从持久 turn 读取结果 |
| 事件重复 | 去重,不重复渲染审批或文本 |
| 事件乱序 | 按状态版本或持久状态校正 |
| JSON 校验失败 | 展示结构化失败,不展示半成品为结果 |
| Trace 缺失 | 展示诊断不完整 |
| awaiting approval | 停止显示为自动运行中 |

## 用户可见结果

用户看到一粒状态点、必要时打开 Trace、需要时看到审批卡或错误提示。系统过程透明,但不会让日志成为写作主角。

## Appendix

- [appendix/event-catalog](./appendix/event-catalog.md) 保存事件枚举、字段和前端订阅明细。
- [appendix/testing-matrix](./appendix/testing-matrix.md) 保存断线、恢复、重复事件和错误展示验证项。
