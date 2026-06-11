# Appendix · Migration Notes

本 appendix 是外部事实审计、版本能力、native binding、构建配置和迁移说明的归口。根层 spec 只记录这些事实是否阻塞系统主路径。

## 归口内容

- 模型能力实查记录。
- AI SDK runner / stream / tool / stop 行为 spike。
- local database、sqlite-vec、native binding 实查。
- Next runtime、server route、hot reload 和本地文件权限验证。
- package、build、lint、typecheck、test 命令。
- 文档迁移和历史 spec 归档说明。

## 对应核心文档

- [00 System Contract](../00-system-contract.md)
- [01 Project Storage](../01-project-storage.md)
- [03 Agent Runtime](../03-agent-runtime.md)
- [05 Streaming UI Protocol](../05-streaming-ui-protocol.md)
- [06 Knowledge Graph](../06-knowledge-graph.md)

## 历史原文

旧 29 篇 spec 原文已归档到 [progress/spec-archive/2026-06-11-pre-core-spec-details](../../progress/spec-archive/2026-06-11-pre-core-spec-details/README.md)。它们只用于追溯和抽取细节,不再作为 active appendix 或当前契约入口。

## 边界

版本号、命令和实查输出会漂移,必须记录日期和环境。未实查事实不能写成“已确认”;若阻塞实现,写入 [TODO](../../TODO.md)。
