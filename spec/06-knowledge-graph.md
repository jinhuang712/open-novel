# 06 · Knowledge Graph

本文档定义项目知识图谱如何从作品事实中生成、更新和供其他能力使用。它是实体、概念、段落锚点、embedding 与派生索引的一致性主权文档。

## 职责边界

本篇负责:

- 实体、概念、关系、时间线和依赖的建模边界。
- 段落锚点和差量 reindex 的一致性原则。
- embedding 与语义检索在项目事实中的位置。
- 知识图谱失败时对上下文、查询和 cascade 的影响。

本篇不负责:

- 上下文装配的排序策略。
- 用户查询入口。
- UI 高亮交互。
- 完整表结构和向量实现细节。

## 主权对象

Knowledge graph 拥有:

- 实体与别名。
- 实体关系。
- 实体时间线。
- 世界观概念与规则。
- 段落锚点。
- 段落引用与 embedding。
- 伏笔、禁忌、承诺等依赖关系。

这些对象是“项目一致性”的机器可读地基。它们由作品和设定推导,不能与作者文件事实相矛盾。

## 输入、输出与依赖

输入是作品文件、设定文件、审批落盘结果和外部文件变更。输出是实体、概念、关系、时间线、段落锚点、embedding 和可查询索引。本篇依赖 project storage 提供事实源,服务 context and query、editor interaction 和 turn orchestration 的一致性判断。

## 技术路径

文件写入或外部变更后,reindex 根据变更范围更新段落锚点、实体引用、概念引用、embedding 和反向索引。稳定段落继续沿用原锚点,修改段落进入局部刷新,重写或删除段落触发引用失效和下游刷新。

embedding 服务于语义召回,不是事实主权来源。语义检索命中的内容必须回到段落、设定或项目事实中解释。

## 失败语义

- 锚点失稳:相关引用进入待修复状态,下游检索不能当作完整事实。
- reindex 失败:作品文件保持事实源,知识图谱标记为部分过期。
- embedding 失败:语义检索降级,精确事实查询仍可工作。
- 概念冲突:交给一致性检查和审批路径,不能自动改写作品事实。

## 用户可见结果

用户看到的是高亮、旁注、查询结果和一致性提醒。系统需要能解释某条提醒来自哪个实体、概念、段落或依赖关系。

## Appendix 引用

- [appendix/schema-tables](./appendix/schema-tables.md) 维护知识图谱相关表结构。
- [appendix/details/16-knowledge-schema](./appendix/details/16-knowledge-schema.md) 保留旧知识 schema 细节。
- [appendix/details/17-paragraph-anchors](./appendix/details/17-paragraph-anchors.md) 保留旧段落锚点细节。
- [appendix/details/18-embeddings](./appendix/details/18-embeddings.md) 保留旧 embedding 细节。
