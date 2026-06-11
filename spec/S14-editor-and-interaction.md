# S14 · Editor And Interaction

这篇把编辑器写成“命令路由面”。正文纸面是主角,高亮、批阅层、旁注、查询、输入条、审批卡和快捷键都只是围绕纸面工作的入口。它们不能抢焦点,不能制造不可撤销的 AI 替换,也不能把派生提示伪装成正文事实。

## 交互表面的地图

```mermaid
flowchart TB
  Editor[纸面编辑器] --> Selection[选区/光标]
  Selection --> Command[Command Registry]
  Command --> Search[Universal Search]
  Command --> Query[查询浮层]
  Command --> Composer[Agent 输入条]
  Command --> Approval[审批卡]
  Command --> Rewrite[AI rewrite]
  Rewrite --> Review[Inline Review Layer]
  KG[Knowledge Graph] --> Highlight[高亮/旁注]
  Highlight --> Query
  Review --> Undo[Editor undo]
  Review --> Approval
  Approval --> Storage[Project Storage]
```

所有入口最终都应该落到命令系统或 turn orchestration,而不是各自直接操作正文。

## 正文事实边界

| 在编辑器里看到的东西 | 是否正文事实 | 说明 |
|---|---|---|
| 用户直接输入的正文 | 是 | 保存后进入项目文件 |
| AI inline review | 否,直到接受 | 近文批注,接受后进入 editor undo |
| AI 改写 proposal | 否,直到审批接受 | 跨文档/事实/剧情/设定变化进入 ChangeSet |
| 实体高亮 | 否 | 来自派生索引 |
| 旁注 | 否 | 解释来源或风险 |
| violation marker | 否 | 风险提示 |
| 查询结果 | 否 | 带来源的事实展示 |

编辑器可以展示很多层信息,但只有用户输入、inline review 接受后的替换和审批后落盘的内容改变作品事实。

## 命令解析顺序

```mermaid
flowchart TD
  Key[键盘/按钮/菜单/命令面板] --> IME{IME 组合态?}
  IME -->|是| Text[交给文本输入]
  IME -->|否| Modal{有 focus trap?}
  Modal -->|是| ModalCmd[浮层命令]
  Modal -->|否| Selection{编辑器选区?}
  Selection -->|是| EditorCmd[编辑器命令]
  Selection -->|否| Query{查询浮层打开?}
  Query -->|是| QueryCmd[查询命令]
  Query -->|否| Composer{输入条聚焦?}
  Composer -->|是| ComposerCmd[输入条命令]
  Composer -->|否| Global[全局命令]
```

快捷键不是全局暴力监听。当前焦点上下文拥有优先权。

## 命令登记表

每个命令都必须声明:

| 字段 | 为什么需要 |
|---|---|
| 可用上下文 | 防止命令在错误界面触发 |
| 焦点需求 | 防止抢输入 |
| 是否危险 | 触发确认或审批 |
| 是否调用 Agent | 进入 turn 生命周期 |
| 是否修改正文 | 进入 inline review、undo 或审批路径 |
| 失败提示 | 用户知道如何恢复 |

完整命令清单归 appendix;根层只定义命令治理规则。

## 查询浮层不是输入条

| 能力 | Universal Search | 查询浮层 | Agent 输入条 |
|---|---|---|---|
| 目标 | 找任何项目对象并导航 | 查项目事实 | 发起讨论/规划/写作 |
| 快捷键 | `Shift+Shift` | `Cmd+E` | `Cmd+L` |
| 输入来源 | 名称、别名、阵营、概念、章节片段 | 选区、高亮、手输查询 | 用户自然语言指令 |
| 输出 | 分组结果 + hover preview + 打开动作 | 带来源的事实答案 | 回答、报告、proposal |
| 写入能力 | 无;危险动作转审批 | 无 | 可能触发审批路径 |
| pending approval 时 | 可查可打开,危险动作禁用 | 可查 | 危险输入需阻止或提示 |

把两者混成一个入口会让用户分不清“我是在查事实”还是“我在让 Agent 做事”。

Universal Search 的完整设计见 [M01 · Universal Search](./M01-universal-search.md)。本篇只保留它在编辑器焦点和命令路由中的位置。

## Esc 和取消

```mermaid
stateDiagram-v2
  [*] --> Paper
  Paper --> QueryOpen
  Paper --> ComposerOpen
  Paper --> ApprovalOpen
  QueryOpen --> Paper: Esc close
  ComposerOpen --> Paper: Esc blur/close draft
  ApprovalOpen --> Paper: Esc close if safe
  Paper --> TurnCancel: explicit cancel command
  ApprovalOpen --> TurnCancel: explicit cancel approval
```

Esc 先关闭最上层界面,不默认取消正在运行的 turn。取消 turn 需要明确命令,并进入 [S04](./S04-turn-orchestration.md) 的统一取消语义。

取消入口不能自己决定“停止、放弃还是撤销”。输入条、状态点、命令面板和 Router action 都只发起取消请求;Orchestrator 根据 turn 状态生成用户可确认的 cancel plan。运行中且没有 durable change 的停止可以无确认完成,并在状态点和 Trace 中留下 recap。

## 外部编辑和 undo

| 场景 | 处理 |
|---|---|
| 外部文件变化 | 提示重载/保留/手动合并,相关审批失效 |
| AI rewrite 替换选区 | 句内安全改写走 inline review + undo;高风险或跨文档走审批路径 |
| 审批落盘后撤销 | 生成反向修改 proposal,不是普通编辑器 undo |
| 高亮索引过期 | 弱化或隐藏 |
| 查询失败 | 保留输入和类型 |

编辑器 undo 解决本地文本操作;审批后落盘属于系统变更,需要 forward-only 修正语义。

用户侧不暴露 Git 式回退。“撤销这次修改”在编辑器里表现为一条新的反向修改提案,仍需审批;“恢复为历史内容”表现为一条恢复提案,同样向前追加。相关用户时间线见 [M17](./M17-turn-recap-and-continuation.md)。

## 批阅层范围

| 范围 | 编辑器呈现 | 操作 |
|---|---|---|
| 句内 / 小选区 | 细下划线、轻底色、删除线/新增线、近文小注 | 在文字附近接受、拒绝、重试 |
| 单文档段落级 | 段落轻标记;必要时使用当前页旁注 | 展开段落建议或接受安全项 |
| 跨文档 / 跨章节 | 当前命中位置的轻量锚点和 cascade 编号 | 跳到 Approval Cascade 对应项 |

跨文档变更不能在当前页旁注中裁决。旁注最多服务当前文档的段落级问题;跨文档只在正文中标出命中位置,完整解释、逐项选择和收场归 Approval Cascade。

## FAQ

**Q: 为什么 Esc 不直接取消 Agent?**

A: 因为 Esc 常用于关闭浮层或退出输入。取消 Agent 是危险动作,要显式触发并进入统一 cancel。

**Q: 高亮不准时怎么办?**

A: 弱化或隐藏,提示索引状态。不能把过期高亮当最新事实。

**Q: AI 改写能不能像普通输入一样进入 undo?**

A: 轻量选区改写可以,但必须经过 inline review 接受并可撤销;高风险或跨文件改写应走 Approval Cascade。

**Q: 命令面板和快捷键谁是主入口?**

A: Command Registry 是主入口。快捷键、按钮、菜单、命令面板只是触发方式。

**Q: IME 为什么要特别写进 spec?**

A: 中文写作里 IME 组合态很常见。抢键会直接破坏写作体验,属于核心交互契约。

## Appendix

- [appendix/tool-catalog](./appendix/A04-tool-catalog.md) 保存命令、快捷键和查询工具明细。
- [appendix/event-catalog](./appendix/A03-event-catalog.md) 保存 UI 交互事件。
- [appendix/testing-matrix](./appendix/V01-test-matrix.md) 保存 IME、focus trap、undo 和冲突测试。
