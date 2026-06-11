# TODO · 开放问题与实施前验证

本文件只维护当前仍开放的问题、代码实施前验证项和后续架构决策。已关闭的文档迁移、HTML/CAST 时代审计和历史清零记录归 [CHANGELOG.md](./CHANGELOG.md) 与 [progress](./progress/README.md) 追溯。

## 1 · 当前文档待办

当前无开放文档待办。已关闭的文档迁移、appendix 抽取规则、M/platform 明细覆盖和风险等级命名收敛见 [CHANGELOG.md](./CHANGELOG.md)。

## 2 · 实施前开放验证

以下项需要真实代码、依赖或运行数据验证。文档已给出暂定策略,但不能在文档层直接关闭。

| 优先级 | 问题 | 关联文档 | 回头解决方式 |
|---|---|---|---|
| P0 | DeepSeek `cache_control` 字段服务端识别情况未实查。 | [spec/S00](./spec/S00-system-contract.md) · [spec/S03](./spec/S03-agent-runtime.md) · [A06](./spec/appendix/A06-migration-notes.md) | 做最小复现;若不支持,降级为稳定头部排布,功能不变但 token 成本上升。 |
| P0 | 1M context + per-agent 装齐契约的真实 token 成本未基线化。 | [spec/S07](./spec/S07-context-and-query.md) · [plan/05](./plan/05-story-world.md) | 用 DeepSeek tokenizer / 真实请求记录基线;校验 Writer 单次章节调用估算是否偏离。 |
| P0 | AI SDK 6 `stopWhen` + tool result marker + `onStepFinish` 的端到端行为未跑通。 | [spec/S00](./spec/S00-system-contract.md) · [spec/S03](./spec/S03-agent-runtime.md) | 写最小 runner spike;若 `stopWhen` 不可靠,回退纯手写 while runner。 |
| P0 | `sqlite-vec` + `better-sqlite3` + Drizzle 在 macOS arm64 / Linux x64 的 native binding 与 JOIN 行为未实测。 | [spec/S00](./spec/S00-system-contract.md) · [spec/S06](./spec/S06-knowledge-graph.md) | 跑 `db.loadExtension(sqliteVec.path)`、`vec0` CRUD、普通表 JOIN;失败再评估替代方案。 |
| P0 | `better-sqlite3` 在 Next.js Route Handler 中的同步调用、WAL 并发写与 dev hot-reload connection 泄漏未实测。 | [spec/S00](./spec/S00-system-contract.md) · [spec/S01](./spec/S01-project-storage.md) | 做 Route Handler 并发写 spike;失败时把写操作隔离到 worker thread。 |
| P2 | design token → Tailwind v4 / shadcn 变量映射与 `@custom-variant dark`(绑 `data-theme`)未在真实组件实测;深色主题「深字浅钮」的 `--primary-foreground` 需过一遍 shadcn Button 全 variant。 | [design/00 §实现对接](./design/00-design-tokens.md) | 前端搭建时随首个 shadcn 组件接入验证;有冲突回写 00 映射表并记 CHANGELOG。 |

## 3 · 后续架构决策

| 优先级 | 问题 | 关联 | 暂定处理 |
|---|---|---|---|
| P1 | better-sqlite3 多 connection / LRU 策略仍需按“项目数 × 数据库文件数”重算。 | [spec/S01](./spec/S01-project-storage.md) · [A06](./spec/appendix/A06-migration-notes.md) | 待 native binding spike 后定默认上限和关闭策略。 |
| P1 | `derived: true` 派生文件守卫的写盘、内部恢复、chokidar 三处实现细节仍需统一。 | [plan/03 红线 R7](./plan/03-guardrails.md) · [spec/S01](./spec/S01-project-storage.md) · [spec/S04](./spec/S04-turn-orchestration.md) · [spec/S06](./spec/S06-knowledge-graph.md) | 代码前补一张实现级接口表,避免守卫只停留在原则。 |
| P1 | Reflector 并发安全未定义:多个 turn 几乎同时完成时 `learnings` upsert 冲突。 | [plan/10](./plan/10-memory-and-learning.md) · [spec/S02](./spec/S02-runtime-state.md) | 实现前明确 transaction / queue / conflict merge 策略。 |
| P1 | doom-loop 阈值、结构化输出 retry 与用户 retry 可能叠加成循环。 | [spec/S03](./spec/S03-agent-runtime.md) · [spec/S04](./spec/S04-turn-orchestration.md) | 增加 metrics 与 retry budget;避免 escalate → retry → 再 escalate 的无效循环。 |
| P1 | `ContextOverflowError` 后的“分卷”兜底未设计。 | [spec/S07](./spec/S07-context-and-query.md) · [plan/05](./plan/05-story-world.md) | 先保留为显式失败;进入长篇真实压测后再设计分卷策略。 |
| P1 | `extractSemanticDelta` 对中长篇正文 diff 的单次 LLM 稳定性依赖过高。 | [spec/S07](./spec/S07-context-and-query.md) | 需要降级路径:分段 delta、规则预筛或人工确认。 |
| P2 | 魔法常数尚未系统化暴露或归档:doom-loop 0.9、cascade ≤3、weight 阈值、lastMessages=30、tokenBudget 软警等。 | 多文档 | 先保留硬编码默认;Settings/debug 设计时统一归档。 |
| P2 | 测试策略已有 appendix 归口,但实际 vitest / playwright / LLM golden / spec audit 尚未落地。 | [V01](./spec/appendix/V01-test-matrix.md) · [spec/S00](./spec/S00-system-contract.md) | 开始代码实施后作为第一批工程化任务。 |
| P2 | 段锚点、差量 reindex、paragraph_embeddings 强耦合,锚点失稳会拖垮知识图谱。 | [spec/S06](./spec/S06-knowledge-graph.md) · [spec/S07](./spec/S07-context-and-query.md) | 需要真实章节样本和 mutation 测试后校准。 |

## 4 · 变更日志

跨文档变更流水线见 [CHANGELOG.md](./CHANGELOG.md)。历史审计和迁移复盘见 [progress](./progress/README.md)。
