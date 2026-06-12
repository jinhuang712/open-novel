# TODO · 活跃验证、裁决与文档修复项

截至 2026-06-13,本文件保留仍需真实运行数据、用户裁决或跨文档修复才能关闭的活跃项。P009 全量审计的完整证据与改法见 [P009](./progress/P009-pre-implementation-audit.md);2026-06-13 并行复审新增项已按主权归口写入本表。已关闭条目从本表移除并记入 [CHANGELOG](./CHANGELOG.md)。仍保留的每项都写明主权文档、为什么不能直接关闭、以及关闭条件。若出现需要用户先选方向的条目,会标【裁决】。

## P1 · 运行时门禁与生命周期

| ID | 问题 | 关联文档 | 为什么不能直接关闭 | 关闭条件 |
|---|---|---|---|---|
| TODO-P1-22 | Tauri 壳内 sidecar 执行宿主中的同步 SQLite/native binding 与 stream channel 调度隔离已补 V03 测量入口,但仍缺真实阻塞时长结果:重 reindex/向量批量写是否冻结事件投递尚未实测(P009·PL-04)。 | [V03](./spec/appendix/V03-external-spikes.md) · [S14](./spec/S14-project-storage.md) · [S05](./spec/S05-knowledge-graph.md) · [S04](./spec/S04-streaming-ui-protocol.md) | P1-42 已裁决为桌面壳常驻执行宿主(壳=Tauri 已裁决,宿主以 Tauri 管理的 sidecar 进程承载),V03/V01/S05 已定义测量和降级口径;剩余是真实运行数据,不能靠文档关闭。 | 执行 V03「stream during heavy SQLite/reindex」spike,记录 stream 心跳延迟、UI 事件投递、host CPU 和隔离需求;若超阈值,回写 S06/S05 的 worker thread/独立进程/分片让步约束后关闭。 |
| TODO-P1-43 | 核心能力成立性 gate 已落文档,但仍缺真实 50–100 万字语料或等价 fixture 的 spike 结果:影响分析召回率/精确率、分段 delta 稳定性、全书级 cascade 成本与延迟尚未实测(2026-06-12 架构评审)。 | [S06](./spec/S06-context-management.md) · [S05](./spec/S05-knowledge-graph.md) · [S11](./spec/S11-creative-engine.md) · [V03](./spec/appendix/V03-external-spikes.md) · [V02](./spec/appendix/V02-golden-cases.md) | V03/S07/S06/S12/V02 已把 gate、fixture 和不达标降级写清;剩余是外部事实证据,不能靠文档关闭。 | 执行 V03 的 long-form impact recall/precision、segmented delta stability、cascade cost/latency spike;将结果回写 S07/S06/S12/V02,若不达标则选择裁判链重设计、承诺收窄或分批 cascade 后关闭。 |

## P1 · 待用户裁决

| ID | 问题 | 关联文档 | 为什么不能直接关闭 | 关闭条件 |
|---|---|---|---|---|
| TODO-P1-45【裁决】 | Planning Mode 与 Writing Mode 的正文连带边界需要定方向:规划模式强调不碰正文,但设定 cascade 又允许称谓、段落等正文连带项同批审批。 | [plan/07](./plan/07-collaboration-and-modes.md) · [plan/08](./plan/08-approval-and-cascade.md) · [M05](./spec/M05-planning-mode.md) · [M06](./spec/M06-writing-mode.md) · [S03](./spec/S03-turn-orchestration.md) | 这会影响 R3 三模式红线和 cascade 产品心智。可选方向至少有两类:机械称谓/引用同步作为规划 cascade 的受控正文连带项;或规划只审定设定,正文修复一律拆到 Writing。需要用户裁决产品边界。 | 用户裁决正文连带项归属后,同步修订 plan/07、plan/08、M05、M06、S03,并补 V01/M08 对应验收。 |
| TODO-P1-46【裁决】 | pending approval 期间能否启动新的只读/写入任务需要定方向:M04/M05 禁止新可写动作和模式切换,M08 又允许多张 pending 卡,M02 未说明 ReaderPanel 在 pending 下能否运行。 | [M02](./spec/M02-command-palette-and-quick-open.md) · [M04](./spec/M04-discuss-mode.md) · [M05](./spec/M05-planning-mode.md) · [M08](./spec/M08-approval-cascade.md) · [S03](./spec/S03-turn-orchestration.md) | 这决定工作台在待审卡存在时是只允许查看历史内容,还是允许生成新的只读报告/排队任务。不同选择会改变队列、模式锁和 recap 语义。 | 用户裁决 pending 下允许的动作集合后,补 S03 队列规则、M02 命令可用性、M04/M05/M08 的 pending 投影和 V01 验收。 |
| TODO-P1-47【裁决】 | Discuss Mode 中的明确反馈是否可沉淀为经验需要定方向:S03 禁止 Discuss 经验沉淀,S01/S11 又允许作者明确反馈或风险反馈进入经验候选。 | [S01](./spec/S01-runtime-state.md) · [S03](./spec/S03-turn-orchestration.md) · [S11](./spec/S11-creative-engine.md) · [M12](./spec/M12-memory-learning-management.md) | 如果完全禁止,讨论中的"以后少用排比"不能被记住;如果允许,需要防止纯讨论被自动学习。需要裁决显式"记住"是否作为 Discuss 的例外入口。 | 用户裁决后,同步修订 S01/S03/S11/M12 和 V01 memory/Reflector 验收。 |
| TODO-P1-48【裁决】 | P010 实施计划的归属需要定方向:progress 规则说 progress 只做历史档案,但 P010 写明会随实现进度勾选,承担 active checklist。 | [progress/README](./progress/README.md) · [P010](./progress/P010-implementation-plan.md) · [WORKFLOW](./WORKFLOW.md) | 这会影响 TODO、CHANGELOG、progress 的职责边界。可选方向是把 P010 改成一次性实施计划快照,或把 active checklist 迁出 progress 成为独立实施跟踪文档。 | 用户裁决后,修订 P010/progress README/README 导航和后续阶段更新规则。 |
| TODO-P1-59【裁决/待讨论】 | Append-only apply journal 的产品/技术语义需要解释并裁决:用户不理解它为什么存在、作者能看见什么、崩溃后如何恢复、它与普通保存/撤销/recap 的关系是什么。 | [S14](./spec/S14-project-storage.md) · [S03](./spec/S03-turn-orchestration.md) · [S04](./spec/S04-streaming-ui-protocol.md) · [M17](./spec/M17-turn-recap-and-continuation.md) · [A01](./spec/appendix/A01-schema-tables.md) · [V01](./spec/appendix/V01-test-matrix.md) | 用户已明确要求继续讨论,不能把 append-only apply journal 当作本轮可直接关闭的技术实现项;需要先把落盘、崩溃恢复、用户可见回执和历史语义讲成用户能理解的方案。 | 给出用户能理解的落盘崩溃恢复方案,说明哪些内容已写入、哪些内容可恢复、哪些内容需要人工确认、recap 如何呈现;经用户确认后再同步 S14/S03/S04/M17/A01/V01 并关闭。 |
| TODO-P1-60【裁决/待讨论】 | `facts-degraded` 模式的产品/技术语义需要解释并裁决:它是否应该作为独立模式存在、何时进入、用户看到什么、哪些写入要阻断、与 index degraded / R04 重建 / 作者文件优先的关系是什么。 | [S14](./spec/S14-project-storage.md) · [R04](./spec/platform/R04-index-health-and-repair.md) · [R01](./spec/platform/R01-project-lifecycle.md) · [A01](./spec/appendix/A01-schema-tables.md) · [V01](./spec/appendix/V01-test-matrix.md) | 用户已明确表示“不明白在干嘛,记入 TODO 作为待讨论”。如果继续把它写成已定模式,会让实现直接固化未确认恢复体验。 | 给出更容易理解的项目事实库损坏恢复方案,说明与索引损坏的区别、作者文件如何取用、是否允许继续写、恢复后哪些历史会丢失;经用户确认后同步 S14/R04/R01/A01/V01 并关闭。 |

## P1 · 文档主权修复

| ID | 问题 | 关联文档 | 为什么不能直接关闭 | 关闭条件 |
|---|---|---|---|---|
| TODO-P1-51 | light apply、Humanizer/inline accept 与 editor undo 的边界不够闭合:S14 要写入记录和 forward-only 反向 apply,S13/S14 容易被读成已入账 AI 替换可普通 editor undo。 | [S14](./spec/S14-project-storage.md) · [S12](./spec/S12-style-and-humanizer.md) · [S13](./spec/S13-editor-and-interaction.md) · [V01](./spec/appendix/V01-test-matrix.md) | S14 已有主权方向,无需裁决;需要把编辑器本地 undo 与 committed 后反向 light apply 区分写清。 | S13/S14 增加"提交前 undo bridge / 提交后 forward-only reverse apply"规则,并补 V01 场景。 |
| TODO-P1-53 | M16 对多项目隔离缺少验收:README 承诺多项目并行且数据互不污染,但切换项目时 active turn、pending approval、recent/runtime history、样例项目隔离规则不足。 | [README](./README.md) · [M16](./spec/M16-project-library-and-navigation.md) · [M01](./spec/M01-universal-search.md) · [M15](./spec/M15-onboarding-and-new-book.md) · [V01](./spec/appendix/V01-test-matrix.md) | 跨项目隔离是既定承诺,无需裁决;缺的是切换/恢复/失败收场和测试矩阵。 | M16 增补项目切换契约、recent/history project 分桶、sample/真实项目隔离、pending/active turn 收场;V01 加验收。 |

## P2 · 同步与体验优化

| ID | 问题 | 关联文档 | 为什么不能直接关闭 | 关闭条件 |
|---|---|---|---|---|
| TODO-P2-25 | S05/S07 需要补交叉映射说明:S05 pipeline phase、R04 health、S03/S04 用户投影术语未成表;S05 的事实优先级图容易把共同真源读成简单上下级;S07 prompt 层级图需说明它不推翻 S01/S06 的上下文取舍优先级。 | [S05](./spec/S05-knowledge-graph.md) · [S07](./spec/S07-prompt-system.md) · [S01](./spec/S01-runtime-state.md) · [S06](./spec/S06-context-management.md) · [R04](./spec/platform/R04-index-health-and-repair.md) | 术语可理解但实现容易分叉,属于解释性补强。 | S05 增加 phase→health→UI 投影表和事实来源/冲突处理表;S07 补安全结构层级 vs context 取舍优先级说明。 |
| TODO-P2-26 | 设计文档和原型存在若干一致性/可访问性优化:Settings 导航仍写 9 section 而实际 12;`--dur-med` 未定义;按钮 kbd 硬编码 rgba;高对比度 token 无 Settings UI;ReaderPanel 空态和段落定位演示不足;主界面审批卡关闭缺焦点恢复演示。 | [design/README](./design/README.md) · [design/00](./design/00-design-tokens.md) · [design/01](./design/01-main-layout.md) · [design/03](./design/03-reader-panel.md) · [design/04](./design/04-settings.md) · `design/prototypes/index.html` | 不阻塞架构,但会影响原型作为交互验收样例的可靠性。 | 统一 12 section,修 token/硬编码颜色,补高对比开关、ReaderPanel 空态和段落定位演示、主界面审批卡焦点恢复。 |

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
