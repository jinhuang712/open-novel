# A01 · Schema Tables

本 appendix 是表结构、字段字典、索引、frontmatter、迁移脚本和存储配置的归口。根层 spec 只保留理解系统必需的对象和主权关系;具体明细按需从历史归档抽取并整理到这里。

## 归口内容

- workspace、project、chapter、setting 文件 frontmatter 字段。
- project storage 相关表结构和索引。
- knowledge graph 的 entity、concept、relation、timeline、dependency、anchor、embedding 表。
- runtime、experience、session history 表。
- approval、ChangeSet、rollback、trace 的持久化字段。
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

## 边界

字段变化如果只影响存储实现,更新本 appendix。字段变化如果改变写入主路径、审批失效、rollback、上下文优先级或用户可见设置,同步更新对应核心 spec。
