# Spec 06 — 审批流接入 needsApproval

## 设计

利用 AI SDK 6 内置的 `needsApproval` 机制,把"工具调用挂起 → 用户审 → 决议"的链路标准化。

## 流程时序

```
[Agent]                       [Server]                    [Client]
   │                             │                            │
   │  emit tool-call             │                            │
   │  (with needsApproval=true)  │                            │
   ├────────────────────────────►│                            │
   │                             │  SSE: tool-call-needs-     │
   │                             │      approval              │
   │                             ├───────────────────────────►│
   │                             │                            │
   │                             │              onToolCall    │
   │                             │              拦截,渲染     │
   │                             │              <ApprovalCard>│
   │                             │                            │
   │                             │              用户点"同意"  │
   │                             │                            │
   │                             │  POST /api/tool-result     │
   │                             │  { toolCallId, output }    │
   │                             │◄───────────────────────────┤
   │                             │                            │
   │  resume execute()           │                            │
   │◄────────────────────────────┤                            │
   │                             │                            │
   │  emit tool-result           │                            │
   ├────────────────────────────►│                            │
   │                             │  SSE: tool-result          │
   │                             ├───────────────────────────►│
   │                             │                            │
   │  continue agent loop        │                            │
   │                             │                            │
```

## 服务端实现

工具定义 (示例 `writeSetting`):

```ts
import { tool } from 'ai'

export const writeSetting = tool({
  description: '...',
  inputSchema: z.object({ /* ... */ }),
  needsApproval: true,
  execute: async ({ path, content, reason }, ctx) => {
    // 这里的代码只在用户批准后才会执行
    await fs.writeFile(/* ... */)
    await db.history.add(/* ... */)
    return { ok: true }
  },
})
```

如果用户点 **"同意"**,客户端调用 `addToolResult({ toolCallId, output: { approved: true, payload } })`,AI SDK 把 `payload` 作为 execute 的 input 触发执行。

如果用户点 **"拒绝"**,客户端调用 `addToolResult({ toolCallId, output: { approved: false, feedback } })`,execute **不执行**,Agent 把 `output` 当作工具返回值 (含拒绝理由),决定是否重试或转向。

## 客户端 UI 拦截

```tsx
// components/panels/ChatBox.tsx
const { messages, sendMessage, addToolResult, status } = useChat({
  api: '/api/chat',
  body: { projectId, sessionId, mode },
  onToolCall: async ({ toolCall }) => {
    if (!toolCall.needsApproval) return  // 普通工具自动执行
    // 把 toolCall 推到 pending queue,UI 渲染 ApprovalCard
    pushPending(toolCall)
    return new Promise<void>(() => {})  // 永不 resolve,等用户决定
  },
})
```

## ApprovalCard 组件

```tsx
// components/panels/ApprovalCard.tsx
export function ApprovalCard({ call, onResolve }) {
  const [editedContent, setEditedContent] = useState(call.input.content)
  const diff = useMemo(() => computeDiff(call.beforeContent, editedContent), [editedContent])
  const cascade = useCascadePreview(call)  // Validator 提供的影响范围

  return (
    <Card>
      <Header>
        ✱ {call.agent} 想要 {call.toolName}: {call.input.path}
      </Header>
      <Reason>{call.input.reason}</Reason>
      <DiffViewer diff={diff} />
      {cascade.length > 0 && (
        <CascadeWarning>
          ⚠ Validator 提示: 此变更将影响 {cascade.length} 处
          <CascadeList items={cascade} />
        </CascadeWarning>
      )}
      <ManualEditor value={editedContent} onChange={setEditedContent} />
      <Actions>
        <Button onClick={() => reject(call.id)}>拒绝</Button>
        <Button onClick={() => approve(call.id, { content: editedContent })}>同意</Button>
        {cascade.length > 0 && (
          <Button onClick={() => approveWithCascade(call.id, cascade)}>同意并 cascade 全部</Button>
        )}
      </Actions>
    </Card>
  )
}

async function approve(toolCallId, payload) {
  await addToolResult({ toolCallId, output: { approved: true, payload } })
}

async function reject(toolCallId) {
  const feedback = await promptUserFeedback()  // 弹小输入框
  await addToolResult({ toolCallId, output: { approved: false, feedback } })
}

async function approveWithCascade(toolCallId, cascade) {
  // 先批准主变更
  await approve(toolCallId, { /* ... */ })
  // 然后逐项排队 cascade
  for (const c of cascade) await enqueueCascadeApproval(c)
}
```

## 多审批排队

同一时刻可能有多个待审 (e.g. cascade 链路),用 Zustand store 维护:

```ts
// lib/store/approvals.ts
export const useApprovals = create<{
  pending: ApprovalRequest[]
  push: (req: ApprovalRequest) => void
  resolve: (id: string, decision: ApprovalDecision) => void
}>((set) => ({
  pending: [],
  push: (req) => set(s => ({ pending: [...s.pending, req] })),
  resolve: (id, decision) => set(s => ({
    pending: s.pending.filter(r => r.id !== id),
  })),
}))
```

UI 显示当前一个 (栈顶),其他角标提示。

## 持久化

每次审批 (无论决策) 都写到 `approvals` 表 (见 spec/01)。

```ts
async function recordApproval(call, decision, payload?) {
  await db.approvals.insert({
    tool_call_id: call.id,
    agent: call.agent,
    tool_name: call.toolName,
    payload: JSON.stringify(call.input),
    diff: renderedDiff,
    status: decision,  // approved | rejected | edited
    user_feedback: payload?.feedback,
    decided_at: new Date().toISOString(),
    created_at: call.createdAt,
  })
}
```

## 批量审批

对长 cascade 链 (>5 项),提供"全选/全拒/逐项"三种模式:

```tsx
<BulkApprovalDialog>
  <CheckList items={cascade} />
  <Actions>
    <Button onClick={() => bulkApprove(selected)}>批准选中 ({selected.length})</Button>
    <Button onClick={() => bulkReject(selected)}>拒绝选中</Button>
    <Button onClick={() => oneByOne()}>逐项审 (默认)</Button>
  </Actions>
</BulkApprovalDialog>
```

bulkApprove 内部仍然逐条调 `addToolResult`,只是 UI 不再阻塞用户。

## 与 Reflector 联动

每次审批 resolve 后:

```ts
async function onResolve(call, decision, finalContent) {
  await recordApproval(call, decision, { feedback })
  
  // 入队 Reflector
  await reflectorQueue.add({
    context: {
      agent: call.agent,
      input: call.input,
      output: call.output,
      decision,
      feedback,
      edited_content: finalContent !== call.input.content ? finalContent : undefined,
    },
  })
}
```

Reflector 异步消费 (Worker),不阻塞主链路。

## 撤销

`approvals` 表支持回退:

```ts
async function rollbackApproval(approvalId) {
  const record = await db.approvals.get(approvalId)
  const history = await db.history.findByApproval(approvalId)
  if (!history.before) throw new Error('无回退基准')
  await fs.writeFile(history.target, history.before)
  await db.history.add(/* 反向操作 */)
}
```

UI 路径: Settings → 审批历史 → 选某条 → "回退"。

## 安全防护

- 工具 input schema 必须严格 (Zod 校验失败 → 自动拒绝,不进入审批)
- file path 必须以项目目录为前缀 (拒绝 `../` 逃逸)
- 写入大小有上限 (单文件 1MB,防止 LLM 失控生成超长内容)
