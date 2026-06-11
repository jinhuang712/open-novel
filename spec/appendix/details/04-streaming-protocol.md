# Spec 04 — 流式协议

## 协议选型

**SSE (Server-Sent Events)**,通过 Vercel AI SDK 6 的 `createAgentUIStreamResponse` + 客户端 `useChat()` 实现,带类型化 UIMessage 流。

不用 WebSocket 因为:

- LLM 流是单向 (server → client),SSE 自然契合
- HTTP/2 + SSE 天然支持断线重连
- AI SDK 6 已成熟封装

## 服务端 Route Handler

`app/api/chat/route.ts`:

```ts
import { routerAgent } from '@/lib/agents/router'
import { createAgentUIStreamResponse } from 'ai'

export async function POST(req: Request) {
  const { messages, projectId, sessionId, mode } = await req.json()
  
  return createAgentUIStreamResponse({
    agent: routerAgent,
    uiMessages: messages,
    options: {
      memory: {
        thread: `proj:${projectId}:session:${sessionId}`,
        resource: projectId,
      },
      runtimeContext: { projectId, sessionId, mode },
    },
    // 把所有事件存档到 traces 表 (异步,不阻塞)
    onFinish: async ({ messages, response }) => {
      await db.traces.archive(projectId, sessionId, response)
    },
  })
}
```

## 事件类型 (UIMessage Parts)

每个 UIMessage 的 `parts` 数组可包含:

| Part Type | 含义 | UI 渲染 |
|---|---|---|
| `text-delta` | 增量文本 token (Writer / Humanizer 自然语言流) | 主消息体逐字渲染 |
| `reasoning-delta` | 推理链增量 (Thinking) | ThinkingPanel 折叠"推理"段 |
| `tool-call` | 调用某工具 (含参数) | ThinkingPanel 工具节点 |
| `tool-result` | 工具返回值 | 工具节点下方折叠 |
| `tool-call-needs-approval` | 待审批工具调用 | 渲染 `<ApprovalCard>` |
| `tool-call-approved` / `rejected` | 用户决定 | 卡片折叠状态变更 |
| `agent-handoff-start` | 切换到子 Agent | ThinkingPanel 嵌套展开 |
| `agent-handoff-end` | 子 Agent 结束 | 嵌套关闭 |
| `finish-step` | 一个 step 结束 | 分隔线 |
| `error` | 错误 | 红色错误卡 |
| `analyzing` | JSON mode 流式中: 当前 chunk 是 JSON 片段, 不展示给用户 | ThinkingPanel 显示 spinner + "正在分析..." 文字 |
| `json-result` | JSON mode 流完整体, 已 zod 校验通过 | 按 Agent 类型渲染对应 view (Validator → ChangeProposal 列表; ReaderPanel → 5 persona 评论卡; 等等) |
| `json-retry` | JSON 校验失败, 自动 retry | ThinkingPanel 显示 "重试 N/2" 提示 |
| `json-failed` | 2 次 retry 仍败 (spec/24 §失败处理) | toast + 折叠区显示原文 + 重试按钮 |

### JSON mode 与 streaming 的衔接 (spec/24)

**关键约束**: Writer / Humanizer 走自然语言流式 (`text-delta` 逐字渲染);其他 agent 走 JSON mode,中间 `analyzing` chunks 不渲染,流完整体后:

```ts
// 服务端
const stream = streamText({
  model,
  messages,
  providerOptions: ctx.metadata.jsonMode ? { deepseek: { response_format: { type: 'json_object' } } } : undefined,
  maxTokens,
})

if (ctx.metadata.jsonMode) {
  // 流式中只 emit 'analyzing' (不 emit text-delta)
  let buffer = ''
  for await (const chunk of stream.textStream) {
    buffer += chunk
    emit({ type: 'analyzing', label: agentName })
  }
  // 流完后整体 parse + zod 校验
  const validated = await parseAndValidate(buffer, agentSchema)
  emit({ type: 'json-result', agent: agentName, data: validated })
} else {
  // 自然语言流: 正常逐字 emit text-delta
  for await (const chunk of stream.textStream) {
    emit({ type: 'text-delta', value: chunk })
  }
}
```

ReaderPanel 5 persona 因 JSON 体较大(8K tokens),全部流完再 parse。如有必要,可引入 incremental JSON parser (e.g. `partial-json`) 让 5 persona 一个一个出现。

## 客户端 useChat 钩子

```ts
'use client'
import { useChat } from 'ai/react'

export function ChatBox() {
  const { messages, sendMessage, status } = useChat({
    api: '/api/chat',
    body: { projectId, sessionId, mode },
    onToolCall: async ({ toolCall }) => {
      if (toolCall.needsApproval) {
        // 渲染 ApprovalCard;用户决议走 /api/approvals/{id}/resolve
        // 见 spec/06-approval-flow.md。决议不回灌同一条 stream
      }
    },
  })
  // ...
}
```

## ThinkingPanel 渲染逻辑

```tsx
function ThinkingPanel({ messages }) {
  return messages.map(msg =>
    msg.parts.map(part => {
      switch (part.type) {
        case 'reasoning-delta':
          return <ReasoningStream agent={part.agent} text={part.text} />
        case 'tool-call':
          return <ToolCallNode tool={part.toolName} args={part.args} status={part.status} />
        case 'tool-result':
          return <ToolResultNode result={part.result} />
        case 'agent-handoff-start':
          return <AgentBoundary agent={part.targetAgent} />
        case 'tool-call-needs-approval':
          return <ApprovalCard call={part} />
        // ...
      }
    })
  )
}
```

## 中断 / 取消 / 浏览器刷新

> **[info]** audit 发现: "工具调用若已开始则继续完成"过于乐观 — writeSetting 已写一半 (200KB 写到一半) 然后取消,fs 看到截断文件。需要更细粒度。

### 取消模型

```ts
const { stop } = useChat(...)
// 用户点"取消"按钮 → stop() → 服务端 AbortSignal 触发 → 流关闭
```

服务端 `createAgentUIStreamResponse` (或 audit 后实际 API) 拿到 abort:

1. **正在跑的 LLM 请求**: 通过底层 fetch AbortController 立刻 cancel (DeepSeek/Gateway 端会终止 token 输出)
2. **正在跑的工具 execute**: 在 step 边界检查 `signal.aborted`;**单一原子操作 (一次 fs.rename / 一个 SQLite transaction) 跑完才停**,绝不中断单步
3. **proposal 类工具** (writeSettingProposal): 如果 proposal 已落 approvals 表 (status=pending),**保留** — 用户可在重启后看到这条 pending,继续审或取消
4. **stream 状态**: emit 一个 `cancelled` 事件,客户端 UI 显示"已取消";trace 文件追加 `kind=cancelled`

### 浏览器刷新 / 崩溃 / 网络中断

**契约**: 刷新 = 抛弃当前 stream,**不**自动续传 LLM 流 (cookbook 上 SSE reconnect 续传依赖 `Last-Event-ID` 但 AI SDK 各版本支持不一致,不依赖)。

**用户体验**:

- 刷新后 ChatBox 历史消息从应用层 memory 模块拉回 (memory 是 server 端落盘的,不依赖 stream)
- 最后一条若为 `partial`,UI 标"(已中断)" + 提供"重发"按钮
- 已 emit 的 proposal (落 `approvals` 表) — `useApprovals.hydrate()` 拉回继续审
- 流式中已开始的 fs/db 副作用 — 因为是原子写,不会有半截文件

### tool_call_id 幂等性

每个工具调用有唯一 `tool_call_id`,**所有有副作用的工具的 execute 都查这个 id**:

```ts
execute: async (input, ctx) => {
  // 幂等检查: 这次 toolCallId 是否已经处理过
  const existing = await db.approvals.findByToolCallId(ctx.toolCallId)
  if (existing) return { kind: 'proposal', approvalId: existing.id, ...existing }   // 同步 idempotent

  // 否则正常处理
  const approvalId = await db.approvals.insert({ tool_call_id: ctx.toolCallId, /* ... */ })
  return { kind: 'proposal', approvalId, /* ... */ }
}
```

`approvals.tool_call_id` UNIQUE 约束保底,即使 race 也只成一条。

## 重连

SSE 原生支持浏览器层重连 — 网络抖动短时,EventSource 会自动重新建连。**但我们不依赖服务端续传**: reconnect 后 server 视为新 request,client 拿到的 stream 从空开始;所以前端在 reconnect 之前已收到的 token 保留显示,reconnect 后不再期望 server 续传剩余。

**断线超过 5 秒** UI 直接进入 cancelled 状态,提示用户"已断线,要重发吗?"。

## traces 归档

> **[info]** audit 发现:`onFinish` 只在正常结束时写,timeout/error/abort 时 trace 不写。但用户最关心调试的恰好是错误。

trace 不在 `onFinish` 写,而是 `onChunk` 同步追加:

```ts
const tracePath = path.join(getProjectDir(projectId), 'trace', `${date}-${sessionId}.jsonl`)
const traceStream = createWriteStream(tracePath, { flags: 'a' })

return createAgentUIStreamResponse({
  /* ... */
  onChunk: (chunk) => traceStream.write(JSON.stringify({ ts: now(), ...chunk }) + '\n'),
  onFinish: () => traceStream.end(),
  onError: (err) => {
    traceStream.write(JSON.stringify({ ts: now(), kind: 'error', error: { message: err.message, code: err.code } }) + '\n')
    traceStream.end()
  },
  onAbort: () => {
    traceStream.write(JSON.stringify({ ts: now(), kind: 'cancelled' }) + '\n')
    traceStream.end()
  },
})
```

JSONL 一行一个事件:

```jsonl
{"ts":"2026-04-29T12:30:45.123Z","kind":"text-delta","agent":"router","text":"我先看看..."}
{"ts":"2026-04-29T12:30:46.001Z","kind":"tool-call","agent":"writer","tool":"readSetting","args":{"path":"characters/lin.md"}}
{"ts":"2026-04-29T12:30:46.234Z","kind":"tool-result","result":{"path":"...","content":"..."}}
{"ts":"2026-04-29T12:30:48.999Z","kind":"error","error":{"message":"...","code":"MODEL_TIMEOUT"}}
```

**trace 体积治理**:

- 单文件 100MB 阈值: Worker 启动 archive — 把 7 天前的 trace 文件按月打包成 `trace/archive/{YYYY-MM}.tar.gz`,删原文件
- SettingsDialog → 数据管理 → 显示当前 trace 总大小 + 一键清理
- 用户可在 SettingsDialog 关 trace (但 debug 体验下降,默认开)

**隐私**: trace 含用户的小说内容 — 首启 OnboardingWizard 明示"诊断 trace 仅本地存,不上传任何服务器" (见 spec/15-onboarding)。

## 流式传输优化

- **Token 合并**: 客户端 100ms 防抖,把多个 text-delta 合并渲染避免 React 频繁重绘
- **推理流压缩**: reasoning 段默认折叠,展开才完整渲染
- **大量 tool-result**: 工具返回值 >2KB 时折叠,显示 "查看完整结果 (3.2 KB)"

## 错误处理

服务端发送 `{ type: 'error', error: { message, code, recoverable, action? } }`。客户端按下表反应:

| code | recoverable | UI 反应 | 用户操作 | 原始 prompt 保留? |
|---|---|---|---|---|
| `MODEL_TIMEOUT` | true | toast "模型超时,重试中..." + 自动 1 次重试 | 静默 | 是 |
| `RATE_LIMIT` | true | toast "限流,N 秒后重试" + 自动重试 (指数退避) | ChatBox 期间 disabled | 是 |
| `INVALID_API_KEY` | false | 红 banner + 自动弹 SettingsDialog Section 1 | 重输 key | 是 (弹回 ChatBox) |
| `INSUFFICIENT_QUOTA` | false | 红 banner "DeepSeek 额度不足" + 链接到充值页 | 充值后点重试 | 是 |
| `MODEL_DOWN` | false | 红 banner "模型不可用,请稍后" + status 页链接 | 等待 | 是 |
| `BUDGET_CAP_HIT` | false | 红 banner "本月预算已耗尽,请到 Settings 调整" | 改预算 / 等下月 | 是 |
| `TOOL_VALIDATION_FAILED` | false | DebugConsole 红字 + 提示用户检查输入 | 重新发 message | 否 (输入有问题) |
| `PATH_ESCAPE` / `PATH_INVALID` | false | DebugConsole + 红 banner "Agent 试图越权,已阻止" | 安全事件,无须重试 | 是 |
| `LLM_STRUCTURED_FAIL` | true | toast "输出格式异常,降级用默认值" | 静默 (用默认值继续) | 是 |
| `CONTENT_FILTERED` | false | 红 banner "DeepSeek 安全过滤拒绝了此请求" | 改 prompt 重发 | 是 |

**原始 prompt 保留逻辑**: 错误发生时,client 不清空 ChatBox textarea。用户重发 = 重新点发送按钮即可。

**自动重试限制**: `MODEL_TIMEOUT` / `RATE_LIMIT` 仅自动重试 1 次,失败转人工。退避: 1.5s + jitter。

**遥测**: 所有错误都落 trace + DebugConsole §Errors tab。不上报到任何远端。

## 长任务进度协议 (新增)

> **[info]** audit 发现:ReaderPanel 5 persona 并行 ≥10s,Validator 全项目扫 ≥30s — 没有进度信号,卡住时用户唯一操作是刷新 (回到刷新→cancelled 路径)。

新增事件类型 `progress`:

| Part Type | 含义 | 示例 |
|---|---|---|
| `progress` | 长任务的子任务状态 | `{ taskId, label, current: 3, total: 5, elapsedMs: 4521, status: 'running' }` |

**ReaderPanel** 每 persona 完成时 emit 一次 progress:

```jsonl
{"kind":"progress","taskId":"reader-panel:ch001","label":"追更党","current":1,"total":5}
{"kind":"progress","taskId":"reader-panel:ch001","label":"逻辑控","current":2,"total":5}
{"kind":"progress","taskId":"reader-panel:ch001","label":"情感党","current":3,"total":5,"status":"failed"}
{"kind":"progress","taskId":"reader-panel:ch001","label":"毒舌读者","current":4,"total":5}
{"kind":"progress","taskId":"reader-panel:ch001","label":"潜水大佬","current":5,"total":5}
```

**Validator** cascade 扫描时按章节 emit:

```jsonl
{"kind":"progress","taskId":"validator:scan","label":"扫第 3 章","current":3,"total":50}
```

**UI**: ChatBox 上方一条进度条 + label,并提供取消按钮 (调 stop()),取消后已完成的 persona 反应保留 (走聚合 placeholder 计算)。
