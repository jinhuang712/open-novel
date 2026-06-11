# 05 · Streaming UI Protocol

本文档定义运行过程如何被前端看见。它说明事件流、trace、状态点和审批提示之间的契约,不展开完整事件字段表。

## 职责边界

本篇负责:

- Agent 运行过程的前端可观测性。
- 流式事件、trace 和状态点的关系。
- 错误、重试、待审批等状态如何呈现给 UI。

本篇不负责:

- Agent runner 内部重试策略。
- UI 视觉样式和布局。
- 完整事件 schema。
- 过程日志持久化表结构。

## 主权对象

Streaming UI protocol 拥有:

- 运行事件。
- trace 片段。
- 状态点状态。
- 前端订阅和恢复语义。

它不拥有业务决策。事件只是把运行过程展示出来,不能替代 turn orchestration 的状态判断。

## 输入、输出与依赖

输入是 Agent runner、turn orchestration 和过程历史产生的运行事件。输出是前端可消费的进度、结果、诊断和恢复信号。本篇依赖 turn 状态判断真实结果,依赖 runtime state 补齐断流后的持久过程,并服务 design 中的状态点与 Trace 面板。

## 技术路径

Agent 运行时把关键过程转成事件流。前端通过事件流更新状态点、Trace 面板、审批入口和错误提示。

事件分三类:

- 进度事件:告诉用户系统正在分析、生成、检索或等待。
- 结果事件:交付文本、报告、审批提议或结构化结果。
- 诊断事件:暴露重试、失败、回滚、取消和 trace。

UI 在事件中断后必须能根据持久状态恢复,不能只依赖浏览器内存里的流式片段判断 turn 结果。

## 失败语义

- 事件流断开:前端进入可恢复状态,从 turn 状态和过程历史补齐。
- 事件乱序或重复:以持久状态和事件身份去重。
- JSON 输出失败:展示结构化失败事件,不把半截结果当成功。
- 待审批事件到达:前端停止把该 turn 显示为仍在自动运行。

## 用户可见结果

用户看到一粒状态点、必要时打开 Trace 面板、以及审批卡或错误提示。运行过程透明,但不占据写作主体。

## Appendix 引用

- [appendix/event-catalog](./appendix/event-catalog.md) 维护事件枚举和字段细节。
- [appendix/details/04-streaming-protocol](./appendix/details/04-streaming-protocol.md) 保留旧 streaming protocol 细节。
