# A06 · Migration Notes

本 appendix 保存迁移说明、版本能力摘要、native binding 影响和历史 spec 归档说明。外部能力的原始 spike 证据归 [V03](./V03-external-spikes.md);测试矩阵归 [V01](./V01-test-matrix.md)。

## 归口内容

- 影响迁移或构建路线的版本能力摘要。
- native binding、构建配置、本地运行环境的迁移影响说明。
- 从 spike 证据提炼出的路线影响摘要,并反链到 V03 记录。
- package、build、lint、typecheck、test 命令的当前摘要。
- 文档迁移和历史 spec 归档说明。

## 对应核心文档

- [S00 System Contract](../S00-system-contract.md)
- [S14 Project Storage](../S14-project-storage.md)
- [S02 Agent Runner](../S02-agent-runner.md)
- [S04 Streaming UI Protocol](../S04-streaming-ui-protocol.md)
- [S05 Knowledge Graph](../S05-knowledge-graph.md)

## 历史原文

旧 29 篇 spec 原文已清理,不再保留。有效明细已抽取进当前 appendix,当前契约入口以根层 spec 与本目录为准。

## 边界

A06 不保存原始 spike 证据。版本号、命令和实查输出会漂移,必须记录日期和环境;若证据本身影响路线,原始记录放入 [V03](./V03-external-spikes.md),并把行为变化回写对应 spec/platform 文档。未关闭的阻塞项写入 [TODO](../../TODO.md)。
