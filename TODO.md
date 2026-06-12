# TODO · 活跃架构审计项

截至 2026-06-13,本文件保留仍需真实运行数据、用户裁决或跨文档修复才能关闭的活跃项。P009 全量审计的完整证据与改法见 [P009](./progress/P009-pre-implementation-audit.md);2026-06-13 并行复审新增项已按主权归口写入本表。已关闭条目从本表移除并记入 [CHANGELOG](./CHANGELOG.md)。仍保留的每项都写明主权文档、为什么不能直接关闭、以及关闭条件。若出现需要用户先选方向的条目,会标【裁决】。

## P1 · 运行时门禁与生命周期

| ID | 问题 | 关联文档 | 为什么不能直接关闭 | 关闭条件 |
|---|---|---|---|---|
| TODO-P1-22 | Tauri 壳内 sidecar 执行宿主中的同步 SQLite/native binding 与 stream channel 调度隔离已补 V03 测量入口,但仍缺真实阻塞时长结果:重 reindex/向量批量写是否冻结事件投递尚未实测(P009·PL-04)。 | [V03](./spec/appendix/V03-external-spikes.md) · [S01](./spec/S01-project-storage.md) · [S06](./spec/S06-knowledge-graph.md) · [S05](./spec/S05-streaming-ui-protocol.md) | P1-42 已裁决为桌面壳常驻执行宿主(壳=Tauri 已裁决,宿主以 Tauri 管理的 sidecar 进程承载),V03/V01/S05 已定义测量和降级口径;剩余是真实运行数据,不能靠文档关闭。 | 执行 V03「stream during heavy SQLite/reindex」spike,记录 stream 心跳延迟、UI 事件投递、host CPU 和隔离需求;若超阈值,回写 S06/S05 的 worker thread/独立进程/分片让步约束后关闭。 |
| TODO-P1-43 | 核心能力成立性 gate 已落文档,但仍缺真实 50–100 万字语料或等价 fixture 的 spike 结果:影响分析召回率/精确率、分段 delta 稳定性、全书级 cascade 成本与延迟尚未实测(2026-06-12 架构评审)。 | [S07](./spec/S07-context-management.md) · [S06](./spec/S06-knowledge-graph.md) · [S12](./spec/S12-creative-engine.md) · [V03](./spec/appendix/V03-external-spikes.md) · [V02](./spec/appendix/V02-golden-cases.md) | V03/S07/S06/S12/V02 已把 gate、fixture 和不达标降级写清;剩余是外部事实证据,不能靠文档关闭。 | 执行 V03 的 long-form impact recall/precision、segmented delta stability、cascade cost/latency spike;将结果回写 S07/S06/S12/V02,若不达标则选择裁判链重设计、承诺收窄或分批 cascade 后关闭。 |

## P1 · 待用户裁决

| ID | 问题 | 关联文档 | 为什么不能直接关闭 | 关闭条件 |
|---|---|---|---|---|
| TODO-P1-45【裁决】 | Planning Mode 与 Writing Mode 的正文连带边界需要定方向:规划模式强调不碰正文,但设定 cascade 又允许称谓、段落等正文连带项同批审批。 | [plan/07](./plan/07-collaboration-and-modes.md) · [plan/08](./plan/08-approval-and-cascade.md) · [M05](./spec/M05-planning-mode.md) · [M06](./spec/M06-writing-mode.md) · [S04](./spec/S04-turn-orchestration.md) | 这会影响 R3 三模式红线和 cascade 产品心智。可选方向至少有两类:机械称谓/引用同步作为规划 cascade 的受控正文连带项;或规划只审定设定,正文修复一律拆到 Writing。需要用户裁决产品边界。 | 用户裁决正文连带项归属后,同步修订 plan/07、plan/08、M05、M06、S04,并补 V01/M08 对应验收。 |
| TODO-P1-46【裁决】 | pending approval 期间能否启动新的只读/写入任务需要定方向:M04/M05 禁止新可写动作和模式切换,M08 又允许多张 pending 卡,M02 未说明 ReaderPanel 在 pending 下能否运行。 | [M02](./spec/M02-command-palette-and-quick-open.md) · [M04](./spec/M04-discuss-mode.md) · [M05](./spec/M05-planning-mode.md) · [M08](./spec/M08-approval-cascade.md) · [S04](./spec/S04-turn-orchestration.md) | 这决定工作台在待审卡存在时是只允许查看历史内容,还是允许生成新的只读报告/排队任务。不同选择会改变队列、模式锁和 recap 语义。 | 用户裁决 pending 下允许的动作集合后,补 S04 队列规则、M02 命令可用性、M04/M05/M08 的 pending 投影和 V01 验收。 |
| TODO-P1-47【裁决】 | Discuss Mode 中的明确反馈是否可沉淀为经验需要定方向:S04 禁止 Discuss 经验沉淀,S02/S12 又允许作者明确反馈或风险反馈进入经验候选。 | [S02](./spec/S02-runtime-state.md) · [S04](./spec/S04-turn-orchestration.md) · [S12](./spec/S12-creative-engine.md) · [M12](./spec/M12-memory-learning-management.md) | 如果完全禁止,讨论中的"以后少用排比"不能被记住;如果允许,需要防止纯讨论被自动学习。需要裁决显式"记住"是否作为 Discuss 的例外入口。 | 用户裁决后,同步修订 S02/S04/S12/M12 和 V01 memory/Reflector 验收。 |
| TODO-P1-48【裁决】 | P010 实施计划的归属需要定方向:progress 规则说 progress 只做历史档案,但 P010 写明会随实现进度勾选,承担 active checklist。 | [progress/README](./progress/README.md) · [P010](./progress/P010-implementation-plan.md) · [WORKFLOW](./WORKFLOW.md) | 这会影响 TODO、CHANGELOG、progress 的职责边界。可选方向是把 P010 改成一次性实施计划快照,或把 active checklist 迁出 progress 成为独立实施跟踪文档。 | 用户裁决后,修订 P010/progress README/README 导航和后续阶段更新规则。 |

## P1 · 文档主权修复

| ID | 问题 | 关联文档 | 为什么不能直接关闭 | 关闭条件 |
|---|---|---|---|---|
| TODO-P1-49 | plan 层仍有过满或相互冲突的产品承诺:改设定"全部连锁影响 / 后文零矛盾"超过 R6 与低置信候选边界;ReaderPanel 在 plan/01 中仍像会给发布建议;plan/02 仍承诺"全量推理"可回看;plan/08 拒绝"不留痕"与审批历史留痕混用。 | [plan/01](./plan/01-overview.md) · [plan/02](./plan/02-principles.md) · [plan/04](./plan/04-goals-and-non-goals.md) · [plan/08](./plan/08-approval-and-cascade.md) · [plan/09](./plan/09-narrative-and-reader.md) · [M11](./spec/M11-reader-panel.md) | 主权方向已由 R6、M11、M17 等文档确定,不需要重新裁决;但需要跨 plan/spec 统一措辞,避免实现按过满承诺落地。 | 将 plan 承诺收窄到"确定性影响集合 + 低置信候选"、ReaderPanel 风险信号、不输出发布结论、工作日志/依据引用可回看;拒绝语义改为"不改作品但留审批历史"。 |
| TODO-P1-50 | S04 尚未统一 turn canonical terminal enum,且没有显式吸收 S03/S05 的 interrupted 恢复路径。 | [S03](./spec/S03-agent-runner.md) · [S04](./spec/S04-turn-orchestration.md) · [S05](./spec/S05-streaming-ui-protocol.md) · [S01](./spec/S01-project-storage.md) · [M17](./spec/M17-turn-recap-and-continuation.md) | 这是状态主权修复,方向清楚:同一终态只能由 S04 定义并向 S01/S05/M17 投影。 | S04 增加 canonical turn terminal enum,明确 Completed/Applied/ApplyFailed/Interrupted/ManualRecovery 等映射;S03/S05/M17/A03/V01 同步。 |
| TODO-P1-51 | light apply、Humanizer/inline accept 与 editor undo 的边界不够闭合:S01 要 journal 和 forward-only 反向 apply,S13/S14 容易被读成已入账 AI 替换可普通 editor undo。 | [S01](./spec/S01-project-storage.md) · [S13](./spec/S13-style-and-humanizer.md) · [S14](./spec/S14-editor-and-interaction.md) · [V01](./spec/appendix/V01-test-matrix.md) | S01 已有主权方向,无需裁决;需要把编辑器本地 undo 与 committed 后反向 light apply 区分写清。 | S13/S14 增加"提交前 undo bridge / 提交后 forward-only reverse apply"规则,并补 V01 场景。 |
| TODO-P1-52 | Turn Recap 触发边界不清:M17 说每个 turn 都有 recap,但 M01/M02/M03 的本地搜索、快速打开、事实查询等只读入口是否算 turn 未定义。 | [M17](./spec/M17-turn-recap-and-continuation.md) · [M01](./spec/M01-universal-search.md) · [M02](./spec/M02-command-palette-and-quick-open.md) · [M03](./spec/M03-fact-query.md) · [A03](./spec/appendix/A03-event-catalog.md) | 方向清楚:避免纯本地查询制造活动噪音,同时不能漏掉长任务回执。 | M17 定义 recap/activity 触发矩阵:纯本地打开/搜索不生成 recap;Agent 执行、ReaderPanel、proposal、失败/停止长任务生成 recap;Fact Query 是否只写轻量 activity 明确。 |
| TODO-P1-53 | M16 对多项目隔离缺少验收:README 承诺多项目并行且数据互不污染,但切换项目时 active turn、pending approval、recent/runtime history、样例项目隔离规则不足。 | [README](./README.md) · [M16](./spec/M16-project-library-and-navigation.md) · [M01](./spec/M01-universal-search.md) · [M15](./spec/M15-onboarding-and-new-book.md) · [V01](./spec/appendix/V01-test-matrix.md) | 跨项目隔离是既定承诺,无需裁决;缺的是切换/恢复/失败收场和测试矩阵。 | M16 增补项目切换契约、recent/history project 分桶、sample/真实项目隔离、pending/active turn 收场;V01 加验收。 |
| TODO-P1-54 | README 和 platform 索引对跳号与当前导航不够准确:README 写 `I01-I05`/`R01-R05` 但实际缺 I04/R02;README progress 导航漏 P010;AGENTS/CLAUDE 的提交推送规则与 WORKFLOW 的 subagent 不提交规则冲突。 | [README](./README.md) · [spec/platform/README](./spec/platform/README.md) · [progress/README](./progress/README.md) · [AGENTS](./AGENTS.md) · [CLAUDE](./CLAUDE.md) · [WORKFLOW](./WORKFLOW.md) | 都是导航/章程一致性修复,方向清楚。 | README 改为显式列当前 platform 编号并补 P010;platform README 说明 I04/R02 已撤销/跳号;AGENTS/CLAUDE 写清主会话非只读任务提交,subagent 不提交。 |
| TODO-P1-55 | 已移除的导入/导出/备份恢复能力在 appendix 中仍有残留词,可能把删除能力重新带回 schema/event/test/golden 范围。 | [A01](./spec/appendix/A01-schema-tables.md) · [A02](./spec/appendix/A02-json-schemas.md) · [A03](./spec/appendix/A03-event-catalog.md) · [V01](./spec/appendix/V01-test-matrix.md) · [V02](./spec/appendix/V02-golden-cases.md) · [R05](./spec/platform/R05-diagnostics-and-debug-mode.md) | 用户已裁决不做导入导出和备份恢复,无需再裁决;应只保留诊断包导出和手动复制目录提示。 | 清理 import/export/backup/restore 残留,改为 diagnostic bundle、manual copy acknowledgement、migration result、archive/delete confirmation 等当前能力;docs lint 通过。 |
| TODO-P1-56 | 设计原型的关键交互闭环不足:Settings 原型缺关闭/Esc/dirty protect;Command Palette 原型只处理上下键,缺 Enter/Esc/执行闭环;Quick Open 原型仍写"新 tab",与对照视图契约冲突;Settings 原型仍引用 spec/S15。 | [design/04](./design/04-settings.md) · [design/06](./design/06-command-palette.md) · `design/prototypes/04-settings.html` · `design/prototypes/06-command-palette.html` | 交互契约已在 design Markdown 和 M14/M18/S14 中确定,无需裁决;原型需要跟上。 | 原型补关闭、遮罩、Esc、dirty confirm、Enter/Esc 执行、Focus Trap 演示;Quick Open 文案改对照打开;S15 改 M14/M18。 |
| TODO-P1-57 | Settings 范围裁决已更新:移除 `数据管理` section 及其背后功能;Workspace/项目入口不属于 Settings,应用每次启动先进入项目选择页,主界面左上角提供返回项目选择页入口;`Appearance / 外观` 不应混在 `风格定制`,应拆为独立 section;`ReaderPanel + Persona` 信息量过大,ReaderPanel 评审设置与 Assistant Persona 应拆成独立 section/页面;Agents 不支持关闭,不再提供启用/关闭开关;Rules 页面只展示规则和必要说明,不提供阈值、提示方式、关闭、恢复默认等调参控件。Memory 中的"待确认冲突候选"不应作为 Settings 常驻队列。经验冲突应在发生当场让用户决策,或提供用户可选的"后续自动覆盖 / 自行处理"策略。Memory 经验默认注入 context,不再提供逐条"注入"开关;权重改为 0-5 五档,每档对应描述;来源正常记录即可,不强求每条经验绑定单一来源。 | [README](./README.md) · [plan/06](./plan/06-agent-team.md) · [plan/03](./plan/03-guardrails.md) · [M13](./spec/M13-agent-team-controls.md) · [M14](./spec/M14-settings.md) · [M15](./spec/M15-onboarding-and-new-book.md) · [M16](./spec/M16-project-library-and-navigation.md) · [M12](./spec/M12-memory-learning-management.md) · [S02](./spec/S02-runtime-state.md) · [design/01](./design/01-main-layout.md) · [design/04](./design/04-settings.md) · `design/prototypes/04-settings.html` · [A01](./spec/appendix/A01-schema-tables.md) · [A04](./spec/appendix/A04-tool-catalog.md) · [V01](./spec/appendix/V01-test-matrix.md) | 用户已裁决产品方向,不需要再问。该项影响 Settings 信息架构、项目入口/导航、Agent 控制边界、Rules 设置边界、Memory 冲突处理、危险操作、经验字段、工具清单和验证矩阵,不能只改原型截图。 | 删除 Settings 数据管理入口与对应工具/测试/文案;删除 Settings 中 Workspace/项目管理入口,改为启动项目选择页和主界面左上返回项目选择;新增独立 Appearance section;拆分 ReaderPanel 与 Assistant Persona;Agents 去掉开关,README/plan/06/M13 改为"可调配置但不可关闭";Rules 从调参面板改为只读规则说明;M12/S02 改为冲突发生时即时决策或按用户策略自动处理,不在 Settings 保留待确认冲突队列;经验默认注入,去掉逐条注入开关;权重改为 0-5 五档描述;来源字段改为普通记录/证据摘要而非强单源;同步 design/01、design/04、原型、A01、A04、V01。 |
| TODO-P1-58 | 用户界面语言裁决:Open Novel 是中文小说写作工具,面向作者的 UI 不应直接暴露英文标签或半中半英术语。截图中的 `Settings`、`Workspace`、`API Keys`、`Agents`、`ReaderPanel`、`Persona`、`Rules`、`Memory`、`Developer Mode`、`context`、`proposal`、`dark mode` 等都应改为中文主标签;确需保留的英文只放在开发者模式、快捷键说明或括注中。 | [design/00](./design/00-design-tokens.md) · [design/01](./design/01-main-layout.md) · [design/04](./design/04-settings.md) · [design/06](./design/06-command-palette.md) · [M14](./spec/M14-settings.md) · [M18](./spec/M18-developer-mode.md) · [A04](./spec/appendix/A04-tool-catalog.md) · [V01](./spec/appendix/V01-test-matrix.md) | 用户已裁决产品定位,不需要再问。该项影响所有用户可见文案、导航命名、原型示例和验收标准,不能只逐词替换截图。 | 建立"作者可见 UI 全中文"规则;Settings/原型/命令面板/状态文案全量中文化;英文产品/技术名仅在必要括注、开发者模式或快捷键层出现;V01 增加中文界面文案巡检。 |

## P2 · 同步与体验优化

| ID | 问题 | 关联文档 | 为什么不能直接关闭 | 关闭条件 |
|---|---|---|---|---|
| TODO-P2-24 | README 仍有几处对能力的概括过满或不够贴合现状:每次修改/否决"都被记住"与 M12/M17 不自动学习边界不一致;TODO 描述仍偏"架构审计项"而当前含验证和文档修复项。Agent 不支持关闭的裁决已归入 TODO-P1-57。 | [README](./README.md) · [M12](./spec/M12-memory-learning-management.md) · [M17](./spec/M17-turn-recap-and-continuation.md) | 不影响主路径,但会误导读者对学习边界的预期。 | README 改为"审定/明确反馈形成可见经验候选",TODO 描述同步当前结构。 |
| TODO-P2-25 | S06/S08 需要补交叉映射说明:S06 pipeline phase、R04 health、S04/S05 用户投影术语未成表;S06 的事实优先级图容易把共同真源读成简单上下级;S08 prompt 层级图需说明它不推翻 S02/S07 的上下文取舍优先级。 | [S06](./spec/S06-knowledge-graph.md) · [S08](./spec/S08-prompt-system.md) · [S02](./spec/S02-runtime-state.md) · [S07](./spec/S07-context-management.md) · [R04](./spec/platform/R04-index-health-and-repair.md) | 术语可理解但实现容易分叉,属于解释性补强。 | S06 增加 phase→health→UI 投影表和事实来源/冲突处理表;S08 补安全结构层级 vs context 取舍优先级说明。 |
| TODO-P2-26 | 设计文档和原型存在若干一致性/可访问性优化:Settings 导航仍写 9 section 而实际 12;`--dur-med` 未定义;按钮 kbd 硬编码 rgba;高对比度 token 无 Settings UI;ReaderPanel 空态和段落定位演示不足;主界面审批卡关闭缺焦点恢复演示。 | [design/README](./design/README.md) · [design/00](./design/00-design-tokens.md) · [design/01](./design/01-main-layout.md) · [design/03](./design/03-reader-panel.md) · [design/04](./design/04-settings.md) · `design/prototypes/index.html` | 不阻塞架构,但会影响原型作为交互验收样例的可靠性。 | 统一 12 section,修 token/硬编码颜色,补高对比开关、ReaderPanel 空态和段落定位演示、主界面审批卡焦点恢复。 |
| TODO-P2-27 | 历史档案和 CHANGELOG 的归档提示不足:P000/P008 仍易被读成当前执行路线;CHANGELOG 早期说明仍提 ADR 表,与当前 plan 无 ADR 纪律不一致。 | [progress/P000](./progress/P000-init.md) · [progress/P008](./progress/P008-plan-rewrite.md) · [CHANGELOG](./CHANGELOG.md) · [AGENTS](./AGENTS.md) | 这是历史阅读风险,不影响 active spec,但会误导新 agent。 | P000/P008 顶部补归档警示;CHANGELOG 总说明改为当前决策以 active plan/spec 正文为准,历史决策见 progress/CHANGELOG。 |

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
