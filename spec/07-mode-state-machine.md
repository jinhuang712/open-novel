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
2. **awaitingApproval 中切换 mode 被禁止** — 无论 SWITCH_MODE.source 是 `click` / `tab` / `shortcut` 都被同等阻止;Tab 触发时 UI 显示 toast: "完成审批后才能切模式"
3. **awaitingApproval 中接受新 USER_INPUT 被禁止** — ChatBox textarea disabled 灰显 + tooltip "请先审批或取消上方提案";`send` 调用直接 reject 不进 stream
4. **discussing 不会进入 awaitingApproval** — discuss 模式 Agent 不持有 write 工具
5. **errored 是 sink,只能通过用户输入或切 mode 离开**
6. **cascade 链路串行** — 主 approval 决议后,cascade queue 依次进入 awaitingApproval,不并发

## USER_INPUT 处理 (新增)

> audit 发现:awaitingApproval 中接受新 USER_INPUT 没建模 — 用户能不能同时回到 ChatBox 发新指令?如果 push 进 currentTask,与 await 残余状态如何 LIFO?

机器在所有非 idle/errored 状态下接收 USER_INPUT 时**默认 reject + emit toast**:

```ts
states: {
  classifying: {
    on: {
      USER_INPUT: {
        actions: 'showBusyToast',     // toast: "正在分析,请稍候"
        // 不 transition
      },
      // ...
    },
  },
  // similarly for discussing/planning.*/writing.*
}
```

**例外**: 用户主动按 `Esc` 触发 CANCEL → 走到 idle 才能接受新 USER_INPUT。这给用户兜底逃生通道,避免被卡死在 await。

`Esc` 在 awaitingApproval 状态有特殊语义: **不**关闭 ApprovalCard (那是审批 dialog 的"无操作关闭"),而是 emit CANCEL → 落到 idle + 把当前 approval 标 'cancelled' (区别于 expired/rejected)。

## Approval Queue 建模 (W9 整批审之后简化)

> ⚠ **W9 升级 (见 spec/06 / spec/19)**: cascade 改为审批前内部递归 + 整批审,**单个 ChangeSet 一个 approval 行**,内部 1-3 级 cascade 全在同一 ApprovalCard 勾选 — 不再需要"cascade 各项独立 approval 行"的子项排队建模。
>
> 但**用户跨多次修改**仍可能产生多个 pending ChangeSet (例如 plan 模式连续发起两次修改还没审),需要 FIFO 排队。

context 扩展:

```ts
context: {
  mode: 'discuss' | 'plan' | 'write'
  currentTask: string | null
  pendingApprovals: string[]            // 当前正展示的 approvalId (栈顶,通常长度=1)
  approvalQueue: string[]               // 后续待审 ChangeSet approvalId 队列 (FIFO)
  lastError: string | null
}
```

每个 approvalId 对应一个完整 ChangeSet(主修改 + 1-3 级 cascade)。`APPROVAL_RESOLVED` 后,如 approvalQueue 非空,自动从中取下一项 push 到 pendingApprovals,继续 awaitingApproval;空才回 idle。

```ts
APPROVAL_RESOLVED: [
  {
    guard: ({ context }) => context.approvalQueue.length > 0,
    target: 'awaitingApproval',
    actions: assign({
      pendingApprovals: ({ context }) => [context.approvalQueue[0]],
      approvalQueue: ({ context }) => context.approvalQueue.slice(1),
    }),
  },
  { target: '#mode.idle' },
],
```

**初始化**: writeSettingProposal 后,服务端 **不**再把 cascade 各项展开成独立 approval 行 — 整个 ChangeSet 进**一行**,客户端 `useApprovals.hydrate()` 时按时间排序的多个 ChangeSet ApprovalCard 推入 `approvalQueue`(队首进 pendingApprovals,其余排队)。

## session.json 与 approvals 表的 source-of-truth (新增)

> audit 发现:spec/01 有 approvals 表 (status=pending),spec/07 又有 runtime/session.json 中的 pendingApprovals 数组。两边写入时机若不同步,reload 后会出现表里 pending 但 session 里没的不一致。

**契约**: `approvals` 表是唯一 source of truth。session.json 仅缓存机器 context,启动时:

```ts
async function rehydrateMachine(projectId: string): Promise<MachineState> {
  const pendingFromDb = await db.approvals.findPending(projectId, { since: now() - 24h })
  // 丢弃 24h 前的 pending (按 spec/06 §审批超时与悬挂时长)
  // session.json 仅用于恢复 mode 与 currentTask;pending 数组永远以 db 为准
  const session = await fs.readFile('runtime/session.json').catch(() => null)
  return {
    mode: session?.mode ?? 'discuss',
    currentTask: session?.currentTask ?? null,
    pendingApprovals: pendingFromDb.length > 0 ? [pendingFromDb[0].id] : [],
    approvalQueue: pendingFromDb.slice(1).map(a => a.id),
    lastError: null,
  }
}
```

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
