# TODO · 文档清零与开放问题

> **[success]** **文档类 TODO 已清零。** 2026-06-02 已按 `site/docs.json` 对 53 个发布 HTML 与 README / TODO / Changelist 源做全量审计:历史 spec 体例升级、progress 角色混乱、已关闭 P0/P1/P2 项仍挂 TODO、README 陈旧导航和图表源码标题残留均已处理或转入 changelist 记录。
>
> 本页只保留**不能靠文档改写直接解决**的代码实施前验证、产品决策和后续架构实测项。已关闭的历史问题不再留在 TODO 活跃区,请从 [CHANGELOG.md](./CHANGELOG.md) 追溯。

## 1 · 当前文档待办

| 类别 | 状态 | 说明 |
|---|---|---|
| design 写作优先同步 | **1 open** | 2026-06-11 设计思想转向后(见 [plan/07](./plan/07-ui-layout.md) ADR-01/04 与 [design/01](./design/01-main-layout.md)),`design/02-06` 文档与原型仍按旧五区语境写作(右栏 ChatBox、底部状态栏、ThinkingPanel 常驻等表述);待按「纸面 + 召唤式表面」契约逐篇同步,入口表述以 design/01 为准。同批处理:[spec/12](./spec/12-shortcuts.md) 新增 `chat.focusComposer`(Cmd+L)并把 ChatBox 上下文更名 Composer。 |
| 文档重写 / CAST 化 | **0 open** | 所有 manifest 页面已重渲染到 CAST shell;Mermaid 作者源恢复到 `site/diagram-sources.json`,渲染器禁止图表 caption / body 暴露 Mermaid 方向声明等源码首行。 |
| 文档导航 / 索引 | **0 open** | README、index、progress README、TODO、Changelist 的职责边界已收敛;README 不再指向过期 progress 重构项。 |
| 已关闭历史项 | **0 open** | Embedding provider、schema 主权拆分、cascade controller 主权、reindex 失败语义、analyzeImpact Writer 边界等已决事项从 TODO 活跃区移除,保留在 changelist / 对应 spec 中。 |

## 2 · 实施前开放验证

以下项需要真实代码、依赖或运行数据验证。文档已给出暂定策略,但不能在文档层直接关闭。

| 优先级 | 问题 | 关联文档 | 回头解决方式 |
|---|---|---|---|
| P0 | DeepSeek `cache_control` 字段服务端识别情况未实查。 | [spec/00 §H](./spec/00-version-audit.md) · [spec/03](./spec/03-prompts.md) | W3 day-1 最小复现;若不支持,降级为稳定头部排布,功能不变但 token 成本上升。 |
| P0 | 1M context + per-agent 装齐契约的真实 token 成本未基线化。 | [spec/23](./spec/23-context-contracts.md) · [plan/12](./plan/12-memory-and-context.md) | 用 DeepSeek tokenizer / 真实请求记录基线;校验 Writer 单次章节调用估算 165K 是否偏离。 |
| P0 | AI SDK 6 `stopWhen` + tool result marker + `onStepFinish` 的端到端行为未跑通。 | [spec/00](./spec/00-version-audit.md) · [plan/08](./plan/08-tech-stack.md) | 写最小 runner spike;若 `stopWhen` 不可靠,回退纯手写 while runner。 |
| P0 | `sqlite-vec` + `better-sqlite3` + Drizzle 在 macOS arm64 / Linux x64 的 native binding 与 JOIN 行为未实测。 | [spec/00](./spec/00-version-audit.md) · [spec/18](./spec/18-embeddings.md) | 跑 `db.loadExtension(sqliteVec.path)`、`vec0` CRUD、普通表 JOIN;失败再评估 sqlite-vss / hnswlib-node。 |
| P0 | `better-sqlite3` 在 Next.js Route Handler 中的同步调用、WAL 并发写与 dev hot-reload connection 泄漏未实测。 | [spec/00](./spec/00-version-audit.md) · [plan/04](./plan/04-storage-model.md) | 做 Route Handler 并发写 spike;失败时把写操作隔离到 worker thread。 |
| P2 | design token → Tailwind v4 / shadcn 变量映射与 `@custom-variant dark`(绑 `data-theme`)未在真实组件实测;深色主题「深字浅钮」的 `--primary-foreground` 需过一遍 shadcn Button 全 variant。 | [design/00 §实现对接](./design/00-design-tokens.md) | W6 前端搭建时随首个 shadcn 组件接入验证;有冲突回写 00 映射表并记 CHANGELOG。 |

## 3 · 后续架构决策

| 优先级 | 问题 | 关联 | 暂定处理 |
|---|---|---|---|
| P1 | better-sqlite3 多 connection / LRU 策略仍需按“项目数 × 数据库文件数”重算。 | [plan/04 §连接池](./plan/04-storage-model.md) | 待 native binding spike 后定默认上限和关闭策略。 |
| P1 | `derived: true` 派生文件守卫的写盘、rollback、chokidar 三处实现细节仍需统一。 | [plan/01](./plan/01-overview.md) · [spec/06](./spec/06-approval-flow.md) · [spec/16](./spec/16-knowledge-schema.md) | 代码前补一张实现级接口表,避免守卫只停留在原则。 |
| P1 | Reflector 并发安全未定义:多个 turn 几乎同时完成时 `learnings` upsert 冲突。 | [plan/06](./plan/06-cascade-and-reflection.md) · [spec/22](./spec/22-memory-and-history.md) | 实现前明确 transaction / queue / conflict merge 策略。 |
| P1 | doom-loop 阈值 0.9、`callJsonAgent` retry 2 次与用户 retry 可能叠加成循环。 | [spec/06](./spec/06-approval-flow.md) · [spec/24](./spec/24-json-output.md) | 增加 metrics 与 retry budget;避免 escalate → retry → 再 escalate 的无效循环。 |
| P1 | `ContextOverflowError` 后的“分卷”兜底未设计。 | [spec/23](./spec/23-context-contracts.md) · [plan/12](./plan/12-memory-and-context.md) | 先保留为显式失败;进入长篇真实压测后再设计分卷策略。 |
| P1 | `extractSemanticDelta` 对中长篇正文 diff 的单次 LLM 稳定性依赖过高。 | [spec/19](./spec/19-impact-analysis.md) | 需要降级路径:分段 delta、规则预筛或人工确认。 |
| P2 | 取消路径仍有两套入口:Router action 与 ChatBox 顶部“取消本次对话”。 | [plan/02](./plan/02-multi-agent.md) · [spec/06](./spec/06-approval-flow.md) · [spec/24](./spec/24-json-output.md) | 实现前统一为同一个 `rollbackTurn` 语义。 |
| P2 | 魔法常数尚未系统化暴露或归档:doom-loop 0.9、cascade ≤3、weight 阈值、lastMessages=30、tokenBudget 软警等。 | 多文档 | 先保留硬编码默认;Settings/debug 设计时统一归档。 |
| P2 | 测试策略已有 spec,但实际 vitest / playwright / LLM golden / spec/00 audit 尚未落地。 | [spec/14](./spec/14-testing.md) · [spec/00](./spec/00-version-audit.md) | 开始代码实施后作为第一批工程化任务。 |
| P2 | 段锚点、差量 reindex、paragraph_embeddings 强耦合,锚点失稳会拖垮知识图谱。 | [spec/17](./spec/17-paragraph-anchors.md) · [spec/18](./spec/18-embeddings.md) · [spec/19](./spec/19-impact-analysis.md) | 需要真实章节样本和 mutation 测试后校准。 |

## 4 · 本轮文档审计记录

| 检查项 | 结果 | 落地 |
|---|---|---|
| 发布文档清单 | 53 个 HTML artifact,来自 `site/docs.json` + index / TODO / changelist / CHANGELOG 兼容页。 | 通过 `scripts/render_all_docs.py --validate` 和 CAST HTML validator 复核。 |
| 图表源码残留 | 发现 63 个 figure caption/body 仍显示 Mermaid 方向声明等源码首行。 | 恢复 63 段 Mermaid 作者源到 `site/diagram-sources.json`;渲染器改为语义 caption + CAST 安全 SVG。 |
| README / progress 角色 | README 仍指向过期 progress 重构说明,progress README 仍像 rolling plan 模板。 | README 改为历史档案说明;progress README 改为归档规则。 |
| 已关闭项挂 TODO | P0-4、P0-5、P2-1、OQ-1、OQ-2 等已关闭事项仍在 TODO 活跃区。 | 移出活跃 TODO,由 changelist 和对应 spec 承担历史追溯。 |
| 不确定事项 | 代码 / 依赖 / 运行数据才能验证的事项无法凭文档关闭。 | 保留在本页 §2 / §3,作为回头解决的开放问题。 |
| 文档形态迁移 | 2026-06-10 全部 53 个 HTML 文档迁移为纯 Markdown,CAST 渲染基础设施(`scripts/` `site/` `assets/` `.cast-docs/`)已删除。 | 本表以上各行为 HTML 时代的审计存档;现行文档规范见 [AGENTS.md](./AGENTS.md),变更详情见 [CHANGELOG.md](./CHANGELOG.md)。 |

## 5 · 变更日志

跨文档变更流水线见 [CHANGELOG.md](./CHANGELOG.md)。本文件只维护当前开放问题。
