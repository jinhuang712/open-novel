# 05 — 三模式与审批流

## 三种工作模式

模式是**对 Agent 行为的硬约束**,不是 UI 装饰。

| 模式 | 用户场景 | Agent 可读 | Agent 可写 | 典型工具 |
|---|---|---|---|---|
| **Discuss** | 检索/对话/不确定 | 设定 + 章节 + 历史 | 无 | readSetting, readChapter, searchEntities, webSearch |
| **Plan** | 改设定 | 设定 + 章节 (参考) | 设定 (审批后) | + writeSetting (gated) |
| **Write** | 写章节 | 设定 + 章节 + 历史 | 章节 (审批后) | + writeChapter (gated) |

**模式间不可通过 LLM 自行切换**;必须用户显式触发。

切换路径有两种,效果完全一致:
1. **点击** ChatBox 顶部的 `[Discuss] [Plan] [Write]` toggle
2. **键盘** 在 ChatBox textarea 焦点内按 `Tab` (循环正向) 或 `Shift+Tab` (反向)

Tab 切模式是与主流 LLM chat 工具 (ChatGPT / Claude.ai / Cursor) 一致的预期心智 — Tab 不再插入字面 tab 字符。详见 [spec/12-shortcuts.md](../spec/12-shortcuts.md) §ChatBox 上下文。

模式切换在 `await_approval` 状态下被状态机阻止 — 此时 Tab 与点击都不生效,UI 显示 toast: "完成审批后才能切模式"。

`await_approval` 状态下接受新 `USER_INPUT` 也被阻止 — ChatBox textarea 显示 disabled 灰显 + tooltip "完成或取消上方审批后才能继续输入"。详见 [spec/07-mode-state-machine.md](../spec/07-mode-state-machine.md) §USER_INPUT 处理。

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

## 审批闸门 (Human-in-the-Loop)

> ⚠ **审计修正**: 早期文档假设 `tool({ needsApproval: true })` 是 AI SDK 6 一等字段 + 流挂起等待。实查 (见 [spec/00-version-audit.md](../spec/00-version-audit.md)) 后改为 **proposal + 独立 endpoint** 模式 — 工具执行时不真正写盘,而是把 proposal 落 `approvals` 表 (status=pending) 并立刻返回;Agent loop 看到 proposal 后自然结束 stream;用户审批通过独立 endpoint `POST /api/approvals/{id}/resolve` 真正落盘。这样审批悬挂不依赖 stream 长连接。详见 [spec/06-approval-flow.md](../spec/06-approval-flow.md)。

```ts
export const writeSettingProposal = tool({
  description: '提议写一个设定文件 (用户审批后才会落盘)',
  inputSchema: z.object({ path: z.string(), content: z.string(), reason: z.string() }),
  execute: async (input, ctx) => {
    safeFromProjectRoot(ctx.projectId, `settings/${input.path}`)   // 路径越权防御
    const approvalId = await db.approvals.insert({ tool_call_id: ctx.toolCallId, /* ... */ status: 'pending' })
    return { kind: 'proposal', approvalId, ...input }
  },
})
```

流程:
1. Writer 调 writeSettingProposal → execute 落 proposal 到 approvals 表 → 返回 `{ kind: 'proposal', approvalId }`
2. Agent loop 看到 proposal 立刻 stop (Writer prompt 约定),stream 自然结束
3. 客户端 `onToolCall` 拦截 result,push 到 `useApprovals` store,UI 渲染 `<ApprovalCard>`
4. 用户点"同意" → `POST /api/approvals/{id}/resolve { decision: 'approved' }`,后端原子写盘 + 落 history + 启动 reindex
5. 用户点"拒绝+反馈" → `POST /api/approvals/{id}/resolve { decision: 'rejected', feedback }` → 自动发一条 ChatBox 消息让 Agent 重做
6. **悬挂超时** = 24 小时 (SettingsDialog 可改);超时后 status='expired',不自动拒绝避免 Reflector 学错经验

**Cascade 中断恢复**: 浏览器关闭时若有 pending 审批,启动时 `useApprovals.hydrate()` 拉回所有 status='pending' 的 approval 继续审。每个 approval 行幂等 (status 检查) — 重复点同意不重复落盘。

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
