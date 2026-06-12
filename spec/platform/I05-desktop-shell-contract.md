# I05 · Desktop Shell Contract

Desktop Shell Contract 定义本地桌面壳集成边界。Open Novel 的唯一主产品形态是本机桌面壳应用:壳内常驻执行宿主/sidecar 负责文件权限、窗口、菜单、系统快捷键、更新、多实例写入权、安全凭据、本地数据库连接、watcher、journal 和长任务生命周期。

桌面壳不是第二套业务层。作品事实、写入事务、上下文、审批和索引健康仍由应用内 S/M/platform 契约拥有。壳层拥有的是本机能力和进程生命期,不是小说事实。

## 应用形态裁决

| 形态 | 职责 | 不承担什么 |
|---|---|---|
| 桌面壳生产形态 | 承载本机权限、keychain、全局菜单/快捷键、窗口与多实例、项目 lease、SQLite/native binding、watcher、append-only journal、runner 长任务和更新恢复 | 不绕过 S01/S04/S09 直接改作品事实,不把菜单命令变成隐式写入 |
| 桌面壳开发模式 | 在同一桌面壳边界内提供 renderer 热更新、DevTools、诊断开关、mock provider 和本机调试日志 | 不引入基于普通浏览器的 Web 调试入口,不把开发进程中断写成生产失败语义 |
| Renderer UI | 发送用户命令、订阅 stream、展示持久 turn 状态和审批结果 | 不成为业务事实源,不用前端内存决定 run 是否成功或作品是否已写入 |

这不是 Web 与桌面双路线。实现可以先优化桌面壳开发模式的启动速度和热更新体验,但任何涉及凭据、安全写入、长任务、断线恢复、外部文件监听或多窗口接管的验收,都必须在桌面壳边界内完成。

## 集成点

| 集成 | 约束 |
|---|---|
| 文件权限 | 用户明确选择 workspace |
| 安全凭据 | API key 和 provider secret 进入系统 keychain 或等价安全凭据库;不得明文写入项目 |
| 常驻执行宿主 | runner、watcher、journal、SQLite 连接和恢复流程在 sidecar/本机后台进程中运行,不绑定单个 renderer 生命周期 |
| 系统快捷键 | 不抢 IME 和编辑器焦点 |
| 窗口状态 | 恢复不能改变业务事实;多窗口必须尊重项目 lease |
| 菜单命令 | 进入 Command Registry |
| 多实例 | 第二窗口默认只读;显式接管走 R01/I03 lease 语义 |
| 自动更新 | 进入 [R03](./R03-migration-and-upgrade.md) |

## 安全凭据库契约

桌面壳拥有 provider credential 的系统边界,应用层拥有 provider 配置和可用状态。secret 不进入项目目录、数据库明文字段、设置导出、项目包、Trace、诊断包或 renderer 持久缓存。

| 操作 | 壳层职责 | 应用层看到什么 |
|---|---|---|
| 写入 | 将 API key/token 写入系统 keychain 或等价安全凭据库,返回不可反推的 credential reference | provider 已配置、最近验证状态、可用模型摘要 |
| 读取 | 只在 sidecar/provider 调用前短暂取用 secret | 成功/失败和脱敏错误类别 |
| 删除 | 删除安全凭据和本地 credential reference | provider 变为未配置,相关能力禁用 |
| 迁移 | 从旧明文来源导入安全凭据库并清理旧来源 | 迁移完成、失败或需用户手动清理 |
| 导出 | 拒绝导出 secret,只允许导出 provider 类型和需重配状态 | 导出预览显示“凭据已剔除” |

迁移旧凭据必须是一次可解释的安全收场:写入安全凭据库成功且旧明文来源清除成功,provider 才能恢复可用;任一步失败都保持 provider 禁用,并把旧来源位置以脱敏类别展示给用户。壳层不得为了兼容旧配置继续读取明文 settings。

provider 认证失败、keychain item 缺失或读取权限被系统撤回时,sidecar 必须返回“凭据失效”而不是普通模型失败。应用层可以保留 pending approval、recap 和项目事实,但需要 provider 的继续、重做、导出诊断复跑和 Agent turn 都必须提示重新配置。

## 系统快捷键冲突矩阵

系统快捷键由桌面壳登记,命令语义由 [M02](../M02-command-palette-and-quick-open.md) 和 [S14](../S14-editor-and-interaction.md) 裁决。壳层不能用全局监听绕过编辑器焦点或 IME 组合态。

| 冲突场景 | 优先级 | 收场 |
|---|---|---|
| IME 组合态正在输入 | IME 优先 | 快捷键不触发,不关闭浮层,不改正文 |
| 正文编辑器处理文本命令 | 编辑器优先 | 壳层命令延后或禁用,必要时提示可重绑 |
| modal / approval card 有 focus trap | 当前浮层优先 | 只处理浮层声明的命令,全局命令显示不可用 |
| 系统或其他应用占用快捷键 | 操作系统优先 | 登记失败时禁用该快捷键并提示重绑 |
| 多窗口同项目 | writable lease owner 优先 | 只读窗口可打开命令面板,写入类命令禁用 |
| pending approval 锁定写入 | 审批主权优先 | 只允许打开/跳转审批,不能直接接受或新建写入 turn |

快捷键冲突不是 silent fallback。用户必须能在 Settings 或命令说明里看到冲突原因、当前生效入口和重绑路径;如果无法判断焦点或 IME 状态,壳层按“不触发写入命令”收场。

## 边界图

```mermaid
flowchart LR
  OS[操作系统] --> Shell[Desktop Shell]
  Shell --> Permission[权限请求]
  Shell --> Host[常驻执行宿主]
  Shell --> Menu[系统菜单]
  Shell --> Window[窗口状态]
  Shell --> Lease[项目 lease]
  Permission --> App[Open Novel App]
  Host --> Storage[S01 Project Storage]
  Host --> Runner[S03 Agent Runner]
  Host --> Watcher[I03 Filesystem Watcher]
  Menu --> Command[M02 Command Registry]
  Window --> Runtime[S02 Runtime State]
  Lease --> Lifecycle[R01 Project Lifecycle]
  App --> Stream[S05 Streaming UI]
```

桌面壳只能承接系统能力、窗口外壳和本机执行宿主,不能拥有作品事实。任何菜单命令最终都要回到应用内 command registry;任何写入最终都要回到 S01/S04 的审批和事务语义。

## 失败收场

| 失败 | 处理 |
|---|---|
| 权限被拒 | 明确提示并停在安全状态 |
| keychain 不可用 | 禁用需要 secret 的 provider,提示用户重新配置;不能把 secret 明文写入项目 |
| 凭据迁移失败 | provider 保持禁用,提示已完成和未完成的清理范围 |
| provider 凭据失效 | 运行中无 durable change 的 turn 失败并生成 recap;pending approval 保留可审但不能继续扩写 |
| sidecar 崩溃 | UI 进入恢复中,重连持久 turn/journal;不能用 renderer 内存补写结果 |
| 系统快捷键冲突 | 禁用或提示重绑,不能抢 IME/编辑器焦点 |
| 更新失败 | 保持旧版本可用 |
| 窗口恢复失败 | 不影响项目事实 |
| 多实例接管失败 | 保持第二窗口只读 |
| lease 丢失 | 禁用写入入口并要求重新加载 |

## FAQ

**Q: 开发调试要不要保留浏览器 Web 入口?**

A: 不保留。开发调试也走桌面壳开发模式,通过 renderer 热更新、DevTools、mock provider 和诊断日志提高效率,不再维护一套基于普通浏览器的 Web 语义。

**Q: 为什么还需要 I05?**

A: 因为文件权限、系统快捷键、菜单、窗口和更新会影响作品主权和失败收场。提前定义边界能避免把壳层写成事实层。

**Q: 桌面壳能不能直接读写 workspace?**

A: 不能绕过应用存储层。壳层可以请求权限和传递路径,实际读写仍由 S01/I03 处理。

**Q: renderer 崩溃或热更新会不会取消正在跑的 Agent?**

A: 不会。renderer 只是观察和命令入口;Runner、journal、watcher 和 SQLite 连接由常驻执行宿主承接。

**Q: 桌面壳能不能把 API key 放进设置文件便于导出?**

A: 不能。设置文件和项目包只保存 provider 配置与重配状态,secret 只能存在系统安全凭据库。
