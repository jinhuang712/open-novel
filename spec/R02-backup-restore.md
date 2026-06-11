# R02 · Backup Restore

Backup Restore 定义项目备份、恢复点和失败恢复。它保护用户数据归属,不替代 Git 或云同步。

## 备份类型

| 类型 | 内容 |
|---|---|
| Manual Backup | 用户主动导出项目包 |
| Safety Snapshot | 危险操作前快照 |
| Migration Backup | schema 升级前备份 |
| Restore Point | 可选择恢复的已知状态 |

## 恢复流

```mermaid
flowchart LR
  Backup[备份] --> Validate[校验]
  Validate --> Preview[展示影响]
  Preview --> Confirm[用户确认]
  Confirm --> Restore[恢复]
  Restore --> Reindex[R04 Reindex]
```

## 失败收场

| 失败 | 用户看到 | 系统不能做 |
|---|---|---|
| 备份损坏 | 不可恢复原因 | 覆盖当前项目 |
| 恢复中断 | 保留原项目或明确部分状态 | 两边都标成功 |
| reindex 失败 | 数据恢复成功但索引过期 | 声称全量可查 |

## FAQ

**Q: 备份是否包含派生索引?**

A: 可以包含用于加速恢复,但索引不是事实来源。恢复后仍要校验健康度,必要时重建。

**Q: 恢复失败时系统应该回到哪里?**

A: 回到可解释的最近安全状态:原项目未被覆盖,或清楚标出已恢复/未恢复的范围。
