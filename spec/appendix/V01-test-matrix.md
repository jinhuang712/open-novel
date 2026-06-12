# V01 · Test Matrix

本 appendix 是测试矩阵、验证命令、单测/集成/E2E 场景和 golden case 引用的归口。外部能力的原始 spike 证据归 [V03](./V03-external-spikes.md)。

## 归口内容

- 外部事实审计需要覆盖的验证项,原始证据反链到 V03。
- storage / reindex / internal recovery 测试。
- runner / JSON retry / tool failure / tool boundary / harness replay 测试。
- turn / approval / cancel / recovery / recap 测试。
- stream 断线、重复、乱序测试。
- context overflow、impact analysis、fact query 测试。
- golden regression、creative engine、reader aggregation、cardinal rules 风险分级测试。
- editor IME、focus trap、shortcut conflict、undo 测试。
- Universal Search: `Shift+Shift`、分组排序、hover preview、索引降级和 pending approval 只读限制。
- Discuss Mode: 只读边界、来源缺口、升级到 Planning/Writing、Trace 解释。
- Trace Observability: 可见层级、断线恢复、降级解释、隐私遮蔽。
- Approval Cascade: Search 发起写入、低置信项、关闭 pending、internal recovery / reindex 失败收场。
- Turn Recap: append-only 时间线、正常/停止/失败/待审/已落盘 recap、作者备注、forward-only 修正和续接入口。
- ReaderPanel: persona 并行、inconclusive、注入防御、审批说明联动。
- onboarding、settings、credential security、danger action、import/export preview 和 diagnostics redaction 测试。

## 对应核心文档

- [S00 System Contract](../S00-system-contract.md)
- [S01 Project Storage](../S01-project-storage.md)
- [S02 Runtime State](../S02-runtime-state.md)
- [S03 Agent Runner](../S03-agent-runner.md)
- [S04 Turn Orchestration](../S04-turn-orchestration.md)
- [S05 Streaming UI Protocol](../S05-streaming-ui-protocol.md)
- [S06 Knowledge Graph](../S06-knowledge-graph.md)
- [S07 Context Management](../S07-context-management.md)
- [S08 Prompt System](../S08-prompt-system.md)
- [S09 Agent Tooling Boundary](../S09-agent-tooling-boundary.md)
- [S10 LLM Quality Harness](../S10-llm-quality-harness.md)
- [S11 Evaluation And Golden Regression](../S11-evaluation-and-golden-regression.md)
- [S12 Creative Engine](../S12-creative-engine.md)
- [S13 Style And Humanizer](../S13-style-and-humanizer.md)
- [S14 Editor And Interaction](../S14-editor-and-interaction.md)
- [S15 Settings And Onboarding](../S15-settings-and-onboarding.md)
- [M01 Universal Search](../M01-universal-search.md)
- [M04 Discuss Mode](../M04-discuss-mode.md)
- [M09 Trace Observability](../M09-trace-observability.md)
- [M08 Approval Cascade](../M08-approval-cascade.md)
- [M11 ReaderPanel](../M11-reader-panel.md)
- [M17 Turn Recap And Continuation](../M17-turn-recap-and-continuation.md)

## 实现前验证覆盖矩阵

| 能力/平台 | 必测场景 |
|---|---|
| S01/S06 storage + graph | 原子写、外部编辑冲突、reindex 降级、anchor 失效、派生文件守卫 |
| S03/S04 runner + orchestration | JSON retry、doom-loop、cancel plan、stopped recap、approval idempotency |
| S05/S14 UI + editor | stream 恢复、事件乱序、IME/focus trap、shortcut conflict、inline review accept/reject、editor undo bridge |
| S07/S08/S09 context + prompt + tools | context overflow、long-form partition、as-of chapter、prompt final budget、impact analysis 收敛、prompt injection、tool permission、二次 LLM 失败、tool cancelability |
| S10/S11 harness + evaluation | run evidence、failure replay、golden regression、阻断阈值、prompt/context/tool 改动验收 |
| S12/S13 creative + humanizer | 风险分级、ReaderPanel 聚合、Humanizer 越权升级 |
| S12/M08 quality + approval | EditedAccepted 轻量重检、阻断级风险解决证据、no-change-evidence、审批前质检汇合 |
| M01-M04 search/query/discuss | Shift+Shift、fact query 来源跳转、command routing、只读边界 |
| M05-M08 planning/writing/approval | proposal 生成、ChangeSet 审批、dependency group、低置信项、residual obligation、writing-blocked、部分接受和失败收场 |
| M03/M10/S06 knowledge governance | as-of chapter 查询、同名歧义、别名确认、实体合并/拆分、obligation 全局清单 |
| M09-M13 trace/memory/agent controls | Trace 层级、经验可见/关闭/删除、agent 开关和预算限制 |
| M14-M17 settings/onboarding/library/recap | credential 写入/删除/迁移、danger action、workspace 初始化、项目切换隔离、Activity append-only、Recap 导出 |
| platform/Ixx | provider probe、editor adapter、watcher、import/export、desktop permission、keychain、shortcut registration |
| platform/Rxx | project lifecycle、backup/restore、migration、repair、diagnostics export preview/redaction |

## Storage / Platform 可靠性验证项

实施时至少补齐以下验收:

| 场景 | 预期 |
|---|---|
| Apply journal crash recovery | prepared/file-applied/committed 任一阶段崩溃后,启动扫描能前滚、放弃或进入人工恢复,UI 不误判为外部编辑。 |
| direct edit light apply | 作者保存直接编辑后生成 light apply journal、activity、reindex request,不生成大审批卡。 |
| inline accept light apply | 选区接受进入 undo bridge 和 light apply;触及事实/跨文档/阻断风险时升级 ChangeSet。 |
| editor undo after committed light apply | 生成新的反向 light apply,不修改旧 journal。 |
| 项目事实库真源损坏 | 项目进入 facts-degraded;作者文件只读可导出;写入、审批应用和高风险 Agent turn 阻断;用户可选备份恢复或以文件为准重建最小事实库。 |
| 文件与事实账本冲突 | 作者文件优先;审批历史或 obligation 标记 lost/invalidated,不能覆盖文件来匹配旧账本。 |
| 系统自写 watcher 回声 | write token、owner、指纹和水位匹配时只推进 ledger,不触发外部编辑失效。 |
| 离线外部编辑 | 下次打开对账 fingerprint ledger,命中 pending approval 的审批失效,索引进入 stale/reindex。 |
| 双窗口接管 | 新 owner 生成 fencing token;旧 owner 恢复后只读降级,队列里的写入/repair 被拒绝。 |
| lease 假死复活 | 过期 token 不能继续应用审批或写文件;用户看到 lease lost 和重新加载入口。 |
| Applying 中备份 | 备份生成被阻断,提示缺少一致性静止点;不得生成完整恢复点。 |
| 恢复前置不满足 | 无 writable lease、active turn 或 pending approval 未处理时只能预览,不能覆盖项目。 |
| 版本 forward-compat | 旧应用打开新 schema/package format 显式拒开,不得忽略未知字段或创建假项目。 |
| repair job 重入 | 相同范围/水位/index version 幂等复用;部分完成从输出水位继续;输入指纹变化时关闭旧 job 并新建。 |
| provider credential 写入 | API key/token 只进入系统安全凭据库;项目、settings export、Trace、诊断包均不出现 secret。 |
| provider credential 删除 | 删除后 provider 变为未配置;需要 secret 的 Agent 能力禁用;历史事实、审批和 recap 保留。 |
| 旧明文凭据迁移 | 安全凭据库写入和旧来源清理都成功才恢复 provider;任一步失败保持禁用并给出脱敏清理提示。 |
| provider 认证失效 | 无 durable change 的运行中 turn 失败并生成 recap;pending approval 可查看但不能继续扩写或重做。 |
| 项目包导出预览 | 作者文件、项目事实、经验/分析、recap、审批历史、settings 偏好和 trace/debug 附件分族展示。 |
| 项目包凭据剔除 | manifest 只记录 provider 类型和需重配状态;API key/token/keychain item 不进入包。 |
| 经验/分析随项目包 | 默认随完整项目包导出;用户排除时 manifest 明确标记不完整或排除范围。 |
| 审批历史随项目包 | pending/applied/rejected/invalidated 摘要可追溯;导入后 pending 必须重校验才能继续接受。 |
| 诊断包分类预览 | 正文、经验、审批、provider、trace/tool 和系统环境分级展示敏感等级与脱敏策略。 |
| 诊断脱敏阻断 | 发现 secret、未知 provider payload 或无法分类正文片段时阻断导出,不得生成残缺包。 |
| 快捷键 / IME 冲突 | IME 组合态、modal focus trap、编辑器文本命令优先;无法判断焦点时按只读处理。 |
| 快捷键登记失败 | 系统占用或重绑冲突时提示替代入口,命令能力不隐藏。 |
| persistent pending turn export/import | pending approval 随项目包导出后导入必须重校验前置,不能靠 runtime.db 直接接受。 |
| runtime recent project isolation | 项目内 Search 不读取其他 project id 的 recent object 或 query history。 |
| mode gate restart | 重启后恢复持久模式;pending/recovery 时模式切换被阻断并说明原因。 |
| writing mode planning prerequisite | 写作发现必须先改设定时生成 planning prerequisite,正文 proposal 不越权落盘。 |
| post-apply reindex failure | 作者文件已保存,索引 degraded/repair,审批不倒退为未接受。 |
| provider context overflow | I01 返回 context_overflow 时退回 S07 overflow,不进入 provider transient retry。 |
| embedding model unknown | 语义召回 needs data,向量表和相关能力不上线。 |
| host interrupted run | host crash/restart 后 run 标记 interrupted,展示最后可信 step 和可重试点,不自动重放危险动作。 |
| heavy reindex stream heartbeat | 批量 SQLite/reindex/embedding 写入期间 stream heartbeat 延迟在 V03 实测阈值内;超阈值需隔离执行。 |

## 外部 spike 对应验证

原始实查证据归 [V03](./V03-external-spikes.md),本篇只记录进入实现前必须有测试或复现脚本覆盖的门禁。

| 验证项 | V01 门禁 | V03 证据 |
|---|---|---|
| DeepSeek `cache_control` / stable prompt header | prompt packet 记录 cache/stable header 降级,不影响 S08 layer manifest | provider response 与成本证据 |
| 1M context 成本 | Writer/Validator/ReaderPanel 典型 context package 的 token 预算、overflow 和用户可见说明 | tokenizer 或真实请求记录 |
| AI SDK loop | stopWhen/tool marker/onStepFinish 或手写 loop 的等价测试,覆盖 cancel、tool result、step finish | 最小 runner spike |
| SQLite/native binding | `sqlite-vec` CRUD/JOIN、WAL 并发、Route Handler 连接泄漏测试 | macOS arm64 / Linux x64 原始输出 |
| watcher / repair | cursor、水位、reconcile scan、repair job lifecycle、健康级别降级测试 | 文件系统平台行为实查 |
| desktop shell | 权限、窗口恢复、系统菜单、多实例 lease 和接管测试 | 打包/权限/系统行为实查 |
| design token mapping | Tailwind/shadcn dark variant、Button variant、深色主题前景色测试 | 首个真实组件验证结果 |

## Approval / Knowledge 补充验证项

实施时至少补齐以下验收:

| 场景 | 预期 |
|---|---|
| EditedAccepted 后用户改掉阻断级风险 | 轻量重检记录风险已解决证据,审批才可进入 Applying |
| EditedAccepted 引入新事实变化 | 卡片回到待审或升级重建 proposal,不能直接落盘 |
| 多审批卡排队 | 点名查看不改变队列顺序,取消单卡不影响其他 pending 卡 |
| 拒绝理由重做 | 新 ChangeSet 反链旧卡,连续未收敛后停止自动重做 |
| obligation 去重 | 同一来源/风险/锚点重复命中只追加证据,不生成多条噪音待办 |
| 实体拆分 | 同名误并能生成审批 proposal,未审定前不改派生身份 |
| no-change-evidence | “已分析无需改动”必须有检查范围、证据和置信状态 |
| as-of chapter 查询 | 改写前文默认排除未来事实;用户切换“最新”时结果明确标时点。 |
| dependency due/overdue | 无 expected window 只提示补计划;due/overdue 按 S06 window 触发确认/阻断风险。 |

## Memory / Reflector 验证项

经验管理和 Reflector 的测试归本篇维护。实施时至少覆盖:

| 场景 | 预期 |
|---|---|
| 经验可见性 | 每条经验展示来源、适用范围、状态和权重;无来源经验不得出现在用户可见列表 |
| 调高 / 调低 | 保存成功后 context builder 使用新权重;保存失败时 UI 保留原值并提示失败 |
| 关闭单条经验 | 经验仍可见但不再注入 context;Trace / Debug 能解释未注入原因 |
| 删除单条经验 | 列表、context 注入和搜索入口都不再出现;删除失败时不得隐藏残留记录 |
| 关闭 Reflector | 后续 turn 不产生新经验候选;已有 active 经验仍按设置注入 |
| 停用经验注入 | Reflector 可继续学习新经验,但已有经验不进入 context |
| 清空经验 | 必须二次确认范围;存在 active writable turn / pending approval 时先阻断或要求处理 |
| 学习冲突 | 相似或相反经验进入合并 / 排队 / 冲突提示路径,不得重复追加多条噪音经验 |

## Turn Recap 验证项

Turn Recap 的测试归本篇维护。实施时至少覆盖:

| 场景 | 预期 |
|---|---|
| 正常完成 | 生成 recap,说明已完成、已修改、可查看结果和下一步 |
| 运行中停止且无 durable change | 不二次确认;生成 stopped recap,明确“没有修改正文或设定”、已完成结果和未完成步骤 |
| pending / applying 状态取消 | 不直接丢弃;先展示 cancel plan 和影响范围 |
| append-only 历史 | 原 recap 不被删除或改写;作者备注和更正以追加记录保存 |
| 撤销 / 恢复入口 | 生成反向修改或恢复 proposal,经审批后向前追加新 recap |
| 事实边界 | recap 不能覆盖项目事实;与项目事实冲突时必须让位 |
| 经验边界 | stopped / abandoned / rejected recap 不自动进入 Reflector 学习 |
| 来源跳转失效 | recap 保留,对应来源标记过期并提供重新定位路径 |

## 边界

测试步骤、命令和 fixture 属于 appendix。测试暴露出行为契约不成立时,必须回写对应根层 spec、platform 文档或 TODO;原始外部能力证据进入 [V03](./V03-external-spikes.md)。
