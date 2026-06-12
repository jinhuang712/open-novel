# V03 · External Spikes

External Spikes 是外部能力原始实查证据的唯一归口:模型 provider、AI SDK、SQLite/native binding、桌面壳 renderer、本机执行宿主、文件系统行为等。A06 只保存迁移/版本影响摘要,V01 只保存验证矩阵。

## 归口内容

- 最小复现命令。
- 真实版本和环境。
- 通过/失败证据。
- 对路线的影响。
- 需要回写的根层 spec 或 platform 文档。

## 实施前 spike 清单

能力成立性 gate 优先于基础设施 spike。若下面三项在真实或等价规模长篇语料上不达标,实现不能继续默认“改完连带改”和“百万字一致性”承诺成立;必须先回写 S07/S06/S12/V02,选择裁判链重设计、承诺收窄或 cascade 分批形态。

| spike | 必须证明 | 影响文档 |
|---|---|---|
| long-form impact recall / precision | 在 50-100 万字长篇语料或等价 fixture 上注入已知设定/角色/伏笔变更,证明规则预筛、索引候选、锚点/依赖和 LLM 复核组成的影响分析链能产出可解释的召回率、精确率、漏召回样例和低置信候选;不达标则 S07 必须改为分阶段人工审查或收窄“全书连带改”承诺 | [S07](../S07-context-management.md) · [S06](../S06-knowledge-graph.md) · [V02](./V02-golden-cases.md) |
| segmented delta stability | 对同一批长篇变更重复运行分段 delta 抽取,证明语义 delta、锚点归属、依赖分类和冲突解释在可接受波动内;不达标则 `extractSemanticDelta` 只能作为低置信建议,不能进入主权候选 | [S07](../S07-context-management.md) · [S12](../S12-creative-engine.md) · [V02](./V02-golden-cases.md) |
| cascade cost / latency at book scale | 在中等规模和全书级 cascade fixture 上测量 context 装配、模型调用、reindex、审批批次、stream 心跳、token 用量和总耗时;不达标则 cascade 必须改为 preflight 估算、分批执行和用户 checkpoint,不能承诺一次性全书处理 | [S07](../S07-context-management.md) · [V02](./V02-golden-cases.md) |
| embedding provider contract | 选定 embedding 模型、维度、批量上限、rate limit、模型升级 drift 和 provider failure 行为;未完成前 S06 语义召回只能 `needs data` | [I01](../platform/I01-llm-provider-contract.md) · [S06](../S06-knowledge-graph.md) · [A01](./A01-schema-tables.md) |
| DeepSeek `cache_control` | 服务端是否识别 cache 字段;不支持时稳定 prompt header 是否可作为降级 | [I01](../platform/I01-llm-provider-contract.md) · [S08](../S08-prompt-system.md) |
| 1M context token cost | Writer/Validator/ReaderPanel 典型 context package 的真实 token 用量和超限行为 | [S07](../S07-context-management.md) · [S10](../S10-llm-quality-harness.md) |
| AI SDK `stopWhen` / tool marker / `onStepFinish` | tool loop、step finish、取消和流式事件是否可端到端复现 | [S03](../S03-agent-runner.md) · [S10](../S10-llm-quality-harness.md) |
| `sqlite-vec` + `better-sqlite3` + Drizzle | macOS arm64 / Linux x64 native binding、`vec0` CRUD 和普通表 JOIN | [S06](../S06-knowledge-graph.md) · [A06](./A06-migration-notes.md) |
| `better-sqlite3` in desktop host | Tauri sidecar 语境下的 Node sidecar 进程形态(`better-sqlite3` 是 Node native binding,宿主必须以兼容的进程形态承载)、同步调用、WAL 并发写、常驻执行宿主连接和 renderer 热更新期间连接是否稳定 | [S01](../S01-project-storage.md) · [A06](./A06-migration-notes.md) |
| stream during heavy SQLite/reindex | Tauri sidecar(Node 进程)内重 reindex、批量 embedding 写入、WAL checkpoint 和普通读写并发时,测量 stream 心跳延迟、UI 事件投递、host CPU 占用和是否需要 worker thread/独立进程隔离;renderer 热更新期间 sidecar 不中断 | [S05](../S05-streaming-ui-protocol.md) · [S06](../S06-knowledge-graph.md) · [S01](../S01-project-storage.md) |
| file watcher reliability | watcher cursor、漏事件、休眠恢复、reconcile scan 的平台行为 | [I03](../platform/I03-filesystem-and-watcher.md) · [R04](../platform/R04-index-health-and-repair.md) |
| desktop host interruption/recovery | Tauri sidecar 语境:sidecar 与 Tauri 主进程生命周期绑定/解绑行为、renderer 热更新不断 sidecar 与 run、host crash/restart、sidecar restart、in-flight provider/tool call、interrupted run 恢复和 apply journal 接管 | [S03](../S03-agent-runner.md) · [S05](../S05-streaming-ui-protocol.md) · [S01](../S01-project-storage.md) |
| desktop shell packaging / permission(Tauri) | Tauri 多端打包(macOS / Windows / Linux)、文件权限、单实例 lock 与二次启动聚焦、系统菜单/快捷键登记、安全凭据(macOS Keychain / Windows Credential Manager / Linux secret service)、窗口恢复和更新失败行为 | [I05](../platform/I05-desktop-shell-contract.md) · [R01](../platform/R01-project-lifecycle.md) |
| Tailwind v4 / shadcn token mapping | `data-theme` dark variant、Button variants、`--primary-foreground` 深色主题可读性 | [design/00](../../design/00-design-tokens.md) |

spike 通过不等于永久通过。实现前若版本、provider、系统平台或打包方式变化,必须刷新对应证据。

## 边界

spike 结果会过期。任何高漂移事实在实现前需要重新验证,不能把旧 spike 当永久真相。若 spike 改变行为语义或失败收场,原始证据留在 V03,行为契约回写对应根层 spec 或 platform 文档。
