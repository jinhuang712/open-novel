# TODO · 活跃验证、裁决与文档修复项

截至 2026-06-13,本文件保留仍需真实运行数据、用户裁决或跨文档修复才能关闭的活跃项。P009 全量审计的完整证据与改法见 [P009](./progress/P009-pre-implementation-audit.md);2026-06-13 并行复审新增项已按主权归口写入本表。已关闭条目从本表移除并记入 [CHANGELOG](./CHANGELOG.md)。仍保留的每项都写明主权文档、为什么不能直接关闭、以及关闭条件。若出现需要用户先选方向的条目,会标【裁决】。

## P1 · 运行时门禁与生命周期

| ID | 问题 | 关联文档 | 为什么不能直接关闭 | 关闭条件 |
|---|---|---|---|---|
| TODO-P1-22 | Tauri 壳内 sidecar 执行宿主中的同步 SQLite/native binding 与 stream channel 调度隔离仍缺可运行 spike harness:当前仓库尚无应用工程、sidecar、SQLite/native binding、重 reindex workload 或 stream heartbeat 测量命令,无法实测重 reindex/向量批量写是否冻结事件投递(P009·PL-04)。 | [V03](./spec/appendix/V03-external-spikes.md) · [S14](./spec/S14-project-storage.md) · [S05](./spec/S05-knowledge-graph.md) · [S04](./spec/S04-streaming-ui-protocol.md) | P1-42 已裁决为桌面壳常驻执行宿主(壳=Tauri 已裁决,宿主以 Tauri 管理的 sidecar 进程承载),但真实测量需要工程代码、workload 和指标采集;不能靠文档关闭。 | 先建立 V03「stream during heavy SQLite/reindex」最小 harness:sidecar/等价宿主、SQLite WAL/native binding、重 reindex/embedding/checkpoint workload、stream heartbeat/UI event 延迟采集和结果记录格式;随后运行 spike,记录 stream 心跳延迟、UI 事件投递、host CPU 和隔离需求;若超阈值,回写 S06/S05 的 worker thread/独立进程/分片让步约束后关闭。 |
| TODO-P1-43 | 核心能力成立性 gate 已落文档,但仍缺 long-form fixture/harness 和真实 spike 结果:当前仓库尚无 50–100 万字语料或等价 fixture、注入变更集、召回/精确率/稳定性/耗时测量命令,无法证明全书级影响分析、分段 delta 和 cascade 成立性。 | [S06](./spec/S06-context-management.md) · [S05](./spec/S05-knowledge-graph.md) · [S11](./spec/S11-creative-engine.md) · [V03](./spec/appendix/V03-external-spikes.md) · [V02](./spec/appendix/V02-golden-cases.md) | V03/S07/S06/S12/V02 已把 gate、fixture 和不达标降级写清;剩余是外部事实证据和可运行 harness,不能靠文档关闭。 | 建立 long-form fixture/harness 后分步关闭:1) 准备跨卷/跨章节/伏笔/别名/关系/世界规则 fixture 与注入变更集;2) 跑 impact recall/precision 并记录 V03;3) 跑 segmented delta stability 并记录 V03;4) 跑 cascade cost/latency spike 并回写 V02/S05/S06/S11。 |

## P1 · 待用户裁决

| ID | 问题 | 关联文档 | 为什么不能直接关闭 | 关闭条件 |
|---|---|---|---|---|
| TODO-P1-47【裁决】 | Discuss Mode 中的明确反馈是否可沉淀为经验需要定方向:S03 禁止 Discuss 经验沉淀,S01/S11 又允许作者明确反馈或风险反馈进入经验候选。 | [S01](./spec/S01-runtime-state.md) · [S03](./spec/S03-turn-orchestration.md) · [S11](./spec/S11-creative-engine.md) · [M12](./spec/M12-memory-learning-management.md) | 如果完全禁止,讨论中的"以后少用排比"不能被记住;如果允许,需要防止纯讨论被自动学习。需要裁决显式"记住"是否作为 Discuss 的例外入口。 | 用户裁决后,同步修订 S01/S03/S11/M12 和 V01 memory/Reflector 验收。 |
| TODO-P1-48【裁决】 | P010 实施计划的归属需要定方向:progress 规则说 progress 只做历史档案,但 P010 写明会随实现进度勾选,承担 active checklist。 | [progress/README](./progress/README.md) · [P010](./progress/P010-implementation-plan.md) · [WORKFLOW](./WORKFLOW.md) | 这会影响 TODO、CHANGELOG、progress 的职责边界。可选方向是把 P010 改成一次性实施计划快照,或把 active checklist 迁出 progress 成为独立实施跟踪文档。 | 用户裁决后,修订 P010/progress README/README 导航和后续阶段更新规则。 |
| TODO-P1-59【裁决/待讨论】 | Append-only apply journal 的产品/技术语义需要解释并裁决:用户不理解它为什么存在、作者能看见什么、崩溃后如何恢复、它与普通保存/撤销/recap 的关系是什么。 | [S14](./spec/S14-project-storage.md) · [S03](./spec/S03-turn-orchestration.md) · [S04](./spec/S04-streaming-ui-protocol.md) · [M17](./spec/M17-turn-recap-and-continuation.md) · [A01](./spec/appendix/A01-schema-tables.md) · [V01](./spec/appendix/V01-test-matrix.md) | 用户已明确要求继续讨论,不能把 append-only apply journal 当作本轮可直接关闭的技术实现项;需要先把落盘、崩溃恢复、用户可见回执和历史语义讲成用户能理解的方案。 | 给出用户能理解的落盘崩溃恢复方案,说明哪些内容已写入、哪些内容可恢复、哪些内容需要人工确认、recap 如何呈现;经用户确认后再同步 S14/S03/S04/M17/A01/V01 并关闭。 |
| TODO-P1-60【裁决/待讨论】 | `facts-degraded` 模式的产品/技术语义需要解释并裁决:它是否应该作为独立模式存在、何时进入、用户看到什么、哪些写入要阻断、与 index degraded / R04 重建 / 作者文件优先的关系是什么。 | [S14](./spec/S14-project-storage.md) · [R04](./spec/platform/R04-index-health-and-repair.md) · [R01](./spec/platform/R01-project-lifecycle.md) · [A01](./spec/appendix/A01-schema-tables.md) · [V01](./spec/appendix/V01-test-matrix.md) | 用户已明确表示“不明白在干嘛,记入 TODO 作为待讨论”。如果继续把它写成已定模式,会让实现直接固化未确认恢复体验。 | 给出更容易理解的项目事实库损坏恢复方案,说明与索引损坏的区别、作者文件如何取用、是否允许继续写、恢复后哪些历史会丢失;经用户确认后同步 S14/R04/R01/A01/V01 并关闭。 |

## P0 · 设计原型覆盖

| ID | 问题 | 关联文档 | 为什么不能直接关闭 | 关闭条件 |
|---|---|---|---|---|
| TODO-P0-01 | 界面原型需要覆盖所有关键交互分支,且作者界面不得暴露 `.md`、相对路径、文件夹结构或任何存储实现细节:当前 design/prototypes 只覆盖主路径和部分状态,不足以让用户逐页检查 pending、错误、空态、降级、确认、取消、恢复、只读锁定、焦点返回、移动端等分支;截图中的“打开 items/luopan.md”这类路径文案必须改为作品对象动作。 | [design/README](./design/README.md) · [design/01](./design/01-main-layout.md) · [design/02](./design/02-approval-cascade.md) · [design/03](./design/03-reader-panel.md) · [design/04](./design/04-settings.md) · [design/05](./design/05-onboarding.md) · [design/06](./design/06-command-palette.md) · `design/prototypes/index.html` | 这是 P0 设计可靠性问题,不能靠文字承诺关闭;需要把交互状态矩阵和真实 HTML 原型逐一补齐,否则用户无法系统性找 UI/交互问题,也会让存储实现泄漏到作者心智里。 | 先建立 design interaction branch matrix,列出每个页面/能力的主态、空态、loading、pending、error、degraded、readonly、confirm、cancel、recovery、focus/mobile 分支;再为每个分支补可打开的 HTML 原型或同页状态切换,更新原型索引;所有作者可见文案必须只显示作品对象名、章节名、设定名、动作名,不得出现 `.md`、相对路径或存储目录;最后用静态检查和浏览器抽查确认所有分支可访问、无明显重叠/英文残留/断链/存储泄漏。 |

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
