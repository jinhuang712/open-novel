# 04 · Turn Orchestration

本文档定义一个用户 turn 如何从意图进入执行、审批、落盘、取消和恢复。它是 cascade、approval、rollback 与 UI 状态切换的主权文档。

## 职责边界

本篇负责:

- user turn 生命周期。
- cascade controller 的职责。
- 审批队列、整批审、回滚和取消语义。
- UI 状态机与运行时编排的边界。

本篇不负责:

- Agent 输出 schema。
- 影响分析算法细节。
- 审批卡视觉设计。
- 数据库字段全表。

## 主权对象

Turn orchestration 拥有:

- user turn。
- action 队列。
- approval 生命周期。
- rollback 语义。
- cascade 运行边界。
- UI 状态进入和退出的触发规则。

Router 只产出动作意图,不直接执行连带修改。状态机只反映 UI 状态,不拥有业务编排。审批 endpoint 只解决审批和回滚请求,不重新解释 Agent 意图。

## 输入、输出与依赖

输入是 Router 动作、Agent 提议、用户审批决定、取消请求和外部冲突信号。输出是 turn 状态、审批队列、落盘命令、rollback 结果和用户可见状态。本篇依赖 agent runtime 产出动作,依赖 project storage 执行写入,依赖 runtime state 记录过程历史。

## 技术路径

一个 turn 的路径是:

1. 用户输入进入 Router。
2. Router 输出动作列表。
3. cascade controller 按动作类型调用对应能力。
4. 需要落盘的结果进入审批队列。
5. 用户整批审定。
6. 被接受的项落盘并触发索引刷新。
7. Reflector 根据已完成 turn 提炼经验。
8. 过程历史记录 trace 和结果。

取消必须落到同一套 rollback 语义。只要 turn 产生了可回滚的已落盘动作,取消就不是简单停止生成,而是进入可解释的撤销路径。

## 审批原则

AI 只提议,作者审定。任何写入作品事实的内容都必须经过审批或用户直接编辑路径,不能由 Agent silent write。

审批没有静默超时。pending 状态持续存在,直到用户处理、turn 被取消、相关文件外部变更导致审批失效,或系统明确回滚。

## 失败语义

- Router 输出非法:turn 失败,用户看到无法理解意图的原因。
- cascade 中途失败:已完成动作可追溯,未完成动作不伪装成功。
- 审批落盘失败:审批不得标记为完成。
- 外部变更命中审批前置状态:审批失效,用户重做。
- rollback 失败:系统保留错误状态和恢复建议,不得继续后续动作。

## 用户可见结果

用户看到当前 turn 处于讨论、规划、写作、待审批、运行、失败或已取消中的哪一种状态。需要用户决定时,系统给出整批审批卡和可理解的影响范围。

## Appendix 引用

- [appendix/event-catalog](./appendix/event-catalog.md) 维护 turn、approval、cascade 事件枚举。
- [appendix/json-schemas](./appendix/json-schemas.md) 维护 Router actions 和审批相关输出 schema。
- [appendix/details/26-cascade-controller](./appendix/details/26-cascade-controller.md) 保留旧 cascade controller 细节。
- [appendix/details/06-approval-flow](./appendix/details/06-approval-flow.md) 保留旧审批流细节。
- [appendix/details/07-mode-state-machine](./appendix/details/07-mode-state-machine.md) 保留旧状态机细节。
