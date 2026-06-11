# Appendix · Schema Tables

本 appendix 索引表结构、frontmatter、存储字段和迁移细节。核心 spec 只点名会影响行为的关键对象,完整字段以这里引用的细节文档为准。

## 项目事实与文件契约

- [details/01-storage-schema](./details/01-storage-schema.md) 保存项目文件结构、frontmatter、项目事实库、连接池、审批记录和派生索引的旧细节。
- [details/16-knowledge-schema](./details/16-knowledge-schema.md) 保存知识图谱相关 schema 和设定目录契约的旧细节。
- [details/17-paragraph-anchors](./details/17-paragraph-anchors.md) 保存段落锚点、reindex 和外部编辑冲突的旧细节。
- [details/18-embeddings](./details/18-embeddings.md) 保存 embedding 相关 schema 和检索细节。

## 运行时与过程历史

- [details/22-memory-and-history](./details/22-memory-and-history.md) 保存 runtime 记忆、经验和历史压缩的旧细节。
- [details/27-session-history](./details/27-session-history.md) 保存过程日志和 trace 存储的旧细节。

## 使用边界

字段变化如果只影响实现,更新本 appendix。字段变化如果改变职责边界、失败语义或用户可见承诺,必须同步更新对应核心 spec。
