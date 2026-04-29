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
| `text-delta` | 增量文本 token | 主消息体 |
| `reasoning-delta` | 推理链增量 (Thinking) | ThinkingPanel 折叠"推理"段 |
| `tool-call` | 调用某工具 (含参数) | ThinkingPanel 工具节点 |
| `tool-result` | 工具返回值 | 工具节点下方折叠 |
| `tool-call-needs-approval` | 待审批工具调用 | 渲染 `<ApprovalCard>` |
| `tool-call-approved` / `rejected` | 用户决定 | 卡片折叠状态变更 |
| `agent-handoff-start` | 切换到子 Agent | ThinkingPanel 嵌套展开 |
| `agent-handoff-end` | 子 Agent 结束 | 嵌套关闭 |
| `finish-step` | 一个 step 结束 | 分隔线 |
| `error` | 错误 | 红色错误卡 |

## 客户端 useChat 钩子

```ts
'use client'
import { useChat } from 'ai/react'

export function ChatBox() {
  const { messages, sendMessage, addToolResult, status } = useChat({
    api: '/api/chat',
    body: { projectId, sessionId, mode },
    onToolCall: async ({ toolCall }) => {
      if (toolCall.needsApproval) {
        // 渲染 ApprovalCard,用户点同意/拒绝后调用 addToolResult
        // 见 spec/06-approval-flow.md
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

## 中断/取消

```ts
const { stop } = useChat(...)
// 用户点"取消"按钮 → stop() → 服务端 AbortSignal 触发 → 流关闭
```

服务端 `createAgentUIStreamResponse` 自动处理 abort,正在跑的 LLM 请求 cancel,工具调用若已开始则继续到完成 (避免脏写)。

## 重连

SSE 原生支持。客户端断线 → 浏览器自动 reconnect → 服务端从 message id 续传 (AI SDK 6 内置)。

## traces 归档

每会话结束时把 SSE 事件序列写入 `~/.open-novel/workspaces/{projectId}/trace/{date}-{sessionId}.jsonl`,**JSONL 一行一个事件**:

```jsonl
{"ts":"2026-04-29T12:30:45.123Z","kind":"text-delta","agent":"router","text":"我先看看..."}
{"ts":"2026-04-29T12:30:46.001Z","kind":"tool-call","agent":"writer","tool":"readSetting","args":{"path":"characters/lin.md"}}
{"ts":"2026-04-29T12:30:46.234Z","kind":"tool-result","result":{"path":"...","content":"..."}}
```

便于事后重放/调试 prompt。也可以用 `lib/storage/trace-importer.ts` ingest 到 `traces` 表。

## 流式传输优化

- **Token 合并**: 客户端 100ms 防抖,把多个 text-delta 合并渲染避免 React 频繁重绘
- **推理流压缩**: reasoning 段默认折叠,展开才完整渲染
- **大量 tool-result**: 工具返回值 >2KB 时折叠,显示 "查看完整结果 (3.2 KB)"

## 错误处理

服务端发送 `{ type: 'error', error: { message, code, recoverable: bool } }`。客户端:

- `recoverable: true` → 显示警告 + "重试"按钮
- `recoverable: false` → 显示红色错误 + "复制错误信息"按钮 + 写入 DebugConsole

常见错误:
- `MODEL_TIMEOUT` → recoverable
- `INVALID_API_KEY` → not recoverable, 弹 SettingsDialog
- `RATE_LIMIT` → recoverable, 30s 后自动重试
- `TOOL_VALIDATION_FAILED` → not recoverable, 写 DebugConsole
