# Spec 12 — 快捷键 Registry 与上下文化绑定

> 替代之前散落在 plan/07 末尾的快捷键列表。所有快捷键集中在一个 registry 中管理,带上下文区分、冲突检测、用户可重绑、持久化。

## 设计目标

- **集中**: 一个文件列出所有快捷键,UI 与代码共享同一份事实
- **上下文化**: Tab 在 ChatBox 切模式 vs 在编辑器是缩进 — 同键不同义
- **可重绑**: 用户在 SettingsDialog → 快捷键 tab 改任意键,持久化到 settings.json
- **冲突检测**: 同一上下文下两条命令绑同一键时高亮警告
- **不可改的硬约束**: 浏览器/系统级键 (Esc / Cmd+Q / Cmd+W) 在我们这里有特殊语义时,标记 `configurable: false`

## Registry 结构

```ts
// lib/shortcuts/registry.ts
export type ShortcutContext = 'global' | 'editor' | 'chatbox' | 'approval' | 'dialog'

export type Shortcut = {
  id: string                          // "chat.cycleMode" / "app.openCommandPalette"
  description: string                 // 中文,UI 显示用
  defaultKeys: string[]               // ["Tab"] 或 ["Cmd+Shift+P", "F1"] (多绑定)
  context: ShortcutContext
  configurable: boolean               // false = 用户不可改
  category: 'navigation' | 'editor' | 'chat' | 'approval' | 'view' | 'system'
  handler: ShortcutHandler            // 由代码注册时绑定;UI 不显示
  preventDefault?: boolean            // 默认 true;false = 不阻止浏览器默认行为
}
```

## 默认快捷键全表

### Global (无焦点限制 / 整个 app 内有效)

| ID | 描述 | 默认键 | 可改 |
|---|---|---|---|
| `app.openCommandPalette` | 打开命令面板 | `Cmd+Shift+P`, `F1` | ✓ |
| `app.openQuickFile` | 快速打开文件 | `Cmd+P` | ✓ |
| `app.openSearch` | 全项目搜索 | `Cmd+Shift+F` | ✓ |
| `app.openSettings` | 打开设置 | `Cmd+,` | ✓ |
| `app.activityBar.outline` | 切到大纲面板 | `Cmd+1` | ✓ |
| `app.activityBar.characters` | 切到角色面板 | `Cmd+2` | ✓ |
| `app.activityBar.chapters` | 切到章节面板 | `Cmd+3` | ✓ |
| `app.activityBar.search` | 切到搜索面板 | `Cmd+4` | ✓ |
| `app.activityBar.learnings` | 切到偏好学习面板 | `Cmd+5` | ✓ |
| `view.toggleFileTree` | 折叠/展开 FileTree | `Cmd+B` | ✓ |
| `view.toggleRightPanel` | 折叠/展开右侧面板 | `Cmd+J` | ✓ |
| `view.toggleConsole` | 折叠/展开 Console | `Cmd+\`` | ✓ |
| `view.zoomIn` | 编辑器字号增 | `Cmd+=` | ✓ |
| `view.zoomOut` | 编辑器字号减 | `Cmd+-` | ✓ |
| `view.resetZoom` | 重置字号 | `Cmd+0` | ✓ |
| `system.closeOverlay` | 关闭最顶层浮层 (Dialog/HoverCard/Approval) | `Esc` | ✗ |

### Editor 上下文 (TipTap 焦点内)

| ID | 描述 | 默认键 | 可改 |
|---|---|---|---|
| `editor.save` | 强制保存当前文件 | `Cmd+S` | ✓ |
| `editor.gotoDefinition` | 跳转到光标处实体的定义 | `F12` | ✓ |
| `editor.gotoDefinition.fullscreen` | 跳转并全屏 | `Cmd+F12` | ✓ |
| `editor.findReferences` | 查找实体引用 | `Shift+F12` | ✓ |
| `editor.renameEntity` | 重命名实体 (Rename Refactor) | `F2` | ✓ |
| `editor.toggleComment` | 切换段落批注 | `Cmd+/` | ✓ |
| `editor.aiInlineEdit` | 框选内容时唤起 AI 改写 | `Cmd+K` | ✓ |
| `editor.acceptSuggestion` | 接受 AI 建议 (待 W4 实现 inline 改写) | `Tab` | ✓ (仅当有建议时;无建议时 Tab 走 TipTap 默认列表缩进) |

### ChatBox 上下文 (右下角输入框焦点内)

| ID | 描述 | 默认键 | 可改 | 备注 |
|---|---|---|---|---|
| **`chat.cycleMode`** | **discuss → plan → write 循环切换** | **`Tab`** | ✓ | **覆盖 textarea 默认 tab 字符插入** |
| **`chat.cycleModeReverse`** | 反向循环 | `Shift+Tab` | ✓ | |
| `chat.send` | 发送消息 | `Cmd+Enter`, `Ctrl+Enter` | ✓ | |
| `chat.cancel` | 取消正在进行的流式生成 | `Esc` | ✗ (与 closeOverlay 共用) | 流进行中时 Esc 优先取消 |
| `chat.historyPrev` | 历史输入回翻 | `Cmd+Up` | ✓ | 仅当 textarea 为空时 |
| `chat.historyNext` | 历史输入向下 | `Cmd+Down` | ✓ | 同上 |
| `chat.atFile` | 引用文件 (类 Cursor `@`) | `@` (字面键,不算快捷键) | ✗ | 由 ChatBox 拦 |
| `chat.clearInput` | 清空输入框 | `Cmd+Shift+Backspace` | ✓ | |

### ApprovalCard 上下文 (浮层焦点内)

| ID | 描述 | 默认键 | 可改 |
|---|---|---|---|
| `approval.approve` | 同意 | `Y`, `Cmd+Enter` | ✓ |
| `approval.reject` | 拒绝 | `N` | ✓ |
| `approval.editThenApprove` | 编辑后同意 | `E` | ✓ |
| `approval.cascadeApproveAll` | 同意并 cascade 全部 | `Cmd+Shift+A` | ✓ |
| `approval.viewNext` | 下一条待审 | `Cmd+]` | ✓ |
| `approval.viewPrev` | 上一条待审 | `Cmd+[` | ✓ |

### Tabs 上下文 (顶部标签栏)

| ID | 描述 | 默认键 | 可改 |
|---|---|---|---|
| `tabs.close` | 关闭当前 tab | `Cmd+W` | ✓ (但有 fallback: 浏览器关 tab 不可拦) |
| `tabs.reopen` | 重开最近关闭 | `Cmd+Shift+T` | ✓ |
| `tabs.next` | 下一个 tab | `Cmd+Option+Right` | ✓ |
| `tabs.prev` | 上一个 tab | `Cmd+Option+Left` | ✓ |

## 上下文优先级 (cascading)

当多个上下文同时活跃 (如 Editor 在最上层但 Global 仍生效),按以下优先级解析按键:

```
1. Most-specific context (approval > dialog > chatbox > editor > tabs)
2. Global
3. Browser default (preventDefault: false 时)
```

例子:
- 焦点在 ChatBox 内按 `Tab` → 命中 `chat.cycleMode` (chatbox 优先级高于 global)
- 焦点在 ChatBox 内按 `Cmd+P` → chatbox 没注册,fallback 到 `app.openQuickFile` (global)
- 焦点在 ApprovalCard 内按 `Esc` → 命中 `system.closeOverlay`(因 approval context 没单独绑 Esc,但 approval 是 dialog 的子集,使用 system 的 closeOverlay)

## 实现层

### 注册

```ts
// app/layout.tsx (启动时)
import { registerShortcuts } from '@/lib/shortcuts'
import { defaultShortcuts } from '@/lib/shortcuts/registry'

registerShortcuts(defaultShortcuts)
```

### 单条注册示例

```ts
// lib/shortcuts/registry.ts
export const defaultShortcuts: Shortcut[] = [
  {
    id: 'chat.cycleMode',
    description: '切换 Agent 模式 (discuss / plan / write)',
    defaultKeys: ['Tab'],
    context: 'chatbox',
    configurable: true,
    category: 'chat',
    preventDefault: true,
    handler: () => {
      const cur = useUiStore.getState().mode
      const next = cycleMode(cur)
      useUiStore.getState().setMode(next)
    },
  },
  // ...
]
```

### 监听器

```ts
// lib/shortcuts/listener.ts
export function useShortcutListener() {
  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      const ctx = inferContext(e.target)              // 'chatbox' / 'editor' / ...
      const key = normalizeKey(e)                      // "Tab" / "Cmd+Shift+P"
      const shortcut = resolveShortcut(ctx, key, registry)
      if (!shortcut) return
      if (shortcut.preventDefault !== false) e.preventDefault()
      shortcut.handler(e)
    }
    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
  }, [])
}
```

`inferContext`: 检查 `e.target` 是否在某个含 `data-shortcut-context="..."` 的容器内,逐层冒泡查找最 specific 的 context。

### 持久化用户重绑

```ts
// ~/.open-novel/settings.json 内
{
  "deepseekApiKey": "...",
  "keybindings": {
    "chat.cycleMode": ["Tab"],         // 默认值 — 用户没改
    "app.openCommandPalette": ["F1"]    // 用户改为只用 F1
  }
}
```

启动时 merge: `effective = defaultKeys ∪ overrides`。同 id 的 overrides **覆盖** 默认 (而不是追加)。

### 冲突检测

UI 在 SettingsDialog → 快捷键 tab 显示:

```
┌─ 快捷键 ─────────────────────────────────────────────┐
│ 上下文    描述                  当前绑定   默认  操作 │
│ chatbox   切换 Agent 模式        Tab      Tab    [改] │
│ chatbox   反向切换               Shift+Tab Shift+Tab  │
│ chatbox   发送消息               Cmd+Enter Cmd+Enter  │
│ ...                                                  │
│                                                      │
│ ⚠ 冲突: editor.acceptSuggestion 与 chat.cycleMode    │
│        都绑定 Tab — 但上下文不同,实际无冲突         │
│                                                      │
│ [重置全部] [导出] [导入]                              │
└──────────────────────────────────────────────────────┘
```

冲突算法:
- 同 context + 同 key + 不同 id → **真冲突**,红色高亮 + 阻止保存
- 跨 context + 同 key + 不同 id → **软冲突**,黄色提示但允许 (因为上下文区分)

## Tab 在 ChatBox 的特殊处理细节

ChatBox textarea 默认行为是输入字面 `\t`。我们要覆盖:

```tsx
<textarea
  data-shortcut-context="chatbox"
  onKeyDown={(e) => {
    // 不要 stopPropagation — 让全局监听器处理
    // 全局监听器若命中 chat.cycleMode,会 preventDefault
  }}
/>
```

副作用:
- 用户**无法**在 ChatBox 输入字面 tab 字符 (与 ChatGPT/Claude.ai/Cursor 一致)
- 如果用户真要输入代码片段含 tab,他可以在 prompt 里说"以下用 →代表 tab" 或 paste 时保留原 tab

显示反馈:
- 切换瞬间在 ChatBox 上方飘出一个 toast: "已切到 plan 模式"
- 同时 mode toggle UI (3 个按钮组) 自身的高亮也跟着变

## 模式循环逻辑

```ts
// lib/shared/modes.ts
export const MODES = ['discuss', 'plan', 'write'] as const
export type Mode = typeof MODES[number]

export function cycleMode(cur: Mode, reverse = false): Mode {
  const i = MODES.indexOf(cur)
  const next = reverse ? (i - 1 + MODES.length) % MODES.length : (i + 1) % MODES.length
  return MODES[next]
}
```

注意: 模式切换在 await_approval 状态下被状态机阻止 (见 spec/07-mode-state-machine.md)。这种情况下:
- Tab 按下后,Listener 检测到 modeMachine 在 awaitingApproval,**不**触发切换,且显示 toast: "完成审批后才能切模式"
- shortcut handler 内部 guard: `if (modeMachine.matches({...awaitingApproval})) showToast(...);  return`

## 浏览器层冲突

某些键浏览器/操作系统不让我们拦:
- `Cmd+W` (关 tab) — 浏览器抢先,我们的 `tabs.close` 在 Electron / Tauri 包装时才能拦,Web 模式不可靠
- `Cmd+T` (新标签页) — 不可拦
- `Cmd+R` (刷新) — 不可拦
- `Cmd+Q` (退出 app) — 系统级,不可拦

策略:
- 文档 (本文 + Settings UI) 明确告知 web 模式下哪些键不可用
- 二期上 Tauri 桌面壳后,这些键可被拦截
- 默认绑定中**避免**使用这些键作为唯一绑定,提供备选 (e.g. `tabs.close = Cmd+W` 主 + `Cmd+Shift+W` 备)

## 命令面板 (Command Palette)

`Cmd+Shift+P` 打开后,fuzzy search 所有 shortcut 的 description + id:

```
┌─ 命令面板 ────────────────────────────┐
│  🔍 切换                              │
│  > 切换 Agent 模式 (discuss/plan/write)  Tab
│    切换批注                              Cmd+/
│    切换 Console                          Cmd+`
└──────────────────────────────────────┘
```

回车执行该命令的 handler。这是发现性的入口,不必所有功能都背快捷键。

## 测试约束

- 每条快捷键写单元测试: trigger key → assert handler 被调用 + state 改变正确
- 上下文测试: 同一键在 chatbox 命中 A,在 editor 命中 B
- 冲突测试: 重绑产生冲突时禁止保存 + 显示警告
- await_approval guard 测试: 该状态下 Tab 不切模式

## 不做什么

- **不做 chord (多键序列,如 `Cmd+K Cmd+T`)** — POC 简化,所有快捷键单组合
- **不做 leader key 风格 (vim 的 `, w q`)** — 不是网文作者的预期心智
- **不做按住 (long press)**
- **不做手势 (鼠标 / 触控板)** — 二期可加
