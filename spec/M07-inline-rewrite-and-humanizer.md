# M07 · Inline Rewrite And Humanizer

Inline Rewrite 和 Humanizer 是表达层改写能力。用户框选文字或主动请求“去 AI 味”时,系统可以改表达,但不能借润色改变剧情事实。

## 两种入口

| 入口 | 快捷键/位置 | 目标 |
|---|---|---|
| Inline Rewrite | `Cmd+K` 框选改写 | 局部语句重写 |
| Humanizer | 输入条或 ReaderPanel 风险入口 | 去套话、降 AI 味、贴近作者风格 |

## 改写边界

```mermaid
flowchart LR
  Selection[选区] --> Intent[改写意图]
  Intent --> Style[S09 Style Boundary]
  Style --> Draft[Rewrite Draft]
  Draft --> Diff[Diff Preview]
  Diff --> Approval[M08 Approval Cascade]
```

改写只能改变表达层。角色关系、事件顺序、设定事实、伏笔含义发生变化时,必须升级为剧情/设定 proposal,不能继续叫润色。

## 失败收场

| 失败 | 用户看到 | 系统不能做 |
|---|---|---|
| 选区过大 | 要求缩小范围或转 Writing | 静默截断 |
| 改写越权 | 标记剧情/事实变化 | 当作润色通过 |
| 风格来源不足 | 使用默认轻润色并说明 | 伪造作者风格 |
| diff 生成失败 | 保留原文和请求 | 直接替换 |

## Design

框选改写见 [design/06](../design/06-command-palette.md)。风格设置入口见 [design/04](../design/04-settings.md)。

## 测试清单

| 类型 | 场景 |
|---|---|
| diff | 原文和改写可对照 |
| 越权 | 剧情变化被拦截 |
| 审批 | 改写接受后才 replaceRange |
| 风格 | 经验关闭后不注入对应偏好 |

## FAQ

**Q: 选区改写是不是可以比章节写作更快地落盘?**

A: 不能绕过接受动作。即便只是局部润色,用户也必须看到 diff 并明确接受。

**Q: 去 AI 味能不能顺手补剧情逻辑?**

A: 不能。补剧情逻辑已经改变事实或事件因果,必须升级为写作或规划 proposal。
