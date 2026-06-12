# A01 · Schema Tables

本 appendix 是表结构、字段字典、索引、frontmatter、迁移脚本和存储配置的归口。根层 spec 只保留理解系统必需的对象和主权关系;具体明细按需从历史归档抽取并整理到这里。

## 归口内容

- workspace、project、chapter、setting 文件 frontmatter 字段。
- project storage 相关表结构和索引。
- knowledge graph 的 entity、concept、relation、timeline、dependency、anchor、embedding 表。
- runtime、activity recap、experience、session history 表。
- canonical agent role id、agent 设置、成本归因和 prompt 名称映射。
- approval、ChangeSet、internal recovery、trace 的持久化字段。
- Universal Search 最近对象、查询历史、preview cache 和索引健康状态字段。
- settings、onboarding、project lifecycle 的存储字段。
- migration 和 backfill 步骤。

## 对应核心文档

- [S01 Project Storage](../S01-project-storage.md)
- [S02 Runtime State](../S02-runtime-state.md)
- [S04 Turn Orchestration](../S04-turn-orchestration.md)
- [S06 Knowledge Graph](../S06-knowledge-graph.md)
- [S15 Settings And Onboarding](../S15-settings-and-onboarding.md)
- [M01 Universal Search](../M01-universal-search.md)
- [M09 Trace Observability](../M09-trace-observability.md)
- [M08 Approval Cascade](../M08-approval-cascade.md)
- [M17 Turn Recap And Continuation](../M17-turn-recap-and-continuation.md)

## 实现前字段覆盖矩阵

实现某个能力前,至少要确认下列字段族是否存在;未实现能力可先不展开具体字段,但不能把字段藏回根层 spec。

| 能力/平台 | 字段族 |
|---|---|
| Search / Query / Knowledge Surface | search history、recent object、preview cache、entity / relation / anchor health、query source jump |
| Discuss / Planning / Writing | turn id、mode gate、proposal draft、context package reference、decision state |
| Inline Review / Humanizer | selection anchor、suggestion id、diff range、accepted/rejected state、editor undo bridge metadata |
| Approval / Cascade | ChangeSet、approval item、decision、low-confidence item、internal recovery snapshot、reindex status |
| Trace / Recap / Activity | trace step、tool run reference、activity recap、author note、continuation action |
| Memory / Reflector / Agent Controls | learning item、source decision、weight、mute/delete state、agent enablement and budget |
| Settings / Onboarding / Project Library | workspace path、project metadata、danger action audit、recent project、library filter |
| Settings / Credentials | provider config reference、credential reference、verification status、migration status、redaction audit |
| platform/Ixx | provider capability cache、editor adapter state、watcher cursor、desktop permission、shortcut registration |
| platform/Rxx | lifecycle state、backup manifest、migration version、repair job、diagnostics export audit、redaction preview |

## Storage / Platform 可靠性字段族

P009 存储与平台可靠性修复涉及的字段族统一归口在本篇,实现时不得分散发明。

| 字段族 | 最少覆盖 | 行为约束 |
|---|---|---|
| file fingerprint ledger | project id、file id/path、content hash、mtime/size 辅助值、last seen watcher watermark、last system write token、post-write hash | mtime/size 不能单独证明文件未变;缺失或不可信时进入 reconcile。 |
| lease / fencing | owner id、lease token、fencing token、renewed at、expires at、takeover reason | 所有写入、审批应用、migration、repair 都必须校验 fencing token。 |
| project facts health | facts health、degraded reason、lost fact families、rebuild source、user decision audit | facts-degraded 不能被派生索引修复自动清除。 |
| migration version | schema version、index version、minimum compatible app、migration stage | forward-compat 拒开必须可解释,迁移中项目处于 Migrating。 |
| repair job | scope、reason、input watermark、output watermark、index version、status、retry count、failure reason | repair 按范围和水位幂等,不能重复制造派生事实。 |
| provider credential reference | provider id、credential reference、verification status、last failure category、migration status、deleted at | secret 明文、token、secret 摘要和 keychain item path 不进项目库;只保存不可反推引用和状态。 |
| shortcut registration | command id、default shortcut、user override、registration status、conflict category、last active context | 快捷键登记失败不等于命令不可用;IME/focus trap/只读窗口冲突按 S14/I05 收场。 |
| diagnostics export audit | selected content families、redaction profile、preview timestamp、blocked category、package id | 诊断导出必须先预览再生成;预览过期或脱敏失败时阻断。 |

## Turn / Journal / Knowledge 字段族

S01/S04/S06/S07 新增的主权对象按字段族归口如下:

| 字段族 | 最少覆盖 | 行为约束 |
|---|---|---|
| apply journal | turn id、action id、apply id、stage、fencing token、input/output file fingerprint、fact watermark、reindex watermark、recovery strategy、projection status | journal append-only;recap/activity/trace/recovery 都从它投影。 |
| light apply transaction | editor action id、source kind、selection anchor、accepted text/diff hash、undo bridge id、risk recheck result、reindex request | direct edit / inline accept 不走大审批卡,但共用 lease、journal 和 reindex。 |
| persistent turn state | project id、turn id、mode、state、active action、approval queue id、cancel plan id、recovery pointer、last heartbeat | pending approval 和 interrupted turn 随项目走,runtime.db 只保存恢复指针。 |
| mode gate | current mode、last switch source、blocked reason、pending writable action、restored at | 重启后以持久模式校正 UI,不能靠前端 tab 状态。 |
| approval queue | queue id、focused approval id、order、decision state、redo source、similarity verdict | 点名查看不改变队列顺序;单卡取消不影响其他 pending 卡。 |
| residual obligation | obligation id、source approval/risk、dedupe key、status、blocking level、latest anchor、last user decision、resolved/dismissed/invalidated audit | 重复命中追加证据,不制造噪音项。 |
| entity / alias governance | entity id、canonical name、alias status、historical alias、merge/split source ids、governance approval id、mention reassignment watermark | 没有用户确认或审批记录时,同名/别名只能标歧义。 |
| timeline / as-of | subject id、fact id、source chapter/order、effective from/to、future-only flag、source anchor | 前文改写默认按目标章节时点取事实。 |
| volume summary | volume id、source file/chapter range、summary version、input fingerprint、generated at、health | summary 是派生对象,不能覆盖原文事实。 |
| dependency window | dependency id、opened at、expected window、latest safe point、resolved at、status、dismiss reason | 无窗口不能触发超期阻断;有窗口才进入 due/overdue。 |
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

经验管理的实现明细归本篇维护,根层语义以 [S02](../S02-runtime-state.md)、[S11](../S15-settings-and-onboarding.md) 和 [M12](../M12-memory-learning-management.md) 为准。实施时至少需要记录下列字段族:

| 字段族 | 目的 | 行为约束 |
|---|---|---|
| identity | 经验 id、项目 id、来源 turn / decision / agent | 每条经验必须能反查来源,不能生成无来源偏好 |
| content | 明白话经验文本、适用任务、适用范围、冲突标签、冲突对象 id | 内容用于展示和 context 选择,不能覆盖项目事实 |
| state | active / pending_confirmation / muted / deleted、权重、更新时间 | pending_confirmation、muted 和 deleted 都不得继续注入 context |
| reflector | 是否允许学习新经验、最近学习时间、失败原因 | Reflector off 只停止学习新经验,不自动删除旧经验 |
| audit | 创建 / 冲突确认 / 调权 / 关闭 / 删除操作者与时间 | Settings 展示失败时不能伪装为已生效 |

Reflector 关闭语义对应两个独立开关:

| 开关 | 影响 | 不影响 |
|---|---|---|
| learn_enabled | turn 完成后是否生成新经验候选 | 已存在经验是否注入 |
| inject_enabled / 单条 muted | context builder 是否选用已有经验 | 是否继续保留历史记录 |

实现不得把“关闭学习”和“停用旧经验”合并成一个不可解释的总开关。危险操作如清空经验、删除经验库或重置设置,还需要记录影响范围与二次确认结果。

## 边界

字段变化如果只影响存储实现,更新本 appendix。字段变化如果改变写入主路径、审批失效、内部恢复、上下文优先级或用户可见设置,同步更新对应核心 spec。
