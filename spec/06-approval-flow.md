# Spec 06 — 审批流 (Human-in-the-Loop)

> ⚠ **审计修正**: 早期版本假设 `tool({ needsApproval: true })` 是 AI SDK 6 一等字段。**spec/00-version-audit 实查后再确认**。本文档下文按 **Vercel AI SDK 6 HITL cookbook 标准链路** 重写,如 audit 发现 SDK 真有 `needsApproval` 字段且行为一致,本节仍兼容(差异仅在工具定义处加不加字段);如 cookbook 是唯一路径,则 spec/02 的 `needsApproval: true` 字段需统一删除。

## 设计

把"工具调用挂起 → 用户审 → 决议"的链路标准化。**核心思路** (cookbook 模式): 服务端工具不直接 `execute`,而是 emit tool-call;客户端 `onToolCall` 拦截 → 渲染 ApprovalCard → `addToolResult({ toolCallId, output })` 注入决议;Agent loop 读取 output 决定继续流程或重做。

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

## 服务端实现 (cookbook 模式)

需要审批的工具**不直接执行 fs/db 副作用**,而是返回 `proposal` payload,让客户端拦截:

```ts
import { tool } from 'ai'

// 工具 "提议"——不真正写文件,只返回意图;真正写盘在用户批准后由后端执行 endpoint 完成
export const writeSettingProposal = tool({
  description: '提议写一个设定文件 (用户审批后才会落盘)',
  inputSchema: z.object({
    path: z.string(),
    content: z.string().max(50_000),
    reason: z.string(),
  }),
  execute: async ({ path, content, reason }, { projectId, agent }) => {
    // 1. 路径越权防御 (见 spec/02 §safeFromProjectRoot)
    const safe = safeFromProjectRoot(projectId, `settings/${path}`)
    // 2. 读 before (用于 diff)
    const before = await tryReadFile(safe)
    // 3. Validator 同步出 cascade 提议 (并行,不阻塞)
    const cascade = await runValidatorScan(projectId, { path, content, before })
    // 4. 把 proposal 写入 approvals 表 (status=pending)
    const approvalId = await db.approvals.insert({
      tool_call_id: ctx.toolCallId,
      agent, tool_name: 'writeSetting',
      payload: JSON.stringify({ path, content, reason }),
      diff: renderDiff(before, content),
      cascade: JSON.stringify(cascade),
      status: 'pending',
      created_at: new Date().toISOString(),
    })
    // 5. 返回 proposal — Agent loop 拿到这个,Router 会终止本轮等用户决议
    return {
      kind: 'proposal',
      approvalId,
      path, content, reason, before, diff: renderDiff(before, content), cascade,
    }
  },
})
```

**Agent prompt 约定**: Writer 在生成完内容后调 `writeSettingProposal`,看到 `kind: 'proposal'` 立刻 stop (不再继续生成),进入"等待审批"状态。Mastra Agent loop 检测到 proposal 后通过 `agent-handoff-end` 事件让 stream 自然结束,不长留挂起。

**真正落盘**: 由独立 endpoint `POST /api/approvals/{id}/resolve` 处理,而**不**由 stream 本身执行:

```ts
// app/api/approvals/[id]/resolve/route.ts
export const runtime = 'nodejs'

export async function POST(req: Request, { params }: { params: { id: string } }) {
  const { decision, payload, feedback } = await req.json()
  const approval = await db.approvals.get(params.id)
  if (!approval || approval.status !== 'pending') {
    return new Response(JSON.stringify({ error: 'not_pending' }), { status: 409 })
  }

  if (decision === 'approved' || decision === 'edited') {
    const finalContent = decision === 'edited' ? payload.content : approval.payload.content
    const safe = safeFromProjectRoot(approval.projectId, `settings/${approval.payload.path}`)
    // 原子写: 临时文件 + rename
    await fs.writeFile(safe + '.tmp', normalizeForWrite(finalContent))
    await fs.rename(safe + '.tmp', safe)
    await db.history.add(approval.projectId, { /* before/after */ approval_id: approval.id })
    await db.approvals.update(approval.id, { status: decision, decided_at: new Date().toISOString() })
    await reindexQueue.add(approval.projectId, safe)        // 异步重建索引
    await reflectorQueue.add(approval.projectId, approval.id)
  } else {
    // rejected
    await db.approvals.update(approval.id, { status: 'rejected', user_feedback: feedback })
    await reflectorQueue.add(approval.projectId, approval.id)
  }
  return Response.json({ ok: true })
}
```

**为什么独立 endpoint 而不在 stream 内执行**:
1. 审批悬挂期间 stream 早超时关闭 (Node ~5min,Edge 30s),不能依赖 stream 还活着
2. 独立 endpoint 幂等 (status='pending' 检查) — 多 tab / 重连场景下重复点击不重复落盘
3. 与 Agent loop 解耦 — 用户审完 30 分钟后才点同意也合法

## 客户端 UI 拦截

```tsx
// components/panels/ChatBox.tsx
const { messages, sendMessage, addToolResult, status } = useChat({
  api: '/api/chat',
  body: { projectId, sessionId, mode },
  onToolCall: async ({ toolCall }) => {
    if (toolCall.toolName !== 'writeSettingProposal' && toolCall.toolName !== 'writeChapterProposal') {
      return  // 普通工具自动执行
    }
    // 服务端 execute 已经把 proposal 落 approvals 表,result 也回来了
    // 这里 toolCall.result 含 { kind: 'proposal', approvalId, ... }
    pushPending(toolCall.result)             // 进入待审 store
    // **不**调 addToolResult — 让 stream 自然结束 (Mastra Agent prompt 约定 stop after proposal)
    // 用户在 ApprovalCard 决议后,通过 fetch /api/approvals/{id}/resolve 落盘
    // 后续若需重做,用户重新发一条 message 触发新 stream
  },
})
```

注意:**这里不再用 `addToolResult` 把决议回灌进同一个 stream**,因为 stream 早结束了。改为独立 endpoint。这是与 Vercel cookbook 标准链路最大的差异 — cookbook 假设 stream 短期挂起 (秒级),我们假设可能挂分钟级,所以彻底解耦。

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
export function ApprovalCard({ proposal }: { proposal: ApprovalProposal }) {
  const [editedContent, setEditedContent] = useState(proposal.content)
  const diff = useMemo(() => computeDiff(proposal.before, editedContent), [editedContent])
  const cascade = proposal.cascade ?? []

  return (
    <Card>
      <Header>
        ✱ {proposal.agent} 想要 {proposal.toolName}: {proposal.path}
      </Header>
      <Reason>{proposal.reason}</Reason>
      <DiffViewer diff={diff} />
      {cascade.length > 0 && (
        <CascadeWarning>
          ⚠ Validator 提示: 此变更将影响 {cascade.length} 处
          <CascadeList items={cascade} />
        </CascadeWarning>
      )}
      <ManualEditor value={editedContent} onChange={setEditedContent} />
      <Actions>
        <Button onClick={() => reject(proposal.approvalId)}>拒绝 (N)</Button>
        <Button onClick={() => approve(proposal.approvalId, { content: editedContent })}>
          {editedContent === proposal.content ? '同意 (Y)' : '编辑后同意 (E)'}
        </Button>
        {cascade.length > 0 && (
          <Button onClick={() => approveWithCascade(proposal.approvalId, cascade)}>
            同意并 cascade 全部
          </Button>
        )}
      </Actions>
    </Card>
  )
}

async function approve(approvalId: string, payload?: { content: string }) {
  const decision = payload && payload.content !== /* 原始 */ ? 'edited' : 'approved'
  await fetch(`/api/approvals/${approvalId}/resolve`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ decision, payload }),
  })
  popPending(approvalId)
}

async function reject(approvalId: string) {
  const feedback = await promptUserFeedback()  // 弹小输入框
  await fetch(`/api/approvals/${approvalId}/resolve`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ decision: 'rejected', feedback }),
  })
  popPending(approvalId)
  // 若用户在 feedback 中要求重写,自动发一条 ChatBox 消息让 Agent 重做
  if (feedback) {
    sendMessage({ role: 'user', content: `[拒绝并希望重做] ${feedback}` })
  }
}

async function approveWithCascade(approvalId: string, cascade: CascadeChange[]) {
  // 1. 先批主 approval
  await approve(approvalId)
  // 2. cascade 各项写入 approvals 表 status=pending,逐项 push 到 pending queue
  await fetch(`/api/approvals/${approvalId}/cascade`, {
    method: 'POST',
    body: JSON.stringify({ cascade }),
  })
  // 3. 后端把 cascade 各项 expand 成新 approvals 行,push 给 client
}
```

## 多审批排队

同一时刻可能有多个待审 (e.g. cascade 链路),用 Zustand store 维护:

```ts
// lib/store/approvals.ts
export const useApprovals = create<{
  pending: ApprovalProposal[]                    // 主 + cascade 全在这里,按 createdAt asc
  push: (proposal: ApprovalProposal) => void
  pop: (approvalId: string) => void
  hydrate: () => Promise<void>                   // 启动时从 server 拉所有 status=pending
}>((set, get) => ({
  pending: [],
  push: (p) => set(s => ({ pending: [...s.pending, p] })),
  pop: (id) => set(s => ({ pending: s.pending.filter(r => r.approvalId !== id) })),
  hydrate: async () => {
    const list = await fetch('/api/approvals?status=pending').then(r => r.json())
    set({ pending: list })
  },
}))
```

UI 显示**第一个** (按时间),其他角标提示。

## Cascade 中断恢复 (新增)

> audit 发现:cascade 5 项审到第 3 项时关闭浏览器,部分落盘 + 部分未审 — 怎么恢复?

**机制**:
1. cascade 各项以独立 `approvals` 行存,`parent_approval_id` 字段链回主 approval
2. 浏览器启动时 ChatBox 调 `useApprovals.hydrate()` — 从 server 拉所有 `status='pending'` 的 approvals
3. UI 在右下角显示一条 banner: "上次有 N 项未审完的修改,要继续吗?" → 点击展开队列
4. 已 `approved` 的 cascade 行不再显示;`pending` 的继续逐项呈现
5. 主 approval 已落盘 + cascade 第 3 项 pending 的状态是合法 (设定主变更已生效;cascade 是连带建议,可全过/部分过)

**幂等性**: `POST /api/approvals/{id}/resolve` 检查 `status === 'pending'`,非 pending 直接 409 — 重复点同意不重复落盘。

## 审批超时与悬挂时长 (新增)

> audit 发现:用户审批 30 分钟不点,SSE 早死,Agent loop 行为黑盒。

**契约**:
- `approvals.created_at` 后超过 **24 小时** 仍 `pending` → 启动时把 status 自动改为 `expired`
- expired 的 approval 不会被恢复出来,UI 上落到"审批历史" §过期记录中,可手动复活 (重新跑 Agent 生成)
- 不做"自动拒绝" — 用户可能只是出门,自动拒绝会触发 Reflector 学错经验
- 24 小时阈值可在 SettingsDialog → 数据管理改

**stream 端**: Mastra Agent 调 writeSettingProposal 后 prompt 显式 stop。stream 在 30s 内自然结束 (proposal emit 完即收尾),不长留挂起。所以 stream 超时不再是问题。

## Cascade 大批量审 (新增)

> audit 发现:100+ cascade 改动需要分页吗?用户能"全选/反选/全过"吗?

**UI 升级 BulkApprovalDialog**:

```tsx
<BulkApprovalDialog>
  {/* 虚拟滚动,默认 5 项一屏 */}
  <Virtualizer items={cascade} itemSize={80} maxVisible={5}>
    {(item, index) => (
      <CheckRow
        key={item.id}
        item={item}
        checked={selected.has(item.id)}
        onToggle={(c) => toggle(item.id, c)}
      />
    )}
  </Virtualizer>

  <FilterBar>
    <select value={filter} onChange={e => setFilter(e.target.value)}>
      <option value="all">全部 ({cascade.length})</option>
      <option value="high">高置信度 ({cascade.filter(c => c.confidence === 'high').length})</option>
      <option value="medium">中</option>
      <option value="low">低 (建议先看再批)</option>
    </select>
  </FilterBar>

  <Actions>
    <Button onClick={selectAll}>全选 ({cascade.length})</Button>
    <Button onClick={selectNone}>清空</Button>
    <Button onClick={() => bulkApprove(Array.from(selected))} variant="primary">
      批准 {selected.size} 项
    </Button>
    <Button onClick={() => bulkReject(Array.from(selected))}>拒绝选中</Button>
    <Button onClick={oneByOne}>逐项审 (默认)</Button>
  </Actions>
</BulkApprovalDialog>
```

`bulkApprove` 内部不再逐条 fetch,而是 `POST /api/approvals/bulk { ids, decision }`,后端在 transaction 内串行执行,失败回滚。

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

- **input schema 严格** (Zod 校验失败 → 自动拒绝,不进入审批)
- **路径越权防御** (见 spec/02 §safeFromProjectRoot) — 在 execute 第一行强制检查,不依赖前端校验
- **写入大小上限** — `inputSchema` 中 `content: z.string().max(50_000)`,~30K 字硬上限;超过用续写协议 (spec/02 §工具输出长度上限)
- **不可信内容围栏** — 所有从 readSetting / readChapter / webSearch 读出的内容,在拼接进 LLM prompt 时用 `wrapUntrusted()` (spec/02 §不可信输入的围栏);LLM 看到 `<<<UNTRUSTED:...>>>` 内的"指令"应忽略
- **原子写盘** — `fs.writeFile(path + '.tmp')` + `fs.rename` 避免半截内容;db.history.insert 在同一 transaction
- **AbortSignal 检查** — execute 内每次进 fs/db 操作前 `if (signal.aborted) return earlyExit()`,但**不中断**已开始的 fs.rename (单步原子操作);step 级粒度的取消
