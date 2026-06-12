# Progress 日志 · P Index

> **[info]** **定位已收敛:** `progress/` 只作为历史档案保留,用于追溯项目启动、阶段偏差和重大设计变化。当前待办以 [TODO.md](../TODO.md) 为准;跨文档变更以 [CHANGELOG.md](../CHANGELOG.md) 为准。
>
> 后续不再把 progress 当作 rolling plan 或任务模板使用。若发生新的重大方向变化,优先更新对应 plan/spec、TODO 与 CHANGELOG;只有需要完整复盘决策过程时才追加新的 `Pxxx` progress 档案。

## 归档规则

- **保留内容**:当时的目标、偏差、风险、关键决策和关联 commit。
- **不再承担**:活跃 TODO、未来计划排期、未决问题主权和变更日志主权。
- **读取方式**:先看当前 plan/spec 与 TODO,再用 progress 追溯为什么形成这些决策。

## 索引

| ID | 标题 | 日期 | 周 | 起始 commit | retro commit |
|---|---|---|---|---|---|
| P000 | 项目启动: 文档骨架 | 2026-04-29 | W1 | `cdc626d` | (合一) |
| P001 | W2: VSCode-Like Shell + EditorAdapter 骨架 | 2026-04-29 起 | W2 | (待) | (W2 收尾) |
| P002 | 战略升级: 纳入叙事引擎 + 读者仿真器 | 2026-04-30 | 跨期 (W9-W10) | (本期 docs commit) | (W9/W10 收尾各自) |
| P003 | UX 治理: Tab 切模式 + 快捷键 Registry + SettingsDialog 重设计 | 2026-04-30 | 跨期 (W2-W3) | (本期 docs commit) | (W2/W3 收尾各自) |
| P004 | 文档审计加固 (9 严重 + 23 中等 + 3 新 spec + drift 修正) | 2026-04-30 | 跨期 (W2 末尾,W3 启动前必清) | (本期 docs commit) | (W3 day-1 跑 spec/S00 后追加) |
| P005 | 知识图谱专攻 (cascade + RAG 真正可工作的地基: 1 plan + 6 spec + 5 同步;W7-W10 重排) | 2026-05-06 | 跨期 (W2 末尾,W7-W10 落地前) | (本期 docs commit) | (W10 收尾) |
| P006 | 记忆 / 上下文 / JSON 输出 / 五大守则 一致性优先重设计 (5 反馈点 → 6 commit tree: T1-T6;1 plan + 5 新 spec + 14 同步) | 2026-05-06 | 跨期 (W2 末尾,W3-W11 落地前) | `5c6f8a7` (T1) → 本批末 (T6) | (W11 收尾) |
| P007 | opencode 借鉴落地 + TODO closure (T1-T9: spec/S00 audit / 混合分档 / 卷级摘要 / tool truncate / middleware / doom-loop / SQLite + 反馈表 / TODO 关闭 / 进度) | 2026-05-07 | 跨期 (W2 末尾,W3-W11 落地前) | `5da548b` (T1) → 本批末 (T9) | (W11 收尾) |
| P008 | plan/ 重写实施计划 | 2026-06-11 | 文档重组 | (计划存档) | (已落地到 plan/spec/design/README) |
| P009 | 落地前全量架构与设计审计 (110 原始发现 → P0×1 / P1×41 / P2×26 确认,TODO 回填 44 条) | 2026-06-12 | 实现启动前 | (本期 docs commit) | (按批次修复后追加) |
| P010 | 实施计划: 从纯文档到可运行应用 (阶段 0-6 + V03 长篇能力门禁) | 2026-06-13 | 实现启动 | (本期 docs commit) | (各阶段收尾追加) |

(后续每条 entry 自动追加到此表)

## 专题归档

2026-06-11 根层 spec 二层重整前的 29 篇旧 spec 原文已清理,不再保留;当前技术契约以 [spec/S00](../spec/S00-system-contract.md) 和 [spec appendix](../spec/appendix/README.md) 为准。
