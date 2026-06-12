# TODO · 活跃架构审计项

截至 2026-06-12,本文件只保留两轮只读审计与同日架构评审中仍需真实运行数据才能关闭的活跃验证项。P009 全量审计的完整证据与改法见 [P009](./progress/P009-pre-implementation-audit.md);已关闭条目从本表移除并记入 [CHANGELOG](./CHANGELOG.md)。仍保留的每项都写明主权文档、为什么不能直接关闭、以及关闭条件。若出现需要用户先选方向的条目,会标【裁决】。

## P1 · 运行时门禁与生命周期

| ID | 问题 | 关联文档 | 为什么不能直接关闭 | 关闭条件 |
|---|---|---|---|---|
| TODO-P1-22 | 壳内执行宿主中的同步 SQLite/native binding 与 stream channel 调度隔离已补 V03 测量入口,但仍缺真实阻塞时长结果:重 reindex/向量批量写是否冻结事件投递尚未实测(P009·PL-04)。 | [V03](./spec/appendix/V03-external-spikes.md) · [S01](./spec/S01-project-storage.md) · [S06](./spec/S06-knowledge-graph.md) · [S05](./spec/S05-streaming-ui-protocol.md) | P1-42 已裁决为桌面壳常驻执行宿主,V03/V01/S05 已定义测量和降级口径;剩余是真实运行数据,不能靠文档关闭。 | 执行 V03「stream during heavy SQLite/reindex」spike,记录 stream 心跳延迟、UI 事件投递、host CPU 和隔离需求;若超阈值,回写 S06/S05 的 worker thread/独立进程/分片让步约束后关闭。 |
| TODO-P1-43 | 核心能力成立性 gate 已落文档,但仍缺真实 50–100 万字语料或等价 fixture 的 spike 结果:影响分析召回率/精确率、分段 delta 稳定性、全书级 cascade 成本与延迟尚未实测(2026-06-12 架构评审)。 | [S07](./spec/S07-context-management.md) · [S06](./spec/S06-knowledge-graph.md) · [S12](./spec/S12-creative-engine.md) · [V03](./spec/appendix/V03-external-spikes.md) · [V02](./spec/appendix/V02-golden-cases.md) | V03/S07/S06/S12/V02 已把 gate、fixture 和不达标降级写清;剩余是外部事实证据,不能靠文档关闭。 | 执行 V03 的 long-form impact recall/precision、segmented delta stability、cascade cost/latency spike;将结果回写 S07/S06/S12/V02,若不达标则选择裁判链重设计、承诺收窄或分批 cascade 后关闭。 |

## 验证入口

需要真实代码、依赖或运行数据证明的事项不作为游离 TODO 漂浮:

- 测试矩阵和未来工程化测试归 [V01 · Test Matrix](./spec/appendix/V01-test-matrix.md)。
- golden cases 和 LLM 回归样例归 [V02 · Golden Cases](./spec/appendix/V02-golden-cases.md)。
- DeepSeek cache、1M context token 成本、AI SDK loop、SQLite/native binding、watcher、desktop shell、Tailwind/shadcn 映射等外部实查归 [V03 · External Spikes](./spec/appendix/V03-external-spikes.md)。

## 新增规则

只有满足以下任一条件的新问题才允许写入本文件:

- 没有明确 plan/spec/platform/appendix 主权文档。
- 需要用户在多个方向中重新裁决。
- 当前文档无法安全给出契约,只能先保留未知。

写入 TODO 时必须同时说明关联文档、为什么不能直接归口、以及回头关闭条件。
