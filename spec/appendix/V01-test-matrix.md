# V01 · Test Matrix

本 appendix 是测试矩阵、验证命令、单测/集成/E2E 场景和 golden case 引用的归口。外部能力的原始 spike 证据归 [V03](./V03-external-spikes.md)。

## 归口内容

- 外部事实审计需要覆盖的验证项,原始证据反链到 V03。
- storage / reindex / internal recovery 测试。
- runner / JSON retry / tool failure / tool boundary / harness replay 测试。
- turn / approval / cancel / recovery / recap 测试。
- stream 断线、重复、乱序测试。
- context overflow、impact analysis、Universal Search 内 fact answer/source view 测试。
- golden regression、creative engine、reader aggregation、cardinal rules 风险分级测试。
- editor IME、focus trap、shortcut conflict、undo 测试。
- Universal Search: `Shift+Shift`、分组排序、hover preview、索引降级和 pending approval 只读限制。
- Project Library: 单窗口项目切换 preflight、active turn/pending approval/未保存编辑收口、runtime/history 分桶、样例/真实项目隔离和切换恢复。
- Discuss Mode: 只读边界、来源缺口、升级到 Planning/Writing、Trace 解释。
- Trace Observability: 可见层级、断线恢复、降级解释、隐私遮蔽。
- Approval Cascade: Search 发起写入、低置信项、关闭 pending、internal recovery / reindex 失败收场。
- Turn Recap: append-only 时间线、正常/停止/失败/待审/已落盘 recap、作者备注、forward-only 修正和续接入口。
- ReaderPanel: persona 并行、inconclusive、注入防御、审批说明联动。
- onboarding、settings、credential security、受限操作、project choice、diagnostics redaction 和 dev build gate 测试。

## 对应核心文档

- [S00 System Contract](../S00-system-contract.md)
- [S14 Project Storage](../S14-project-storage.md)
- [S01 Runtime State](../S01-runtime-state.md)
- [S02 Agent Runner](../S02-agent-runner.md)
- [S03 Turn Orchestration](../S03-turn-orchestration.md)
- [S04 Streaming UI Protocol](../S04-streaming-ui-protocol.md)
- [S05 Knowledge Graph](../S05-knowledge-graph.md)
- [S06 Context Management](../S06-context-management.md)
- [S07 Prompt System](../S07-prompt-system.md)
- [S08 Agent Tooling Boundary](../S08-agent-tooling-boundary.md)
- [S09 LLM Quality Harness](../S09-llm-quality-harness.md)
- [S10 Evaluation And Golden Regression](../S10-evaluation-and-golden-regression.md)
- [S11 Creative Engine](../S11-creative-engine.md)
- [S12 Style And Humanizer](../S12-style-and-humanizer.md)
- [S13 Editor And Interaction](../S13-editor-and-interaction.md)
- [M14 Settings](../M14-settings.md)
- [M15 Onboarding And New Book](../M15-onboarding-and-new-book.md)
- [M18 Developer Mode](../M18-developer-mode.md)
- [M01 Universal Search](../M01-universal-search.md)
- [M04 Discuss Mode](../M04-discuss-mode.md)
- [M09 Trace Observability](../M09-trace-observability.md)
- [M08 Approval Cascade](../M08-approval-cascade.md)
- [M11 ReaderPanel](../M11-reader-panel.md)
- [M17 Turn Recap And Continuation](../M17-turn-recap-and-continuation.md)

## 实现前验证覆盖矩阵

| 能力/平台 | 必测场景 |
|---|---|
| S14/S05 storage + graph | 原子写、外部编辑冲突、reindex 降级、anchor 失效、派生文件守卫 |
| S02/S03 runner + orchestration | JSON retry、doom-loop、cancel plan、stopped recap、approval idempotency |
| S04/S13 UI + editor | stream 恢复、事件乱序、IME/focus trap、shortcut conflict、inline review accept/reject、editor undo bridge |
| S06/S07/S08 context + prompt + tools | context overflow、long-form partition、as-of chapter、prompt final budget、impact analysis 收敛、prompt injection、tool permission、二次 LLM 失败、tool cancelability |
| S09/S10 harness + evaluation | run evidence、failure replay、golden regression、阻断阈值、prompt/context/tool 改动验收 |
| S11/S12 creative + humanizer | 风险分级、ReaderPanel 聚合、Humanizer 越权升级 |
| S11/M08 quality + approval | EditedAccepted 轻量重检、阻断级风险解决证据、no-change-evidence、审批前质检汇合 |
| M01-M04 search/query/discuss | Shift+Shift、Search 内 fact answer 来源跳转、无 Cmd+E 独立入口、command routing、只读边界 |
| M05-M08 planning/writing/approval | proposal 生成、ChangeSet 审批、dependency group、低置信项、residual obligation、writing-blocked、部分接受和失败收场 |
| M03/M10/S05 knowledge governance | as-of chapter 查询、同名歧义、别名确认、实体合并/拆分、obligation 全局清单 |
| M09-M13 trace/memory/agent controls | Trace 层级、经验可见/0-5 权重/删除、agent 调档/频率/权重且不可关闭 |
| M14-M17 settings/onboarding/library/recap | credential 写入/删除/迁移、受限操作、启动项目选择、Settings 不含项目/数据管理、项目切换隔离、Activity append-only |
| platform/Ixx | provider probe、editor adapter、watcher、desktop permission、keychain、shortcut registration |
| platform/Rxx | project lifecycle、migration、repair、diagnostics export preview/redaction |

## Storage / Platform 可靠性验证项

实施时至少补齐以下验收:

| 场景 | 预期 |
|---|---|
| 写入记录崩溃恢复 | prepared/file-applied/committed 这类阶段是否保留待 TODO-P1-59 裁决;裁决前只验收“崩溃后不能误判为外部编辑,用户能看见未完成写入如何收场”。 |
| direct edit light apply | 作者保存直接编辑后生成写入记录、activity、reindex request,不生成大审批卡。 |
| inline accept light apply | 选区接受进入 undo bridge 和 light apply;触及事实/跨文档/阻断风险时升级 ChangeSet。 |
| editor undo after committed light apply | 生成新的反向 light apply,不修改旧写入记录。 |
| 项目事实库真源损坏 | 作者文件仍可取用;不得把派生索引重建伪装成丢失审批历史;恢复/保护路径待 TODO-P1-60 裁决后补齐。 |
| 文件与事实账本冲突 | 作者文件优先;审批历史或 obligation 标记 lost/invalidated,不能覆盖文件来匹配旧账本。 |
| 系统自写 watcher 回声 | write token、owner、指纹和水位匹配时只推进 ledger,不触发外部编辑失效。 |
| 离线外部编辑 | 下次打开对账 fingerprint ledger,命中 pending approval 的审批失效,索引进入 stale/reindex。 |
| 宿主崩溃后重启 | 新宿主签发新 fencing token;旧宿主残留的延迟写入/repair 被拒绝;启动恢复扫描接管未收场事务并进入恢复流程。 |
| 单实例锁 | 应用已运行时二次启动不创建第二个宿主,聚焦既有窗口。 |
| 单实例单窗口 | 二次启动聚焦既有窗口并转交打开请求;不得创建第二窗口。 |
| 版本 forward-compat | 旧应用打开新 schema 显式拒开,不得忽略未知字段或创建假项目。 |
| repair job 重入 | 相同范围/水位/index version 幂等复用;部分完成从输出水位继续;输入指纹变化时关闭旧 job 并新建。 |
| provider credential 写入 | API key/token 只进入系统安全凭据库;项目、settings 文件、Trace、诊断包均不出现 secret。 |
| provider credential 删除 | 删除后 provider 变为未配置;需要 secret 的 Agent 能力禁用;历史事实、审批和 recap 保留。 |
| 旧明文凭据迁移 | 安全凭据库写入和旧来源清理都成功才恢复 provider;任一步失败保持禁用并给出脱敏清理提示。 |
| provider 认证失效 | 无 durable change 的运行中 turn 失败并生成 recap;pending approval 可查看但不能继续扩写或重做。 |
| 诊断包分类预览 | 正文、经验、审批、provider、trace/tool 和系统环境分级展示敏感等级与脱敏策略。 |
| 诊断脱敏阻断 | 发现 secret、未知 provider payload 或无法分类正文片段时阻断导出,不得生成残缺包。 |
| 快捷键 / IME 冲突 | IME 组合态、modal focus trap、编辑器文本命令优先;无法判断焦点时按项目只读状态处理。 |
| 快捷键登记失败 | 系统占用或重绑冲突时提示替代入口,命令能力不隐藏。 |
| runtime recent project isolation | 项目内 Search 不读取其他 project id 的 recent object 或 query history。 |
| project switch active turn preflight | 当前项目有 active turn 时,切换项目必须等待完成、停止、取消或进入恢复说明;旧项目不得在后台继续运行。 |
| project switch pending approval isolation | pending approval 可留待稍后并冻结在源项目;切到目标项目后不能应用、展示或排序进目标项目。 |
| project switch unsaved edits | 未保存编辑必须保存、丢弃或留在源项目;保存失败停在源项目,草稿不得迁移到目标项目。 |
| runtime history project buckets | recent objects、query history、preview cache、session history 和继续入口按 project id 分桶;切换后只读取目标项目 bucket。 |
| sample project isolation | 样例项目有独立 project id 和 runtime/history;复制成真实项目时不携带 pending、recent、query history、session history、经验候选或诊断历史。 |
| project switch crash recovery | 切换中崩溃后不得误把目标项目设为 active;源项目 pending、recent 和编辑状态可恢复或可解释失效。 |
| mode gate restart | 重启后恢复持久模式;pending/recovery 时模式切换被阻断并说明原因。 |
| writing mode planning prerequisite | 写作发现必须先改设定时生成 planning prerequisite,正文 proposal 不越权落盘。 |
| post-apply reindex failure | 作者文件已保存,索引 degraded/repair,审批不倒退为未接受。 |
| provider context overflow | I01 返回 context_overflow 时退回 S07 overflow,不进入 provider transient retry。 |
| embedding model unknown | 语义召回 needs data,向量表和相关能力不上线。 |
| canonical turn terminal enum | S02 run state、S04 control event、S05 reindex health、S14 write phase、M17 recap/activity 和 A03 event 字段都只引用 S03 的 `Completed`/`StoppedNoChange`/`Cancelled`/`Rejected`/`Applied`/`ApplyFailed`/`FailedTerminal`/`Interrupted`/`ManualRecoveryOpened`,不出现本地同义终态。 |
| host interrupted run | host crash/restart 后 run 标记 interrupted,由 S03 映射为 `Interrupted` 或恢复相关 canonical result;展示最后可信 step 和可重试点,不自动重放危险动作。 |
| heavy reindex stream heartbeat | 批量 SQLite/reindex/embedding 写入期间 stream heartbeat 延迟在 V03 实测阈值内;超阈值需隔离执行。 |

## 性能与延迟验证项

心流保护(plan/02 原则四)依赖的交互延迟必须可验收。目标数值不拍脑袋:实施计划阶段 0/2 在真实壳与真实语料上实测后填入,此前一律标 `待实测`。

| 交互 | 测量口径 | 目标 |
|---|---|---|
| 按键到回显 | 纸面输入 P95 | 待实测 |
| 实体高亮就绪 | 章节打开/编辑后高亮渲染 P95 | 待实测 |
| Universal Search 打开 | 唤出到可输入 P95 | 待实测 |
| 精确查询应答 | 查询提交到结果 P95 | 待实测 |
| 流式首 token | 发送到首个可见输出 P95 | 待实测 |
| 落盘到可搜 | light apply 后新内容进入索引可查的延迟 | 待实测 |
| 重 reindex 期间心跳 | stream 心跳延迟(对应 TODO-P1-22 spike) | 待实测 |

目标填入后,任何超出目标的劣化按 [S10](../S10-evaluation-and-golden-regression.md) 的 warn/fail 处理。

## 外部 spike 对应验证

原始实查证据归 [V03](./V03-external-spikes.md),本篇只记录进入实现前必须有测试或复现脚本覆盖的门禁。

| 验证项 | V01 门禁 | V03 证据 |
|---|---|---|
| DeepSeek `cache_control` / stable prompt header | prompt packet 记录 cache/stable header 降级,不影响 S08 layer manifest | provider response 与用量证据 |
| 1M context 体量 | Writer/Validator/ReaderPanel 典型 context package 的 token 体量、overflow 和用户可见说明 | tokenizer 或真实请求记录 |
| AI SDK loop | stopWhen/tool marker/onStepFinish 或手写 loop 的等价测试,覆盖 cancel、tool result、step finish | 最小 runner spike |
| SQLite/native binding | `sqlite-vec` CRUD/JOIN、WAL 并发、Route Handler 连接泄漏测试 | macOS arm64 / Linux x64 原始输出 |
| watcher / repair | cursor、水位、reconcile scan、repair job lifecycle、健康级别降级测试 | 文件系统平台行为实查 |
| desktop shell | 权限、窗口恢复、系统菜单、单实例锁、单窗口和二次启动聚焦测试 | 打包/权限/系统行为实查 |
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
| 权重 0 | 经验仍可见但默认不主动选用;Trace / Debug 能解释未选用原因 |
| 删除单条经验 | 列表、context 注入和搜索入口都不再出现;删除失败时不得隐藏残留记录 |
| 暂停学习 | 后续 turn 不产生新经验候选;已有 active 经验仍按权重参与 |
| 无逐条注入开关 | UI 和 schema 不出现 inject_enabled / muted / 单条关闭注入字段 |
| 删除全部经验 | 必须二次确认范围;存在 active turn / pending approval 时先阻断或要求处理 |
| 学习冲突 | 相似或相反经验进入即时裁决或预设策略路径,不得进入 Settings 常驻队列或重复追加噪音经验 |

## Settings / Developer Mode 验证项

Settings、项目选择和 Developer Mode 的测试归本篇维护。实施时至少覆盖:

| 场景 | 预期 |
|---|---|
| Settings 无项目管理 | Settings 不出现项目列表、项目删除、清理缓存或数据管理页;项目选择、迁移提示、诊断包和删除确认都在对应入口处理。 |
| 启动项目选择 | 每次启动先选择或创建项目;主界面左上项目入口可返回项目选择。 |
| 项目切换 preflight | active turn、applying、pending approval、未保存编辑和外部冲突未收口时,项目选择页阻断切换并给出处理入口。 |
| 样例项目隔离 | 样例项目标记清晰;真实项目不读取样例的 Search、recent、history、审批或经验候选。 |
| Appearance 独立 | 外观是独立 section,不混入 Style / 风格定制。 |
| Rules 只读 | Rules 页面只展示规则、检测说明和审批关系;不提供阈值、提示方式、关闭或恢复默认。 |
| Assistant Persona 边界 | Assistant Persona 只影响助手表达;不混入 ReaderPanel persona。 |
| Developer dev build gate | dev build 才显示 Developer 入口;真实用户包不显示且不可通过配置、快捷键或隐藏路由开启。 |

## Turn Recap 验证项

Turn Recap 的测试归本篇维护。实施时至少覆盖:

| 场景 | 预期 |
|---|---|
| 正常完成 | 生成 recap,说明已完成、已修改、可查看结果和下一步 |
| 运行中停止且无 durable change | 不二次确认;生成 stopped recap,明确“没有修改正文或设定”、已完成结果和未完成步骤 |
| awaiting approval 非终态 | 只生成 pending activity item 和审批恢复入口,不生成 terminal recap。 |
| interrupted / manual recovery | 生成 recovery note,说明最后可信 step、已知事实和恢复选择;不得生成成功/停止 recap。 |
| pending / applying 状态取消 | 不直接丢弃;先展示 cancel plan 和影响范围 |
| append-only 历史 | 原 recap 不被删除或改写;作者备注和更正以追加记录保存 |
| 撤销 / 恢复入口 | 生成反向修改或恢复 proposal,经审批后向前追加新 recap |
| 事实边界 | recap 不能覆盖项目事实;与项目事实冲突时必须让位 |
| 经验边界 | `StoppedNoChange` / `Cancelled` / `Rejected` / `Interrupted` / `ManualRecoveryOpened` 不自动进入 Reflector 学习 |
| 来源跳转失效 | recap 保留,对应来源标记过期并提供重新定位路径 |

## 边界

测试步骤、命令和 fixture 属于 appendix。测试暴露出行为契约不成立时,必须回写对应根层 spec、platform 文档或 TODO;原始外部能力证据进入 [V03](./V03-external-spikes.md)。
