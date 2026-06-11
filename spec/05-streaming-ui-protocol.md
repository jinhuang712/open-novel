# 05 · Streaming UI Protocol

这篇只管“用户如何看见系统正在做什么”。它不是业务状态源,也不是调试日志全集。Streaming UI Protocol 的职责是把持久 turn 状态和过程事件翻译成可恢复、可去重、不过度打扰写作的前端反馈。

## 驾驶舱原则

UI 像驾驶舱,不是黑盒日志流。

| UI 元素 | 承担什么 | 不承担什么 |
|---|---|---|
| 状态点 | 当前 turn 的粗状态:空闲、运行、待审批、错误 | 细节日志 |
| Trace | 系统做过的关键步骤和诊断证据 | 业务真相 |
| 审批卡 | 用户需要审定的具体变更 | 自动写入许可 |
| 错误提示 | 失败原因和可恢复动作 | 技术栈堆栈全文 |

真正的业务结果来自 [04](./04-turn-orchestration.md) 和 [01](./01-project-storage.md)。事件流只是把这些结果展示出来。

## 一条事件如何抵达 UI

```mermaid
sequenceDiagram
  participant O as Orchestrator
  participant H as Session History
  participant Bus as Stream Channel
  participant UI as Frontend

  O->>H: 写入 step/trace 证据
  O->>Bus: emit event
  Bus-->>UI: progress/output/control/diagnostic
  UI->>UI: 去重、排序、渲染
  UI->>O: 需要恢复时读取持久 turn 状态
```

事件可以丢、重复、乱序。持久 turn 状态不能丢。前端每次恢复都以持久状态校正自己。

## 事件分层

| 层 | 例子 | UI 展示 |
|---|---|---|
| progress | routing、querying、generating、reindexing | 状态点和短句 |
| output | 草稿文本片段、报告摘要、查询结果 | 正文/面板可见内容 |
| control | awaiting approval、completed、cancel requested、retry available | 审批卡、按钮、状态切换 |
| diagnostic | tool run、LLM call、JSON retry、成本、错误 | Trace / Developer Mode |

完整字段进 appendix。根层要求每个事件都能关联 project、turn、step 或 trace 身份,否则无法去重和恢复。

## 状态点映射

```mermaid
stateDiagram-v2
  [*] --> Idle
  Idle --> Running: active turn starts
  Running --> AwaitingApproval: pending ChangeSet
  AwaitingApproval --> Running: user accepts, applying
  Running --> Idle: completed
  AwaitingApproval --> Idle: rejected/cancelled
  Running --> Error: failed
  AwaitingApproval --> Error: approval invalidated/apply failed
  Error --> Idle: dismissed after safe state
```

状态点不能从单个 progress event 推断最终结果。它读取 turn 状态,事件只触发刷新。

## 流式输出的红线

| 内容 | 能否流式展示 | 何时进入业务状态 |
|---|---|---|
| 讨论文本 | 可以 | 展示即可 |
| 章节草稿 | 可以展示为草稿流 | 完整结果通过校验后 |
| JSON 分析 | 不逐字展示 | schema 和业务校验通过后 |
| ChangeSet | 不展示半成品为审批 | ChangeSet 完整可解释后 |
| 错误 | 可以即时提示 | 持久状态确认后 |

“正在分析”是合法 UI;“半截 JSON 被当作报告”不是。

## 断线恢复流程

```mermaid
flowchart TD
  Disconnect[stream 断开] --> Mark[UI 标记恢复中]
  Mark --> Load[读取 project + active turn]
  Load --> State{持久状态}
  State -->|running| Resub[重新订阅事件]
  State -->|awaiting approval| Approval[恢复审批卡]
  State -->|completed| Result[读取完成结果]
  State -->|failed| Error[展示失败]
  State -->|unknown| Safe[停止危险展示,提示缺口]
  Resub --> Dedupe[按 event/step 身份去重]
```

恢复不会重跑 Agent,也不会重新提交用户输入。它只恢复展示和后续订阅。

## Trace 的可读性约定

Trace 不是越多越好。每条 trace 应能回答一个问题:

| 问题 | Trace 应展示 |
|---|---|
| 系统现在在干什么 | 当前 step 和 Agent 角色 |
| 为什么拿这些上下文 | context package 来源摘要 |
| 为什么这些段落受影响 | impact analysis 来源 |
| 为什么失败 | 工具/模型/schema/存储的失败点 |
| 哪些能力降级 | 索引过期、语义召回不可用、日志缺失 |

Developer Mode 可以看更多诊断,但普通 Trace 应服务作者理解,不是堆内部字段。Trace 作为用户可读产品能力的完整闭环见 [14 · Trace Observability](./14-trace-observability.md)。

## 事件事故处理

| 事故 | UI 处理 |
|---|---|
| 事件重复 | 按身份去重,不重复插入文本或审批 |
| 事件乱序 | 临时排序,最终以持久状态校正 |
| stream 断开 | 进入恢复流程 |
| Trace 写入失败 | 展示诊断不完整 |
| awaiting approval 到达 | 停止“自动运行中”的文案 |
| cancel requested | 显示正在取消,等待 turn 最终状态 |

## FAQ

**Q: 为什么事件流不能当事实源?**

A: 因为浏览器可能刷新、断线、重复接收事件。业务结果必须在持久 turn 和存储状态中。

**Q: 用户能不能看到所有 tool call?**

A: 普通 Trace 只展示有解释价值的步骤;Developer Mode 可以展示更细诊断。

**Q: running 状态下可以显示文本吗?**

A: 可以,但文本是运行中的输出片段。它是否成为草稿、报告或审批内容,取决于完整校验后的结果。

**Q: 断线后要不要自动重试生成?**

A: 不默认重试。先恢复 turn 状态;只有用户明确重试或状态允许时才重跑。

**Q: 错误提示应该技术化还是产品化?**

A: 普通 UI 解释用户能采取什么动作;技术细节归 Trace/Developer Mode。

## Appendix

- [appendix/event-catalog](./appendix/event-catalog.md) 保存事件枚举、字段和订阅明细。
- [appendix/testing-matrix](./appendix/testing-matrix.md) 保存断线、恢复、重复事件和错误展示验证项。
