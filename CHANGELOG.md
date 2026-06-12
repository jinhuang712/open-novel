# CHANGELOG · 跨文档变更日志

## 2026-06-12 · docs/decision · ReaderPanel 风险信号裁决

| 变更 | 影响文档 | 关联 |
|---|---|---|
| 裁决 ReaderPanel 只输出弃读风险信号,不输出留存预测、发布建议或“可发布/应重写”聚合结论;报告只展示风险信号、证据位置、来源 persona 和可选处理方向。 | `plan/09-narrative-and-reader.md` `spec/M11-reader-panel.md` | 关闭 TODO-P1-31。 |
| 设计与原型删除“可发布 / 小修 / 重做建议”发布裁判心智和“留存环”图形,改为「风险低 / 需留意 / 风险集中 / 证据不足」风险信号。 | `design/03-reader-panel.md` `design/prototypes/03-reader-panel.html` | 用户选择方案 A。 |
| TODO 移除 P009 中最后一个【裁决】项;当前仍有同日架构评审新增的 TODO-P1-42【裁决】待处理。 | `TODO.md` | 继续按 TODO 表逐项裁决。 |

## 2026-06-12 · docs/todo · 架构评审 TODO 回填

| 变更 | 影响文档 | 关联 |
|---|---|---|
| 2026-06-12 架构评审结论回填 5 条:TODO-P0-05(落盘/恢复/recap/trace 统一 append-only journal 底座)、TODO-P1-42【裁决】(应用形态与执行宿主,收 P1-07/P1-20/P1-22/P2-20 公共分叉)、TODO-P1-43(影响分析召回/delta 稳定性/cascade 成本在真实长篇语料零验证,标 gating 先于 infra spike)、TODO-P1-44(全书级成本与延迟预算契约)、TODO-P2-23(README「13 个 runner」、目录树与 docs lint 真实性簇)。 | `TODO.md` | 用户要求“都记到 todo 里”;评审总判断:主权分层、提议-审定-落盘与失败语义骨架成立,风险集中在未验证能力赌注与未裁决形态。 |
| TODO 表头补记同日架构评审为条目来源;与 P009 条目同表续编号,已用编号(P1-41)不复用。 | `TODO.md` | 后续按【裁决】→ spike → 批次修复顺序收敛。 |

## 2026-06-12 · docs/decision · 经验冲突仲裁裁决

| 变更 | 影响文档 | 关联 |
|---|---|---|
| 裁决经验冲突为“显式询问”:Reflector 发现新旧经验互相否定时不自动覆盖旧经验,也不静默丢弃新经验;候选进入待确认状态,由用户选择采用新经验、保留旧经验或两条都不用。 | `plan/10-memory-and-learning.md` `spec/S02-runtime-state.md` `spec/M12-memory-learning-management.md` | 关闭 TODO-P1-24。 |
| Experience / Reflector 字段归口补 `pending_confirmation`、冲突对象 id 和冲突确认审计;待确认经验不得注入 context。 | `spec/appendix/A01-schema-tables.md` | 用户选择方案 C。 |
| TODO 移除已裁决的 TODO-P1-24。 | `TODO.md` | P009 裁决项随后继续逐项处理。 |

## 2026-06-12 · docs/decision · 待审期间输入策略裁决

| 变更 | 影响文档 | 关联 |
|---|---|---|
| 裁决待审期间交互策略为「写入锁定、只读放行」:pending approval 存在时禁止写入、生成新 ChangeSet、接受跨文档改写、切换可写模式或影响审批前置条件;查询、搜索、打开文档、Trace 和只读讨论仍可用,但必须标注当前待审状态且不能改变审批。 | `plan/08-approval-and-cascade.md` `spec/S04-turn-orchestration.md` `spec/S14-editor-and-interaction.md` `spec/M04-discuss-mode.md` `design/01-main-layout.md` | 关闭 TODO-P1-14。 |
| 主界面 await_approval 状态从输入条全锁改为只读讨论可用、写入动作锁定,避免“审批永不过期”导致工作台长期冻结。 | `design/01-main-layout.md` | 与 S04/S14 的并发和命令路由口径一致。 |
| TODO 移除已裁决的 TODO-P1-14,保留剩余两个【裁决】项继续逐项确认。 | `TODO.md` | 用户选择方案 A。 |

## 2026-06-12 · docs/todo · 首批 P009 确定性问题修复

| 变更 | 影响文档 | 关联 |
|---|---|---|
| 命令面板审批命令从「cascade 全部同意」降级为「打开待审审批卡」,补齐 ReaderPanel 的「运行 / 打开最近报告」入口与空态;toast 操作从即时「撤销」改为查看回执 / 前向修正入口。 | `design/06-command-palette.md` `design/prototypes/06-command-palette.html` `spec/M02-command-palette-and-quick-open.md` `spec/M11-reader-panel.md` `design/03-reader-panel.md` | 关闭 TODO-P1-38、TODO-P1-39、TODO-P2-04。 |
| Settings 归档语义改为可随时恢复,原型归口标签修正为 S15/M14 与 S14/M01;R01 状态图去掉未定义 `Open` 节点,M12/M14 的 S15 链接标签同步修正。 | `design/04-settings.md` `design/prototypes/04-settings.html` `spec/platform/R01-project-lifecycle.md` `spec/M12-memory-learning-management.md` `spec/M14-settings-and-developer-mode.md` | 关闭 TODO-P1-41、TODO-P2-05、TODO-P2-13。 |
| 发布相关措辞收窄为「标记可发布 / 导出成稿 / 进入发布准备」,Trace 透明性改为全量工作日志、输入材料、动作记录、依据引用和可解释结论可回看,不承诺模型内部推理全文。 | `plan/01-overview.md` `plan/07-collaboration-and-modes.md` `plan/09-narrative-and-reader.md` | 关闭 TODO-P2-06、TODO-P2-07。 |
| TODO 表头改为仅保留尚未关闭项,并移除本批 8 个已关闭条目。 | `TODO.md` | 后续继续按 TODO 批次收敛。 |

## 2026-06-12 · docs/audit · P009 落地前全量架构与设计审计

| 变更 | 影响文档 | 关联 |
|---|---|---|
| 新增 `progress/P009`:落地前全量审计报告——14 域并行审计 110 条原始发现 + 主会话通读全部 79 份文档逐条亲自验证,确认 P0×1、P1×41(含 3 项需用户裁决)、P2 与提升项×26,驳回/降权 4 条;按修复批次给出建议顺序。 | `progress/P009-pre-implementation-audit.md` `progress/README.md` `README.md` | 用户要求找出未落地项目的架构缺陷与设计提升点,并把报告输出到仓库。 |
| TODO 回填 44 条新审计项:TODO-P0-04(落盘崩溃恢复协议)、TODO-P1-07..41(执行宿主、取消/超时、provider 失败分类、turn 状态归属、EditedAccepted 重检、审批失效态、队列与重做闭环、输入锁定裁决、三模式主权、事实库损坏、指纹/lease、备份一致性、版本模型、API key、embedding、同步 SQLite、token 预算、经验仲裁裁决、分卷、as-of 时点、实体治理、守则四窗口、叙事诊断闭环、模板库、留存预测裁决、导出三件套、九项设计 P1)、TODO-P2-15..22(八个问题簇)。 | `TODO.md` | 与首轮 23 条同表续编号;证据与改法归 P009,TODO 只留主权文档、原因与关闭条件。 |

## 2026-06-12 · docs/audit · plan/spec/design 架构审计 TODO 回填

| 变更 | 影响文档 | 关联 |
|---|---|---|
| 将本轮 plan/spec/design 只读审计发现的活跃架构缺陷回填到 `TODO.md`,按 P0/P1/P2 分级记录主权文档、不能直接关闭的原因和关闭条件。 | `TODO.md` `README.md` | 用户要求“都记到 todo 里面去”。 |
| TODO 状态从“当前无活跃开放项”改为“活跃架构审计项”,覆盖轻量写入事务、模式跨界、审批 atomic group、运行时门禁、prompt 优先级、recap 生命周期、索引 blocked、Settings/Onboarding/design 原型一致性等问题族。 | `TODO.md` | 后续可按 TODO 拆文档修复批次。 |

## 2026-06-12 · docs/todo · TODO 空态清理

| 变更 | 影响文档 | 关联 |
|---|---|---|
| `TODO.md` 从“开放问题入口”改为“当前无活跃开放项”,只保留已清理问题族、验证入口和新增规则;README 导航同步改为空态描述。 | `TODO.md` `README.md` | 用户要求把剩余所有 TODO 清理掉。 |
| 清掉 active design 中最后几处待办式表述:主界面长卷/窄窗/输入条密度改为边界规则,可达性高对比开关改为 Settings 契约,Settings 原型移除 LICENSE 待补占位。 | `design/00-design-tokens.md` `design/01-main-layout.md` `design/prototypes/04-settings.html` | 避免 active 文档继续保留“待实测 / 待补充 / 非必做”口径。 |

## 2026-06-12 · docs/spec · S 层 LLM 质量闭环重分层

| 变更 | 影响文档 | 关联 |
|---|---|---|
| S 层从 `S00-S11` 扩展为 `S00-S15`:`S03` 收窄为 Agent Runner,`S07` 收窄为 Context Management,新增 `S08 Prompt System`、`S09 Agent Tooling Boundary`、`S10 LLM Quality Harness`、`S11 Evaluation And Golden Regression`;原 Creative/Style/Editor/Settings 后移为 `S12-S15`。 | `README.md` `spec/S00-system-contract.md` `spec/S03-agent-runner.md` `spec/S07-context-management.md` `spec/S08-prompt-system.md` `spec/S09-agent-tooling-boundary.md` `spec/S10-llm-quality-harness.md` `spec/S11-evaluation-and-golden-regression.md` `spec/S12-S15` | 关闭“context / prompt / runner / tool / harness / golden 没有系统主权层”的文档缺口。 |
| Appendix 反链按新主权层重归口:`A05` 只放 prompt 模板全文,`A04` 只放工具参数明细,`V01/V02/V03` 分别承接测试矩阵、golden 明细和外部 spike;质量门禁语义上移到 S10/S11。 | `spec/appendix/README.md` `A01-A05` `V01` `V02` `V03` `spec/platform/I01` | 关闭 prompt/harness/golden 只有明细、没有门禁的问题。 |
| TODO 活跃表收口为“开放问题入口”:已归口的架构风险写入对应 plan/spec/platform/appendix,真实依赖验证进入 `V01/V03`,不再在 TODO 中重复漂浮。 | `TODO.md` `spec/appendix/V01-test-matrix.md` `spec/appendix/V03-external-spikes.md` | 用户要求把剩余 TODO 一并清理。 |
| 补齐剩余架构契约:Approval Cascade dependency group / residual obligation / writing-blocked,项目级 lock/lease,watcher cursor / reconcile / repair job,canonical agent role id,桌面壳生产包装边界。 | `plan/04` `plan/08` `spec/S01` `spec/S04` `spec/M08` `spec/M13` `spec/platform/I03` `spec/platform/I05` `spec/platform/R01` `spec/platform/R04` | 关闭本轮 plan/spec/design 复查中可通过文档主权关闭的缺陷。 |
| design 与原型同步风险语言和 ReaderPanel 心智:Approval 风险统一为「提示级 / 确认级 / 阻断级」,ReaderPanel 去掉 0-100 留存预测总分,改为分类风险和多人共识。 | `design/02-approval-cascade.md` `design/03-reader-panel.md` `design/prototypes/02-approval-cascade.html` `design/prototypes/03-reader-panel.html` `design/00-design-tokens.md` | 关闭 design 与 plan/spec 的风险枚举和评分心智冲突。 |

## 2026-06-12 · docs · 文档待办清理与 appendix 覆盖矩阵

| 变更 | 影响文档 | 关联 |
|---|---|---|
| 风险等级产品命名统一为「提示级 / 确认级 / 阻断级」,plan 不再暴露 `critical` / `blocking` 实现枚举;S04 FAQ 同步使用中文风险名。 | `plan/03-guardrails.md` `plan/08-approval-and-cascade.md` `spec/S04-turn-orchestration.md` `TODO.md` | 关闭“风险三档命名中英混用”文档待办。 |
| appendix 新增抽取完成口径:历史归档不再整体搬回 active appendix,实现某个 `S/M/platform` 前只按触发场景补必要 A/V 明细。 | `spec/appendix/README.md` `TODO.md` | 关闭“appendix 明细抽取”文档待办,避免 appendix 重新变成历史垃圾桶。 |
| A/V 初始覆盖矩阵补齐到字段、schema、事件、工具、prompt、测试和 golden 七类明细,覆盖 `M01-M17` 与 `platform/I/R` 的实现前检查口径。 | `spec/appendix/A01-schema-tables.md` `spec/appendix/A02-json-schemas.md` `spec/appendix/A03-event-catalog.md` `spec/appendix/A04-tool-catalog.md` `spec/appendix/A05-prompt-templates.md` `spec/appendix/V01-test-matrix.md` `spec/appendix/V02-golden-cases.md` `TODO.md` | 关闭“M/platform 明细深化”文档待办,后续具体字段随实现进入对应 A/V。 |

## 2026-06-11 · spec+design · M17 Turn Recap 与 forward-only 历史语义

| 变更 | 影响文档 | 关联 |
|---|---|---|
| 新增 `M17 Turn Recap And Continuation`:把每个 turn 的完成、停止、失败、待审、拒绝、放弃、已落盘和已修正都写成作者可读的项目活动记录;明确 Recap 是用户 changelog,不是作品事实、Trace step 或 Reflector 经验。 | `spec/M17-turn-recap-and-continuation.md` `README.md` `spec/S00-system-contract.md` | 用户确认普通作者不会使用 Git,recap 对他们就是最重要的变更记录。 |
| 收敛取消和历史修正语义:运行中且未产生 durable change 时停止不需二次确认,但必须留下 stopped recap;已有待审、落盘或不可自动恢复风险时进入 cancel plan;撤销和恢复都生成新的反向修改或恢复提案,经审定后向前追加历史。 | `spec/S04-turn-orchestration.md` `spec/S14-editor-and-interaction.md` `spec/M08-approval-cascade.md` `spec/S01-project-storage.md` `plan/05-story-world.md` `plan/08-approval-and-cascade.md` | 关闭“取消入口仍需统一到同一个 rollback 语义”TODO,用户侧不暴露 Git 式回退。 |
| UI 和过程可见性接入 recap:状态点新增 stopped recap 表现,Trace 顶部可展示最近 turn recap,S05 增加 `recap ready` 展示协议,M09 明确 Recap 与 Trace 的边界。 | `design/01-main-layout.md` `spec/S05-streaming-ui-protocol.md` `spec/M09-trace-observability.md` | 对齐“终止前内容做简单 recap,挂在界面上”的交互要求。 |
| appendix 承接实现明细:补 activity recap 表字段、recap payload / event、作者备注、correction request、continuation action 和 Turn Recap 验证矩阵;TODO 的能力范围更新为 `M01-M17`。 | `spec/appendix/A01-schema-tables.md` `spec/appendix/A02-json-schemas.md` `spec/appendix/A03-event-catalog.md` `spec/appendix/V01-test-matrix.md` `TODO.md` | 保持根层 spec 可读,字段、事件和测试继续后置。 |

## 2026-06-11 · docs+design · 轻量 TODO 清理

| 变更 | 影响文档 | 关联 |
|---|---|---|
| 补齐开书旅程的产品承诺:一句故事种子会被拆成可审定的世界起点,样例项目用于直接体验完整故事世界。 | `plan/05-story-world.md` `TODO.md` | 关闭“开书旅程缺 plan 承诺”待办,与 plan/01 场景速览对齐。 |
| 将经验管理与 Reflector 关闭语义的实现明细落到 appendix:经验字段族、学习开关与注入开关分离、可见 / 调权 / 关闭 / 删除 / 清空 / 冲突测试矩阵。 | `spec/appendix/A01-schema-tables.md` `spec/appendix/V01-test-matrix.md` `TODO.md` | 关闭“经验管理契约缺口”和“Reflector 关闭语义”两项文档待办;核心语义仍在 S02/S11/M12。 |
| `design/02` 收敛到“章节轨 · 纸面 · 状态点”契约:审批卡改为状态点触发的纸面中央召唤层,`×/Esc` 统一为暂不处理且保持 pending,风险视觉改为细线/弱底/文字色。 | `design/02-approval-cascade.md` `design/prototypes/02-approval-cascade.html` `TODO.md` | 关闭 design 同步项中审批卡定位、取消入口和风险视觉部分;全局 rollback 语义与风险等级命名仍保留独立 TODO。 |
| `design/01` 原型接入 Universal Search:顶部演示按钮与 `Shift+Shift` 可开关,结果按角色/阵营/章节分组并提供 hover preview。 | `design/prototypes/01-main-layout.html` `TODO.md` | 关闭 design 同步项中 “01 原型尚未接入全局搜索热键”。 |

## 2026-06-11 · docs · 文档矛盾复查与审定口径收敛

| 变更 | 影响文档 | 关联 |
|---|---|---|
| 将产品层“审批”口径收敛为“作者审定”:小处表达走正文批阅层就地确认,连带修改和高风险变更进入整批审批;避免 plan 继续暗示所有写入都走同一个审批卡闸门。 | `plan/02-principles.md` `plan/05-story-world.md` `plan/06-agent-team.md` `plan/07-collaboration-and-modes.md` | 本轮文档矛盾复查发现 plan 与 inline review 主路径冲突。 |
| 将系统总契约纳入批阅建议路径:Agent 输出形态从回答 / 报告 / proposal 扩展为回答 / 报告 / 批阅建议 / proposal,写入节点统一称为作者审定。 | `spec/S00-system-contract.md` `spec/S14-editor-and-interaction.md` `spec/platform/I02-editor-adapter-contract.md` | 避免 S00/I02 只承认审批后落盘,遗漏 inline review 接受后的 editor undo 路径。 |
| 补齐 inline review 的 appendix 归口:批阅建议 schema、inline review 事件进入 A02/A03,实现明细仍后置到 appendix。 | `spec/appendix/A02-json-schemas.md` `spec/appendix/A03-event-catalog.md` | 核心 spec 已定义行为,appendix 需要承接字段与事件明细。 |
| 清理 design 与原型旧 UI 命名:ChatBox、ThinkingPanel、DebugConsole、FileTree 等残留改为输入条、Trace、Developer Console、库面板;Onboarding 改为“就地确认 + 审批卡”双层心智。 | `design/00-design-tokens.md` `design/03-reader-panel.md` `design/05-onboarding.md` `design/prototypes/04-settings.html` `design/prototypes/05-onboarding.html` `design/prototypes/tokens.css` | 避免旧五区心智继续污染写作优先主界面契约。 |
| 更新剩余 TODO:design 同步项从 02-05 全部残留缩小到 design/02 审批卡复查与 01 原型全局搜索热键。 | `TODO.md` | 本轮已处理 03/04/05 的明显旧命名和 onboarding 旧审批口径。 |

## 2026-06-11 · spec+design · Inline Review 默认路径与跨文档 Cascade 边界

| 变更 | 影响文档 | 关联 |
|---|---|---|
| 将轻量选区改写和 Humanizer 的默认路径从审批卡改为正文批阅层:句内 / 小选区在原文附近展示修订痕迹、近文小注和接受 / 拒绝 / 重试;接受后才替换并进入编辑器 undo。 | `spec/M07-inline-rewrite-and-humanizer.md` `spec/S13-style-and-humanizer.md` `spec/S14-editor-and-interaction.md` | 用户明确轻量 editor accept 是大多数场景,希望像高级批阅而不是卡片审批。 |
| 收紧跨文档变更边界:跨文档、跨章节、事实、剧情、设定和关系变更不能在当前页旁注中裁决;当前命中处必须保留轻量锚点或 cascade 序号,完整解释和选择进入 Approval Cascade。 | `spec/M07-inline-rewrite-and-humanizer.md` `spec/M08-approval-cascade.md` `design/01-main-layout.md` `design/06-command-palette.md` | 用户指出跨文档变更不应使用旁注,但也不能在正文里完全没有标注。 |
| README、plan 红线和 design 原则澄清为“作者显式审定必经”:小改可就地接受,连带修改整批审定,保持无静默落盘。 | `README.md` `plan/03-guardrails.md` `plan/08-approval-and-cascade.md` `plan/09-narrative-and-reader.md` `design/README.md` | 避免全局原则与 inline review 主路径冲突,保留 R1 的用户驾驶位含义。 |
| 同步命令面板与主界面原型中的 Cmd+K 样例:展示克制的细线、淡底、删除/新增标记、近文操作和 cascade 锚点,移除旧的“卡片审批默认路径”文案。 | `design/prototypes/01-main-layout.html` `design/prototypes/06-command-palette.html` | 设计原型必须随 spec/design 文档同步,避免继续展示旧交互。 |

## 2026-06-11 · docs · spec 编号残留与审计归口修正

| 变更 | 影响文档 | 关联 |
|---|---|---|
| 修复 spec 内部链接显示文本仍使用旧连续编号的问题,统一改为目标文档的 `S/M` 前缀,避免与当前 `S/M/I/R/A/V/P` 编号体系冲突。 | `spec/S*.md` `spec/appendix/*.md` | spec 复查发现链接虽不断链,但显示编号会误导阅读姿态。 |
| 收敛外部事实审计归口:S00 明确审计证据进 appendix,行为契约回写对应根层 `S/M` 或 `platform/I/R`;未关闭问题进 TODO,路线变化进 CHANGELOG。 | `spec/S00-system-contract.md` | 修复 platform 拆分后 S00 仍只写 appendix/TODO 的归口残留。 |
| 明确 appendix 三类验证/迁移材料边界:`V03` 是外部能力原始 spike 证据唯一归口,`V01` 只放验证矩阵和用例引用,`A06` 只放迁移说明、版本能力摘要和历史归档说明。 | `spec/appendix/README.md` `spec/appendix/A06-migration-notes.md` `spec/appendix/V01-test-matrix.md` `spec/appendix/V03-external-spikes.md` | 修复 A06/V01/V03 同时承接外部审计与 spike 的职责重叠。 |

## 2026-06-11 · docs · platform 归口与 WORKFLOW 去项目化

| 变更 | 影响文档 | 关联 |
|---|---|---|
| `Ixx/Rxx` 从根层 spec 迁入 `spec/platform/`,与 appendix 平级:platform 承载集成、可靠性、恢复、迁移和诊断等支撑契约;根层 `spec/` 保持 `S/M` 主阅读路径。 | `spec/platform/*` `README.md` `spec/S00-system-contract.md` `TODO.md` | 用户判断 I/R 更适合放进另一个与 appendix 平级的目录,并确认目录名为 `platform`。 |
| `WORKFLOW.md` 去项目化:移除 Open Novel 名称、当前能力清单和具体 design/spec 文件名,保留可复制的文档流、编号体系、platform/appendix 分工和提交前验证规则。 | `WORKFLOW.md` | 用户指出 WORKFLOW 应该可以覆盖到另一个项目,不应有项目 designated words。 |
| `AGENTS.md` 与 `CLAUDE.md` 同步整理:保留 Open Novel 项目级约束,但把文档职责改成根层 `S/M`、`spec/platform/I/R`、`spec/appendix/A/V`。 | `AGENTS.md` `CLAUDE.md` | 用户要求完成后整理 WORKFLOW、CLAUDE、AGENTS。 |

## 2026-06-11 · docs · S/M/I/R/A/V/P 编号体系与全量文档重写执行

| 变更 | 影响文档 | 关联 |
|---|---|---|
| 文档编号从连续数字扩展为单字母 + 数字:`Sxx` 表示系统设计,`Mxx` 表示用户能力,`Ixx` 表示集成契约,`Rxx` 表示可靠性/运维契约,`Axx` 表示 appendix 实现明细,`Vxx` 表示验证明细,`Pxxx` 表示 progress 历史档案。编号规则固化进 WORKFLOW、README、agent 工作规范和各索引。 | `WORKFLOW.md` `README.md` `AGENTS.md` `CLAUDE.md` `spec/appendix/README.md` `progress/README.md` | 用户要求继续使用单字母 + 数字,保留 appendix,增加 `P` 给 progress。 |
| 新增并纳入导航的 `I01-I05` 覆盖模型、编辑器、文件系统、导入导出、桌面壳五类跨边界接入;新增 `R01-R05` 覆盖项目生命周期、备份恢复、迁移升级、索引修复和诊断排障。它们随后迁入 `spec/platform/`,不再作为根层主阅读路径。 | `spec/platform/I*.md` `spec/platform/R*.md` `README.md` `spec/S00-system-contract.md` | 用户追问除 S/M 外是否还有其他适用场景;最终选择 I/R 进入编号体系,验证细节 V 进 appendix。 |
| 能力级 spec 补齐到 `M01-M16`:Universal Search、Command Palette、Fact Query、Discuss、Planning、Writing、Inline Rewrite、Approval、Trace、Knowledge Surface、ReaderPanel、Memory、Agent Controls、Settings、Onboarding、Project Library 都有根层阅读入口,后续实现明细只补入 A/V。 | `spec/M*.md` `README.md` `TODO.md` | 用户要求放心大胆拆,不要放 `/modules`,直接放到核心 spec 级别。 |
| appendix 和 progress 也纳入编号管理:appendix README 改为 A/V index 并新增 golden cases、external spikes;progress 根层文档改为 `P000-P008`,README 表格同步编号。 | `spec/appendix/*` `progress/*` | appendix 保留但只放用户不必主动读的明细;progress 可用,但只做历史档案。 |

## 2026-06-11 · spec+design · 用户可感知能力提升为根层核心 spec

| 变更 | 影响文档 | 关联 |
|---|---|---|
| 新增第一批根层能力 spec:Universal Search、Discuss Mode、Trace Observability、Approval Cascade、ReaderPanel。Universal Search 明确 `Shift+Shift` 全局搜索、角色/阵营/概念/章节分组、hover preview、排序降级和 Search→审批/讨论边界;其余四篇补齐触发、读写边界、失败收场、design 对接和测试清单。 | `spec/M01` `spec/M04` `spec/M08` `spec/M09` `spec/M11` `README.md` | 用户要求补 Global Search / universal search hover overlay,并要求不要放入 `/modules`,直接放到核心 spec 级别。 |
| 文档规则从“模块目录”收敛为“能力级核心 spec”:用户可感知且可独立实现/测试的能力直接进入根层编号 spec;不另建二级能力目录。WORKFLOW 新增需求进入 plan/spec/design/TODO/CHANGELOG 的更新顺序和能力 spec 检查表。 | `WORKFLOW.md` `AGENTS.md` `CLAUDE.md` `README.md` | 用户指出文档不是按能力拆,但不接受二级能力目录概念;需要大胆拆到核心 spec。 |
| design 被重新接入文档流:主界面和命令面板文档补 Universal Search 与 `Cmd+E` fact query 的分工,design README 明确 design 不是 SoT,但必须随能力 spec 同步更新。 | `design/01-main-layout.md` `design/06-command-palette.md` `design/README.md` | 用户指出 `/design` 长期被遗忘,但不希望 design 成为 SoT。 |
| appendix、TODO 同步新归口:Search/Discuss/Trace/Approval/ReaderPanel 的 schema、事件、工具、测试明细归 appendix;未完成的原型同步和后续能力 spec 延展进入 TODO。 | `spec/appendix/*` `TODO.md` | 保持核心 spec 可读,把机器级明细和未关闭工作放到正确位置。 |

## 2026-06-11 · spec · 12 篇核心 spec 完全重写为差异化技术设计

| 变更 | 影响文档 | 关联 |
|---|---|---|
| 12 篇根层系统 spec 重新按主题设计骨架并完整重写:系统总图、事故剧本、记忆生命周期、runner 执行手册、turn 泳道、UI 驾驶舱、知识图谱管线、证据包配方、质检室、表达边界、交互路由和控制面板各自采用不同结构。每篇补足 mermaid 图、边界表、事故/失败收场和 FAQ,不再沿用同一套“问题 / 主权对象 / 失败语义”模板。 | `spec/S00-S11` | 用户要求“完全重写”“每篇都不同的骨架”“加入足够多的 diagrams、表格、FAQ”,并指出旧核心 spec 缺少代入感和技术设计解释。 |
| 失败语义写法从抽象错误列表改为事故收场:强调谁拥有真相、哪些结果已生效、用户看到什么、系统能否重试和禁止自动做什么。 | `spec/S00-S11` | 用户追问“失败语义到底是啥”,要求把技术设计讲清楚。 |
| spec 写作纪律新增 S0 反模板纪律:根层 spec 必须按主题采用不同骨架,优先用场景、mermaid、表格和 FAQ 解释设计;失败语义必须写成具体事故收场。README 的 spec 导航同步改为新阅读口径。 | `AGENTS.md` `CLAUDE.md` `README.md` | 防止后续 agent 把核心 spec 重新写回规章模板或把 appendix 当主文档。 |

## 2026-06-11 · spec · 根层 spec 扩写为可读技术设计 + active appendix 精简

| 变更 | 影响文档 | 关联 |
|---|---|---|
| 12 篇根层系统 spec 从抽象规章模板扩写为可直接阅读的技术设计:每篇补回主路径、主权对象、关键设计、失败语义和用户可见结果;重点回填 turn/cascade/approval、context/impact/query、knowledge graph、creative engine、editor interaction 与 settings 的核心契约。 | `spec/S00-S11` | 用户反馈“核心 spec 里啥也没有,appendix 太多”,要求读完核心文档就能明白。 |
| active appendix 改为 7 个分类明细入口,只承接表结构、schema、事件字段、工具参数、prompt、测试和审计;不再逐篇链接旧 spec details。 | `spec/appendix/*` | appendix 应是用户不需要主动读的实现明细,不是主文档内容仓库。 |
| 旧 29 篇 spec 原文从 `spec/appendix/details/` 迁入历史归档 `progress/spec-archive/2026-06-11-pre-core-spec-details/`,作为追溯材料而非当前契约入口。 | `progress/spec-archive/2026-06-11-pre-core-spec-details/*` `README.md` | 保留细节来源,但移出 active appendix,避免 appendix 臃肿和误导。 |
| README、TODO、agent 写作规范同步新分工:核心 spec 必须讲清主路径,appendix 只放机器级明细,历史原文归 progress archive。 | `README.md` `TODO.md` `AGENTS.md` `CLAUDE.md` | 保持后续 agent 不再把旧 details 当 active spec。 |

## 2026-06-11 · spec · 根层 spec 激进重组为 12 篇系统契约 + appendix 明细

| 变更 | 影响文档 | 关联 |
|---|---|---|
| spec 根层从 29 篇历史增量功能文档重组为当时的 12 篇系统契约文档。核心 spec 只写技术路径、职责边界、主权对象和失败语义。2026-06-12 后当前文件名以本日志顶部的 S 层重分层条目为准。 | `spec/S00-S11` `README.md` | 用户确认 spec 应减少技术细节堆砌,先讲清技术路径和设计。 |
| 表结构、JSON schema、事件枚举、工具参数、prompt 模板、测试矩阵、版本审计和旧迁移明细后置到 `spec/appendix/`;旧 29 篇 spec 原文在后续同日整理中迁入 `progress/spec-archive/`,作为字段、schema、参数和历史细节来源,不再作为根层 spec 主权骨架。 | `spec/appendix/*` `progress/spec-archive/*` | 同上;避免细节丢失,同时降低核心 spec 噪音。 |
| 文档规范新增 spec 写作纪律:S1 核心 spec 必须说明职责边界、主权对象、输入输出、关键流程、失败语义和用户可见结果;S2 技术细节后置;S3 同一生命周期、状态机、失败语义、数据主权或上下文规则只能有一个权威定义位置。 | `AGENTS.md` `CLAUDE.md` | 用户要求把“核心 spec 不能太虚、appendix 不能变垃圾桶、关键约束不能完全挪走”纳入长期要求。 |
| README 的 spec 导航与当前实现方向改为新骨架;TODO 活跃项和实施前验证项同步改指核心 spec 或 appendix,旧断链风险从入口文档移除。 | `README.md` `TODO.md` | 同上。 |

## 2026-06-11 · plan · 能力章按创作旅程重排 + 概览具体化 + 删竞品对比与变更纪律

| 变更 | 影响文档 | 关联 |
|---|---|---|
| plan 能力章按作者创作旅程重排:05 故事世界(原 08)→ 06 AI 角色团队(原 05)→ 07 协作与三模式(原 06)→ 08 审批与连带修改(原 07)→ 09 叙事诊断与读者预演(原 10)→ 10 记忆与成长(原 09);01-04 不变。全仓引用(README、TODO、spec、design 链接与「NN — 标题」标签)同步重映射,无断链;progress/ 历史档案按档案纪律不改动,其散文中的旧编号指当时结构。 | 全部 `plan/*.md` `README.md` `TODO.md` 相关 `spec/*.md` `design/*.md` `CLAUDE.md` `AGENTS.md` | 用户指定能力章按创作旅程排序。 |
| plan/01 概览具体化:能力亮点 10 项与场景速览改写为「产品行为 + 你的决策动作 + 结果」并按新章序重排;开篇一句定义「审定」动作集合(通过 / 否决 / 改后通过);删「与同类产品的差异」整节(竞品对比表),定位句改写为不点名竞品的版本并入能力亮点收尾;阅读地图按新序重排,删文档体系说明行(职责归 README)。改写文案已与能力章逐项交叉核对对齐(审定三元组、整批审批勾选语义、章内体检四项、六维名称「人事物」、润色师按需召唤)。 | `plan/01-overview.md` | 用户反馈能力 / 亮点 / 核心交互太笼统;交互形态仍归 design,plan 只写产品行为。 |
| plan/06、plan/10 同口径收紧:读者评审团 / 润色师 / 反思学习者的「给你什么」从口号落到具体行为;「四个旋钮」点名(档位、开关、用量、性格文风);经验权重表述改为「调高、调低或删除」;plan/06 七个角色小节标题去除英文内部代号(G1);plan/04 平台约束「WSL」改「兼容层」(技术名词出 plan)。两项遗留口径问题(开书旅程缺 plan 承诺、风险三档命名中英混用)记入 TODO。 | `plan/06-agent-team.md` `plan/10-memory-and-learning.md` `plan/04-goals-and-non-goals.md` `spec/S00-system-contract.md` `TODO.md` | 同上;对抗性校验(编号一致性 / 写作纪律 / 事实交叉核对 / 误伤体检)后修正。 |
| plan/03 删「红线变更纪律」节(流程性元内容出 plan);其中值得保留的治理规则(红线编号只追加不复用、增删改须同步 spec 并记 CHANGELOG)移入 `CLAUDE.md` / `AGENTS.md` G3。plan/04 对变更纪律的引用同步收尾。 | `plan/03-guardrails.md` `plan/04-goals-and-non-goals.md` `CLAUDE.md` `AGENTS.md` | 用户决定 plan 不放变更纪律。 |

## 2026-06-11 · plan · 删除各篇文末「## 实现承载」小节,plan/ 收为零 spec/design 链接

| 变更 | 影响文档 | 关联 |
|---|---|---|
| plan 全部 10 篇文末的 `## 实现承载` 小节(集中放 spec/design 链接)删除;plan/ 现为纯产品 PRD,全篇不出现 spec/design 链接,仅保留 plan 内部互链与红线编号引用。plan→spec/design 的文档导航由 [README.md](./README.md)(唯一入口)承载。 | 全部 `plan/*.md` | 用户决定 plan 不需要文末实现承载。 |
| 治理纪律同步:`CLAUDE.md` / `AGENTS.md` 的 G3 结构约定由「正文零 spec/design 链接 + 每篇文末固定 `## 实现承载` 小节」改为「plan 全篇不出现 spec/design 链接(plan 内部互链与红线编号引用除外),导航集中在 README」。 | `CLAUDE.md` `AGENTS.md` | 保持仓库自洽,避免后续 agent 按旧 G3 把小节加回。 |
| `progress/P008-plan-rewrite.md` 作为历史档案保留其对旧实现承载约定的记述,不回改。 | (无改动,仅说明) | 历史档案只追溯当时决策。 |

## 2026-06-11 · plan rewrite · plan/ 重定义为纯产品 PRD:12 篇半技术 → 10 篇纯产品,技术内容迁入 spec

| 变更 | 影响文档 | 关联 |
|---|---|---|
| plan/ 重定义为**纯产品 PRD**——零技术细节、无历史包袱:旧 12 篇半技术 PRD 删除,重组为 10 篇纯产品 PRD,技术内容迁入 spec([spec/28 — 技术栈](./spec/S00-system-contract.md) 为本次新增);纯产品写作纪律已立入章程 `CLAUDE.md` / `AGENTS.md`。旧 → 新对照见本节下表。 | 全部 `plan/*.md` `spec/S00-system-contract.md` `CLAUDE.md` `AGENTS.md` | [progress/P008-plan-rewrite.md](./progress/P008-plan-rewrite.md) 为本次迁移的执行计划存档。 |
| 技术设计取舍(ADR)迁移:旧 plan/03、plan/04、plan/08 的技术 ADR 分别入 [spec/S05](./spec/S14-editor-and-interaction.md)、[spec/S01](./spec/S01-project-storage.md) 与 [spec/17](./spec/S06-knowledge-graph.md)、[spec/28](./spec/S00-system-contract.md) 的 §设计取舍;产品级决策理由不再以 ADR 表存在,内联进新 plan 各篇正文。 | `spec/S05` `spec/S01` `spec/17` `spec/28` 全部新 `plan/*.md` | 同上。 |
| 红线编号映射:旧 plan/01 不变性 #1-12 → 新 [plan/03](./plan/03-guardrails.md) 红线 R1-R10;其中 #5 入 [spec/S02](./spec/S03-agent-runner.md),#7 入 `CLAUDE.md` / `AGENTS.md` 工作规范,#12 的 JSON 面入 [spec/24](./spec/S03-agent-runner.md)。 | `plan/03-guardrails.md` `spec/S02` `spec/24` `CLAUDE.md` `AGENTS.md` | 历史文档中的旧编号按本映射换算。 |
| README 导航与全仓交叉引用已同步到新 plan 结构。 | `README.md` 及全仓 plan/spec/design/progress 引用 | 同上。 |

旧 → 新对照(旧篇已删,旧名仅为历史名称,只以行内代码标注、不作链接):

| 旧(已删) | 去向 |
|---|---|
| `plan/01-overview` | 新 plan/01(概览)/ 02(产品原则)/ 03(守则与红线)/ 04(目标与非目标) |
| `plan/02-multi-agent` | plan/05(产品)+ spec/S02、11、13、24(技术) |
| `plan/03-editor-layer` | plan/08 + design/01(产品)+ spec/S05(技术) |
| `plan/04-storage-model` | plan/08、02(产品)+ spec/S01、13、16、17、27(技术) |
| `plan/05-modes-and-approval` | plan/06、07 + spec/S06、07 |
| `plan/06-cascade-and-reflection` | plan/07、09 + spec/19、06、22、01 |
| `plan/07-ui-layout` | design/01 |
| `plan/08-tech-stack` | spec/28(新增) |
| `plan/09-narrative-engine` + `plan/10-reader-simulator` | plan/10 + spec/S10、11 |
| `plan/11-knowledge-graph` | plan/08 + spec/M11-21 |
| `plan/12-memory-and-context` | plan/08、09 + spec/22、23 |

## 2026-06-11 · design+plan · 主界面再设计:「章节轨 · 纸面 · 状态点」,去 VSCode 形似,极简克制

| 变更 | 影响文档 | 关联 |
|---|---|---|
| plan/07 修订:顶部 Tabs 取消,新增 ADR-05(多章打开 = 左缘章节轨 + 库面板「最近」+ Cmd+P);状态线收为右下状态点(一粒 8px 点 + 旁文一句话,四态不变);导航抽屉改库面板(纯文字类目);纸面无任何顶部常驻行,字数/保存/violation 以左下微标静置;视觉基调约束入档:简约素雅克制、不引入文化符号装饰、唯一循环动效为状态点运行态呼吸。 | `plan/07-ui-layout.md` | 用户要求设计提高想象力、摆脱 VSCode 形似;随后明确否决中国风方案(印章/卷轴/笺),指定简约、高级、素雅、克制、零装饰动画。 |
| design/01 重写 + 01 号原型第三版:章节轨(章号列 + 当前章标记 + 未保存/violation 微点)、库面板(类目下划线 tab + 发丝线列表 + 最近)、状态点四态、Trace 面板(无卡片底色,发丝线分块)、输入条(模式纯文字 tab)、审批聚焦卡;实体 hover 改为**纸面右缘旁注**(对齐所在段落,不遮正文);新增「动效清单(全集)」章节,声明全部动效及 reduced-motion 行为。原型交互完整:Cmd+B/J/L/1~5、Esc 分层、旁注 hover 100/200ms、四态演示。 | `design/01-main-layout.md` `design/prototypes/01-main-layout.html` | 同上。 |
| design 原则新增「克制是审美底线」;原则 3 表述与导航(design README 表格、原型索引、根 README)同步为「章节轨 · 纸面 · 状态点」。 | `design/README.md` `design/prototypes/index.html` `README.md` | 同上。 |
| 库面板收为 4 类目(章节 / 角色 / 世界观 / 大纲),只承载「能打开的东西」:**查询独立为一键浮层**(`Cmd+E` 召出 / 同键或 Esc 收回,框选「查询」预填直达,四类型 `Tab` 互换,结果行点击跳来源;spec/M01 待补 `query.open`);**已学偏好移出主界面**,查看与编辑归 Settings §风格定制,Reflector 新沉淀在 Trace 面板内联提示(design/04 同步项记入 TODO)。原型同步实现,`Cmd+1~4` 重映射。 | `plan/07-ui-layout.md` `design/01-main-layout.md` `design/prototypes/01-main-layout.html` `design/prototypes/index.html` `TODO.md` | 用户反馈:查询应是单独的一键互换交互,偏好不该放在库里。 |

## 2026-06-11 · design+plan · 设计思想转向:写作优先,「纸面 + 召唤式表面」替代五区常驻

| 变更 | 影响文档 | 关联 |
|---|---|---|
| plan/07 修订:目标由「仿 VSCode 五区」改为「IDE 的能力,纸面的外观」+ 三条注意力法则(常驻 ≤3 层 / AI 过程默认一行 / 打断只为审批);ADR-01 修订为「纸面 + 召唤式 IDE」并记录原因,新增 ADR-04(agent 可观测性 = 状态线一行 + trace 召唤)。结构变化:ActivityBar 并入导航抽屉(Cmd+B)、ChatBox 改为召唤式 Composer(Cmd+L,新增命令待补 spec/M01)、ThinkingPanel 改为 Trace 抽屉(Cmd+J)、DebugConsole 降为 Developer Mode 专属、底部状态栏取消(mode/violation/进度并入 Agent 状态线,费用并入 Trace 头部与 Settings,保存状态归 tab dirty 点)。 | `plan/07-ui-layout.md` | 用户实测主界面原型截图,判定五区常驻「太挤太丰富、难以使用」,要求调整设计思想;经选项确认走「写作优先重构」。 |
| design/01 重写 + 01 号原型重做:常驻层只剩 Tabs / 纸面 / Agent 状态线(四态:空闲 / 运行中 / 待审批 / 错误);导航抽屉、Trace 抽屉、Composer、审批聚焦卡全部召唤式,原型含真实键绑定(Cmd+B/J/L、Esc 按层级收回)与四态演示;violation 汇总信号改为状态线计数 + 滚动条 marker,移除段落 gutter 常驻 ⚠。 | `design/01-main-layout.md` `design/prototypes/01-main-layout.html` | 同上。 |
| 01 号原型补全导航抽屉类目交互:六类目可点击切换(`Cmd+1~5` 键绑定,抽屉收起时自动展开),树区内容按 plan/07 目录映射切换;查询面板做成查询输入 + 四类型 chip + 结果行,已学偏好做成权重徽标列表;文件行点击切活动态;底部 📚/⚙ 直接跳转 05 / 04 号原型。design/01 同步补两条契约(非文件类目形态、底部入口跳转)。 | `design/prototypes/01-main-layout.html` `design/01-main-layout.md` | 用户指着类目列与底部入口要求「这些的交互也都做出来」。 |
| design 原则与导航同步:README 原则 3 由「IDE 心智不破坏」改为「纸面唯一主角(写作优先)」;原型索引页与根 README 的 01 条目改为新表述。 | `design/README.md` `design/prototypes/index.html` `README.md` | 同上。 |
| TODO 新增文档同步项:02-06 设计文档与原型仍按旧五区语境(右栏 ChatBox、状态栏等引用),待按新契约同步;spec/M01 需补 `chat.focusComposer`(Cmd+L)。 | `TODO.md` | 本轮范围经用户确认仅 plan/07 + design/01 + 01 号原型,其余下一轮。 |

## 2026-06-10 · design · 主题修正:底色去绿改素色中性,绿仅保留为 accent

| 变更 | 影响文档 | 关联 |
|---|---|---|
| 背景体系由雾绿系改为无色彩倾向的素色中性(light `#F7F7F7` 系 / dark `#1D1D1D` 系),边框、hover/active、遮罩、阴影同步去色;文字改为灰墨(饱和度 ≤5%,读感是墨不是绿);`--agent-router` 回归中性灰。嫩叶绿 accent、低反差区间(正文 7:1–9:1)与全部语义/实体/diff 色不变,对比度断言重新实测全过。主题名「雾绿 · 嫩叶」更正为「嫩叶 · 素纸」。 | `design/00-design-tokens.md` `design/prototypes/tokens.css` `design/README.md` `README.md` `design/05-onboarding.md` `design/prototypes/index.html` | 用户反馈雾绿底色把背景也染绿了,不符合预期——绿色只能做点缀,背景必须中性。 |

## 2026-06-10 · design · 主题改版:陶土橙 Claude 风 → 雾绿 · 嫩叶绿低反差主题,并补齐 Claude Code 落地对接

| 变更 | 影响文档 | 关联 |
|---|---|---|
| 全套色彩 token 重做:accent 由陶土橙 `#D97757` 改为嫩叶绿(light `#158243` / dark `#3DA066`),中性色由暖纸/暖炭改为雾绿系;确立低反差书卷气原则——正文对比度收在 7:1–9:1(下限可达性、上限纸感),关键文字 token 附实测对比度;深色主题主按钮改为深字浅钮(`--text-on-accent` 分主题取值);`--agent-writer` 跟随品牌色、`--agent-router` 调为雾绿灰;衬线栈移除 New York / Copernicus 替身表述,改为中文宋体系书卷气定位。语义色 / 实体色 / diff 色不变,accent 与 success 同为绿系的区分规则(饱和度 + 角色)写入 00。 | `design/00-design-tokens.md` `design/prototypes/tokens.css` | 用户不接受与 Claude 一致的橙色主题,指定轻盈绿色、整体低对比度书卷气;经表单确认嫩叶绿 + 雾绿中性。 |
| 风格表述去 Claude 化:design 设计原则、根 README design 导航、onboarding「品牌时刻」描述、原型索引页副标题中的「Claude Desktop 风格」全部改为「雾绿 · 嫩叶」自有视觉语言。原型页本身零硬编码色(全走 tokens.css),无需逐页改动。 | `design/README.md` `README.md` `design/05-onboarding.md` `design/prototypes/index.html` | 同上。 |
| 新增 Claude Code 落地对接:00 增「实现对接(Tailwind v4 + shadcn/ui)」——tokens.css 原样进 `app/globals.css`、`@custom-variant dark` 绑定 `data-theme`、token → shadcn 变量映射表(含 shadcn `--accent` ≠ 品牌色的命名冲突警告);design README 增「交付与验收(Claude Code 落地流程)」——coding agent 阅读顺序 + 每界面 PR 验收清单(双主题对照原型、对比度区间、Esc/Focus Trap、reduced-motion、禁硬编码 hex)。 | `design/00-design-tokens.md` `design/README.md` | 用户要求设计可直接交给 Claude Code 丝滑落地。 |
| TODO 增一条 P2 实施前验证:shadcn 变量映射与 data-theme dark variant 需在首个组件接入时实测。 | `TODO.md` | 同上。 |

## 2026-06-10 · design · 新增 design/ 界面设计体系(交互文档 + 双主题高保真原型)

| 变更 | 影响文档 | 关联 |
|---|---|---|
| 新增 `design/` 目录:`README.md`(设计原则与导航)、`00-design-tokens.md`(Claude Desktop 风格 token,light/dark 双主题色彩 / 字体 / 圆角 / 动效与对比度验收)、`01~06` 六篇界面交互设计文档(主界面五区 / ApprovalCard 与 cascade / ReaderPanel / Settings / Onboarding / 命令面板与快捷交互),内容基于 plan/03 05 07、spec/S05 06 11 12 13 15 收束,只定交互与视觉,协议与 schema 仍以 spec 为准。 | `design/*.md` | 用户要求基于现有设计文档产出界面交互 / 原型图 / UI 样例,落在 `design/`;风格参考 Claude Desktop,必须支持 dark & light 双主题。 |
| 新增 `design/prototypes/`:`tokens.css`(唯一 token 源)+ `index.html` 原型索引 + 六个可交互高保真原型页,均支持深浅主题切换(跟随系统 + 手动记忆)。这是仓库唯一允许 `.html` 的目录(原型,非文档站)。 | `design/prototypes/*` | 同上。 |
| 文档规范同步:文档体系与职责边界新增 design 条目;spec 不再承载“原型图 / 样例 / 交互设计”,移交 design;链接规则细化为“Markdown 不得超链接 `.html`(以代码段写路径),`design/prototypes/` 内 HTML 互链允许”。README 增补 design 导航区、目录树与文档状态说明。 | `AGENTS.md` `CLAUDE.md` `README.md` | 为 HTML 原型在纯 Markdown 仓库中开出受控例外;两份 agent 规范保持一致。 |

## 2026-06-10 · markdown migration · 文档全面去 CAST 化

| 变更 | 影响文档 | 关联 |
|---|---|---|
| 53 个 CAST HTML 文档(plan 12 / spec 28 / progress 9 / index / TODO / changelist / CHANGELOG)迁移为纯 Markdown;63 张图表以 mermaid 代码块回填(源自 `site/diagram-sources.json` 的作者源);仓库内部链接全部 .md 化;逐篇经独立校验确认标题 / 表格 / 代码块 / 图表与 HTML 一致。 | 全部 `plan/*.md` `spec/*.md` `progress/*.md` `TODO.md` `CHANGELOG.md` `README.md` | 用户决定弃用 CAST skills,文档回归纯 Markdown。 |
| 删除 CAST 渲染基础设施:全部 `*.html`、`.cast-docs/`、`assets/`、`scripts/render_all_docs.py`、`site/`(docs.json / todo.json / changelist.json / diagram-sources.json)。 | 仓库根 | 内容已 1:1 进入 Markdown,渲染层不再需要。 |
| `AGENT.md` 重命名为 `AGENTS.md`,并与 `CLAUDE.md` 内容完全统一:去掉 CAST 工作流与 HTML validator 要求,改为 Markdown 文档体系 + mermaid-only 图表约定。 | `AGENTS.md` `CLAUDE.md` | 两份 agent 指南必须保持一致。 |
| changelist 与 CHANGELOG 合并:原 `changelist.html`(由 changelist.json 渲染)的内容成为本文件,`CHANGELOG.html` 兼容跳板移除;`index.html` 文档地图并入 `README.md`。 | `CHANGELOG.md` `README.md` | 用户确认 changelist 与 changelog 重复,保留 CHANGELOG。 |

## 2026-06-02 · docs audit · TODO 清零与图表修复

| 变更 | 影响文档 | 关联 |
|---|---|---|
| 按 `site/docs.json` 对发布文档集做逐篇审计,把文档重写 / CAST 化 / progress 角色混乱 / 已关闭事项挂 TODO 等文档类待办清零;TODO 活跃区只保留代码实施前必须实测或用户回头决策的问题。 | `site/todo.json` `todo.html` `README.md` `progress/README.html` | 用户要求“完成 todo 的清零,整个项目的检查;不确定项落入 todo 回头解决”。 |
| 恢复 63 段 Mermaid 作者源到 `site/diagram-sources.json`,并更新渲染器:图表重新渲染时使用语义 caption 与 CAST 安全 SVG,禁止 caption 或图表正文继续暴露 Mermaid 方向声明等源码首行。 | `scripts/render_all_docs.py` `site/diagram-sources.json` 全部含图表的 plan/spec HTML | 此前图表以文字源码呈现问题的后续彻底修复;避免重新渲染后再次退化。 |
| 将 `progress/README.html` 从 rolling plan 模板改为历史档案索引;README 同步去掉过期重构表述,并把未声明许可证改成明确风险说明。 | `README.md` `progress/README.html` | 文档角色主权收敛:当前待办归 TODO,跨文档变更归 Changelist,progress 只做追溯。 |
| 把已关闭的 P0/P2/OQ 历史项移出 TODO 活跃区,例如 cascade controller 主权、schema 主权拆分、Embedding provider、reindex 失败语义与 analyzeImpact Writer 边界;真实未知项保留为开放验证 / 后续架构决策。 | `site/todo.json` `todo.html` | 避免 TODO 同时承载历史回溯和当前风险,降低后续 agent 误判。 |

> **[info]** 本文件仅记录 **跨文档变更流水线**。每条 = 一次有意义的变更意图(可跨多文档)。设计决策(为什么这么改)见各 plan/spec 文档底部 ADR 表;待办与未关闭风险见 [TODO.md](./TODO.md)。本日志从 2026-05-21 文档体系重整开始;此前历史见 `progress/`。

## 2026-05-30 · renderer · Mermaid SVG 图表

| 变更 | 影响文档 | 关联 |
|---|---|---|
| 将 Mermaid 源码块从纯文本 `pre[data-language=mermaid]` 改为构建期编译的内联 SVG figure,并注入 `cast-a-doc` renderer-owned diagram viewer,支持点击放大、缩放拖拽和 SVG/PNG 下载;页面不再依赖 Mermaid CDN/runtime,也不再把图表源码作为正文展示。 | `scripts/render_all_docs.py` `assets/docs.css` 全部包含图表的 `*.html` | 图表渲染反馈:流程图不应是纯文本状态 |
| 同步 Strict Profile 校验:禁止生成 `Mermaid source` 和 `data-language="mermaid"` 残留,禁止静态 `data:image/svg+xml` 图像回退,并要求 diagram figure 包含内联 SVG 与 CAST diagram viewer hook。 | `scripts/render_all_docs.py` | 防止后续重渲染退回源码块 |

## 2026-05-30 · index · 首页文档地图

| 变更 | 影响文档 | 关联 |
|---|---|---|
| 扩充 `index.html` 顶部说明,明确 Open Novel 文档站的阅读顺序:先看 Plan 理解设计取舍,再看 Spec 对齐实现约束,最后用 Progress 追溯决策历史。 | `scripts/render_all_docs.py` `index.html` `README.md` | 首页 UX 反馈:入口缺少描述 |
| 新增三列文档地图,以 Plan / Spec / Progress 三张概览卡展示文档集结构;下方详细文档清单也改为三列并排,让主分组关系在首页一眼可见。 | `assets/docs.css` 全部 `*.html` | 首页 UX 反馈:三列更适合展示主文档分组 |

## 2026-05-30 · index · 首页读者入口收敛

| 变更 | 影响文档 | 关联 |
|---|---|---|
| 移除 `index.html` 的维护向 `Source` 分组,首页主体只保留关键入口、plan、spec 与 progress;CAST profile、样式源和 JSON 源不再作为用户主导航卡片出现。 | `site/docs.json` `index.html` `README.md` | 首页 UX 反馈:不要把维护源文件作为用户主导航 |
| 同步渲染器 Strict Profile:首页仍必须链接 README、plan、spec、TODO 和 Changelist,但禁止暴露 `.cast-docs/project.json`、`assets/docs.css` 与 `site/*.json` 维护链接。 | `scripts/render_all_docs.py` | 避免重新渲染后内部维护入口回流到首页 |

## 2026-05-30 · index · README 外跳 GitHub

| 变更 | 影响文档 | 关联 |
|---|---|---|
| 将 GitHub Pages 文档站的 README 导航统一改为 `https://github.com/jinhuang712/open-novel#readme`,不再让用户在 Pages 里打开本地 `README.md` 原文。 | `scripts/render_all_docs.py` 全部 `*.html` `README.md` | 首页 UX 反馈:README 应跳转 GitHub 而不是本地 Markdown |
| 同步 Strict Profile 校验:首页必须包含 GitHub README 链接,且不得继续链接本地 `README.md`。 | `scripts/render_all_docs.py` | 避免后续重渲染回退 |

## 2026-05-30 · cast-a-doc · HTML 视觉与 profile 收敛

| 变更 | 影响文档 | 关联 |
|---|---|---|
| 将全站 HTML 渲染壳收敛到 `cast-a-doc` 控制 profile:每页内联 `assets/docs.css`,统一 `article.doc` / `topbar` / `sidebar` / `doc-section` / `doc-footer`,移除外部 stylesheet、Mermaid CDN runtime 与兼容页脚本跳转。 | `scripts/render_all_docs.py` `assets/docs.css` 全部 `*.html` | 解决外部运行时依赖与页面壳不一致 |
| 重做 `index.html` 为静态 document-set 入口,由 `site/docs.json` 生成章节卡片和分组导航,不再靠浏览器端 JS 拼装索引。 | `index.html` `site/docs.json` | GitHub Pages 入口维护 |
| 新增仓库级 `.cast-docs/project.json`,把语言、输出策略和 CAST styleProfile 作为可审查项目 profile 固定下来。 | `.cast-docs/project.json` `README.md` | cast-a-start 项目记忆 |

## 2026-05-30 · full rerender · 架构审计与主权收敛

| 变更 | 影响文档 | 关联 |
|---|---|---|
| 新增本仓库轻量渲染入口:以 `site/docs.json` 为索引源,以 `site/todo.json` / `site/changelist.json` 为项目档案源,通过 `scripts/render_all_docs.py` 全量重包 HTML 并执行 Strict Profile / 链接校验。 | `scripts/render_all_docs.py` `site/docs.json` `site/todo.json` `site/changelist.json` `index.html` `todo.html` `changelist.html` | cast-a-start renderer-tool |
| 新增 `spec/26` 作为 cascade controller 主权文档,明确 Router 只输出 actions、状态机只管 UI 状态、审批 endpoint 只管 resolve/rollback、analyzeImpact 只管影响分析;补齐 turn cancel 与 reindex 失败语义。 | `spec/26` `spec/S06` `spec/S07` `spec/19` `todo.html` | 关闭 P0-4 / P0-5 / P2-1 |
| 新增 `spec/27` 作为 `session_history.db` schema 主权文档,将过程日志从 `plan/04` 的职责说明提升为可实施 schema,并明确它不参与产品事实恢复。 | `spec/27` `spec/S01` `plan/04` `README.md` | 关闭 OQ-2 |
| 统一审批链路为 proposal-only + 独立 endpoint,清理 `addToolResult` 回灌 / 永不 resolve 的双轨描述。 | `spec/S06` `spec/S04` `spec/S02` `spec/M09` `plan/08` `spec/S00` | 避免实现阶段误走短挂起 HITL cookbook |
| 将 `foreshadowings` 物理表误导收敛为 `dependencies(kind=foreshadowing)` 逻辑视图;spec/25 的字段升级目标改为 `dependencies`。 | `spec/S01` `spec/19` `spec/23` `spec/25` `todo.html` | schema 主权清理 |

## 2026-05-30 · guided migration · Memory/History 文档收敛

| 变更 | 影响文档 | 关联 |
|---|---|---|
| `spec/22` 从过渡态 Mastra Memory 文档重写为应用层 memory 模块规格:定义 `runtime.db` threads/messages/compressed_messages/archived_threads、thread/resource guard、写入时机、历史压缩、卷级摘要和跨进程恢复。 | `spec/22` | `plan/12` L2 会话记忆 |
| `spec/23` 调整上下文装配边界: L2 历史由 `appMemory.fetchRecent` 显式读取;runner 不再隐式追加 lastMessages;文本 agent 经 `callTextAgent` / AI SDK `streamText` 衔接。 | `spec/23` | `spec/22` · `spec/24` |
| 清理实现误导项:状态机事件适配从 Mastra `streamVNext` 改为统一 Agent runner;测试策略中的 Mastra mock 改为 DeepSeek + 应用层 runner 边界;存储图修正 `runtime.db` / `session_history.db` 职责。 | `spec/S07` `spec/M09` `spec/S01` | 避免实现阶段继续沿旧框架路径接线 |
| 同步顶层导航与项目记忆,记录本轮 guided migration 的范围和仍保留的后续清理项。 | `README.md` `index.html` `todo.html` `CHANGELOG.html` | cast-a-start preserve-first 改写 |

## 2026-05-22 · Turn 2 · plan/ 全篇升级

| 变更 | 影响文档 |
|---|---|
| `plan/04` 重写:LibSQL → better-sqlite3 + sqlite-vec + Drizzle;连接池策略改 LRU(3) by-project;产物 vs 过程分库语义明确 | `plan/04` |
| `plan/06` 重写:Reflector 简化版(只衰减 + 注入 + cardinal_rule 保护;砍 hit_count / archive / 学习面板 / 跨进程 hydrate / 命中加权);learnings 表 schema 同步精简 | `plan/06` |
| `plan/12` 重写:Mastra Memory → 应用层 memory 模块;四层记忆模型保留;L3 简化版只做按需 SQL 查不主动 hydrate | `plan/12` |
| `plan/03` 体例升级:删历史注(TipTap 2.x → 3.x 演进),加 ADR 表(编辑器框架 / 实体识别方式 / EditorAdapter 抽象) | `plan/03` |
| `plan/05` 体例升级:删 "W9 升级" 标签,Agent loop 终止改 stopWhen 表述,加 ADR 表(审批挂起 / cascade 粒度 / stopWhen / 无超时) | `plan/05` |
| `plan/07` 体例升级:删 "战略升级 002 引入" 注释,加 ADR 表(UI 范式 / Tab 键功能 / _ 前缀隐藏) | `plan/07` |
| `plan/09` 体例升级:删 "plan/02 历史变更" 段(指令"内容是最终结论"),加 ADR 表(BeatAnalyzer 归属 / ArcTracker 归属 / 模板强制度 / 触发时机) | `plan/09` |
| `plan/10` 体例升级:删 "plan/02 历史变更" 段,加 ADR 表(是否闸门 / persona 数量 / 持久化粒度 / 是否显总分) | `plan/10` |
| `plan/11` 体例升级 + 技术变更:LibSQL native vector → sqlite-vec(§不做什么 + L1 数据层图);删 "audit 分析见 progress/005" 历史引用;加 ADR 表(影响半径算法 / 向量索引 / 派生视图 / concepts 触发) | `plan/11` |

## 2026-05-21 · Turn 1.5 · Turn 1 修补

| 变更 | 影响文档 | 关联 |
|---|---|---|
| `spec/22` 改名落地:`22-mastra-memory.html` → `22-memory-and-history.html`(内容暂保留,顶部加过渡 blockquote;Turn 3 重写) | `spec/22` + 10 处下游引用 | 修复 Turn 1 留下的死链 |
| `README.md` 整篇按 P0-1 决策重写(Mastra/LibSQL/Gateway → AI SDK 6 + better-sqlite3 + sqlite-vec + Drizzle;7+6 Agent 二分;新增项目档案区) | `README.md` | 修复 index.html JS fetch README.md 覆盖描述的链路 |
| `index.html` 三处描述同步:plan/02 / plan/08 / spec/22 标题与 extraKeys 去 mastra | `index.html` | — |
| `plan/02` 残留清理:"Mastra-free memory" → "应用层 memory";"mastra_messages" → "messages 表";"Mastra AgentNetwork agents-as-tools" → "Agent-as-tool 多轮派发" | `plan/02` | — |
| `plan/01` Agent 拓扑图重画:同时展示 7 对外 + 6 Hidden Agent 三 subgraph;ADR-03 表述微调(从"是否点名 Mastra" → "是否点名具体框架") | `plan/01` | 与 plan/01 ADR-02 / plan/02 §Hidden Agent 对齐 |
| `todo.html` 加 §1.3 现存技术矛盾清单(spec/S04 / spec/S09 / spec/S10 / spec/S11 / spec/M04 共 5 处 Mastra/LibSQL 残留,等后续触碰时修);删 OQ-2(已确认不该挂 Open Questions);OQ-4 编号修正为 OQ-3 + 表述更新 | `todo.html` | — |
| `CHANGELOG.html` 上一条 spec/22 改名描述修正(原写法 "spec/22→spec/22" 含义不明) | `CHANGELOG.html` | — |

## 2026-05-21 · P0-1 落地 + 文档体系重整

| 变更 | 影响文档 | 关联 |
|---|---|---|
| 新建 `todo.html`:TODO + Known Issues + Open Questions 三段 | `todo.html` | — |
| 新建 `CHANGELOG.html`:跨文档变更流水线 | `CHANGELOG.html` | — |
| P0-1 全栈切换:废弃 Mastra Agent / Memory / LibSQL,改用 AI SDK 6 `generateText`/`streamText` + `stopWhen` 显式终止 + better-sqlite3 + Drizzle ORM + sqlite-vec | `plan/01` `plan/02` `plan/04` `plan/08` `plan/12` `spec/S00` `spec/S01` `spec/S02` `spec/S06` `spec/S07` `spec/M11` `spec/17` `spec/18` `spec/19` `spec/20` `spec/21` `spec/22-mastra-memory.html`→`spec/22-memory-and-history.html` `spec/23` `spec/24` | plan/08 ADR-A · spec/S06 ADR-A · spec/22 ADR-A |
| `spec/22-mastra-memory.html` 改名为 `spec/22-memory-and-history.html`;全项目 grep 替换引用 | `spec/22` + 所有引用方 | spec/22 ADR-A |
| Reflector 简化版:保留 per-turn LLM + scope + weight 衰减 + cardinal_rule top-1 保留;砍掉 hit_count / archive / 学习面板 / 跨进程 hydrate / 命中加权 | `plan/06` `spec/S01`(learnings 表瘦身) `spec/22` `spec/23` | plan/06 ADR-A |
| Agent 拓扑显式二分:7 个对外 Agent + 6 个 Hidden Agent = 13 总数(修正 plan/01 / plan/02 原有的 "7 Agent" 单一说法与 progress/007 引入的 Hidden Agent 矛盾) | `plan/01` `plan/02` `spec/S02` | plan/02 ADR-A |
| plan/01 不变性从 17 条合并到 ≤12 条(只合并语义重叠,不删减;具体条数见 plan/01) | `plan/01` | plan/01 ADR-A |
| 文档体系拆分明确:`plan/` = 半技术 PRD;`spec/` = 核心技术文档;每篇文档底部加 ADR 表;新建 todo.html / CHANGELOG.html 顶层文件 | 所有触碰的 plan/spec | — |
| `plan/` 12 篇全部按新模板升级体例(未受 P0-1 技术影响的 6 篇:plan/03 plan/05 plan/07 plan/09 plan/10 plan/11 仅做体例升级,技术结论不变) | 所有 `plan/` | — |
| `spec/` P0-1 触碰范围按新模板升级体例 + 技术变更(其余 12 篇未触碰,待后续 P0 主题处理,详见 todo.html) | spec/ 触碰范围 14 处 | — |
| 删除全部历史包袱描述:"W7 升级"、"v1→v2 字段"、"已撤"、"~~已弃用~~"、"借鉴 opencode X.ts:Y-Z" 等 | 所有触碰的 plan/spec | — |
