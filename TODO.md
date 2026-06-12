# TODO · 活跃架构审计项

截至 2026-06-12,本文件保留两轮只读审计与同日架构评审中尚未关闭的活跃架构缺陷。P009 全量审计的完整证据与改法见 [P009](./progress/P009-pre-implementation-audit.md);已关闭条目从本表移除并记入 [CHANGELOG](./CHANGELOG.md)。仍保留的每项都写明主权文档、为什么不能直接关闭、以及关闭条件。若出现需要用户先选方向的条目,会标【裁决】。

## P0 · 主权与写入链路

| ID | 问题 | 关联文档 | 为什么不能直接关闭 | 关闭条件 |
|---|---|---|---|---|
| TODO-P0-03 | Approval Cascade 设计和原型允许过宽的逐条勾选,可能违反 S04 的 dependency group / atomic group。 | [plan/08](./plan/08-approval-and-cascade.md) · [S04](./spec/S04-turn-orchestration.md) · [M08](./spec/M08-approval-cascade.md) · [design/02](./design/02-approval-cascade.md) · `design/prototypes/02-approval-cascade.html` · [A02](./spec/appendix/A02-json-schemas.md) · [V01](./spec/appendix/V01-test-matrix.md) | design/prototype 仍把 ChangeRow 近似当作可独立勾选项,和原子组语义不完全一致。 | design/prototype 引入 dependency group:必需项成组接受或不可单独取消;独立低置信项才能搁置并生成 residual obligation;schema/test 同步。 |

## P1 · 运行时门禁与生命周期

| ID | 问题 | 关联文档 | 为什么不能直接关闭 | 关闭条件 |
|---|---|---|---|---|
| TODO-P1-22 | 壳内执行宿主中的同步 SQLite/native binding 与 stream channel 调度隔离已补 V03 测量入口,但仍缺真实阻塞时长结果:重 reindex/向量批量写是否冻结事件投递尚未实测(P009·PL-04)。 | [V03](./spec/appendix/V03-external-spikes.md) · [S01](./spec/S01-project-storage.md) · [S06](./spec/S06-knowledge-graph.md) · [S05](./spec/S05-streaming-ui-protocol.md) | P1-42 已裁决为桌面壳常驻执行宿主,V03/V01/S05 已定义测量和降级口径;剩余是真实运行数据,不能靠文档关闭。 | 执行 V03「stream during heavy SQLite/reindex」spike,记录 stream 心跳延迟、UI 事件投递、host CPU 和隔离需求;若超阈值,回写 S06/S05 的 worker thread/独立进程/分片让步约束后关闭。 |
| TODO-P1-29 | S12/M11/V02 已补叙事诊断的章内四维体检、趋势/存档、旧章重跑、单维度重跑和 BeatAnalyzer 主权;剩余是 design 文档与原型仍无对应报告布局和趋势地形图。 | [S12](./spec/S12-creative-engine.md) · [M11](./spec/M11-reader-panel.md) · [V02](./spec/appendix/V02-golden-cases.md) · [design/03](./design/03-reader-panel.md) | M/spec 部分已收口,但用户可见能力还缺 design/prototype 承接。 | design/03 和 ReaderPanel 原型补叙事诊断区块、趋势地形图、旧章/单维度重跑入口后关闭。 |
| TODO-P1-43 | 核心能力成立性 gate 已落文档,但仍缺真实 50–100 万字语料或等价 fixture 的 spike 结果:影响分析召回率/精确率、分段 delta 稳定性、全书级 cascade 成本与延迟尚未实测(2026-06-12 架构评审)。 | [S07](./spec/S07-context-management.md) · [S06](./spec/S06-knowledge-graph.md) · [S12](./spec/S12-creative-engine.md) · [V03](./spec/appendix/V03-external-spikes.md) · [V02](./spec/appendix/V02-golden-cases.md) | V03/S07/S06/S12/V02 已把 gate、fixture 和不达标降级写清;剩余是外部事实证据,不能靠文档关闭。 | 执行 V03 的 long-form impact recall/precision、segmented delta stability、cascade cost/latency spike;将结果回写 S07/S06/S12/V02,若不达标则选择裁判链重设计、承诺收窄或分批 cascade 后关闭。 |

## P2 · 设计闭环与文案边界

| ID | 问题 | 关联文档 | 为什么不能直接关闭 | 关闭条件 |
|---|---|---|---|---|
| TODO-P2-18 | 原型保真度剩余簇:Approval Cascade 的 ApplyFailed/部分失败态仍缺原型演示;影响图谱 hover 联动仍只是文案说明。 | [design/02](./design/02-approval-cascade.md) · `design/prototypes/02-approval-cascade.html` | Settings 搜索交互已与 design/04 对齐;剩余问题集中在审批原型 02 的失败态和图谱联动。 | design/02/prototype 补 ApplyFailed/部分失败态和真实 hover 联动后关闭。 |
| TODO-P2-22 | 体验提升簇(elevation):词级 diff + 同模式聚合(50+ 同质替换可扫读)、persona 近邻色/首字识别、中文排版契约(避头尾/标点悬挂/混排)、自动滚动备份、run 内工具结果缓存、turn 成本预算与 cascade preflight 估算一等化、风格来源分级防 AI 回声室、单条 stale 新鲜度标记(P009·D-12/13/14、S-1、R-2、C-2/C-5、K-3)。 | [design/00](./design/00-design-tokens.md) · [design/02](./design/02-approval-cascade.md) · [design/03](./design/03-reader-panel.md) · [R02](./spec/platform/R02-backup-restore.md) · [S03](./spec/S03-agent-runner.md) · [S09](./spec/S09-agent-tooling-boundary.md) · [S13](./spec/S13-style-and-humanizer.md) · [S04](./spec/S04-turn-orchestration.md) | 非缺陷,但都是把设计从「正确」提到「高级」的杠杆点,集中记录防遗忘。 | 按 P009 §九对应行逐项决定纳入批次;词级 diff 与同模式聚合建议优先(核心场景扫读性)。 |

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
