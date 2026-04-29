# 05 — 三模式与审批流

## 三种工作模式

模式是**对 Agent 行为的硬约束**,不是 UI 装饰。

| 模式 | 用户场景 | Agent 可读 | Agent 可写 | 典型工具 |
|---|---|---|---|---|
| **Discuss** | 检索/对话/不确定 | 设定 + 章节 + 历史 | 无 | readSetting, readChapter, searchEntities, webSearch |
| **Plan** | 改设定 | 设定 + 章节 (参考) | 设定 (审批后) | + writeSetting (gated) |
| **Write** | 写章节 | 设定 + 章节 + 历史 | 章节 (审批后) | + writeChapter (gated) |

**模式间不可通过 LLM 自行切换**;必须用户在 UI 上显式点击 mode toggle。

## 状态机 (XState)

```
   ┌──── idle ──── (input) ────► classifying
   │                                  │
   │   Router 输出 intent + 校验 mode 一致性
   │                                  ▼
   │                       ┌──────────┼──────────┐
   │                       ▼          ▼          ▼
   │                   discuss      plan        write
   │                       │          │           │
   │                  (read-only)  generate   generate
   │                       │          │           │
   │                       │      validate    validate
   │                       │          │           │
   │                       │        diff        diff
   │                       │          │           │
   │                       │     await_approval await_approval
   │                       │          │           │
   │                       │   (approve→persist→reflect)
   │                       │   (reject + feedback → refine → generate)
   │                       │          │           │
   └───────────────────────┴──────────┴───────────┘
```

## `needsApproval` 闸门 (AI SDK 6 集成)

工具定义带 `needsApproval`:

```ts
export const writeSetting = tool({
  description: '将一个设定文件写入磁盘',
  inputSchema: z.object({ name: z.string(), content: z.string(), reason: z.string() }),
  needsApproval: true,
  execute: async ({ name, content, reason }, { projectId }) => {
    await fs.write(`${workspaceOf(projectId)}/settings/${name}`, content)
    await db.history.add(projectId, { action: 'write_setting', target: name, after: content, reason })
    return { ok: true }
  },
})
```

AI SDK 6 在工具被调用时,如果 `needsApproval: true`:
1. 流被挂起,emit `tool-call-needs-approval` 事件
2. 前端 `useChat({ onToolCall })` 收到 → 渲染 `<ApprovalCard>`
3. ApprovalCard 展示: 工具名、参数 (含 diff vs 当前文件)、拒绝/同意/编辑后同意 三个按钮
4. 用户点 "同意" → `addToolResult({ toolCallId, output: { approved: true } })`,流继续
5. 用户点 "拒绝 + 反馈" → `addToolResult({ ... output: { approved: false, feedback: '...' } })`,Agent 看到拒绝原因后重做

## ApprovalCard UI 形态

```
┌────────────────────────────────────────────────────┐
│ ✱ Writer 想要修改: characters/lin.md               │
│ 原因: 用户要求把主角性别改为女                       │
├────────────────────────────────────────────────────┤
│ Diff:                                              │
│   - gender: male                                   │
│   + gender: female                                 │
│   - 名字叫"林川",北漂程序员                        │
│   + 名字叫"林溪",北漂程序员                        │
│                                                    │
│ ⚠ Validator 提示: 此变更将影响:                     │
│   • outline.md (3 处性别引用)                      │
│   • characters/wang.md (称谓 "兄弟" 需改)         │
│   • chapters/001-XX/draft.md (5 处)                │
├────────────────────────────────────────────────────┤
│ [拒绝]  [手动编辑]  [同意]  [同意并 cascade 全部]   │
└────────────────────────────────────────────────────┘
```

## Cascade 审批

当 Validator 检测到一个变更影响多处时:

1. Writer 完成主变更并请求审批
2. Validator 并行扫,产出 `cascadeChanges: ChangeProposal[]`
3. 主 ApprovalCard 多一个按钮 "同意并 cascade 全部"
4. 用户点 "同意并 cascade":
   - 主变更落盘
   - 每个 cascadeChange **依次** 渲染 ApprovalCard (用户可逐项审或一键全过)
5. 用户点普通"同意":只落盘主变更,不 cascade (用户自己负责处理副作用)

## 拒绝反馈环

ApprovalCard 拒绝时**强制要求填反馈**:

- 输入框: "为什么拒绝?"
- 例: "改性别后语气还是男性化的,口吻没调整"
- Agent 拿到反馈后重新生成,带着拒绝理由进 system prompt

## Reflector 在闭环中的位置

每次审批完成 (无论是 approve 还是 reject):

```
{ approval_id, action, target, before, after, decision, feedback?, time_to_decide }
```

入队给 Reflector,Reflector:
- 读最近 N 条审批记录
- 提炼 1-3 条 generalizable 经验
- 写入 `learnings` 表 (含 weight,初始 1.0,每次相关命中 +0.5)
- 后续生成时 Router 把 top-N 经验注入 system prompt

## 审批历史可回溯

`approvals` 表保留所有决定。Settings → "审批历史"面板:

- 时间倒序列出所有审批
- 可以"回退某次审批" (执行反向操作 + 写新一条 history)
- 可以"导出审批日志" 帮助调试 prompt
