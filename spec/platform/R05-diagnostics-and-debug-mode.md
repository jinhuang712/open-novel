# R05 · Diagnostics And Debug Mode

Diagnostics And Debug Mode 定义系统如何导出和解释诊断信息。它服务排障,不改变项目事实。

## 诊断内容

| 内容 | 来源 |
|---|---|
| Trace steps | [M09](../M09-trace-observability.md) |
| Index health | [R04](./R04-index-health-and-repair.md) |
| Provider audit | [I01](./I01-llm-provider-contract.md) |
| Runtime state | [S01](../S01-runtime-state.md) |
| Settings snapshot | [M14](../M14-settings.md) |

诊断内容按正文、经验和系统过程分级。Developer Mode 可以帮助 dev build 使用者预览这些分级,但不能把预览变成默认导出。真实用户包不显示、不可开启 Developer Mode;是否编入和暴露由构建/打包变量控制。

| 分类 | 可见内容 | 默认导出 | 处理规则 |
|---|---|---|---|
| 正文 / 项目事实 | 文件名、锚点、片段摘要、事实健康状态 | 只导出摘要 | 正文全文需用户显式勾选,并在预览中标红敏感范围 |
| 经验 / 分析 | 经验条目状态、来源 turn、分析报告摘要 | 导出摘要 | 诊断包中默认只放状态和来源 |
| 审批 / Recap | pending/applied/rejected 摘要、来源跳转状态 | 导出摘要 | 不导出被拒 proposal 的完整正文快照,除非用户显式选择 |
| Provider / 凭据 | provider 类型、能力状态、认证失败类别 | 导出脱敏状态 | API key、token、secret 摘要和 keychain 路径永不导出 |
| Trace / Prompt / Tool | step 名称、耗时、错误类别、工具边界 | 导出脱敏过程 | 隐藏 prompt 全文、provider payload 和用户未确认的敏感上下文 |
| 系统环境 | 应用版本、平台、索引状态、日志水位 | 导出 | 本机用户名、绝对路径按预览选择脱敏 |

## 导出边界

```mermaid
flowchart LR
  Gate[Dev Build Gate] --> Dev[Developer Mode]
  Dev --> Collect[收集诊断]
  Collect --> Preview[分类预览]
  Preview --> Redact[脱敏]
  Redact --> Export[导出包]
  Export -.no restore.-> Project[项目事实]
```

导出包不能包含 API key、隐藏 prompt 全文或未脱敏用户敏感信息。导出包也不能作为项目恢复来源。

导出预览至少展示内容分类、预计体积、敏感等级、是否包含正文片段、是否包含经验内容、是否包含审批历史和已应用的脱敏策略。用户可以缩小导出范围;系统不能在用户选择“仅系统诊断”时夹带正文、经验全文或审批正文快照。

脱敏失败是阻断条件,不是警告。只要存在无法分类的 secret、未脱敏 provider payload、未知二进制日志或无法判断来源的正文片段,诊断包必须停止生成并指出问题类别。

## 失败收场

| 失败 | 用户看到 | 系统不能做 |
|---|---|---|
| 诊断缺失 | 标记不完整 | 伪造状态 |
| 分类不确定 | 要求缩小范围或手动排除 | 把未知内容按低敏导出 |
| 脱敏失败 | 阻断导出 | 泄露凭据 |
| 导出预览过期 | 要求重新预览 | 用旧预览生成新包 |
| 导出失败 | 保留本地状态 | 生成残缺包 |
| 非 dev build 请求 Developer Mode | Developer Mode 不可用 | 通过设置或隐藏入口开启 |

## FAQ

**Q: 诊断包能不能用来恢复项目?**

A: 不能。诊断包只用于排查,不是事实备份;项目事实库损坏时按 S01 以作者文件为准重建最小事实库。

**Q: Debug Mode 是否能看到所有 prompt 和正文?**

A: 不能默认暴露敏感内容。Developer Mode 要分层显示,导出前必须脱敏并排除凭据。

**Q: 真实用户包能不能打开 Developer Mode?**

A: 不能。真实用户包不显示也不可开启 Developer Mode;诊断导出按普通诊断流程走预览和脱敏。
