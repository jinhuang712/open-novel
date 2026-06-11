# A01 · Schema Tables

本 appendix 是表结构、字段字典、索引、frontmatter、迁移脚本和存储配置的归口。根层 spec 只保留理解系统必需的对象和主权关系;具体明细按需从历史归档抽取并整理到这里。

## 归口内容

- workspace、project、chapter、setting 文件 frontmatter 字段。
- project storage 相关表结构和索引。
- knowledge graph 的 entity、concept、relation、timeline、dependency、anchor、embedding 表。
- runtime、activity recap、experience、session history 表。
- approval、ChangeSet、internal recovery、trace 的持久化字段。
- Universal Search 最近对象、查询历史、preview cache 和索引健康状态字段。
- settings、onboarding、project lifecycle 的存储字段。
- migration 和 backfill 步骤。

## 对应核心文档

- [S01 Project Storage](../S01-project-storage.md)
- [S02 Runtime State](../S02-runtime-state.md)
- [S04 Turn Orchestration](../S04-turn-orchestration.md)
- [S06 Knowledge Graph](../S06-knowledge-graph.md)
- [S11 Settings And Onboarding](../S11-settings-and-onboarding.md)
- [M01 Universal Search](../M01-universal-search.md)
- [M09 Trace Observability](../M09-trace-observability.md)
- [M08 Approval Cascade](../M08-approval-cascade.md)
- [M17 Turn Recap And Continuation](../M17-turn-recap-and-continuation.md)

## Experience / Reflector 字段归口

经验管理的实现明细归本篇维护,根层语义以 [S02](../S02-runtime-state.md)、[S11](../S11-settings-and-onboarding.md) 和 [M12](../M12-memory-learning-management.md) 为准。实施时至少需要记录下列字段族:

| 字段族 | 目的 | 行为约束 |
|---|---|---|
| identity | 经验 id、项目 id、来源 turn / decision / agent | 每条经验必须能反查来源,不能生成无来源偏好 |
| content | 明白话经验文本、适用任务、适用范围、冲突标签 | 内容用于展示和 context 选择,不能覆盖项目事实 |
| state | active / muted / deleted、权重、更新时间 | muted 和 deleted 都不得继续注入 context |
| reflector | 是否允许学习新经验、最近学习时间、失败原因 | Reflector off 只停止学习新经验,不自动删除旧经验 |
| audit | 创建 / 调权 / 关闭 / 删除操作者与时间 | Settings 展示失败时不能伪装为已生效 |

Reflector 关闭语义对应两个独立开关:

| 开关 | 影响 | 不影响 |
|---|---|---|
| learn_enabled | turn 完成后是否生成新经验候选 | 已存在经验是否注入 |
| inject_enabled / 单条 muted | context builder 是否选用已有经验 | 是否继续保留历史记录 |

实现不得把“关闭学习”和“停用旧经验”合并成一个不可解释的总开关。危险操作如清空经验、删除经验库或重置设置,还需要记录影响范围与二次确认结果。

## 边界

字段变化如果只影响存储实现,更新本 appendix。字段变化如果改变写入主路径、审批失效、内部恢复、上下文优先级或用户可见设置,同步更新对应核心 spec。
