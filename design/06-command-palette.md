# design/06 — 命令面板与快捷交互

> 原型:`design/prototypes/06-command-palette.html` · 上游:[spec/10 编辑器与交互](../spec/10-editor-and-interaction.md)(命令清单 / 上下文优先级 / IME 闸门以 spec 为准)

本篇收口五个"轻浮层"交互:命令面板、快速打开文件、@文件引用、框选 AI 改写(Cmd+K)、toast。它们共享同一套浮层视觉:`--bg-raised` + `--radius-lg` + `--shadow-lg`,顶部 1/4 处垂直定位,`Esc` 关闭,Focus Trap。

## 命令面板(Cmd+Shift+P / F1)

```mermaid
flowchart TB
  IN["输入行: > 前缀图标 + '输入命令…'"]
  G1["匹配命令组 (fuzzy, 高亮命中字符)"]
  G2["最近用过组 (空查询时置顶)"]
  FOOT["底部提示: ↑↓ 选择 · Enter 执行 · Esc 关闭"]
  IN --> G1 --> G2 --> FOOT
```

- 行结构:命令名(命中字符 accent 加粗)+ 右侧 kbd 键帽(有绑定时);category 作前缀「视图: 切换 dark mode」
- `when` 为 false 的命令不出现(如「审批: cascade 全部同意」仅有 cascade 待审时可见)
- 选中行 `--bg-active` + accent 左条;`↑↓` 循环,`Enter` 执行并关闭,执行后记入「最近用过」
- 空结果:「没有匹配的命令」+ 次行「试试 设置 / 章节 / 导出」
- 危险命令(project.delete 等)行尾 danger 点;执行仍走各自确认闸,面板不直接执行危险动作

## 快速打开文件(Cmd+P)

- 同壳不同源:搜章节 / 设定文件名 + 路径;行 = 类目图标 + 文件名 + 次要路径
- `Enter` 当前 tab 预览模式打开,`Cmd+Enter` 新 tab 永久打开(与 Tabs 单击/双击心智一致,[design/01 §Tabs](./01-main-layout.md#tabs))
- 输入 `>` 前缀即转命令面板(VSCode 习惯)

## @文件引用(ChatBox 内)

- 输入 `@` 100ms 后在光标下方弹 popover(不抢 `@` 字符;IME composition 中不弹)
- 源:实体 + 章节 + 设定文件,fuzzy;行 = 类目色点 + 名称 + 路径
- `↑↓` 选,`Enter` 确认 → textarea 中 `@xxx` 替换为 mention chip(accent-subtle 底圆角块,含 ×);`Esc` 取消保留字面 `@xxx`
- chip 在发送 prompt 时展开为 `[@角色名](mention://char_xxx)` 契约形态([spec/10](../spec/10-editor-and-interaction.md))

## 框选 AI 改写(Cmd+K)

```mermaid
flowchart LR
  SEL[框选段落] --> BTN["浮动条: ✦ 让 AI 修改 (Cmd+K) | 查询"]
  BTN --> INPUT["就地 inline 输入条: 修改要求 + 发送"]
  INPUT --> GEN["流式生成 (选区出虚线框 + 进度)"]
  GEN --> CARD["ApprovalCard (diff 高亮 from/to)"]
  CARD -->|同意| APPLY[replaceRange 落盘]
  CARD -->|拒绝+反馈| GEN
```

- inline 输入条吸附选区下方:`✦` accent 图标 + 单行输入(占位「怎么改这段?例:语气更克制」)+ 发送;`Esc` 收起
- 生成期间选区披 accent 虚线框;结果不直接替换 — 一律走 ApprovalCard([design/02](./02-approval-cascade.md)),同意后才 `replaceRange`
- 「查询」分支:选中文字直接发 queryFacts,结果在右栏查询面板展示,不动正文

## Toast

- 位置:右栏左缘上方(不遮编辑器正文);同屏最多 3 条堆叠,4s 自动消退,hover 暂停
- 类型:默认(无图标)/ success ✓ / warning ⚠ / danger ✗;模式切换 toast 带 mode 色点:「已切到 plan 模式」
- 带操作的 toast(如「已落盘 7 项 · 撤销」)操作文字 accent,点击后即销毁该条

## 键盘速查(本篇涉及)

| 键 | 上下文 | 行为 |
|---|---|---|
| `Cmd+Shift+P` / `F1` | 全局 | 命令面板 |
| `Cmd+P` | 全局 | 快速打开;输入 `>` 转命令 |
| `@` | ChatBox | 文件引用 popover(字面键) |
| `Cmd+K` | Editor 有选区 | inline 改写输入条 |
| `↑↓` / `Enter` / `Esc` | 浮层内 | 选择 / 执行 / 关闭(Esc 硬约束不可重绑) |

## 主题适配

- 浮层在深色主题用 `--bg-raised`(比卡面再亮一档)保证"浮"感;阴影加深由 token 自动处理
- fuzzy 命中字符:浅色 accent-text、深色 accent-text(已提亮),不用纯 accent 以保对比度
- mention chip / 虚线选区框深浅主题均走 accent 系 token
