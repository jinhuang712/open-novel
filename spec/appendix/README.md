# Spec Appendix

appendix 只承接实现者偶尔需要查的机器级明细。读者不需要先读 appendix 才能理解系统;系统主路径、设计取舍、职责边界、失败语义和用户可见结果必须在根层 `spec/00-11` 讲清。

当前 appendix 是明细归口层。旧 29 篇原文已迁出 active appendix;后续需要具体字段、schema、工具参数、prompt 或测试矩阵时,从历史归档抽取仍有效内容,整理进这里对应分类。

## Active Appendix 范围

appendix 归口保存:

- 当前有效的表结构、字段字典、索引和迁移说明。
- 完整 JSON Schema / Zod / interface。
- 工具参数全表、命令清单和事件字段。
- prompt 模板全文和公共片段。
- 测试矩阵、版本审计和外部能力实查记录。

appendix 不保存:

- 根层 spec 应该讲清的主路径。
- 历史阶段叙事、旧方案对比和迁移过程流水账。
- 已关闭问题、旧 MVP/Phase/Wave/Wn 计划。
- 未验证事实伪装成当前契约。

旧 29 篇 spec 原文已作为历史材料归档到 [progress/spec-archive/2026-06-11-pre-core-spec-details](../../progress/spec-archive/2026-06-11-pre-core-spec-details/README.md)。它们不是 active appendix,不再作为当前 spec 的阅读入口。

## 分类索引

- [schema-tables](./schema-tables.md) — 文件、frontmatter、数据库表、索引和迁移字段的归口。
- [json-schemas](./json-schemas.md) — 结构化输出、报告对象、ChangeSet、context package 和 query result 的归口。
- [event-catalog](./event-catalog.md) — turn、stream、trace、approval、UI 事件字段的归口。
- [tool-catalog](./tool-catalog.md) — Agent 工具、查询工具、命令和快捷键明细的归口。
- [prompt-templates](./prompt-templates.md) — prompt 模板和公共片段全文的归口。
- [testing-matrix](./testing-matrix.md) — 实施前验证、单测、集成、E2E 和 LLM golden 的归口。
- [migration-notes](./migration-notes.md) — 外部事实审计、版本能力、native binding 和迁移说明的归口。

## 更新规则

新增 appendix 明细前先确认它服务哪篇根层 spec。若明细改变了行为语义、失败处理、用户可见结果或主权边界,必须同步更新根层 spec,不能只改 appendix。
