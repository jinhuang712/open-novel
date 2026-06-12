# CHANGELOG · 跨文档变更日志

## 2026-06-13 · docs · TODO-P2-25 索引健康与 Prompt 边界映射

| 变更 | 影响文档 | 关联 |
|---|---|---|
| S05 补管线阶段到 R04 健康度再到 S03/S04 用户投影的映射表,并把事实优先级图解释为冲突裁决顺序而非简单上下级覆盖;S07 明确 prompt 层级不重新裁定 S01/S06 的事实优先级与 context package 取舍,context package 归 S06。 | `spec/S05` `spec/S07` `TODO.md` | 关闭 TODO-P2-25。 |

## 2026-06-13 · docs · TODO-P1-51 light apply undo 边界

| 变更 | 影响文档 | 关联 |
|---|---|---|
| 明确 inline accept / Humanizer 小改的撤销分界:提交前通过 editor undo bridge 当作本地替换撤销,不生成写入记录;保存并入账为 light apply 后只能生成新的反向 light apply,旧写入记录不可改写。 | `spec/S13` `spec/S12` `spec/S14` `V01` `TODO.md` | 关闭 TODO-P1-51。 |

## 2026-06-13 · docs/design · TODO-P2-26 设计原型一致性补齐

| 变更 | 影响文档 | 关联 |
|---|---|---|
| 设计文档与原型同步 Settings 12 分区口径,补 `--dur-med` token,移除审批按钮 kbd 的硬编码 rgba,Settings 高对比开关改为可切换 `data-contrast`,ReaderPanel 补空态与段落定位演示,主界面审批卡补关闭后的焦点恢复说明和原型提示。 | `design/README` `design/00` `design/01` `design/03` `design/04` `design/prototypes/index.html` `design/prototypes/*.html` `design/prototypes/tokens.css` `TODO.md` | 关闭 TODO-P2-26。 |

## 2026-06-13 · docs · Recap / Activity 触发矩阵

| 变更 | 影响文档 | 关联 |
|---|---|---|
| 定义 recap/activity 触发矩阵:纯本地 Search、Quick Open、Command Palette 打开/预览/跳转不生成 recap 且不写项目 Activity;Fact Query 默认只写轻量 activity;Agent 执行、ReaderPanel、proposal、已进入 turn 的失败/停止/超时生成 recap。 | `spec/M17` `spec/M01` `spec/M02` `spec/M03` `A03` `TODO.md` | 关闭 TODO-P1-52,避免本地查询制造活动噪音,同时保留长任务回执。 |

## 2026-06-13 · docs/sync · 本轮裁决、导航与 TODO 收口

| 变更 | 影响文档 | 关联 |
|---|---|---|
| S 文档阅读顺序重排:Runtime State 改为 S01,Project Storage 后移为 S14;README/S00/TODO/appendix/platform 引用同步,避免一上来先读最重的存储协议。 | `README.md` `spec/S00` `spec/S01-S14` `TODO.md` `A01` `V01` `I05` | 用户追加反馈“S01 排太前,上来读 S 文档太难懂”。 |
| 项目入口与 Settings 范围收口:应用启动先进入项目选择页,主界面提供返回项目选择页入口;Settings 删除数据管理与项目入口,拆出外观、ReaderPanel 评审设置、Assistant Persona 等独立区域,危险操作和凭据语义归回对应能力文档。 | `README.md` `spec/M14` `M15` `M16` `M12` `S01` `design/01` `design/04` `design/prototypes/04-settings.html` `A01` `A04` `V01` | 关闭 TODO-P1-57 中 Settings 范围与项目入口裁决。 |
| 统一搜索只保留一个作者入口:主界面与命令入口统一到全局搜索 / 快速打开路径,不再把“搜索唯一入口”留成 TODO;相关能力由 M01/M02 与设计原型承接。 | `spec/M01` `spec/M02` `design/01` `design/06` `design/prototypes/01-main-layout.html` `design/prototypes/06-command-palette.html` | 搜索入口已同步,不保留开放项。 |
| Agents / Rules / Memory 裁决落地:Agents 可调但不可关闭;Rules 只展示规则和必要说明,不提供阈值、提示方式、关闭或恢复默认调参;Memory 默认注入 context,权重改 0-5 档,冲突发生当场决策或按用户策略处理,不在 Settings 常驻待确认队列。 | `README.md` `plan/06` `plan/03` `spec/M13` `spec/M12` `S01` `design/04` `A01` `A04` `V01` | 关闭 TODO-P1-57 中 Agents/Rules/Memory 裁决。 |
| Developer Mode 收口为开发构建门禁与只读诊断:作者默认界面不暴露开发诊断项;开发模式只在开发构建或明确开启后可见,不能绕过审批、写入或修复主权。 | `spec/M18-developer-mode.md` `spec/M09` `design/04` `design/prototypes/04-settings.html` `V01` | Developer Mode 从 Settings 普通作者路径中剥离。 |
| 产品形态追加裁决为单实例单窗口:二次启动只聚焦既有窗口,不创建第二窗口;多窗口写入权切换、窗口间接管和多 renderer 写入协调不再作为 active 导航或 TODO 口径。 | `README.md` `CHANGELOG.md` `TODO.md` | 用户追加裁决“不允许多窗口”。 |
| 多项目/单窗口项目切换隔离契约补齐:M16 定义 active project context、切换 preflight、active turn/pending approval/未保存编辑收口、runtime/history 分桶、样例/真实项目隔离和切换崩溃恢复;M01/M15/README/V01 同步 Search、首启样例和验收投影。 | `README.md` `spec/M16` `spec/M01` `spec/M15` `V01` `TODO.md` | 关闭 TODO-P1-53。 |
| 作者可见 UI 中文化:面向作者的 Settings、Workspace、Agents、Rules、Memory、ReaderPanel、Persona、Developer Mode、context、proposal、dark mode 等标签改为中文主标签;英文只作为开发者模式、快捷键或必要括注出现。 | `README.md` `design/00` `design/01` `design/04` `design/06` `design/prototypes/*` `spec/M14` `M18` `A04` `V01` | 关闭 TODO-P1-58。 |
| 设计 / 原型同步:Settings 信息架构、命令面板搜索入口、主界面项目入口、作者中文文案、Developer Mode 可见性和 ReaderPanel/Persona 分区已按本轮裁决同步。 | `design/*.md` `design/prototypes/*.html` | 避免 design 与 M14/M18/M01/M02 分叉。 |
| 设计原型交互闭环补齐:Settings 原型增加遮罩/关闭按钮/Esc dirty protect 和 Focus Trap 演示;命令面板原型补 Enter 执行、Esc 关闭;快速打开移除“新 tab”文案并改为对照打开,原型索引同步统一搜索口径。 | `design/prototypes/04-settings.html` `design/prototypes/06-command-palette.html` `design/prototypes/index.html` `TODO.md` | 关闭 TODO-P1-56。 |
| Append-only apply journal 不在本轮关闭:新增 TODO-P1-59【裁决/待讨论】,要求先给出用户能理解的落盘崩溃恢复方案并经用户确认,再同步 S14/S03/S04/M17/A01/V01。 | `TODO.md` | 用户追加要求“不要把它当作本轮可直接关闭项”。 |
| `facts-degraded` 不在本轮关闭:新增 TODO-P1-60【裁决/待讨论】,S14/A01/V01 改为“项目事实库损坏恢复方案待讨论”,不再把该模式写成已裁决产品路径。 | `TODO.md` `spec/S14` `A01` `V01` | 用户追加要求“facts-degraded 模式记入 TODO 作为待讨论”。 |
| Appendix 与诊断契约清理导入导出/备份恢复残留:platform/Rxx 字段改为 manual copy acknowledgement / diagnostics bundle audit,Settings 验证只保留“无项目管理”,R05 明确诊断包不是项目事实来源、迁移来源或备份。 | `A01` `V01` `R05` `TODO.md` | 关闭 TODO-P1-55。 |
| plan 过满承诺收窄:连带修改从“全部连锁影响 / 后文零矛盾 / 拒绝不留痕”改为“确定性影响集合 + 低置信候选 + 拒绝不改作品但保留裁定历史”。 | `plan/04` `plan/08` `TODO.md` | 关闭 TODO-P1-49。 |
| 索引、章程与历史提示收口:README 显式列当前 platform 编号并补 P010 导航,platform README 标注 I04/R02 已撤销跳号,AGENTS/CLAUDE/WORKFLOW 明确主会话/整合者提交而 subagent 不提交,P000/P008 顶部增加历史归档提示。TODO 移除 TODO-P1-54、TODO-P1-57、TODO-P1-58、TODO-P2-24、TODO-P2-27,继续保留真实实测项、用户裁决项和未完成文档/原型修复项。 | `README.md` `spec/platform/README.md` `progress/README.md` `AGENTS.md` `CLAUDE.md` `WORKFLOW.md` `progress/P000-init.md` `progress/P008-plan-rewrite.md` `TODO.md` | 本 worker 收口范围。 |
| Turn canonical terminal enum 归口到 S03:S03 定义 `Completed`、`StoppedNoChange`、`Cancelled`、`Rejected`、`Applied`、`ApplyFailed`、`FailedTerminal`、`Interrupted`、`ManualRecoveryOpened` 唯一终态;S02/S04/S05/S14/M17/A03/V01 改为只引用该枚举并投影 run state、UI status、reindex health、write phase、recap/activity。 | `spec/S03` `S02` `S04` `S05` `S14` `M17` `A03` `V01` `TODO.md` | 关闭 TODO-P1-50。 |

## 2026-06-13 · docs · 存储分库 + 索引管线主线 + 实施计划 + lint 升级

| 变更 | 影响文档 | 关联 |
|---|---|---|
| 每项目数据库物理拆分为 `project.db`(真源:审批/obligation/turn 状态/fencing/经验/写入记录)与 `index.db`(派生索引,可整库删除经 R04 重建);写入记录底层形式待 TODO-P1-59 裁决,项目事实库损坏恢复语义待 TODO-P1-60 裁决。 | `spec/S14` `S01` `S05` `R04` `A01` `README.md` | 关闭"真源与派生混在 index.db"的命名与数据事故隐患。 |
| S06 新增主线《从一次保存到可查询》:触发源、指纹判定、锚点三段身份与邻接迁移、AC 词典层 vs LLM 候选层、图谱增量更新、embedding 批次、同步/异步事务边界、水位健康度衔接;锚点/差量 reindex 算法自历史归档抽回。 | `spec/S05-knowledge-graph.md` `A01` | 用户指出"文件如何索引"无一篇文档技术上讲明白。 |
| 新增 `progress/P010` 实施计划:门禁优先(V03 能力 gate),阶段 0 spike → 1 存储索引地基 → 2 最小创作闭环 → 3 写作主路径 → 4 一致性 cascade → 5 完整编辑部 → 6 质量闭环与多端打包;含依赖图、每阶段验收口径与 checkbox。 | `progress/P010-implementation-plan.md` `progress/README.md` | 用户裁决补实施计划。 |
| docs-lint 升级:CLAUDE/AGENTS 逐字一致校验、GitHub 风格锚点片段校验(`--strict-anchors`)、plan 技术词/阶段词红线扫描、原型硬编码色检测;当前仓库全部检查零命中。 | `scripts/docs-lint.js` | 章程规则机器化执行。 |

## 2026-06-13 · docs · 单实例/Tauri 裁决落地 + Settings 拆分 + 核心模式 spec 加厚

| 变更 | 影响文档 | 关联 |
|---|---|---|
| 裁决应用为单实例单窗口:一机一桌面壳进程/一执行宿主/一个作者窗口,二次启动只聚焦既有窗口,不创建第二窗口;多窗口写入权切换与窗口接管协议不再作为产品形态。R01 状态机删 TakingOver/LeaseLost。 | `spec/platform/I05` `I03` `R01` `spec/S00` `S01` `S03` `S04` `S05` `A01` `V01` `plan/04` | 用户裁决"只允许开一个实例",并追加裁决"不允许多窗口"。 |
| 裁决桌面壳选型 Tauri(多端 macOS/Windows/Linux);执行宿主写为 Tauri 管理的 sidecar,进程形态与 native binding 兼容性归 V03 实查;README 技术栈表新增桌面壳行。 | `README.md` `spec/S00` `spec/platform/I05` `spec/appendix/V03` `TODO.md` | 用户裁决 Tauri、要做多端。 |
| Settings 与 Developer Mode 拆为两篇独立 M 文档:S15 删除,内容拆至 M14(Settings,改名 `M14-settings.md`)、M15(首启)、新增 M18(Developer Mode 只读诊断)、I05(凭据主权);全仓 S15 引用重定向,design/04 persona 名单修正为正典五位、Agents 行补可关矩阵约束。 | `spec/M14-settings.md` `spec/M18-developer-mode.md` `spec/M15` `design/04` 及全仓引用 | 用户裁决 Settings 与 Developer Mode 各自单独成 M。 |
| M05/M06 按反模板纪律加厚为完整能力闭环:M06 以"写第 38 章的一天"贯穿备料→概要→流式草稿→三路审查汇合→审批→recap→润色;M05 补规划产物清单、改设定 cascade、规划产物如何武装写作;S04 模式闸门补"规划 cascade 可含必需正文替换 item"澄清。 | `spec/M05` `spec/M06` `spec/S04` | 旗舰路径 spec 过薄。 |
| 小修复批:ReaderPanel 风险信号四类枚举上移 M11 为行为主权;移除 `Cmd+Shift+A` 快捷键(易冲突、低频);A04 新增"用户可见默认值登记"表;P001-P003 头部加归档注。 | `spec/M11` `spec/M02` `design/02` `design/03` `spec/appendix/A04` `progress/P001-P003` | 本轮文档评审遗留项。 |

## 2026-06-12 · docs/decision · 用量指标替代预算控制

| 变更 | 影响文档 | 关联 |
|---|---|---|
| plan:原则七由“成本透明可控”改为“用量透明”——每一轮消耗了什么、各角色用了多少随时可查,高消耗能力可单独关闭;全篇“省钱/高成本”措辞改为“节省消耗/高消耗”;用量随时可见段改为用量指标表述。 | `plan/01-overview.md` `plan/02-principles.md` `plan/06-agent-team.md` | 用户裁决 POC 不做预算与成本控制,只保留 token/cache/context 技术指标透明。 |
| spec:S04 preflight 删除成本/预算维度(价格输入行、成本确认、预算状态机),改为用量指标可见 + preflight 只解释范围/批次/等待/取消点;S07 “成本与延迟预算”改写为“context 体量与批次”;I01 “成本和上限主权”改写为“上限和限流主权”,删计费单位/价格行,needs data 仅对上限未知成立;S08 终局预算校验改名终局体量校验;S15/M14 Usage 分区改为 token 消耗、cache 命中、context 用量等技术指标;M09/S00/S01/S02/S03/S05/S10/S11/S12/M13/A01/A03/V01/V02/V03 面向用户的“成本”字眼统一为“用量/体量”,事件与字段级 cost 记录保留。 | `spec/S00-system-contract.md` `spec/S14-project-storage.md` `spec/S01-runtime-state.md` `spec/S02-agent-runner.md` `spec/S03-turn-orchestration.md` `spec/S04-streaming-ui-protocol.md` `spec/S06-context-management.md` `spec/S07-prompt-system.md` `spec/S09-llm-quality-harness.md` `spec/S10-evaluation-and-golden-regression.md` `spec/S11-creative-engine.md` `spec/S15(已拆分)` `spec/M09-trace-observability.md` `spec/M13-agent-team-controls.md` `spec/M14-settings.md` `spec/platform/I01-llm-provider-contract.md` `spec/appendix/A01-schema-tables.md` `spec/appendix/A03-event-catalog.md` `spec/appendix/V01-test-matrix.md` `spec/appendix/V02-golden-cases.md` `spec/appendix/V03-external-spikes.md` | — |
| design:设置页删除月度预算输入、用量进度条与“预算触顶暂停”状态,改为只读用量指标(本月 token 消耗、cache 命中率等);Trace 面板头部“本 turn 成本”改“本 turn 用量”;onboarding 删成本预估承诺;对应原型同步最小修改。 | `design/01-main-layout.md` `design/04-settings.md` `design/05-onboarding.md` `design/prototypes/01-main-layout.html` `design/prototypes/04-settings.html` `design/prototypes/05-onboarding.html` | 角色档位与开关保留不动。 |

## 2026-06-12 · docs/decision · 移除导入导出与备份恢复

| 变更 | 影响文档 | 关联 |
|---|---|---|
| 用户裁决:POC 阶段不做任何导入导出功能,备份恢复一并移除;“数据归你”由作品本身是本机纯文本文件满足(任何编辑器可开、整目录复制即迁移)。删除 `spec/platform/I04-import-export-contract.md` 与 `spec/platform/R02-backup-restore.md`。 | `spec/platform/I04-import-export-contract.md`(删除) `spec/platform/R02-backup-restore.md`(删除) `spec/platform/README.md` `README.md` `WORKFLOW.md` | 数据归你原则改写见 `plan/02-principles.md` 原则六。 |
| plan 全量去除导出/导入/备份承诺:原则六改为本机纯文本 + 整目录带走;非目标“云同步/平台自动发布”措辞改为整目录复制即迁移、正文即本机文件自行取用;审批历史“导出日志”段删除;经验“一键导出导入”改为随项目数据留在本机;“导出成稿”类措辞改为标记可发布/发布本章。 | `plan/01-overview.md` `plan/02-principles.md` `plan/04-goals-and-non-goals.md` `plan/08-approval-and-cascade.md` `plan/09-narrative-and-reader.md` `plan/10-memory-and-learning.md` | — |
| spec 清理:S15 设置导出语义整节删、首启导入分支删;M08 审批历史导出整节删;M17 Recap/Activity 导出整节删;M15 导入分支删;当时将项目事实库损坏恢复收为以作者文件为准重建最小事实库,该命名和产品语义已由本轮 TODO-P1-60 重新标为待讨论;R03 收为 schema/index 两版本模型、迁移前提示手动复制项目目录并显式确认(不可逆);R01 删除操作改为明确不可恢复提示;R04/R05 对 R02 的恢复引用改指 S14;I05/S00/S01/S07/S08/S13/M14/M16 相关措辞清理;“导入资料”围栏语义改为“外部粘贴/拖入的资料”。 | `spec/S00-system-contract.md` `spec/S14-project-storage.md` `spec/S01-runtime-state.md` `spec/S07-prompt-system.md` `spec/S08-agent-tooling-boundary.md` `spec/S13-editor-and-interaction.md` `spec/S15(已拆分)` `spec/M08-approval-cascade.md` `spec/M14-settings.md` `spec/M15-onboarding-and-new-book.md` `spec/M16-project-library-and-navigation.md` `spec/M17-turn-recap-and-continuation.md` `spec/platform/R01-project-lifecycle.md` `spec/platform/R03-migration-and-upgrade.md` `spec/platform/R04-index-health-and-repair.md` `spec/platform/R05-diagnostics-and-debug-mode.md` `spec/platform/I05-desktop-shell-contract.md` | R05 诊断包导出保留(排障用途,非数据迁移)。 |
| appendix 与 design 清理:A01 删 backup manifest / import-export manifest / project package export inventory 字段族;A04 platform tools 行去掉 import/export、backup/restore;V01 删备份/恢复/项目包导出导入验证行(诊断包预览/脱敏保留);design/04 与 design/05 及对应原型删导入项目包、导出 zip、整体设置导入导出、首启导入分支等 UI;命令面板原型删“导出当前项目”。 | `spec/appendix/A01-schema-tables.md` `spec/appendix/A04-tool-catalog.md` `spec/appendix/V01-test-matrix.md` `design/04-settings.md` `design/05-onboarding.md` `design/06-command-palette.md` `design/prototypes/03-reader-panel.html` `design/prototypes/04-settings.html` `design/prototypes/05-onboarding.html` `design/prototypes/06-command-palette.html` | — |
| spec-archive 历史归档同步清理:`progress/spec-archive/` 整目录删除,旧 29 篇 spec 原文不再保留;相关引用改写为“历史原文已清理”。 | `progress/spec-archive/*`(删除) `progress/README.md` `spec/appendix/README.md` `spec/appendix/A06-migration-notes.md` `README.md` | — |

## 2026-06-12 · docs/design · 剩余设计与体验 TODO 收口

| 变更 | 影响文档 | 关联 |
|---|---|---|
| Approval Cascade 设计与原型改为 dependency group / atomic group 裁决:必需一致性项锁定同组接受或同组拒绝,只有独立低置信项可搁置并生成 residual obligation;原型补真实 hover 联动、ApplyFailed/部分失败态、词级 diff 和同模式聚合摘要。 | `design/02-approval-cascade.md` `design/prototypes/02-approval-cascade.html` | 关闭 TODO-P0-03、TODO-P2-18;承接 TODO-P2-22 的词级 diff 与同模式聚合。 |
| ReaderPanel 设计与原型补叙事诊断区块:章内四维体检、趋势地形图、历史快照、旧章重跑、单维度重跑和 inconclusive/人工判断态;persona 增加近邻色 token 和首字识别。 | `design/03-reader-panel.md` `design/prototypes/03-reader-panel.html` `design/00-design-tokens.md` `design/prototypes/tokens.css` | 关闭 TODO-P1-29;承接 TODO-P2-22 的 persona 识别。 |
| 体验提升簇落入主权文档:中文排版契约、自动滚动备份、run 内工具结果缓存、turn 成本预算 / cascade preflight 一等状态、风格来源分级防 AI 回声室、单条 stale freshness marker。 | `design/00-design-tokens.md` `spec/platform/R02-backup-restore.md` `spec/S02-agent-runner.md` `spec/S08-agent-tooling-boundary.md` `spec/S03-turn-orchestration.md` `spec/S12-style-and-humanizer.md` | 关闭 TODO-P2-22。 |
| TODO 仅保留必须真实实测才能关闭的两项:heavy SQLite/reindex stream heartbeat 与 long-form impact/cascade 能力 spike。 | `TODO.md` | 活跃 TODO 收缩为 TODO-P1-22、TODO-P1-43。 |

## 2026-06-12 · docs/todo · 主权链路与剩余 TODO 大收口

| 变更 | 影响文档 | 关联 |
|---|---|---|
| S14/S03/S04/S02/S08/A01/A02/A03/V01 补写入记录、轻量写入事务、崩溃前滚/恢复、持久 turn 状态、recap 触发、obligation/action queue、EditedAccepted 重检、取消/超时/interrupted run 与工具 cancelability;写入记录底层形式后续由 TODO-P1-59 裁决。 | `spec/S14-project-storage.md` `spec/S03-turn-orchestration.md` `spec/S04-streaming-ui-protocol.md` `spec/S02-agent-runner.md` `spec/S08-agent-tooling-boundary.md` `spec/appendix/A01-schema-tables.md` `spec/appendix/A02-json-schemas.md` `spec/appendix/A03-event-catalog.md` `spec/appendix/V01-test-matrix.md` | 关闭 TODO-P0-01、TODO-P0-04、TODO-P0-05、TODO-P1-03、TODO-P1-07、TODO-P1-08、TODO-P1-10、TODO-P1-11、TODO-P1-12、TODO-P1-13。 |
| plan/07/S04/M07/S00 补三模式主权、重启恢复、模式切换阻断、写作模式 planning prerequisite 和 XState 实现边界;写作发现必须改设定时不越权,先生成规划前置。 | `plan/07-collaboration-and-modes.md` `spec/S03-turn-orchestration.md` `spec/M07-inline-rewrite-and-humanizer.md` `spec/S00-system-contract.md` | 关闭 TODO-P0-02、TODO-P1-15。 |
| S07/S08/I01/S06/S12/S11/V03 补 prompt packet 终局预算、provider runtime failure taxonomy、embedding 能力契约、volume/as-of chapter、dependency 兑现窗口、误报回流、增量质检、quality gate 判定与 re-baseline。 | `spec/S06-context-management.md` `spec/S07-prompt-system.md` `spec/platform/I01-llm-provider-contract.md` `spec/S05-knowledge-graph.md` `spec/S11-creative-engine.md` `spec/S10-evaluation-and-golden-regression.md` `spec/appendix/V03-external-spikes.md` | 关闭 TODO-P1-09、TODO-P1-21、TODO-P1-23、TODO-P1-25、TODO-P1-26、TODO-P1-28、TODO-P2-15;收窄 TODO-P1-22 为待真实 spike 结果。 |
| R04/M01/M10/S02/plan/02/plan/05 拆清 pre-apply blocked 与 post-apply reindex failure,补 pending 事实不进派生展示、Search stale/freshness、recent object 项目隔离、纯文本源文件与派生资料边界、伏笔卡兑现窗口。 | `spec/platform/R04-index-health-and-repair.md` `spec/M01-universal-search.md` `spec/M10-knowledge-surface.md` `spec/S01-runtime-state.md` `plan/02-principles.md` `plan/05-story-world.md` | 关闭 TODO-P1-04、TODO-P2-09、TODO-P2-19。 |
| S15/I05/I04/R05/M08/M17/S14/M02/A01/V01 和 Settings/Onboarding 原型补安全凭据库、凭据导出剔除、诊断包分类/预览/脱敏阻断、项目包经验/审批/recap 导出、桌面快捷键/IME 冲突、workspace-first onboarding、Settings Memory/Rules/Agents/ReaderPanel 控制面与搜索。 | `spec/S15(已拆分)` `spec/platform/I05-desktop-shell-contract.md` `spec/platform/I04-import-export-contract.md` `spec/platform/R05-diagnostics-and-debug-mode.md` `spec/M08-approval-cascade.md` `spec/M17-turn-recap-and-continuation.md` `spec/S13-editor-and-interaction.md` `spec/M02-command-palette-and-quick-open.md` `design/04-settings.md` `design/05-onboarding.md` `design/prototypes/04-settings.html` `design/prototypes/05-onboarding.html` | 关闭 TODO-P1-20、TODO-P1-32、TODO-P2-01、TODO-P2-02、TODO-P2-20;收窄 TODO-P2-18 为 Approval Cascade 原型 02 剩余。 |
| README/S03/M13/A04 新增 docs lint 并修正 runner/目录真实性:README 不再宣称未落主权清单的“13 个 runner”,当前目录树只列实际文档/脚本结构,未来应用工程目录另行说明。 | `README.md` `spec/S02-agent-runner.md` `spec/M13-agent-team-controls.md` `spec/appendix/A04-tool-catalog.md` `scripts/docs-lint.js` | 关闭 TODO-P2-23。 |
| TODO 移除已关闭条目,仅保留 6 个活跃项:Approval Cascade 原子组原型(P0-03/P2-18)、SQLite/reindex stream 实测(P1-22)、ReaderPanel 叙事诊断设计(P1-29)、长篇能力真实 spike(P1-43)、体验提升簇(P2-22)。 | `TODO.md` | 后续无需用户裁决的剩余项继续按设计原型和 spike 批次推进。 |

## 2026-06-12 · docs/platform · 存储与可靠性 TODO 收口

| 变更 | 影响文档 | 关联 |
|---|---|---|
| S14/I03/A01/V01 补项目事实库损坏恢复待讨论项、持久文件指纹、write token 自写回声与 fencing 残留写入防护;明确文件与事实账本冲突时作者文件优先。 | `spec/S14-project-storage.md` `spec/platform/I03-filesystem-and-watcher.md` `spec/appendix/A01-schema-tables.md` `spec/appendix/V01-test-matrix.md` | 关闭 TODO-P1-16、TODO-P1-17;恢复命名后续由 TODO-P1-60 裁决。 |
| R02 补备份一致性静止点、manifest 水位和恢复前置条件;恢复后审批重新判定并进入 R04 reindex/degraded 收场。 | `spec/platform/R02-backup-restore.md` | 关闭 TODO-P1-18、TODO-P2-11。 |
| R03/R01/I04 补 schema/index/package 三版本模型、项目包 manifest、Migrating 态、同 id 导入语义和 forward-compat 拒开;R04 补 repair job 按水位幂等重入。 | `spec/platform/R03-migration-and-upgrade.md` `spec/platform/R01-project-lifecycle.md` `spec/platform/I04-import-export-contract.md` `spec/platform/R04-index-health-and-repair.md` | 关闭 TODO-P1-19;收窄 TODO-P2-19、TODO-P2-20。 |

## 2026-06-12 · docs/spec · M 层与 appendix TODO 收口

| 变更 | 影响文档 | 关联 |
|---|---|---|
| Approval Cascade 补 EditedAccepted 轻量重检、Invalidated 投影、obligation 生命周期、多审批卡队列和拒绝理由重做回路;Creative Engine/Writing 明确审批前质检汇合和 no-change-evidence。 | `spec/M08-approval-cascade.md` `spec/S11-creative-engine.md` `spec/M06-writing-mode.md` `spec/appendix/A02-json-schemas.md` `spec/appendix/A03-event-catalog.md` `spec/appendix/V01-test-matrix.md` | 收窄 TODO-P1-11、TODO-P1-12、TODO-P1-13。 |
| Knowledge Graph/Surface/Fact Query 补实体身份治理、别名确认、合并/拆分、as-of chapter 查询和全局 obligation 清单;保留 A01 存储字段为剩余 TODO。 | `spec/S05-knowledge-graph.md` `spec/M10-knowledge-surface.md` `spec/M03-fact-query.md` | 收窄 TODO-P1-27。 |
| ReaderPanel/S12/V02 补叙事诊断的章内四维体检、趋势/存档、旧章和单维度重跑;design/prototype 剩余范围保留在 TODO。 | `spec/M11-reader-panel.md` `spec/S11-creative-engine.md` `spec/appendix/V02-golden-cases.md` | 收窄 TODO-P1-29。 |
| Planning/A05 承接结构模板库为只读参照;M13/S09/A04 明确 BeatAnalyzer 是 checker 内部工具,Validator/Checker failure envelope 归口。 | `spec/M05-planning-mode.md` `spec/appendix/A05-prompt-templates.md` `spec/M13-agent-team-controls.md` `spec/S08-agent-tooling-boundary.md` `spec/appendix/A04-tool-catalog.md` | 关闭 TODO-P1-30、TODO-P2-12。 |
| A03 补 turn/attempt/seq/step/delta 去重身份;M04 补拒绝后回 Discuss 回边;M07 补批阅层未决标记生命周期;S15 承接 Assistant Persona 设置边界。 | `spec/appendix/A03-event-catalog.md` `spec/M04-discuss-mode.md` `spec/M07-inline-rewrite-and-humanizer.md` `spec/S15(已拆分)` | P2-16 的 A03 部分已落地;关闭 TODO-P2-21。 |

## 2026-06-12 · docs/design · 产品设计闭环 TODO 收口

| 变更 | 影响文档 | 关联 |
|---|---|---|
| 补齐审批聚焦卡焦点守卫、拒绝必填反馈、对照视图、召唤层并存层级、对照审批、toast placement 与 Onboarding Enter/IME/必填契约;对应原型同步演示。 | `design/01-main-layout.md` `design/02-approval-cascade.md` `design/05-onboarding.md` `design/06-command-palette.md` `design/prototypes/01-main-layout.html` `design/prototypes/02-approval-cascade.html` `design/prototypes/05-onboarding.html` `design/prototypes/06-command-palette.html` | 关闭 TODO-P1-33/P1-34/P1-35/P1-36/P1-40/P2-03/P2-14。 |
| ReaderPanel 增加风险勾选与 report→action 两条产品出路;视觉 token 落高对比变量、纸面边界、状态点命中区、五态状态点和字号/间距 token。 | `plan/09-narrative-and-reader.md` `design/03-reader-panel.md` `design/00-design-tokens.md` `design/prototypes/03-reader-panel.html` `design/prototypes/tokens.css` | 关闭 TODO-P1-37/P2-17。 |
| 审批原型补阻断级演示、对照审批底部条、拒绝 danger 提交;P2-18 保留 Settings 搜索交互分叉和不在本批范围的原型细节。 | `design/prototypes/02-approval-cascade.html` `TODO.md` | 收窄 TODO-P2-18。 |

## 2026-06-12 · docs/cleanup · 运行时门禁与 plan 口径收敛

| 变更 | 影响文档 | 关联 |
|---|---|---|
| S00 主路径拆清运行时校验/创作风险与开发期 Harness/Golden Regression;S10/S11 继续作为记录、回放和合入门禁。 | `spec/S00-system-contract.md` `spec/S09-llm-quality-harness.md` `spec/S10-evaluation-and-golden-regression.md` | 关闭 TODO-P1-01。 |
| Prompt 层级改为当前用户指令压过历史经验和默认偏好,但仍不能覆盖系统律、审批和工具边界;S02/S13 同步经验优先级。 | `spec/S07-prompt-system.md` `spec/S01-runtime-state.md` `spec/S12-style-and-humanizer.md` | 关闭 TODO-P1-02。 |
| R5/R6 收窄为“有审定才学习”和“已入故事世界/显式关系/可追踪引用可确定列出”;纯讨论不沉淀经验,疑似语义影响只作低置信候选。 | `plan/03-guardrails.md` `plan/10-memory-and-learning.md` | 关闭 TODO-P1-05、TODO-P1-06。 |
| plan 层移除本地 Web/桌面壳双路线和模型档位实现映射,改为本地桌面级工作台与产品级用量档位;长历史与本轮 context package 的分层由 S02/S07 既有契约承接。 | `plan/04-goals-and-non-goals.md` `plan/06-agent-team.md` `spec/S01-runtime-state.md` `spec/S06-context-management.md` | 关闭 TODO-P2-08、TODO-P2-10。 |
| S03 事件措辞从“可恢复事件”收窄为“可去重事件”,A03 落 `project_id/turn_id/attempt_id/step_id/seq/event_kind` 去重键,并要求 text delta 额外带 `delta_id`。 | `spec/S02-agent-runner.md` `spec/appendix/A03-event-catalog.md` | 关闭 TODO-P2-16。 |

## 2026-06-12 · docs/decision · Cascade 成本与延迟预算归口

| 变更 | 影响文档 | 关联 |
|---|---|---|
| 新增 cascade preflight 契约:S07 负责 context 体量、批次建议和预算来源,S04 负责用户可见 preflight、分批、checkpoint、needs-data/blocked 收场。 | `spec/S06-context-management.md` `spec/S03-turn-orchestration.md` | 关闭 TODO-P1-44。 |
| I01 明确 provider 成本、上下文上限、限流、fallback 差异和失败分类是模型侧事实来源;未知时全书级 cascade 只能进入 `needs data` 或 `blocked`。 | `spec/platform/I01-llm-provider-contract.md` | P1-43 的 spike 结果仍是估算输入。 |
| plan/08 增加产品级执行预览:全书级连带修改开始前说明范围、批次、确认点、证据状态和取消后的收场。 | `plan/08-approval-and-cascade.md` | 不写技术参数,只承接用户体验。 |
| TODO 移除已关闭的 TODO-P1-44。 | `TODO.md` | P1-23/P2-22 后续按该预算归口分别收口。 |

## 2026-06-12 · docs/gate · 长篇能力成立性门禁

| 变更 | 影响文档 | 关联 |
|---|---|---|
| 将「改完连带改 / 百万字一致性」前置为能力成立性 gate:实施前必须用长篇语料或等价 fixture 证明影响分析召回/精确、分段 delta 稳定性、cascade 成本/延迟。 | `spec/appendix/V03-external-spikes.md` `spec/appendix/V02-golden-cases.md` | TODO-P1-43 进入待实测证据状态。 |
| S07/S06/S12 写明 gate 未通过时的降级:低置信审查、人工确认、承诺收窄、裁判链重设计或分批 cascade;不得把未验证能力包装成“已全书检查”。 | `spec/S06-context-management.md` `spec/S05-knowledge-graph.md` `spec/S11-creative-engine.md` | 关闭文档缺口,不关闭外部 spike 缺口。 |
| TODO-P1-43 从“V03 无能力 spike”更新为“gate 已落文档,等待真实 spike 结果回写后关闭”。 | `TODO.md` | 保留为实施前验证项。 |

## 2026-06-12 · docs/decision · 桌面壳主形态裁决

| 变更 | 影响文档 | 关联 |
|---|---|---|
| 裁决 Open Novel 的唯一主产品形态为本机桌面壳应用,开发调试也走桌面壳开发模式;不再保留基于普通浏览器的 Web 调试入口。 | `spec/S00-system-contract.md` `spec/platform/I05-desktop-shell-contract.md` | 关闭 TODO-P1-42。 |
| 壳内常驻执行宿主/sidecar 拥有 runner、SQLite/native binding、watcher、fencing、写入记录、安全凭据和长任务生命周期;renderer 只发送命令、订阅 stream、展示持久状态。 | `spec/S02-agent-runner.md` `spec/S04-streaming-ui-protocol.md` `spec/S14-project-storage.md` | P1-07/P1-20/P1-22/P2-20 后续按此形态继续收口;写入记录底层形式后续由 TODO-P1-59 裁决。 |
| TODO 移除已裁决的 TODO-P1-42,保留其他依赖项等待逐项修复。 | `TODO.md` | 用户裁决为“纯桌面壳调试”。 |

## 2026-06-12 · docs/decision · ReaderPanel 风险信号裁决

| 变更 | 影响文档 | 关联 |
|---|---|---|
| 裁决 ReaderPanel 只输出弃读风险信号,不输出留存预测、发布建议或“可发布/应重写”聚合结论;报告只展示风险信号、证据位置、来源 persona 和可选处理方向。 | `plan/09-narrative-and-reader.md` `spec/M11-reader-panel.md` | 关闭 TODO-P1-31。 |
| 设计与原型删除“可发布 / 小修 / 重做建议”发布裁判心智和“留存环”图形,改为「风险低 / 需留意 / 风险集中 / 证据不足」风险信号。 | `design/03-reader-panel.md` `design/prototypes/03-reader-panel.html` | 用户选择方案 A。 |
| TODO 移除 P009 中最后一个【裁决】项;当前仍有同日架构评审新增的 TODO-P1-42【裁决】待处理。 | `TODO.md` | 继续按 TODO 表逐项裁决。 |

## 2026-06-12 · docs/todo · 架构评审 TODO 回填

| 变更 | 影响文档 | 关联 |
|---|---|---|
| 2026-06-12 架构评审结论回填 5 条:TODO-P0-05(落盘/恢复/recap/trace 统一写入记录底座,具体 append-only 形式已由本轮 TODO-P1-59 重新标为待讨论)、TODO-P1-42【裁决】(应用形态与执行宿主,收 P1-07/P1-20/P1-22/P2-20 公共分叉)、TODO-P1-43(影响分析召回/delta 稳定性/cascade 成本在真实长篇语料零验证,标 gating 先于 infra spike)、TODO-P1-44(全书级成本与延迟预算契约)、TODO-P2-23(README「13 个 runner」、目录树与 docs lint 真实性簇)。 | `TODO.md` | 用户要求“都记到 todo 里”;评审总判断:主权分层、提议-审定-落盘与失败语义骨架成立,风险集中在未验证能力赌注与未裁决形态。 |
| TODO 表头补记同日架构评审为条目来源;与 P009 条目同表续编号,已用编号(P1-41)不复用。 | `TODO.md` | 后续按【裁决】→ spike → 批次修复顺序收敛。 |

## 2026-06-12 · docs/decision · 经验冲突仲裁裁决

| 变更 | 影响文档 | 关联 |
|---|---|---|
| 裁决经验冲突为“显式询问”:Reflector 发现新旧经验互相否定时不自动覆盖旧经验,也不静默丢弃新经验;候选进入待确认状态,由用户选择采用新经验、保留旧经验或两条都不用。 | `plan/10-memory-and-learning.md` `spec/S01-runtime-state.md` `spec/M12-memory-learning-management.md` | 关闭 TODO-P1-24。 |
| Experience / Reflector 字段归口补 `pending_confirmation`、冲突对象 id 和冲突确认审计;待确认经验不得注入 context。 | `spec/appendix/A01-schema-tables.md` | 用户选择方案 C。 |
| TODO 移除已裁决的 TODO-P1-24。 | `TODO.md` | P009 裁决项随后继续逐项处理。 |

## 2026-06-12 · docs/decision · 待审期间输入策略裁决

| 变更 | 影响文档 | 关联 |
|---|---|---|
| 裁决待审期间交互策略为「写入锁定、只读放行」:pending approval 存在时禁止写入、生成新 ChangeSet、接受跨文档改写、切换可写模式或影响审批前置条件;查询、搜索、打开文档、Trace 和只读讨论仍可用,但必须标注当前待审状态且不能改变审批。 | `plan/08-approval-and-cascade.md` `spec/S03-turn-orchestration.md` `spec/S13-editor-and-interaction.md` `spec/M04-discuss-mode.md` `design/01-main-layout.md` | 关闭 TODO-P1-14。 |
| 主界面 await_approval 状态从输入条全锁改为只读讨论可用、写入动作锁定,避免“审批永不过期”导致工作台长期冻结。 | `design/01-main-layout.md` | 与 S04/S14 的并发和命令路由口径一致。 |
| TODO 移除已裁决的 TODO-P1-14,保留剩余两个【裁决】项继续逐项确认。 | `TODO.md` | 用户选择方案 A。 |

## 2026-06-12 · docs/todo · 首批 P009 确定性问题修复

| 变更 | 影响文档 | 关联 |
|---|---|---|
| 命令面板审批命令从「cascade 全部同意」降级为「打开待审审批卡」,补齐 ReaderPanel 的「运行 / 打开最近报告」入口与空态;toast 操作从即时「撤销」改为查看回执 / 前向修正入口。 | `design/06-command-palette.md` `design/prototypes/06-command-palette.html` `spec/M02-command-palette-and-quick-open.md` `spec/M11-reader-panel.md` `design/03-reader-panel.md` | 关闭 TODO-P1-38、TODO-P1-39、TODO-P2-04。 |
| Settings 归档语义改为可随时恢复,原型归口标签修正为 S15/M14 与 S14/M01;R01 状态图去掉未定义 `Open` 节点,M12/M14 的 S15 链接标签同步修正。 | `design/04-settings.md` `design/prototypes/04-settings.html` `spec/platform/R01-project-lifecycle.md` `spec/M12-memory-learning-management.md` `spec/M14-settings.md` | 关闭 TODO-P1-41、TODO-P2-05、TODO-P2-13。 |
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
| S 层从 `S00-S11` 扩展为 `S00-S15`:`S03` 收窄为 Agent Runner,`S07` 收窄为 Context Management,新增 `S07 Prompt System`、`S08 Agent Tooling Boundary`、`S09 LLM Quality Harness`、`S10 Evaluation And Golden Regression`;原 Creative/Style/Editor/Settings 后移为 `S12-S15`。 | `README.md` `spec/S00-system-contract.md` `spec/S02-agent-runner.md` `spec/S06-context-management.md` `spec/S07-prompt-system.md` `spec/S08-agent-tooling-boundary.md` `spec/S09-llm-quality-harness.md` `spec/S10-evaluation-and-golden-regression.md` `spec/S12-S15` | 关闭“context / prompt / runner / tool / harness / golden 没有系统主权层”的文档缺口。 |
| Appendix 反链按新主权层重归口:`A05` 只放 prompt 模板全文,`A04` 只放工具参数明细,`V01/V02/V03` 分别承接测试矩阵、golden 明细和外部 spike;质量门禁语义上移到 S10/S11。 | `spec/appendix/README.md` `A01-A05` `V01` `V02` `V03` `spec/platform/I01` | 关闭 prompt/harness/golden 只有明细、没有门禁的问题。 |
| TODO 活跃表收口为“开放问题入口”:已归口的架构风险写入对应 plan/spec/platform/appendix,真实依赖验证进入 `V01/V03`,不再在 TODO 中重复漂浮。 | `TODO.md` `spec/appendix/V01-test-matrix.md` `spec/appendix/V03-external-spikes.md` | 用户要求把剩余 TODO 一并清理。 |
| 补齐剩余架构契约:Approval Cascade dependency group / residual obligation / writing-blocked,项目级 lock/lease,watcher cursor / reconcile / repair job,canonical agent role id,桌面壳生产包装边界。 | `plan/04` `plan/08` `spec/S01` `spec/S04` `spec/M08` `spec/M13` `spec/platform/I03` `spec/platform/I05` `spec/platform/R01` `spec/platform/R04` | 关闭本轮 plan/spec/design 复查中可通过文档主权关闭的缺陷。 |
| design 与原型同步风险语言和 ReaderPanel 心智:Approval 风险统一为「提示级 / 确认级 / 阻断级」,ReaderPanel 去掉 0-100 留存预测总分,改为分类风险和多人共识。 | `design/02-approval-cascade.md` `design/03-reader-panel.md` `design/prototypes/02-approval-cascade.html` `design/prototypes/03-reader-panel.html` `design/00-design-tokens.md` | 关闭 design 与 plan/spec 的风险枚举和评分心智冲突。 |

## 2026-06-12 · docs · 文档待办清理与 appendix 覆盖矩阵

| 变更 | 影响文档 | 关联 |
|---|---|---|
| 风险等级产品命名统一为「提示级 / 确认级 / 阻断级」,plan 不再暴露 `critical` / `blocking` 实现枚举;S04 FAQ 同步使用中文风险名。 | `plan/03-guardrails.md` `plan/08-approval-and-cascade.md` `spec/S03-turn-orchestration.md` `TODO.md` | 关闭“风险三档命名中英混用”文档待办。 |
| appendix 新增抽取完成口径:历史归档不再整体搬回 active appendix,实现某个 `S/M/platform` 前只按触发场景补必要 A/V 明细。 | `spec/appendix/README.md` `TODO.md` | 关闭“appendix 明细抽取”文档待办,避免 appendix 重新变成历史垃圾桶。 |
| A/V 初始覆盖矩阵补齐到字段、schema、事件、工具、prompt、测试和 golden 七类明细,覆盖 `M01-M17` 与 `platform/I/R` 的实现前检查口径。 | `spec/appendix/A01-schema-tables.md` `spec/appendix/A02-json-schemas.md` `spec/appendix/A03-event-catalog.md` `spec/appendix/A04-tool-catalog.md` `spec/appendix/A05-prompt-templates.md` `spec/appendix/V01-test-matrix.md` `spec/appendix/V02-golden-cases.md` `TODO.md` | 关闭“M/platform 明细深化”文档待办,后续具体字段随实现进入对应 A/V。 |

## 2026-06-11 · spec+design · M17 Turn Recap 与 forward-only 历史语义

| 变更 | 影响文档 | 关联 |
|---|---|---|
| 新增 `M17 Turn Recap And Continuation`:把每个 turn 的完成、停止、失败、待审、拒绝、放弃、已落盘和已修正都写成作者可读的项目活动记录;明确 Recap 是用户 changelog,不是作品事实、Trace step 或 Reflector 经验。 | `spec/M17-turn-recap-and-continuation.md` `README.md` `spec/S00-system-contract.md` | 用户确认普通作者不会使用 Git,recap 对他们就是最重要的变更记录。 |
| 收敛取消和历史修正语义:运行中且未产生 durable change 时停止不需二次确认,但必须留下 stopped recap;已有待审、落盘或不可自动恢复风险时进入 cancel plan;撤销和恢复都生成新的反向修改或恢复提案,经审定后向前追加历史。 | `spec/S03-turn-orchestration.md` `spec/S13-editor-and-interaction.md` `spec/M08-approval-cascade.md` `spec/S14-project-storage.md` `plan/05-story-world.md` `plan/08-approval-and-cascade.md` | 关闭“取消入口仍需统一到同一个 rollback 语义”TODO,用户侧不暴露 Git 式回退。 |
| UI 和过程可见性接入 recap:状态点新增 stopped recap 表现,Trace 顶部可展示最近 turn recap,S05 增加 `recap ready` 展示协议,M09 明确 Recap 与 Trace 的边界。 | `design/01-main-layout.md` `spec/S04-streaming-ui-protocol.md` `spec/M09-trace-observability.md` | 对齐“终止前内容做简单 recap,挂在界面上”的交互要求。 |
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
| 将系统总契约纳入批阅建议路径:Agent 输出形态从回答 / 报告 / proposal 扩展为回答 / 报告 / 批阅建议 / proposal,写入节点统一称为作者审定。 | `spec/S00-system-contract.md` `spec/S13-editor-and-interaction.md` `spec/platform/I02-editor-adapter-contract.md` | 避免 S00/I02 只承认审批后落盘,遗漏 inline review 接受后的 editor undo 路径。 |
| 补齐 inline review 的 appendix 归口:批阅建议 schema、inline review 事件进入 A02/A03,实现明细仍后置到 appendix。 | `spec/appendix/A02-json-schemas.md` `spec/appendix/A03-event-catalog.md` | 核心 spec 已定义行为,appendix 需要承接字段与事件明细。 |
| 清理 design 与原型旧 UI 命名:ChatBox、ThinkingPanel、DebugConsole、FileTree 等残留改为输入条、Trace、Developer Console、库面板;Onboarding 改为“就地确认 + 审批卡”双层心智。 | `design/00-design-tokens.md` `design/03-reader-panel.md` `design/05-onboarding.md` `design/prototypes/04-settings.html` `design/prototypes/05-onboarding.html` `design/prototypes/tokens.css` | 避免旧五区心智继续污染写作优先主界面契约。 |
| 更新剩余 TODO:design 同步项从 02-05 全部残留缩小到 design/02 审批卡复查与 01 原型全局搜索热键。 | `TODO.md` | 本轮已处理 03/04/05 的明显旧命名和 onboarding 旧审批口径。 |

## 2026-06-11 · spec+design · Inline Review 默认路径与跨文档 Cascade 边界

| 变更 | 影响文档 | 关联 |
|---|---|---|
| 将轻量选区改写和 Humanizer 的默认路径从审批卡改为正文批阅层:句内 / 小选区在原文附近展示修订痕迹、近文小注和接受 / 拒绝 / 重试;接受后才替换并进入编辑器 undo。 | `spec/M07-inline-rewrite-and-humanizer.md` `spec/S12-style-and-humanizer.md` `spec/S13-editor-and-interaction.md` | 用户明确轻量 editor accept 是大多数场景,希望像高级批阅而不是卡片审批。 |
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
| 技术设计取舍(ADR)迁移:旧 plan/03、plan/04、plan/08 的技术 ADR 分别入 [spec/S05](./spec/S13-editor-and-interaction.md)、[spec/S01](./spec/S14-project-storage.md) 与 [spec/17](./spec/S05-knowledge-graph.md)、[spec/28](./spec/S00-system-contract.md) 的 §设计取舍;产品级决策理由不再以 ADR 表存在,内联进新 plan 各篇正文。 | `spec/S05` `spec/S01` `spec/17` `spec/28` 全部新 `plan/*.md` | 同上。 |
| 红线编号映射:旧 plan/01 不变性 #1-12 → 新 [plan/03](./plan/03-guardrails.md) 红线 R1-R10;其中 #5 入 [spec/S02](./spec/S02-agent-runner.md),#7 入 `CLAUDE.md` / `AGENTS.md` 工作规范,#12 的 JSON 面入 [spec/24](./spec/S02-agent-runner.md)。 | `plan/03-guardrails.md` `spec/S02` `spec/24` `CLAUDE.md` `AGENTS.md` | 历史文档中的旧编号按本映射换算。 |
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
