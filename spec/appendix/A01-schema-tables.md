# A01 · Schema Tables

本 appendix 是表结构、字段字典、索引、frontmatter、迁移脚本和存储配置的归口。根层 spec 只保留理解系统必需的对象和主权关系;具体明细按需从历史归档抽取并整理到这里。

## 归口内容

- project、chapter、setting 文件 frontmatter 字段。
- project storage 相关表结构和索引。
- knowledge graph 的 entity、concept、relation、timeline、dependency、anchor、embedding 表。
- runtime、activity recap、experience、session history 表。
- canonical agent role id、agent 设置、用量归因和 prompt 名称映射。
- approval、ChangeSet、internal recovery、trace 的持久化字段。
- Universal Search 最近对象、查询历史、preview cache 和索引健康状态字段。
- settings、onboarding、project lifecycle 的存储字段。
- migration 和 backfill 步骤。

## 对应核心文档

- [S14 Project Storage](../S14-project-storage.md)
- [S01 Runtime State](../S01-runtime-state.md)
- [S03 Turn Orchestration](../S03-turn-orchestration.md)
- [S05 Knowledge Graph](../S05-knowledge-graph.md)
- [M14 Settings](../M14-settings.md)
- [M01 Universal Search](../M01-universal-search.md)
- [M09 Trace Observability](../M09-trace-observability.md)
- [M08 Approval Cascade](../M08-approval-cascade.md)
- [M17 Turn Recap And Continuation](../M17-turn-recap-and-continuation.md)

## 库归属

每项目数据库物理拆分为真源账本 `project.db` 和派生索引 `index.db`(见 [S14](../S14-project-storage.md)、[S01](../S01-runtime-state.md))。本节是字段族 → 数据库文件的唯一归属表;实现新表时必须先在这里落位,不得把真源字段写进 `index.db`,也不得让 `project.db` 出现可整体重建的派生对象。

| 数据库 | 归属字段族 | 损坏命运 |
|---|---|---|
| runtime.db(全局,跨项目) | thread、message、压缩摘要、turn recap 指针、跨项目打开/最近项目、UI 恢复指针、search history / recent object / preview cache(按 project id 分区) | 少历史模式运行,不影响项目事实 |
| project.db(每项目真源) | 写入记录/恢复记录(具体是否 append-only apply journal 待 TODO-P1-59 裁决)、light apply transaction、persistent turn state、mode gate、approval queue、ChangeSet / approval item / decision、residual obligation、internal recovery snapshot、recap/activity 投影、author note / continuation action、host fencing、file fingerprint ledger、project facts health、migration version、项目级经验(identity / content / state / reflector / audit)、danger action audit | 项目事实库损坏恢复语义待 TODO-P1-60 裁决 |
| index.db(每项目派生索引) | entity / alias / entity governance 状态缓存、concept、relation、timeline / as-of、dependency window 索引行、anchor、embedding 与 embedding index contract、volume summary、确定性抽取词典(Aho-Corasick trie 物化)、索引健康状态、repair job、reindex 水位/失败记录、搜索派生缓存 | 整库可删,由 [R04](../platform/R04-index-health-and-repair.md) 全量重建;不等同项目事实库损坏 |
| session_history.db(每项目,诊断) | trace step、tool run、模型调用、用量归因、错误记录、diagnostics export audit | Trace 不完整提示,不影响写作与事实 |

两条裁决性边界:

- 实体身份治理的**用户裁决记录**(确认别名、合并/拆分审批、改名审定)是审批事实,随 ChangeSet/approval 留在 `project.db`;`index.db` 里的 entity/alias 行只是这些裁决 + 正文抽取的派生物化,重建时从 `project.db` 的治理记录重放。
- dependency 的**已审定兑现窗口与用户裁定**(expected window、dismiss、resolved 审批来源)同样以 `project.db` 的审批/obligation 记录为真源;`index.db` 中的 dependency 行重建后必须恢复这些裁定,不能凭抽取重新猜。

## 实现前字段覆盖矩阵

实现某个能力前,至少要确认下列字段族是否存在;未实现能力可先不展开具体字段,但不能把字段藏回根层 spec。

| 能力/平台 | 字段族 |
|---|---|
| Search / Query / Knowledge Surface | search history、recent object、preview cache、entity / relation / anchor health、query source jump |
| Discuss / Planning / Writing | turn id、mode gate、proposal draft、context package reference、decision state |
| Inline Review / Humanizer | selection anchor、suggestion id、diff range、accepted/rejected state、editor undo bridge metadata |
| Approval / Cascade | ChangeSet、approval item、decision、low-confidence item、internal recovery snapshot、reindex status |
| Trace / Recap / Activity | trace step、tool run reference、activity recap、author note、continuation action |
| Memory / Reflector / Agent Controls | learning item、source record/evidence summary、0-5 weight、delete state、agent tier/frequency/weight |
| Settings / Onboarding / Project Library | project metadata、recent project、library filter、project choice state |
| Settings / Credentials | provider config reference、credential reference、verification status、migration status、redaction audit |
| platform/Ixx | provider capability cache、editor adapter state、watcher cursor、desktop permission、shortcut registration |
| platform/Rxx | lifecycle state、backup manifest、migration version、repair job、diagnostics export audit、redaction preview |

## Storage / Platform 可靠性字段族

P009 存储与平台可靠性修复涉及的字段族统一归口在本篇,实现时不得分散发明。

| 字段族 | 最少覆盖 | 行为约束 |
|---|---|---|
| file fingerprint ledger | project id、file id/path、content hash、mtime/size 辅助值、last seen watcher watermark、last system write token、post-write hash | mtime/size 不能单独证明文件未变;缺失或不可信时进入 reconcile。 |
| host fencing | 宿主实例 id、fencing token、issued at | 唯一用途是宿主崩溃防护:新宿主启动时签发新 token,所有写入、审批应用、migration、repair 都必须校验 fencing token,旧宿主残留写入被拒绝;不存在多窗口写入权或跨进程 lease。 |
| project facts health | facts health、degraded reason、lost fact families、rebuild source、user decision audit | 字段族先保留为恢复方案预留;具体模式命名和用户体验待 TODO-P1-60 裁决。 |
| migration version | schema version、index version、minimum compatible app、migration stage | forward-compat 拒开必须可解释,迁移中项目处于 Migrating。 |
| repair job | scope、reason、input watermark、output watermark、index version、status、retry count、failure reason | repair 按范围和水位幂等,不能重复制造派生事实。 |
| provider credential reference | provider id、credential reference、verification status、last failure category、migration status、deleted at | secret 明文、token、secret 摘要和 keychain item path 不进项目库;只保存不可反推引用和状态。 |
| shortcut registration | command id、default shortcut、user override、registration status、conflict category、last active context | 快捷键登记失败不等于命令不可用;IME/focus trap/项目只读状态冲突按 S14/I05 收场。 |
| diagnostics export audit | selected content families、redaction profile、preview timestamp、blocked category、package id | 诊断导出必须先预览再生成;预览过期或脱敏失败时阻断。 |

## Turn / Journal / Knowledge 字段族

S14/S03/S05/S06 新增的主权对象按字段族归口如下:

| 字段族 | 最少覆盖 | 行为约束 |
|---|---|---|
| write/apply record(待 TODO-P1-59 定名) | turn id、action id、apply id、stage、fencing token、input/output file fingerprint、fact watermark、reindex watermark、recovery strategy、projection status | 是否使用 append-only journal、阶段字段和 recap/activity/trace/recovery 投影关系待裁决;实现前不得按本表视为已定 schema。 |
| light apply transaction | editor action id、source kind、selection anchor、accepted text/diff hash、undo bridge id、risk recheck result、reindex request | direct edit / inline accept 不走大审批卡,但共用 fencing、写入记录和 reindex。 |
| persistent turn state | project id、turn id、mode、state、active action、approval queue id、cancel plan id、recovery pointer、last heartbeat | pending approval 和 interrupted turn 随项目走,runtime.db 只保存恢复指针。 |
| mode gate | current mode、last switch source、blocked reason、pending write action、restored at | 重启后以持久模式校正 UI,不能靠前端 tab 状态。 |
| approval queue | queue id、focused approval id、order、decision state、redo source、similarity verdict | 点名查看不改变队列顺序;单卡取消不影响其他 pending 卡。 |
| residual obligation | obligation id、source approval/risk、dedupe key、status、blocking level、latest anchor、last user decision、resolved/dismissed/invalidated audit | 重复命中追加证据,不制造噪音项。 |
| entity / alias governance | entity id、canonical name、alias status、historical alias、merge/split source ids、governance approval id、mention reassignment watermark | 没有用户确认或审批记录时,同名/别名只能标歧义。 |
| timeline / as-of | subject id、fact id、source chapter/order、effective from/to、future-only flag、source anchor | 前文改写默认按目标章节时点取事实。 |
| volume summary | volume id、source file/chapter range、summary version、input fingerprint、generated at、health | summary 是派生对象,不能覆盖原文事实。 |
| dependency window | dependency id、opened at、expected window、latest safe point、resolved at、status、dismiss reason | 无窗口不能触发超期阻断;有窗口才进入 due/overdue。 |
| paragraph anchor | anchor id(文件 id + 标题路径 hash + 内容签名三段组合)、heading path、完整 content hash、归一化 content signature、段内 offset、prev/next 邻接链、软删标记 | 锚点 diff 与邻接迁移算法以 S06 主线为准;签名归一化规则变更等同全量重建事件。 |
| extraction candidate | 候选对象类型、来源锚点、置信度、candidate/confirmed/dismissed 状态、确认审批 id | LLM 抽取只产生候选;未经用户确认或审批不得进入高置信图谱事实或抽取词典。 |
| extraction dictionary | 词典版本、来源 entity/alias/concept 水位、重建时间 | 词典是派生索引,治理动作或概念审定后必须重建并重扫受影响 mention。 |
| reindex watermark | scope、已追平的落盘水位、job id、健康度 | 同步段标 stale,异步 job 幂等推进水位;重复 job 不重复制造派生事实。 |
| embedding index contract | provider/model id、dimension、index version、batch limit、drift policy、needs-data flag | 模型/维度未知时语义召回不上线。 |

## Canonical Agent Role 字段

角色相关持久化字段必须使用 [M13](../M13-agent-team-controls.md) 定义的 canonical id:

| id | 中文展示名 | 使用位置 |
|---|---|---|
| `router` | 调度员 | route event、trace badge、prompt template、cost row |
| `writer` | 写手 | draft/proposal、writing cost、prompt template |
| `checker` | 审稿人 | risk report、creative diagnostics、trace |
| `validator` | 一致性守护者 | dependency、impact、阻断原因、trace |
| `reader_panel` | 读者评审团 | persona aggregate、reader report、cost |
| `humanizer` | 润色师 | inline suggestion、style report、cost |
| `reflector` | 反思学习者 | learning item、experience audit、cost |

数据库 enum、JSON schema、event payload、prompt name 和 design token 不得另写一套角色 id。

## Experience / Reflector 字段归口

经验管理的实现明细归本篇维护,根层语义以 [S01](../S01-runtime-state.md)、[M14](../M14-settings.md) 和 [M12](../M12-memory-learning-management.md) 为准。实施时至少需要记录下列字段族:

| 字段族 | 目的 | 行为约束 |
|---|---|---|
| identity | 经验 id、项目 id、来源 turn / decision / agent | 每条经验必须能反查来源,不能生成无来源偏好 |
| content | 明白话经验文本、适用任务、适用范围、冲突标签、冲突对象 id | 内容用于展示和 context 选择,不能覆盖项目事实 |
| source | 普通记录 id、单轮证据摘要或多轮证据摘要 | 每条经验必须能解释来源,但不强制单一 turn |
| state | active / pending_conflict / deleted、0-5 权重、更新时间 | pending_conflict 和 deleted 不得进入 context;active 默认可按权重选用 |
| reflector | 学习频率、确认策略、最近学习时间、失败原因 | 暂停或降频只影响新经验候选,不自动删除旧经验 |
| audit | 创建 / 冲突裁决 / 调权 / 删除操作者与时间 | Settings 展示失败时不能伪装为已生效 |

经验权重是唯一的选用强弱字段:

| 权重 | 影响 | 不影响 |
|---|---|---|
| 0 | 仅留档,默认不主动选用 | 不删除历史记录 |
| 1-5 | 从弱到强参与 context builder 选择 | 不覆盖项目事实和当前显式指令 |

实现不得新增逐条注入开关、agent enablement 字段或角色关闭字段。受限操作如删除全部经验需要记录影响范围与二次确认结果;项目删除、导入导出、缓存清理等数据管理功能不属于 Settings 字段族。

## 边界

字段变化如果只影响存储实现,更新本 appendix。字段变化如果改变写入主路径、审批失效、内部恢复、上下文优先级或用户可见设置,同步更新对应核心 spec。
