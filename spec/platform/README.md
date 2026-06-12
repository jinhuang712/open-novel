# Spec Platform · I/R Index

platform 承接支撑核心体验但不应打断主阅读路径的工程契约。它与 appendix 平级,但不是 appendix:platform 定义行为边界、接入前提、恢复路径和失败收场;appendix 只放字段、schema、prompt、测试矩阵等机器级明细。

读者理解主路径时先读根层 `Sxx` / `Mxx`;实现者接入外部边界、处理恢复/迁移/诊断时再读 platform。

当前编号存在有意跳号:I04(导入/导出契约)与 R02(备份/恢复契约)已按 2026-06-12 用户裁决撤销。编号不复用,索引只列当前仍有效的 I/R 文档。

## 分类索引

- [I01-llm-provider-contract](./I01-llm-provider-contract.md) — 模型 provider 能力、失败、审计和降级边界。
- [I02-editor-adapter-contract](./I02-editor-adapter-contract.md) — 编辑器适配层、选区、锚点、replace 和 undo 边界。
- [I03-filesystem-and-watcher](./I03-filesystem-and-watcher.md) — 文件系统、外部编辑监听、原子写和冲突处理。
- [I05-desktop-shell-contract](./I05-desktop-shell-contract.md) — 桌面壳、系统权限、窗口与本地路径契约。
- [R01-project-lifecycle](./R01-project-lifecycle.md) — 项目创建、打开、关闭、归档和恢复入口。
- [R03-migration-and-upgrade](./R03-migration-and-upgrade.md) — 文档、数据和索引迁移升级策略。
- [R04-index-health-and-repair](./R04-index-health-and-repair.md) — 索引健康、重建、降级查询和修复体验。
- [R05-diagnostics-and-debug-mode](./R05-diagnostics-and-debug-mode.md) — 诊断包、Debug Mode、导出边界和隐私保护。

## 更新规则

新增 platform 文档前先确认它不是根层主路径。如果读者必须先读它才能理解核心能力,它应该回到 `spec/Sxx` 或 `spec/Mxx`。如果它只是字段、参数、测试样例或实查记录,它应该进入 `spec/appendix/Axx` 或 `spec/appendix/Vxx`。
