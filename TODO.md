# TODO · 开放问题入口

本文件只维护当前没有主权文档、没有验证入口、或需要用户重新裁决的开放问题。已归口的架构风险不再重复放在这里,而是进入对应 plan/spec/platform/appendix 文档。

## 当前状态

截至 2026-06-12,本轮 plan/spec/design 架构复查发现的待办已经归口:

| 原问题族 | 当前归口 |
|---|---|
| LLM 质量闭环、prompt/context/runner/tool/harness/golden 门禁 | [S03](./spec/S03-agent-runner.md) · [S07](./spec/S07-context-management.md) · [S08](./spec/S08-prompt-system.md) · [S09](./spec/S09-agent-tooling-boundary.md) · [S10](./spec/S10-llm-quality-harness.md) · [S11](./spec/S11-evaluation-and-golden-regression.md) · [A05](./spec/appendix/A05-prompt-templates.md) · [V01](./spec/appendix/V01-test-matrix.md) · [V02](./spec/appendix/V02-golden-cases.md) |
| Approval Cascade 部分通过、dependency group、residual obligation、writing-blocked | [plan/08](./plan/08-approval-and-cascade.md) · [S04](./spec/S04-turn-orchestration.md) · [M08](./spec/M08-approval-cascade.md) · [A02](./spec/appendix/A02-json-schemas.md) · [V01](./spec/appendix/V01-test-matrix.md) |
| 单窗口、项目 lock/lease、多实例接管 | [plan/04](./plan/04-goals-and-non-goals.md) · [S01](./spec/S01-project-storage.md) · [S04](./spec/S04-turn-orchestration.md) · [I03](./spec/platform/I03-filesystem-and-watcher.md) · [I05](./spec/platform/I05-desktop-shell-contract.md) · [R01](./spec/platform/R01-project-lifecycle.md) · [V01](./spec/appendix/V01-test-matrix.md) |
| Watcher cursor、event watermark、reconciliation、repair job、index health severity | [S01](./spec/S01-project-storage.md) · [S06](./spec/S06-knowledge-graph.md) · [I03](./spec/platform/I03-filesystem-and-watcher.md) · [R04](./spec/platform/R04-index-health-and-repair.md) · [V01](./spec/appendix/V01-test-matrix.md) · [V03](./spec/appendix/V03-external-spikes.md) |
| Long-form partition、ContextOverflow、`extractSemanticDelta` 降级 | [S07](./spec/S07-context-management.md) · [V01](./spec/appendix/V01-test-matrix.md) |
| 设计风险等级与 ReaderPanel 总分心智 | [design/02](./design/02-approval-cascade.md) · [design/03](./design/03-reader-panel.md) · `design/prototypes/02-approval-cascade.html` · `design/prototypes/03-reader-panel.html` |
| 七个 Agent canonical id、中文展示名、Trace/成本/prompt/schema 归因 | [M13](./spec/M13-agent-team-controls.md) · [A01](./spec/appendix/A01-schema-tables.md) · [A03](./spec/appendix/A03-event-catalog.md) · [A05](./spec/appendix/A05-prompt-templates.md) · [design/00](./design/00-design-tokens.md) |
| 桌面/本地壳路线 | [plan/04](./plan/04-goals-and-non-goals.md) · [S00](./spec/S00-system-contract.md) · [I05](./spec/platform/I05-desktop-shell-contract.md) · [R01](./spec/platform/R01-project-lifecycle.md) · [V03](./spec/appendix/V03-external-spikes.md) |
| Active appendix 最小接口抽取 | [appendix README](./spec/appendix/README.md) · [A01](./spec/appendix/A01-schema-tables.md) · [A02](./spec/appendix/A02-json-schemas.md) · [A03](./spec/appendix/A03-event-catalog.md) · [A04](./spec/appendix/A04-tool-catalog.md) · [A05](./spec/appendix/A05-prompt-templates.md) · [V01](./spec/appendix/V01-test-matrix.md) · [V02](./spec/appendix/V02-golden-cases.md) |

## 实施前验证入口

需要真实代码、依赖或运行数据证明的事项不再作为 TODO 漂浮:

- 测试矩阵和未来工程化测试归 [V01 · Test Matrix](./spec/appendix/V01-test-matrix.md)。
- golden cases 和 LLM 回归样例归 [V02 · Golden Cases](./spec/appendix/V02-golden-cases.md)。
- DeepSeek cache、1M context token 成本、AI SDK loop、SQLite/native binding、watcher、desktop shell、Tailwind/shadcn 映射等外部实查归 [V03 · External Spikes](./spec/appendix/V03-external-spikes.md)。

## 新增 TODO 规则

只有满足以下任一条件的新问题才进入本文件:

- 没有明确 plan/spec/platform/appendix 主权文档。
- 需要用户在多个方向中重新裁决。
- 当前文档无法安全给出契约,只能先保留未知。

写入 TODO 时必须同时说明关联文档、为什么不能直接归口、以及回头关闭条件。
