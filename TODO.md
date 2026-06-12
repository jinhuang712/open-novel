# TODO · 活跃验证、裁决与文档修复项

截至 2026-06-13,本文件只保留仍需用户裁决、跨文档修复或设计补齐才能关闭的活跃项。P009 全量审计的完整证据与改法见 [P009](./progress/P009-pre-implementation-audit.md);已关闭条目从本表移除并记入 [CHANGELOG](./CHANGELOG.md)。真实工程验证已归入 [V01](./spec/appendix/V01-test-matrix.md) 与 [V03](./spec/appendix/V03-external-spikes.md),不再作为游离 TODO 漂浮。

## 当前状态

当前没有活跃 TODO。新增问题只有在没有明确主权文档、需要用户重新裁决,或无法安全写成 plan/spec/design/Vxx 契约时,才进入本文件。

## 验证入口

需要真实代码、依赖或运行数据证明的事项不作为游离 TODO 漂浮:

- 测试矩阵和未来工程化测试归 [V01 · Test Matrix](./spec/appendix/V01-test-matrix.md)。
- golden cases 和 LLM 回归样例归 [V02 · Golden Cases](./spec/appendix/V02-golden-cases.md)。
- DeepSeek cache、1M context token 成本、AI SDK loop、SQLite/native binding、watcher、desktop shell、Tailwind/shadcn 映射等外部实查归 [V03 · External Spikes](./spec/appendix/V03-external-spikes.md)。

## 新增规则

只有满足以下任一条件的新问题才允许写入本文件:

- 没有明确 plan/spec/platform/appendix 主权文档。
- 需要用户在多个方向中重新裁决。
- 当前文档无法安全给出契约,只能先保留未知。

写入 TODO 时必须同时说明关联文档、为什么不能直接归口、以及回头关闭条件。
