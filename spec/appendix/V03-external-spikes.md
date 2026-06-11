# V03 · External Spikes

External Spikes 是外部能力原始实查证据的唯一归口:模型 provider、AI SDK、SQLite/native binding、浏览器原型、文件系统行为等。A06 只保存迁移/版本影响摘要,V01 只保存验证矩阵。

## 归口内容

- 最小复现命令。
- 真实版本和环境。
- 通过/失败证据。
- 对路线的影响。
- 需要回写的根层 spec 或 platform 文档。

## 实施前 spike 清单

| spike | 必须证明 | 影响文档 |
|---|---|---|
| DeepSeek `cache_control` | 服务端是否识别 cache 字段;不支持时稳定 prompt header 是否可作为降级 | [I01](../platform/I01-llm-provider-contract.md) · [S08](../S08-prompt-system.md) |
| 1M context token cost | Writer/Validator/ReaderPanel 典型 context package 的真实 token 成本和超限行为 | [S07](../S07-context-management.md) · [S10](../S10-llm-quality-harness.md) |
| AI SDK `stopWhen` / tool marker / `onStepFinish` | tool loop、step finish、取消和流式事件是否可端到端复现 | [S03](../S03-agent-runner.md) · [S10](../S10-llm-quality-harness.md) |
| `sqlite-vec` + `better-sqlite3` + Drizzle | macOS arm64 / Linux x64 native binding、`vec0` CRUD 和普通表 JOIN | [S06](../S06-knowledge-graph.md) · [A06](./A06-migration-notes.md) |
| `better-sqlite3` in Route Handler | 同步调用、WAL 并发写和 dev hot-reload connection 是否稳定 | [S01](../S01-project-storage.md) · [A06](./A06-migration-notes.md) |
| file watcher reliability | watcher cursor、漏事件、休眠恢复、reconcile scan 的平台行为 | [I03](../platform/I03-filesystem-and-watcher.md) · [R04](../platform/R04-index-health-and-repair.md) |
| desktop shell packaging / permission | 文件权限、系统菜单、窗口恢复、多实例 lease 和更新失败行为 | [I05](../platform/I05-desktop-shell-contract.md) · [R01](../platform/R01-project-lifecycle.md) |
| Tailwind v4 / shadcn token mapping | `data-theme` dark variant、Button variants、`--primary-foreground` 深色主题可读性 | [design/00](../../design/00-design-tokens.md) |

spike 通过不等于永久通过。实现前若版本、provider、系统平台或打包方式变化,必须刷新对应证据。

## 边界

spike 结果会过期。任何高漂移事实在实现前需要重新验证,不能把旧 spike 当永久真相。若 spike 改变行为语义或失败收场,原始证据留在 V03,行为契约回写对应根层 spec 或 platform 文档。
