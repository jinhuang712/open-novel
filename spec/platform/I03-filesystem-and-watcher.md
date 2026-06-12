# I03 · Filesystem And Watcher

Filesystem And Watcher 定义本地文件、外部编辑器和 Open Novel 存储层之间的集成边界。

## 需要解决的问题

| 场景 | 风险 |
|---|---|
| 外部编辑 Markdown | UI 状态过期 |
| 文件被移动/删除 | 最近项和索引失效 |
| 写盘中断 | 半文件或假成功 |
| watcher 漏事件 | 索引健康度错误 |

## 集成流

```mermaid
flowchart LR
  FS[File System] --> Watcher[Watcher]
  Watcher --> Cursor[Watcher Cursor]
  Cursor --> Storage[S01 Project Storage]
  Watcher --> Reindex[R04 Index Repair]
  Storage --> Editor[S14 Editor]
```

## Watcher cursor 与水位

watcher 不是“收到事件就算完成”。平台层必须维护 cursor 和水位,让存储和索引知道自己看到的是不是完整文件世界。

| 对象 | 含义 |
|---|---|
| watcher cursor | 最近一次处理到的文件事件位置或扫描时间点。 |
| event watermark | 已确认进入存储/索引队列的最高事件水位。 |
| file fingerprint ledger | 每个作者源文件的持久指纹基线,用于离线外部编辑、审批失效和 reindex 范围判断。 |
| write token | 系统自写文件时生成的一次性标识,用于识别 watcher 回声。 |
| reconcile scan | 周期性或异常后的文件系统全量对账,用于弥补漏事件。 |
| stale range | 文件新于索引或 cursor 不可信的范围。 |
| lease signal | 多窗口写入权、接管和 lease loss 的平台信号。 |

漏事件、进程休眠、权限变化或 watcher crash 后,系统必须启动 reconcile scan。reconcile 完成前,索引健康不得显示 healthy。

## 自写回声与外部编辑

平台层不能只凭进程内状态判断“这是我自己写的”。每次系统写入作者源文件时,存储层提供 write token、目标文件身份、写前指纹和写后指纹;watcher 事件只有同时匹配 write token、当前 writable owner、文件身份和写后指纹,才算自写回声。

| 事件 | 平台投递 |
|---|---|
| 匹配当前 write token | 投递 self-write echo,推进 cursor 和 fingerprint ledger。 |
| 不匹配 write token 但指纹变化 | 投递 external edit,由 S01 判定审批失效和 reindex 范围。 |
| watcher 漏过系统写入完成事件 | reconcile scan 用 fingerprint ledger 补齐水位,不能把项目标为 healthy。 |
| 离线期间文件变化 | 下次打开先对账指纹,再允许高风险写入。 |

## 多实例与 lease

| 场景 | 平台行为 |
|---|---|
| 第二窗口打开同项目 | 只读打开,展示当前 writable owner。 |
| 显式接管 | 发送 lease transfer,要求原窗口降级只读。 |
| 原窗口不可达 | 进入 stale lease recovery,恢复前不自动写入。 |
| lease loss | 禁用写作、审批、落盘和 repair 操作,提示重新加载。 |
| pending approval | 接管提示必须列出 pending 状态,不能静默关闭。 |

Lease 载体必须是项目目录内可持久校验的 lock/lease 记录,并与项目事实库中的 owner、lease token、fencing token、续约时间和过期时间一致。续约失败、token 不匹配、fencing token 过期或检测到更新 owner 后,当前窗口立即降级只读;任何延迟到来的写入命令都必须被 storage 拒绝。

显式接管生成新的 fencing token。旧 owner 即使随后恢复连接,也只能展示 lease lost 并要求重新加载,不能继续执行队列里尚未落盘的写入、审批应用或 repair job。

## 失败收场

| 失败 | 用户看到 | 系统不能做 |
|---|---|---|
| 外部冲突 | 重载/保留/合并选择 | silent overwrite |
| watcher 失效 | 索引健康 warning | 继续声称索引完整 |
| reconcile 未完成 | stale/degraded 状态 | 启用高风险 Agent 写入 |
| 原子写失败 | 写入失败和恢复建议 | 标记成功 |
| 路径越权 | 阻断 | 读写 workspace 外文件 |
| lease 冲突 | 只读降级或接管确认 | last-write-wins |

## FAQ

**Q: watcher 漏事件时是否意味着项目不能编辑?**

A: 不一定。正文编辑仍可继续,但派生索引必须标记 degraded,高风险查询和生成要降级或阻断。

**Q: 外部编辑冲突由谁裁决?**

A: 用户裁决。系统可以展示差异和建议,不能默认覆盖外部改动。
