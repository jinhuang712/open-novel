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

## 服务端实现 (cookbook 模式 + W9 内部 cascade 递归)

需要审批的工具**不直接执行 fs/db 副作用**,而是先在内部跑完 cascade 递归 (spec/19),把整批 ChangeSet 落 `approvals` 表后返回 proposal 给客户端:

```ts
import { tool } from 'ai'

// 工具 "提议"——内部跑 cascade 递归后返回整批 ChangeSet;真正写盘在用户批准后由后端 endpoint 完成
export const writeSettingProposal = tool({
  description: '提议写一个设定文件 (内部计算 cascade 影响 → 整批 ChangeSet → 用户审批后落盘)',
  inputSchema: z.object({
    path: z.string(),
    content: z.string().max(50_000),
    reason: z.string(),
  }),
  execute: async ({ path, content, reason }, { projectId, agent }) => {
    // 1. 路径越权防御 (见 spec/02 §safeFromProjectRoot)
    const safe = safeFromProjectRoot(projectId, `settings/${path}`)
    // 2. 读 before (用于 diff + cascade 算 delta)
    const before = await tryReadFile(safe)
    // 3. analyzeImpact 内部递归 (spec/19) — ≤3 轮把 cascade 全部跑出来
    //    返回的 proposals 含 cascadeLevel: 1 (一级) / 2 (二级) / 3 (三级)
    //    主修改本身用 cascadeLevel=0 标
    const impact = await analyzeImpactRecursive(projectId, {
      mainChange: { filePath: `settings/${path}`, before, after: content, reason },
    })
    // impact = { proposals: ChangeProposal[], graph, metadata }
    // 4. 把整批 ChangeSet 写入 approvals 表 (status=pending) — 一行包含所有 levels 的 ChangeSet
    const approvalId = await db.approvals.insert({
      tool_call_id: ctx.toolCallId,
      agent, tool_name: 'writeSetting',
      change_set: JSON.stringify({
        main: { path, content, reason, before, diff: renderDiff(before, content) },
        cascade: impact.proposals,           // 含 cascadeLevel 1-3
        graph: impact.graph,
        metadata: impact.metadata,
      }),
      status: 'pending',
      created_at: new Date().toISOString(),
    })
    // 5. 返回 proposal — Agent loop 拿到这个,Router 会终止本轮等用户决议
    return {
      kind: 'proposal',
      approvalId,
      changeSet: { /* same as above */ },
    }
  },
})
```

**关键差异 (vs 旧版 `runValidatorScan`)**:
- ❌ 旧:cascade 是平铺一级 ChangeProposal[],"同意并 cascade 全部"再逐项 ApprovalCard
- ✅ 新:cascade 是 ≤3 级的 ChangeSet,**一次** ApprovalCard 内部勾选,后端 transaction 一次落盘
- 内部递归 ~15-45s,期间 stream 保持活跃,UI 显示进度;完成后 stream 才结束等审

**`approvals` 表 schema 升级** (在 spec/01 既有 schema 上加):
```sql
ALTER TABLE approvals ADD COLUMN change_set TEXT;       -- JSON,含 main + cascade[] + graph + metadata
ALTER TABLE approvals ADD COLUMN parent_approval_id INTEGER;  -- 二期: 跨多次审批的链路 (POC 单 ApprovalCard 整批,无需用)
```
旧 `payload` / `diff` / `cascade` 列保留兼容(读取时 fallback);新逻辑全用 `change_set`。

**Agent prompt 约定**: Writer 在生成完内容后调 `writeSettingProposal`,看到 `kind: 'proposal'` 立刻 stop (不再继续生成),进入"等待审批"状态。Mastra Agent loop 检测到 proposal 后通过 `agent-handoff-end` 事件让 stream 自然结束,不长留挂起。

**真正落盘**: 由独立 endpoint `POST /api/approvals/{id}/resolve` 处理,接受用户的 `accepted_items`(勾选了哪些 cascade proposal),按 SQLite transaction 一次写所有 accepted 文件:

```ts
// app/api/approvals/[id]/resolve/route.ts
export const runtime = 'nodejs'

export async function POST(req: Request, { params }: { params: { id: string } }) {
  const { decision, accepted_items, edits, feedback } = await req.json()
  // accepted_items: string[] — 勾选的 proposal id (含 'main' + cascade proposal anchorId 们)
  // edits: Record<string, string> — 用户手动改过的 content,key = proposal id
  const approval = await db.approvals.get(params.id)
  if (!approval || approval.status !== 'pending') {
    return new Response(JSON.stringify({ error: 'not_pending' }), { status: 409 })
  }

  const changeSet = JSON.parse(approval.change_set)

  if (decision === 'approved') {
    const cascadeGroupId = `cgroup_${Date.now()}_${approval.id}`

    // 一个 transaction 内写所有 accepted 文件
    await db.transaction(async (tx) => {
      // 1. 主修改 (若 'main' 在 accepted_items)
      if (accepted_items.includes('main')) {
        const finalMain = edits?.main ?? changeSet.main.content
        const safe = safeFromProjectRoot(approval.projectId, `settings/${changeSet.main.path}`)
        await fs.writeFile(safe + '.tmp', normalizeForWrite(finalMain))
        await fs.rename(safe + '.tmp', safe)
        await tx.history.add(approval.projectId, {
          action: 'write_setting', target: `settings/${changeSet.main.path}`,
          before: changeSet.main.before, after: finalMain,
          cascade_group_id: cascadeGroupId, approval_id: approval.id, agent: approval.agent,
        })
      }
      // 2. 每条 accepted cascade proposal
      for (const p of changeSet.cascade) {
        if (!accepted_items.includes(p.anchorId)) continue
        const finalText = edits?.[p.anchorId] ?? p.proposedText
        // 用 anchor 找到段范围,做段级写入 (paragraph splice)
        await applyParagraphRewrite(tx, approval.projectId, p.anchorId, finalText)
        await tx.history.add(approval.projectId, {
          action: 'cascade_rewrite', target: p.targetFile,
          anchor_id: p.anchorId, before: '...', after: finalText,
          cascade_group_id: cascadeGroupId, parent_approval_id: approval.id,
          cascade_level: p.cascadeLevel, agent: 'validator+writer',
        })
      }
      // 3. 主审批状态更新
      await tx.approvals.update(approval.id, {
        status: 'approved', decided_at: new Date().toISOString(),
        accepted_items: JSON.stringify(accepted_items),
      })
    })

    // transaction 外: 异步副作用 (reindex 不阻塞 transaction)
    const allFiles = collectAffectedFiles(changeSet, accepted_items)
    for (const f of allFiles) await reindexQueue.add(approval.projectId, f)
    await reflectorQueue.add(approval.projectId, approval.id)  // 按 cascade group 批次合并
  } else {
    // rejected — 全部丢弃,不落盘
    await db.approvals.update(approval.id, {
      status: 'rejected', user_feedback: feedback,
      decided_at: new Date().toISOString(),
    })
    await reflectorQueue.add(approval.projectId, approval.id)
  }
  return Response.json({ ok: true })
}
```

**事务原子性**: 任一文件写盘失败 → 全部 rollback,UI 收到错误后保留 ApprovalCard 让用户重试。这避免了"主修改落了但 cascade 第 5 项失败,数据半落地"的尴尬状态。

`history` 表新增三列:
```sql
ALTER TABLE history ADD COLUMN cascade_group_id TEXT;          -- 同 ChangeSet 落盘的所有 history 共享一个 group
ALTER TABLE history ADD COLUMN cascade_level INTEGER;          -- 0 = 主修改 / 1-3 = cascade 层级
ALTER TABLE history ADD COLUMN anchor_id TEXT;                 -- 段级 cascade rewrite 的锚点
CREATE INDEX idx_history_cgroup ON history(cascade_group_id);
```

UI"回退某次审批"现在按 `cascade_group_id` 批量回退,不允许只回退主修改不回退 cascade(否则又出现一致性问题)。

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

## ApprovalCard 组件 (整批审,W9 升级)

> 整个 ChangeSet (主修改 + 1-3 级 cascade) 在**一个** ApprovalCard 内呈现。每条 proposal 有独立勾选框,默认按 confidence 决定是否勾选 (high/medium 默认勾,low 默认不勾)。用户可手动 toggle、整批同意、整批拒绝。

```tsx
// components/panels/ApprovalCard.tsx
export function ApprovalCard({ proposal }: { proposal: ApprovalProposal }) {
  const { changeSet } = proposal
  // 每条 proposal 一个 checkbox state + 一个 edits 文本 state
  const [acceptedItems, setAcceptedItems] = useState<Set<string>>(() => {
    const s = new Set<string>(['main'])
    for (const p of changeSet.cascade) {
      if (p.confidence === 'high' || p.confidence === 'medium') s.add(p.anchorId)
    }
    return s
  })
  const [edits, setEdits] = useState<Record<string, string>>({})

  const toggle = (id: string) => setAcceptedItems(s => {
    const ns = new Set(s); ns.has(id) ? ns.delete(id) : ns.add(id); return ns
  })

  return (
    <Card>
      <Header>
        ✱ {proposal.agent} 想要 {proposal.toolName}: {changeSet.main.path}
        <span className="cascade-badge">
          + {changeSet.cascade.length} 项 cascade ({changeSet.metadata.rounds} 轮分析)
        </span>
      </Header>

      {/* 影响图谱 (顶部) */}
      <ImpactGraphView graph={changeSet.graph} />

      {/* 主修改 */}
      <ChangeRow
        id="main"
        checked={acceptedItems.has('main')}
        onToggle={() => toggle('main')}
        title={`主修改: ${changeSet.main.path}`}
        reason={changeSet.main.reason}
        diff={computeDiff(changeSet.main.before, edits.main ?? changeSet.main.content)}
        editable={edits.main ?? changeSet.main.content}
        onEdit={text => setEdits(e => ({ ...e, main: text }))}
        cascadeLevel={0}
      />

      {/* Cascade proposals (按 cascadeLevel 分组,折叠可展开) */}
      {[1, 2, 3].map(level => {
        const items = changeSet.cascade.filter(p => p.cascadeLevel === level)
        if (items.length === 0) return null
        return (
          <CascadeGroup key={level} level={level} count={items.length}>
            {items.map(p => (
              <ChangeRow
                key={p.anchorId}
                id={p.anchorId}
                checked={acceptedItems.has(p.anchorId)}
                onToggle={() => toggle(p.anchorId)}
                title={`${p.targetFile} § ${p.anchorId.slice(-8)}`}
                reason={p.reason}
                confidence={p.confidence}
                diff={computeDiff(p.beforeText, edits[p.anchorId] ?? p.proposedText)}
                editable={edits[p.anchorId] ?? p.proposedText}
                onEdit={text => setEdits(e => ({ ...e, [p.anchorId]: text }))}
                cascadeLevel={level}
              />
            ))}
          </CascadeGroup>
        )
      })}

      <Actions>
        <Button onClick={() => setAcceptedItems(allItemIds(changeSet))}>全选</Button>
        <Button onClick={() => setAcceptedItems(new Set())}>全不选</Button>
        <Button onClick={() => reject(proposal.approvalId)}>拒绝全部 (N)</Button>
        <Button
          variant="primary"
          disabled={acceptedItems.size === 0}
          onClick={() => approve(proposal.approvalId, acceptedItems, edits)}
        >
          同意勾选项 ({acceptedItems.size}/{1 + changeSet.cascade.length}) (Y)
        </Button>
      </Actions>
    </Card>
  )
}

async function approve(approvalId: string, acceptedItems: Set<string>, edits: Record<string, string>) {
  await fetch(`/api/approvals/${approvalId}/resolve`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({
      decision: 'approved',
      accepted_items: Array.from(acceptedItems),
      edits,
    }),
  })
  popPending(approvalId)
}

async function reject(approvalId: string) {
  const feedback = await promptUserFeedback()
  await fetch(`/api/approvals/${approvalId}/resolve`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ decision: 'rejected', feedback }),
  })
  popPending(approvalId)
  if (feedback) {
    sendMessage({ role: 'user', content: `[拒绝并希望重做] ${feedback}` })
  }
}
```

**关键变化 (vs 旧版)**:
- ❌ 旧:`approveWithCascade` 把 cascade 各项**展开**成独立 approvals 行,逐项 push 到 pending queue
- ✅ 新:**单一** approval 行包含整个 ChangeSet;UI 内部勾选;后端一个 transaction 写所有 accepted
- ❌ 旧:cascade 各项独立 ApprovalCard 逐项审 (用户体验"批 N 次")
- ✅ 新:一次 ApprovalCard 看完整批 (用户体验"批 1 次")
- ❌ 旧:`approve(approvalId, { content })` 单文件
- ✅ 新:`approve(approvalId, acceptedItems, edits)` 批量勾选 + 各自 edits

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

## Cascade 中断恢复 (W9 整批审之后简化)

> audit 发现:旧版 cascade 5 项审到第 3 项时关闭浏览器,部分落盘 + 部分未审 — 怎么恢复?
> 整批审之后,这个问题大幅简化:**整批要么全落,要么全不落** (transaction 原子性),不再存在"半落地"状态。

**机制**:
1. 一个 ChangeSet = 一行 `approvals` (status=pending),浏览器关闭时这行仍在
2. 浏览器启动时 ChatBox 调 `useApprovals.hydrate()` — 拉所有 `status='pending'` 的 approvals
3. UI 在右下角显示 banner: "上次有 N 个未决的 ChangeSet,要继续吗?" → 点击展开队列
4. 每个 ChangeSet 渲染为完整 ApprovalCard (含影响图谱 + 整批 cascade),用户可继续审
5. 因为整批落盘是 transaction,如果中途用户改主意了,直接 reject 整批不留任何痕迹

**多 ChangeSet 排队**: 用户可能在不同时间点发起多次修改,产生多个 pending approvals。pending queue 仍保留 (Zustand store),但每个 entry 是一个完整 ChangeSet 而非 cascade 中的某一项。UI 显示**第一个**,其他角标 +N。
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
