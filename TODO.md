# TODO · 活跃架构审计项

截至 2026-06-12,本文件重新承接本轮 plan/spec/design 只读审计发现的活跃架构缺陷。已归口且可直接修复的问题不再停留在对话里;每项都写明主权文档、为什么不能直接关闭、以及关闭条件。

## P0 · 主权与写入链路

| ID | 问题 | 关联文档 | 为什么不能直接关闭 | 关闭条件 |
|---|---|---|---|---|
| TODO-P0-01 | 编辑器直接输入与 inline accept 缺少轻量写入事务。当前 S14/M07/I02 允许 replaceRange 和 editor undo,但 S01 主要定义审批后 ChangeSet 落盘,没有覆盖 direct edit / inline accept 的 lease、文件版本、reindex、activity、save failure 和外部冲突。 | [S01](./spec/S01-project-storage.md) · [S04](./spec/S04-turn-orchestration.md) · [S14](./spec/S14-editor-and-interaction.md) · [M07](./spec/M07-inline-rewrite-and-humanizer.md) · [I02](./spec/platform/I02-editor-adapter-contract.md) · [V01](./spec/appendix/V01-test-matrix.md) | 这是作品事实写入主路径缺口,不能只靠现有审批事务解释。 | 补“作者直接编辑 / inline accept 轻量写入事务”契约,明确是否生成轻量 ChangeSet、如何持有 writable lease、如何记账和 reindex、undo 与外部冲突如何收场,并在 V01 加验证项。 |
| TODO-P0-02 | 写作/规划模式边界与连带修改原子性冲突。写作模式承诺不碰设定,但正文改写可能发现必要设定变更;必要连带修改又不能拆开审批。 | [plan/07](./plan/07-collaboration-and-modes.md) · [plan/05](./plan/05-story-world.md) · [plan/08](./plan/08-approval-and-cascade.md) · [S04](./spec/S04-turn-orchestration.md) · [M05](./spec/M05-planning-mode.md) · [M06](./spec/M06-writing-mode.md) · [M08](./spec/M08-approval-cascade.md) | 这是产品模式边界和系统事务边界的共同缺口,需要 plan/spec 同步裁决。 | 定义跨边界升级语义:写作模式发现必要设定变更时冻结/拆分/升级的唯一规则,以及同一批跨模式审批如何保持 atomic group。 |
| TODO-P0-03 | Approval Cascade 设计和原型允许过宽的逐条勾选,可能违反 S04 的 dependency group / atomic group。 | [plan/08](./plan/08-approval-and-cascade.md) · [S04](./spec/S04-turn-orchestration.md) · [M08](./spec/M08-approval-cascade.md) · [design/02](./design/02-approval-cascade.md) · `design/prototypes/02-approval-cascade.html` · [A02](./spec/appendix/A02-json-schemas.md) · [V01](./spec/appendix/V01-test-matrix.md) | design/prototype 仍把 ChangeRow 近似当作可独立勾选项,和原子组语义不完全一致。 | design/prototype 引入 dependency group:必需项成组接受或不可单独取消;独立低置信项才能搁置并生成 residual obligation;schema/test 同步。 |

## P1 · 运行时门禁与生命周期

| ID | 问题 | 关联文档 | 为什么不能直接关闭 | 关闭条件 |
|---|---|---|---|---|
| TODO-P1-01 | S00 主路径把 Quality Harness / Evaluation / Golden Gate 放进每次用户请求链路,与 S10/S11 的开发期 replay / regression gate 职责混淆。 | [S00](./spec/S00-system-contract.md) · [S10](./spec/S10-llm-quality-harness.md) · [S11](./spec/S11-evaluation-and-golden-regression.md) · [S12](./spec/S12-creative-engine.md) · [V01](./spec/appendix/V01-test-matrix.md) · [V02](./spec/appendix/V02-golden-cases.md) | 运行时结构化校验、创作风险检测、开发期 golden regression 是不同门禁。 | S00 主路径改为 runtime validator / creative risk / structured validation;S10/S11 明确只作为记录、replay、合入门禁。若保留运行时 quality gate,需新增唯一主权和失败收场。 |
| TODO-P1-02 | Prompt 优先级把 Experience 放在 User 前,与 S02/S07/S13 中“当前显式指令压过经验/偏好”的语义冲突。 | [S02](./spec/S02-runtime-state.md) · [S07](./spec/S07-context-management.md) · [S08](./spec/S08-prompt-system.md) · [S13](./spec/S13-style-and-humanizer.md) · [A05](./spec/appendix/A05-prompt-templates.md) · [V01](./spec/appendix/V01-test-matrix.md) | prompt 层级同时承担系统律、上下文材料和用户偏好,现在排序容易被实现误读。 | S08 拆清“系统治理优先级”和“材料/偏好取舍优先级”:当前用户指令不能越过系统律,但必须压过 Reflector 经验和历史偏好。 |
| TODO-P1-03 | Turn Recap 生命周期与 pending / lease-lost 语义不闭环。M17 暗示 awaiting approval 也生成 recap,S04 更像终态后 recap,lease lost 又禁止生成 recap。 | [S04](./spec/S04-turn-orchestration.md) · [S05](./spec/S05-streaming-ui-protocol.md) · [M17](./spec/M17-turn-recap-and-continuation.md) · [A02](./spec/appendix/A02-json-schemas.md) · [A03](./spec/appendix/A03-event-catalog.md) · [V01](./spec/appendix/V01-test-matrix.md) | recap 是用户时间线主权对象,不能把 pending activity 当作已结束 changelog。 | S04 定义 terminal recap、pending activity item、lease-lost recovery note 的唯一触发条件;M17 只承接展示和续接入口;schema/event/test 同步。 |
| TODO-P1-04 | 索引 blocked 与审批 apply / reindex 收场相互误导。R04 blocked 说阻断审批应用,但 S01/M08 又允许作品已保存、派生能力降级。 | [S01](./spec/S01-project-storage.md) · [S06](./spec/S06-knowledge-graph.md) · [M08](./spec/M08-approval-cascade.md) · [R04](./spec/platform/R04-index-health-and-repair.md) · [V01](./spec/appendix/V01-test-matrix.md) | pre-apply index precondition 和 post-apply reindex failure 是两种事故,当前文字容易合并。 | R04/S01/M08 拆清:blocked 可阻断新的依赖索引提案/应用;已接受且已写入的事务不能因 post-apply reindex 失败倒退,只能进入 degraded/repair。 |
| TODO-P1-05 | R5 学习红线与纯讨论不沉淀经验冲突。红线写“每轮完成交互提炼经验”,plan/10 又排除纯讨论。 | [plan/03](./plan/03-guardrails.md) · [plan/06](./plan/06-agent-team.md) · [plan/10](./plan/10-memory-and-learning.md) · [S02](./spec/S02-runtime-state.md) · [M12](./spec/M12-memory-learning-management.md) · [V01](./spec/appendix/V01-test-matrix.md) | 红线级语义会影响隐私、学习开关和验收用例。 | R5 改成“有审定结果的完成交互必复盘;取消不学;纯讨论只保存会话、不沉淀经验”,并同步 Reflector / memory 测试。 |
| TODO-P1-06 | “全部/任何连锁影响确定穷举”承诺过绝对,与“关系需显式声明才被守护”的边界冲突。 | [plan/01](./plan/01-overview.md) · [plan/03](./plan/03-guardrails.md) · [plan/05](./plan/05-story-world.md) · [plan/08](./plan/08-approval-and-cascade.md) · [S07](./spec/S07-context-management.md) · [S12](./spec/S12-creative-engine.md) | 低置信语义影响、隐喻关系和未入库事实无法按同一强度穷举。 | 将“全部/任何”限定为已进入故事世界的事实、声明关系和可追踪引用;疑似语义影响改成候选提示/低置信提醒。 |

## P2 · 设计闭环与文案边界

| ID | 问题 | 关联文档 | 为什么不能直接关闭 | 关闭条件 |
|---|---|---|---|---|
| TODO-P2-01 | Onboarding 缺少 workspace 选择和导入入口,与 S15 首启路径不一致。 | [S15](./spec/S15-settings-and-onboarding.md) · [M15](./spec/M15-onboarding-and-new-book.md) · [I04](./spec/platform/I04-import-export-contract.md) · [design/05](./design/05-onboarding.md) · `design/prototypes/05-onboarding.html` · [V01](./spec/appendix/V01-test-matrix.md) | 首启是项目事实和路径权限的第一入口,不能只展示 key + 新建项目。 | design/prototype 补 workspace 选择、创建/导入分支、导入失败语义和重进恢复。 |
| TODO-P2-02 | Settings design 未覆盖 S15/M14 的 Memory、Rules、Agents 完整控制面,ReaderPanel/persona 仍不够可操作。 | [S15](./spec/S15-settings-and-onboarding.md) · [M12](./spec/M12-memory-learning-management.md) · [M13](./spec/M13-agent-team-controls.md) · [M14](./spec/M14-settings-and-developer-mode.md) · [design/04](./design/04-settings.md) · `design/prototypes/04-settings.html` | Settings 是用户控制主权入口,缺少经验可看/调权/关闭/删除和守则阈值会影响实现。 | design/prototype 补 Memory、Rules、Agents 分区或等价入口;ReaderPanel/persona 配置落成可操作控件。 |
| TODO-P2-03 | 主界面审批聚焦卡的“拒绝”可能绕过 design/02 的必填反馈。 | [design/01](./design/01-main-layout.md) · [design/02](./design/02-approval-cascade.md) · `design/prototypes/01-main-layout.html` · [M08](./spec/M08-approval-cascade.md) | 两个设计入口对同一审批动作给出不同收场。 | 01 聚焦卡复用拒绝反馈流程,不允许一键拒绝后直接 idle;原型同步。 |
| TODO-P2-04 | ReaderPanel 独立入口不闭环。design/03 说可从命令面板触发,但 design/06 和原型命令列表没有 ReaderPanel / 读者预演命令。 | [M11](./spec/M11-reader-panel.md) · [M02](./spec/M02-command-palette-and-quick-open.md) · [design/03](./design/03-reader-panel.md) · [design/06](./design/06-command-palette.md) · `design/prototypes/06-command-palette.html` | 用户能力可触发入口缺失,会影响验收。 | 命令面板补“运行 ReaderPanel / 打开最近报告”,标注可用上下文、运行态和失败收场。 |
| TODO-P2-05 | 原型残留旧 spec 归口标签。 | `design/prototypes/04-settings.html` · `design/prototypes/06-command-palette.html` | 虽不影响 Markdown 链接,但会误导实现者按旧 S/M 编号找主权。 | 04 原型改为 S15/M14;06 原型改为 S14/M01。 |
| TODO-P2-06 | “一键发布/直接发”措辞可能冲撞“不做平台自动发布”边界。 | [plan/01](./plan/01-overview.md) · [plan/04](./plan/04-goals-and-non-goals.md) · [plan/09](./plan/09-narrative-and-reader.md) · [I04](./spec/platform/I04-import-export-contract.md) | 发布措辞容易被误读为平台账号、上架流程和自动发布。 | 统一改为“标记可发布 / 导出成稿 / 进入发布准备”,保留导出不承诺平台发布。 |
| TODO-P2-07 | “全量推理过程可回看”是过强产品承诺。 | [plan/02](./plan/02-principles.md) · [plan/07](./plan/07-collaboration-and-modes.md) · [M09](./spec/M09-trace-observability.md) · [R05](./spec/platform/R05-diagnostics-and-debug-mode.md) | 模型内部推理全文不可稳定承诺,也可能与隐私/脱敏冲突。 | 改为“全量工作日志、输入材料、动作记录、依据引用和可解释结论可回看”。 |
| TODO-P2-08 | plan 层残留过具体实现路线,如本地 Web / 桌面壳、模型深度/快速两档。 | [plan/02](./plan/02-principles.md) · [plan/04](./plan/04-goals-and-non-goals.md) · [plan/06](./plan/06-agent-team.md) · [S00](./spec/S00-system-contract.md) · [I01](./spec/platform/I01-llm-provider-contract.md) · [I05](./spec/platform/I05-desktop-shell-contract.md) | plan 应保持纯产品 PRD,实现形态应由 spec/platform 承接。 | plan 改成产品级“本地单用户工作台、成本档位可控”;具体 Web/桌面壳/模型映射下沉到 spec/platform。 |
| TODO-P2-09 | “纯文本任何编辑器可打开”与“派生资料不能手改”边界不够清楚。 | [plan/01](./plan/01-overview.md) · [plan/02](./plan/02-principles.md) · [plan/03](./plan/03-guardrails.md) · [plan/05](./plan/05-story-world.md) · [S01](./spec/S01-project-storage.md) · [I03](./spec/platform/I03-filesystem-and-watcher.md) | 数据主权承诺可能被理解为所有项目文件都可外部编辑。 | plan/spec 明确作者源文件可编辑纯文本;派生资料透明可读、由系统重建、外部改动不作为事实来源。 |
| TODO-P2-10 | 长历史“永不压缩”与本轮 context package 材料装齐的运行语义未分层。 | [plan/03](./plan/03-guardrails.md) · [plan/10](./plan/10-memory-and-learning.md) · [S02](./spec/S02-runtime-state.md) · [S07](./spec/S07-context-management.md) | 存储完整性不等于每次生成全量塞入上下文。 | 明确“历史原文完整保存”和“本轮工作材料包”两层;生成时引用可追溯材料包,原文随时可查但不等于全部进入 context。 |
| TODO-P2-11 | 备份恢复缺少项目事务前置条件。 | [S01](./spec/S01-project-storage.md) · [S04](./spec/S04-turn-orchestration.md) · [R01](./spec/platform/R01-project-lifecycle.md) · [R02](./spec/platform/R02-backup-restore.md) · [R04](./spec/platform/R04-index-health-and-repair.md) | restore 会改变项目文件和事实,必须接入 writable lease、pending approval 和 active turn 语义。 | R02 增加恢复前置检查:拥有 writable lease、处理/放弃 pending approval、暂停可写 turn、记录恢复影响、使相关审批失效、恢复后 reindex/recap 或 degraded。 |
| TODO-P2-12 | Validator / Checker / BeatAnalyzer 职责未稳定到唯一主权层。 | [M06](./spec/M06-writing-mode.md) · [M08](./spec/M08-approval-cascade.md) · [M13](./spec/M13-agent-team-controls.md) · [S12](./spec/S12-creative-engine.md) · [S09](./spec/S09-agent-tooling-boundary.md) · [A04](./spec/appendix/A04-tool-catalog.md) | BeatAnalyzer 未在 canonical role id 中落位,但多个文档依赖其风险结果。 | 明确 BeatAnalyzer 是 checker 内部工具还是新增 canonical id;Validator 输入、输出、阻断级别和 failure envelope 归到唯一主权位置。 |
| TODO-P2-13 | 低级导航/状态标签残留会误导实现。 | [M12](./spec/M12-memory-learning-management.md) · [M14](./spec/M14-settings-and-developer-mode.md) · [R01](./spec/platform/R01-project-lifecycle.md) | 链接目标正确但显示标签或状态机节点错误。 | 把 S15 链接标签从 S11 改为 S15;R01 状态图将未定义 `Open` 改为 `Opening` 或显式定义。 |
| TODO-P2-14 | Toast 位置和动效约束在 design/prototype 间不一致。 | [design/01](./design/01-main-layout.md) · [design/03](./design/03-reader-panel.md) · [design/06](./design/06-command-palette.md) · `design/prototypes/01-main-layout.html` · `design/prototypes/03-reader-panel.html` · `design/prototypes/06-command-palette.html` | UI 落地会出现多个 placement 和循环动效例外。 | 统一 toast placement;统一进行态动效,要么静态骨架 + 进度条,要么放宽“唯一循环动效”定义并列明例外。 |

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
