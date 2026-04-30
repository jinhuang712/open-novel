# Spec 07 — 三模式 XState 状态机

## 为什么用状态机

模式间切换 + 审批闸门有不少看不见的边界条件:

- discuss 模式下用户突然想改设定 → 该提示切换还是直接拒绝?
- write 中途冒出一个 cascade 影响设定 → 主流程是否阻塞?
- 取消按钮在不同状态下行为不一样

把这些用 XState 显式画出来,运行时不变性可机器校验。

## State Machine 定义

```ts
// lib/agents/mode-machine.ts
import { setup, assign } from 'xstate'

export const modeMachine = setup({
  types: {} as {
    context: {
      mode: 'discuss' | 'plan' | 'write'
      currentTask: string | null
      pendingApprovals: string[]
      lastError: string | null
    }
    events:
      | { type: 'USER_INPUT'; text: string }
      | { type: 'SWITCH_MODE'; mode: 'discuss' | 'plan' | 'write'; source: 'click' | 'tab' | 'shift-tab' | 'shortcut' }
      | { type: 'AGENT_DONE'; result: unknown }
      | { type: 'TOOL_NEEDS_APPROVAL'; callId: string }
      | { type: 'APPROVAL_RESOLVED'; callId: string; decision: 'approved' | 'rejected' }
      | { type: 'CANCEL' }
      | { type: 'ERROR'; message: string }
  },
}).createMachine({
  id: 'mode',
  initial: 'idle',
  context: {
    mode: 'discuss',
    currentTask: null,
    pendingApprovals: [],
    lastError: null,
  },
  states: {
    idle: {
      on: {
        USER_INPUT: { target: 'classifying' },
        SWITCH_MODE: { actions: assign({ mode: ({ event }) => event.mode }) },
      },
    },
    classifying: {
      // Router 在跑,识别意图
      on: {
        AGENT_DONE: [
          { guard: ({ context }) => context.mode === 'discuss', target: 'discussing' },
          { guard: ({ context }) => context.mode === 'plan', target: 'planning' },
          { guard: ({ context }) => context.mode === 'write', target: 'writing' },
        ],
        ERROR: { target: 'errored', actions: 'recordError' },
        CANCEL: { target: 'idle' },
      },
    },
    discussing: {
      // 只读,不会触发 needsApproval
      on: {
        AGENT_DONE: { target: 'idle' },
        CANCEL: { target: 'idle' },
        ERROR: { target: 'errored' },
      },
    },
    planning: {
      initial: 'generating',
      states: {
        generating: {
          on: {
            TOOL_NEEDS_APPROVAL: { target: 'awaitingApproval' },
            AGENT_DONE: { target: '#mode.idle' },  // Writer 没要写就直接结束
          },
        },
        awaitingApproval: {
          on: {
            APPROVAL_RESOLVED: [
              { guard: ({ event }) => event.decision === 'approved', target: 'persisting' },
              { guard: ({ event }) => event.decision === 'rejected', target: 'refining' },
            ],
            CANCEL: { target: '#mode.idle' },
          },
        },
        persisting: {
          // 落盘 + 触发 Validator cascade + Reflector
          on: {
            AGENT_DONE: { target: '#mode.idle' },
            TOOL_NEEDS_APPROVAL: { target: 'awaitingApproval' },  // cascade 链
          },
        },
        refining: {
          // 用户拒绝 + 反馈,Writer 重新生成
          on: {
            TOOL_NEEDS_APPROVAL: { target: 'awaitingApproval' },
            AGENT_DONE: { target: '#mode.idle' },
          },
        },
      },
      on: {
        SWITCH_MODE: {
          guard: ({ context }) => context.pendingApprovals.length === 0,
          actions: assign({ mode: ({ event }) => event.mode }),
          target: 'idle',
        },
      },
    },
    writing: {
      // 与 planning 同构,写章节版本
      initial: 'generating',
      states: {
        generating: { /* same as planning.generating */ },
        awaitingApproval: { /* same */ },
        persisting: { /* same */ },
        refining: { /* same */ },
      },
    },
    errored: {
      on: {
        USER_INPUT: { target: 'classifying' },
        SWITCH_MODE: { target: 'idle' },
      },
    },
  },
})
```

## 不变性 (Invariants)

机器保证:

1. **Approval 必须 resolve 才能离开 awaitingApproval** — 防止"流式漏写"
2. **awaitingApproval 中切换 mode 被禁止** — 否则会丢失上下文。无论 SWITCH_MODE 的 source 是 `click` 还是 `tab` 都被同等阻止;Tab 触发时 UI 显示 toast: "完成审批后才能切模式"
3. **discussing 不会进入 awaitingApproval** — discuss 模式 Agent 不持有 write 工具
4. **errored 是 sink,只能通过用户输入或切 mode 离开**

## SWITCH_MODE 的 source 字段语义

`SWITCH_MODE.source` 用于 UI 反馈与遥测,**不影响**状态机迁移逻辑:

- `click`: 用户点 ChatBox 顶部 toggle (按 mode 名直选,不循环)
- `tab`: 用户在 ChatBox textarea 内按 Tab (循环正向: discuss → plan → write → discuss)
- `shift-tab`: 反向循环
- `shortcut`: 命令面板 (`Cmd+Shift+P`) 调起的"切到 plan 模式"等命令

UI 层根据 source 决定动效:
- `click`: 静默切换
- `tab` / `shift-tab`: toast 短暂显示新模式名 + toggle 高亮飞过
- `shortcut`: 同 click

ShortcutListener 把 Tab 事件翻译成 SWITCH_MODE 时,先调用 `cycleMode(currentMode, reverse=...)` 算出 next mode,再 send `{ type: 'SWITCH_MODE', mode: next, source: 'tab' }`。详见 spec/12 §模式循环逻辑。

## React 集成

```ts
// hooks/useModeMachine.ts
import { useMachine } from '@xstate/react'
import { modeMachine } from '@/lib/agents/mode-machine'

export function useModeMachine() {
  const [state, send] = useMachine(modeMachine)
  return {
    mode: state.context.mode,
    isAwaitingApproval: state.matches({ planning: 'awaitingApproval' })
                     || state.matches({ writing: 'awaitingApproval' }),
    isBusy: state.matches('classifying') || state.matches('discussing')
         || state.matches('planning') || state.matches('writing'),
    send,
  }
}
```

ChatBox + ApprovalCard 通过 `send(event)` 与机器通信。Mode Toggle 按钮在 `isAwaitingApproval=true` 时禁用并显示 tooltip "完成审批后才能切模式"。

## 持久化恢复

会话中断后重启时,从 `~/.open-novel/workspaces/{projectId}/runtime/session.json` 恢复:

```json
{
  "machineState": "planning.awaitingApproval",
  "context": { "mode": "plan", "pendingApprovals": ["call_xxx"], ... },
  "savedAt": "2026-04-29T12:30:45Z"
}
```

## 与 Mastra Agent 的协同

Mastra Agent 的 `streamVNext` 触发的事件 (tool-call / handoff / finish) 通过适配器转成机器的 events:

```ts
const stream = await routerAgent.streamVNext(messages, { /* ... */ })
for await (const chunk of stream.fullStream) {
  switch (chunk.type) {
    case 'tool-call':
      if (chunk.tool.needsApproval) send({ type: 'TOOL_NEEDS_APPROVAL', callId: chunk.id })
      break
    case 'finish':
      send({ type: 'AGENT_DONE', result: chunk.result })
      break
    case 'error':
      send({ type: 'ERROR', message: chunk.error })
      break
  }
}
```

## 测试

每条转移要写单测,用 `xstate/test` 自动化:

```ts
describe('modeMachine', () => {
  it('discuss 模式不会进入 awaitingApproval', () => { /* ... */ })
  it('awaitingApproval 中切 mode 被拒绝', () => { /* ... */ })
  it('cascade 链路连续多个 awaitingApproval 可正确串行', () => { /* ... */ })
})
```
