# Spec Appendix

appendix 承接核心 spec 不展开的实现明细。核心 spec 写系统契约、技术路径、职责边界和失败语义;appendix 写表结构、schema、事件、工具、prompt、测试矩阵和迁移细节。

## 使用规则

- appendix 不能成为无主信息堆。每个条目都应被某篇核心 spec 引用。
- 核心行为约束必须在核心 spec 正文点名,完整字段和样例才放 appendix。
- `details/` 保存重组前的旧 spec 原文,用于追溯和细节复用;它不再定义根层 spec 骨架。

## 分类索引

- [schema-tables](./schema-tables.md) — 表结构、frontmatter、存储字段。
- [json-schemas](./json-schemas.md) — 结构化输出和报告 schema。
- [event-catalog](./event-catalog.md) — 流式事件、trace、turn、cascade 事件。
- [tool-catalog](./tool-catalog.md) — Agent 工具、命令和查询工具。
- [prompt-templates](./prompt-templates.md) — prompt 模板和公共片段。
- [testing-matrix](./testing-matrix.md) — 测试策略和验证矩阵。
- [migration-notes](./migration-notes.md) — 版本审计、构建配置和迁移记录。
