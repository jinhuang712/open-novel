# R05 · Diagnostics And Debug Mode

Diagnostics And Debug Mode 定义系统如何导出和解释诊断信息。它服务排障,不改变项目事实。

## 诊断内容

| 内容 | 来源 |
|---|---|
| Trace steps | [M09](../M09-trace-observability.md) |
| Index health | [R04](./R04-index-health-and-repair.md) |
| Provider audit | [I01](./I01-llm-provider-contract.md) |
| Runtime state | [S02](../S02-runtime-state.md) |
| Settings snapshot | [M14](../M14-settings-and-developer-mode.md) |

## 导出边界

```mermaid
flowchart LR
  Dev[Developer Mode] --> Collect[收集诊断]
  Collect --> Redact[脱敏]
  Redact --> Export[导出包]
  Export -.no restore.-> Project[项目事实]
```

导出包不能包含 API key、隐藏 prompt 全文或未脱敏用户敏感信息。导出包也不能作为项目恢复来源。

## 失败收场

| 失败 | 用户看到 | 系统不能做 |
|---|---|---|
| 诊断缺失 | 标记不完整 | 伪造状态 |
| 脱敏失败 | 阻断导出 | 泄露凭据 |
| 导出失败 | 保留本地状态 | 生成残缺包 |

## FAQ

**Q: 诊断包能不能用来恢复项目?**

A: 不能。诊断包只用于排查,不是事实备份;恢复走 R02。

**Q: Debug Mode 是否能看到所有 prompt 和正文?**

A: 不能默认暴露敏感内容。Developer Mode 要分层显示,导出前必须脱敏并排除凭据。
