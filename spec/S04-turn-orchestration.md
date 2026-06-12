# S04 · Turn Orchestration

这篇用一个具体 turn 来解释编排层:作者说“把女主第一次出手的代价改重一点,全书相关地方都同步”。系统不能只把这句话交给模型,也不能边找边改。它必须把意图、影响分析、Agent 输出、审批、落盘、取消和恢复放进同一个生命周期。

## Turn 是一个事务信封

Turn Orchestration 不拥有小说内容,也不拥有模型能力。它拥有的是“这一轮发生了什么”的事务信封。

| 信封里有什么 | 为什么必须在这里 |
|---|---|
| user turn 身份和当前状态 | 刷新、断线、取消后能恢复 |
| Router action | 用户意图被结构化,不能靠下游猜 |
| action queue | 多个动作按顺序执行,避免互相覆盖 |
| cascade 记录 | 连带影响在审批前汇总 |
| ChangeSet | 一次可审定的最小批次 |
| approval lifecycle | pending、accepted、rejected、invalidated 有明确状态 |
| cancel / correction 信息 | 失败或取消后能解释已经发生什么、下一步如何收场 |
| recap trigger | turn 终态后生成用户级变更回执 |

## 一轮复杂修改的泳道

```mermaid
sequenceDiagram
  participant U as 作者
  participant R as Router
  participant O as Orchestrator
  participant Q as Impact/Context
  participant A as Agent Runner
  participant S as Storage
  participant K as Knowledge Graph
  participant UI as UI Stream

  U->>O: 提交修改意图
  O->>R: 路由
  R-->>O: structured actions
  O->>Q: 影响分析
  Q->>K: 查实体、关系、锚点、依赖
  K-->>Q: 候选范围
  Q->>A: 复核候选并生成修改提议
  A-->>O: ChangeSet proposal
  O->>UI: awaiting approval
  U->>O: 审批决定
  alt accepted
    O->>S: apply ChangeSet
    S->>K: reindex
    O->>UI: completed / degraded
  else rejected or cancelled
    O->>UI: closed without write
  end
```

cascade 在审批前完成。审批后才进入存储写入。用户必须一次看到“这批改动为什么放在一起”。

## 生命周期状态机

```mermaid
stateDiagram-v2
  [*] --> Received
  Received --> Routed
  Routed --> Running
  Running --> GatheringImpact
  GatheringImpact --> GeneratingProposal
  GeneratingProposal --> AwaitingApproval
  GeneratingProposal --> Completed: read-only answer/report
  Running --> StoppedNoChange: cancel before durable change
  GatheringImpact --> StoppedNoChange: cancel before durable change
  GeneratingProposal --> StoppedNoChange: cancel before durable change
  AwaitingApproval --> Applying: accepted
  AwaitingApproval --> Rejected: rejected
  AwaitingApproval --> CancelPlan: cancel requested
  Applying --> CancelPlan: cancel requested
  CancelPlan --> Cancelled: user confirms
  CancelPlan --> AwaitingApproval: keep pending
  CancelPlan --> ManualRecovery: unsafe to auto-resolve
  Applying --> Reindexing
  Reindexing --> Completed
  StoppedNoChange --> Recap
  Cancelled --> Recap
  Rejected --> Recap
  Completed --> Recap
  Running --> Failed
  GatheringImpact --> Failed
  GeneratingProposal --> Failed
  Applying --> Failed
  Failed --> Recoverable
  Failed --> Terminal
```

状态机不是 UI 动画。它是恢复和并发控制的业务事实。前端状态点只是它的投影。

## Router 只产出动作

Router 的职责是把自然语言意图变成结构化 action,例如讨论、写章、改设定、查询、取消或打开审批。Router 不做这些事。

| Router 输出 | 编排层判断 |
|---|---|
| 只读回答 | 可以并行或直接调用 Agent |
| 查询 | 走 fact query,不改变作品 |
| 写作/改写 | 需要上下文、Agent、proposal |
| 设定变更 | 需要 impact analysis 和审批 |
| 取消 | 进入统一 cancel 语义 |
| 非法 action | turn 失败,不让下游猜 |

Discuss Mode 是 Router action 中最严格的只读分支,详见 [M04 · Discuss Mode](./M04-discuss-mode.md)。它可以讨论、解释和建议,但不能生成可落盘 ChangeSet。

## ChangeSet 的最小 anatomy

| 部件 | 用途 |
|---|---|
| intent | 用户原始意图的结构化摘要 |
| affected items | 受影响文件、段落、实体、概念或依赖 |
| proposed edits | 候选修改内容 |
| rationale | 为什么这些地方一起改 |
| risks | 守则、事实冲突、低置信项 |
| preconditions | 文件版本、锚点、索引健康度 |
| correction hints | 已生效后如何生成反向修正 |
| dependency groups | 哪些 item 必须同批生效,哪些可以独立裁决 |
| residual obligations | 用户搁置或拒绝后仍需后续处理的影响项 |

完整 schema 在 appendix;根层只强调 ChangeSet 必须能被用户看懂、能被存储层应用、能被失败流程恢复。

## 部分通过的事务边界

部分通过只允许发生在相互独立的 dependency group 之间。一个 primary change 与维持世界一致所必需的事实、称谓、锚点、伏笔或守则修正属于同一个 atomic group;用户不能只接受主修改而搁置必需一致性项。

| 裁决 | 编排语义 | 用户可见结果 |
|---|---|---|
| 接受完整 group | group 内 item 同批进入 Applying | 显示为一组已接受修改 |
| 拒绝完整 group | group 内 item 都不落盘 | 记录拒绝理由,可重做或关闭 |
| 搁置独立 item | 生成 residual obligation | Recap、Trace 和后续 Validator 都能看到 |
| 搁置触碰 R4 的 item | turn 进入 writing-blocked | 阻止继续写正文,直到解决或明确拒绝理由 |
| 编辑后接受 | 以用户编辑版替代 proposal | 新内容仍需满足 group preconditions |

Residual obligation 不是隐藏 TODO。它是项目状态的一部分:必须带来源、原因、阻断级别、下次检查入口和用户最后裁决。后续 Agent 写作、Validator、ReaderPanel 或 Search 命中相关材料时,都必须把它作为上下文或风险解释的一部分。

## 并发原则

```mermaid
flowchart TD
  NewTurn[新 turn] --> Check{是否会写?}
  Check -->|只读| Parallel[允许并行查询/讨论]
  Check -->|会写| Active{已有 active writable turn?}
  Active -->|否| Start[启动]
  Active -->|是| Gate[排队/阻止/提示先处理]
  Gate --> Pending{是否存在 pending approval?}
  Pending -->|是| Approval[先处理审批<br/>写入锁定]
  Pending -->|否| Queue[等待当前 turn 结束]
```

同一项目同一时间只允许一个可写 turn 进入危险路径。只读查询可以并行,但不能改变 pending 审批或落盘结果。

pending approval 存在时,Orchestrator 必须把项目切成“写入锁定、只读放行”:会写入作品、生成新 ChangeSet、接受跨文档改写、改变模式权限或影响审批前置条件的 action 一律阻止或要求先处理审批;只读查询、搜索、打开文档、Trace 查看和 Discuss 可以继续运行。只读 action 必须读取一致快照或标注当前 pending 状态,不能修改审批卡、自动失效审批或把讨论摘要沉淀为项目事实。

如果项目级 lease 发生变化,当前可写 turn 必须重新确认 owner。失去 lease 的窗口立刻降为只读,不能继续提交审批决定、应用 ChangeSet、生成 recap 或触发 reindex。

## 取消不是 abort

| 取消发生时 | 处理 |
|---|---|
| 还在路由/检索 | 停止运行,记录取消 |
| Agent 正在生成 | 停止流,丢弃未完成输出 |
| 已生成 pending ChangeSet | 标记取消或关闭审批 |
| 已开始写入 | 进入内部恢复或人工处理 |
| 内部恢复不安全 | 停止后续动作,展示不可自动恢复原因 |

所有入口都走同一取消语义:输入条按钮、命令面板、状态点、Router action 和快捷键不允许各自发明一套取消。

运行中且没有 durable change 时,取消不需要二次确认:系统停止剩余工作,保留已完成的只读结果,并生成 stopped recap。只要存在 pending ChangeSet、已开始落盘或内部恢复不安全,Orchestrator 必须生成 cancel plan 让用户确认影响范围。

用户侧不暴露 Git 式回退。所有撤销和恢复都向前追加:撤销一次已落盘修改时,系统生成反向 ChangeSet;恢复到历史内容时,系统基于历史 recap / 快照生成恢复提案。两者都必须经作者审定,不能直接改写项目历史。

Approval Cascade 是 ChangeSet 的用户可见审定模块,详见 [M08 · Approval Cascade](./M08-approval-cascade.md)。本篇定义生命周期,M08 定义审批 UI 必须解释什么。

Turn Recap 是 turn 结束后的用户级 changelog,详见 [M17 · Turn Recap And Continuation](./M17-turn-recap-and-continuation.md)。S04 只负责在正确状态触发 recap,不把 recap 当作品事实源。

## 失败分叉

| 分叉 | 用户看到 | 下游状态 |
|---|---|---|
| Router action 非法 | 无法理解或当前模式不可执行 | 无写入 |
| 影响分析低置信 | 需要确认或扩大审查范围 | ChangeSet 带低置信标记 |
| cascade 不收敛 | 建议拆分或人工确认 | 不继续递归 |
| ChangeSet 生成失败 | 本轮无法生成可审定修改 | 不进入审批 |
| 审批落盘失败 | 接受未生效,可重试/取消 | storage 决定恢复 |
| recovery 缺少状态 | 不重跑危险动作 | 进入人工处理 |

## FAQ

**Q: pending 审批能不能自动过期?**

A: 不能按时间自动过期。只有相关文件、锚点、版本或项目事实变化导致 precondition 不成立时才失效。

**Q: cascade 为什么不能边发现边写?**

A: 因为作者需要一次看全影响范围。边发现边写会让审批失去意义,也让失败收场变复杂。

**Q: 只读查询能不能在写入 turn 运行时并行?**

A: 可以。pending approval 期间也是同一规则:查询、搜索、打开文档、Trace 和只读讨论可以继续,但必须读取一致快照或标记当前待审状态,不能改变正在进行的审批/落盘,也不能生成新的可写 action。

**Q: 失败后能不能让 Router 再跑一次恢复?**

A: 不作为默认恢复。恢复以持久 turn 状态为准,避免重复执行危险动作。

**Q: 阻断级风险来自 Creative Engine 时,谁阻断?**

A: [S12 · Creative Engine](./S12-creative-engine.md) 提供风险;Turn Orchestration 在审批和落盘路径上执行阻断语义。

## Appendix

- [appendix/event-catalog](./appendix/A03-event-catalog.md) 保存 turn、cascade、approval、cancel 事件明细。
- [appendix/json-schemas](./appendix/A02-json-schemas.md) 保存 Router action、ChangeSet 和审批输出 schema。
- [appendix/tool-catalog](./appendix/A04-tool-catalog.md) 保存影响分析和 cascade 工具参数;工具权限和失败语义由 [S09](./S09-agent-tooling-boundary.md) 定义。
