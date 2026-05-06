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
1. Writer 调 writeSettingProposal → execute **内部跑 cascade 递归 ≤3 轮 (spec/19)** → 落整批 ChangeSet 到 approvals 表 (一行) → 返回 `{ kind: 'proposal', approvalId, changeSet }`
2. Agent loop 看到 proposal 立刻 stop (Writer prompt 约定),stream 自然结束
3. 客户端 `onToolCall` 拦截 result,push 到 `useApprovals` store,UI 渲染 `<ApprovalCard>` (整批 ChangeSet,含影响图谱 + 1-3 级 cascade 勾选)
4. 用户点"同意勾选项" → `POST /api/approvals/{id}/resolve { decision: 'approved', accepted_items: [...], edits: {...} }`,后端 transaction 一次写所有 accepted + 落 history group + 入队 reindex
5. 用户点"拒绝全部+反馈" → `POST /api/approvals/{id}/resolve { decision: 'rejected', feedback }` → 自动发一条 ChatBox 消息让 Agent 重做
6. **悬挂超时** = 24 小时 (SettingsDialog 可改);超时后 status='expired',不自动拒绝避免 Reflector 学错经验

**Cascade 中断恢复 (整批审之后简化)**: 浏览器关闭时若有 pending 审批,启动时 `useApprovals.hydrate()` 拉回所有 status='pending' 的 approval (每个一个完整 ChangeSet) 继续审。每个 approval 行幂等 (status 检查 + transaction 原子性) — 重复点同意不重复落盘,中途崩溃也不会出现"半落地"。

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
│ ────────────────────────────────────────────────── │
│ ⚠ 影响图谱: 8 段 cascade (3 轮内部分析)            │
│ ☑ 一级 cascade (5 项)  [展开]                      │
│   ☑ outline.md § 3 (高置信)                        │
│   ☑ wang.md § "称谓" (高置信)                      │
│   ☑ ch_001 § 5 (高置信)                            │
│   ☑ ch_001 § 12 (中置信)                           │
│   ☐ ch_001 § 18 (低置信 — 默认不勾)                 │
│ ☑ 二级 cascade (3 项)  [展开]                      │
│   ☑ ch_003 § 7 (中置信)                            │
│   ...                                               │
├────────────────────────────────────────────────────┤
│ [全选] [全不选] [拒绝全部] [同意勾选 7/8 项 (Y)]    │
└────────────────────────────────────────────────────┘
```

## Cascade 审批 (W9 升级 — 整批审)

> ⚠ **关键交互模型**: cascade 递归在审批**前**的内部循环里完成,用户只看一次最终汇总的 ChangeSet。落盘是后端 transaction 一次写所有勾选项 — 不再"主变更落盘 + cascade 各项再 ApprovalCard"。

```
Writer 出主修改 (in-memory)
   ↓
[内部递归 ≤3 轮 (见 plan/06 + spec/19)]
   - 第 1 轮 analyzeImpact → ChangeProposal[1]
   - Writer 内部短调用生成 afterText
   - 第 2 轮 → ChangeProposal[2]
   - 第 3 轮 → ChangeProposal[3]
   - 终止 (候选空 / 半径不收缩 / 深度=3)
   ↓
汇总 ChangeSet (主修改 + 1-3 级 cascade,含影响图谱)
   ↓
**一次** ApprovalCard:
   - 顶部: 影响图谱 (节点 + 边,按 cascadeLevel 着色)
   - 主修改一行 (默认勾)
   - 一级 cascade 折叠组 (高/中置信默认勾,低置信默认不勾)
   - 二级 cascade 折叠组 (同上)
   - 三级 cascade 折叠组 (同上)
   - 每条可手动编辑 / toggle 勾选
   - 操作: [全选] [全不选] [拒绝全部] [同意勾选 K/N 项]
   ↓
用户决定 → POST /api/approvals/{id}/resolve { decision, accepted_items[], edits{} }
   ↓
后端 transaction 一次落盘所有 accepted (主 + 勾选的 cascade)
   ↓
副作用 (差量 reindex / snapshot / history group / Reflector,见 plan/04 §审批通过后的副作用)
```

**不勾选某条 cascade 的语义**: 该 proposal 被显式**搁置**,系统记录但不落盘。后续如果作者写到那段,Validator 会在再下一次 cascade 中重新发现并提议。
**全部勾不勾选 + reject 全部**: 拒绝整个 ChangeSet,主修改也不落,等于这次修改没发生过。

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
