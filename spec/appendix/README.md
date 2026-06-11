# Spec Appendix · A/V Index

appendix 只承接实现者偶尔需要查的机器级明细。读者不需要先读 appendix 才能理解系统;系统主路径、设计取舍、职责边界、失败语义和用户可见结果必须在根层 `spec/Sxx` / `spec/Mxx` 或 `spec/platform/Ixx` / `spec/platform/Rxx` 讲清。

当前 appendix 只保留两类编号:`Axx` 是实现明细,`Vxx` 是验证明细。旧 29 篇原文已迁出 active appendix;后续需要具体字段、schema、工具参数、prompt、golden case 或测试矩阵时,从历史归档抽取仍有效内容,整理进这里对应分类。

## Active Appendix 范围

appendix 归口保存:

- `Axx`: 当前有效的表结构、字段字典、索引、迁移说明、JSON Schema / Zod / interface、事件字段、工具参数、命令清单、prompt 模板全文和公共片段。
- `Vxx`: 测试矩阵、golden cases、外部能力 spike 原始证据和实查记录。

appendix 不保存:

- 根层 spec 应该讲清的主路径。
- platform 应该讲清的接入、恢复、迁移和诊断失败语义。
- 历史阶段叙事、旧方案对比和迁移过程流水账。
- 已关闭问题、旧 MVP/Phase/Wave/Wn 计划。
- 未验证事实伪装成当前契约。

旧 29 篇 spec 原文已作为历史材料归档到 [progress/spec-archive/2026-06-11-pre-core-spec-details](../../progress/spec-archive/2026-06-11-pre-core-spec-details/README.md)。它们不是 active appendix,不再作为当前 spec 的阅读入口。

## 分类索引

- [A01-schema-tables](./A01-schema-tables.md) — 文件、frontmatter、数据库表、activity recap、索引和迁移字段的归口。
- [A02-json-schemas](./A02-json-schemas.md) — 结构化输出、报告对象、ChangeSet、recap、context package 和 query result 的归口。
- [A03-event-catalog](./A03-event-catalog.md) — turn、stream、trace、approval、recap、UI 事件字段的归口。
- [A04-tool-catalog](./A04-tool-catalog.md) — Agent 工具、查询工具、命令和快捷键明细的归口。
- [A05-prompt-templates](./A05-prompt-templates.md) — prompt 模板和公共片段全文的归口。
- [A06-migration-notes](./A06-migration-notes.md) — 迁移说明、版本能力摘要、native binding 影响和历史归档说明的归口。
- [V01-test-matrix](./V01-test-matrix.md) — 实施前验证、单测、集成、E2E 和 golden 引用的归口。
- [V02-golden-cases](./V02-golden-cases.md) — 关键能力验收样例、输入/输出预期和失败样例的归口。
- [V03-external-spikes](./V03-external-spikes.md) — 外部依赖 spike、原始实查证据和替代路线判断的归口。

## 更新规则

新增 appendix 明细前先确认它服务哪篇根层 spec 或 platform 文档。若明细改变了行为语义、失败处理、用户可见结果或主权边界,必须同步更新对应 spec/platform 文档,不能只改 appendix。
