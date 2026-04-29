# Spec 02 — Agent 工具签名与契约

所有工具用 AI SDK 的 `tool()` 定义 + Zod schema 校验。带审批的工具 `needsApproval: true`。

## 公共 Context

每次工具调用都会注入 `executionContext`:

```ts
type ExecutionContext = {
  projectId: string                   // 当前项目
  sessionId: string                   // 当前会话
  agent: string                       // 调用方 (writer/checker/...)
  mode: 'discuss' | 'plan' | 'write'  // 当前模式
}
```

## 文件读取工具

### `readSetting`

```ts
export const readSetting = tool({
  description: '读取一个设定文件 (worldview/outline/character/place 等)',
  inputSchema: z.object({
    path: z.string().describe('相对于项目 settings/ 的路径,例如 characters/lin.md'),
  }),
  execute: async ({ path }, { projectId }) => {
    const content = await fs.readFile(`${ws(projectId)}/settings/${path}`, 'utf8')
    return { path, content }  // 含 frontmatter
  },
})
```

### `listSettings`

```ts
export const listSettings = tool({
  description: '列出所有设定文件',
  inputSchema: z.object({
    category: z.enum(['all', 'character', 'place', 'worldview', 'outline']).default('all'),
  }),
  execute: async ({ category }, { projectId }) => {
    return { files: await db.entities.list(projectId, category) }
  },
})
```

### `readChapter`

```ts
export const readChapter = tool({
  description: '读取一个章节文件',
  inputSchema: z.object({
    chapterId: z.string(),
    section: z.enum(['outline', 'draft']).default('draft'),
  }),
  execute: async ({ chapterId, section }, { projectId }) => {
    const path = `${ws(projectId)}/chapters/${resolveChapterDir(chapterId)}/${section}.md`
    return { content: await fs.readFile(path, 'utf8') }
  },
})
```

### `searchEntities`

```ts
export const searchEntities = tool({
  description: '搜索实体 (按名字模糊匹配)',
  inputSchema: z.object({
    query: z.string(),
    category: z.enum(['all', 'character', 'place']).default('all'),
  }),
  execute: async ({ query, category }, { projectId }) => {
    return { results: await db.entities.search(projectId, query, category) }
  },
})
```

## 文件写入工具 (带审批)

### `writeSetting`

```ts
export const writeSetting = tool({
  description: '将一个设定文件写入磁盘 (创建或覆盖)。需用户审批。',
  inputSchema: z.object({
    path: z.string().describe('相对于项目 settings/ 的路径'),
    content: z.string().describe('完整文件内容,含 YAML frontmatter'),
    reason: z.string().describe('改动原因 (用于审批 UI 与历史记录)'),
  }),
  needsApproval: true,
  execute: async ({ path, content, reason }, { projectId, agent }) => {
    const target = `${ws(projectId)}/settings/${path}`
    const before = await tryReadFile(target)
    await fs.writeFile(target, content)
    await db.history.add(projectId, {
      action: 'write_setting',
      target: `settings/${path}`,
      before, after: content, reason, agent,
    })
    await reindex(projectId, target)
    return { ok: true, path }
  },
})
```

### `writeChapter`

```ts
export const writeChapter = tool({
  description: '将一个章节文件写入磁盘。需用户审批。',
  inputSchema: z.object({
    chapterId: z.string(),
    section: z.enum(['outline', 'draft']),
    content: z.string(),
    reason: z.string(),
  }),
  needsApproval: true,
  execute: async ({ chapterId, section, content, reason }, { projectId, agent }) => {
    const dir = resolveChapterDir(chapterId)
    const target = `${ws(projectId)}/chapters/${dir}/${section}.md`
    const before = await tryReadFile(target)
    await fs.writeFile(target, content)
    await db.history.add(projectId, {
      action: 'write_chapter',
      target: `chapters/${dir}/${section}.md`,
      before, after: content, reason, agent,
    })
    await reindex(projectId, target)
    return { ok: true, chapterId }
  },
})
```

### `proposeChanges` (Validator 用)

```ts
export const proposeChanges = tool({
  description: 'Validator 提议一组 cascade 修改 (不直接落盘,会与主审批一同呈现)',
  inputSchema: z.object({
    changes: z.array(z.object({
      targetFile: z.string(),
      from: z.number(),
      to: z.number(),
      currentText: z.string(),
      proposedText: z.string(),
      reason: z.string(),
      confidence: z.enum(['high', 'medium', 'low']).default('medium'),
    })),
  }),
  execute: async ({ changes }) => {
    return { changes }  // 直接回流,Router 会把它收进 ApprovalCard
  },
})
```

## 联网工具 (POC Mock)

### `webSearch` (mock)

```ts
export const webSearch = tool({
  description: '联网搜索 (POC 阶段返回 mock 数据,不要依赖结果)',
  inputSchema: z.object({
    query: z.string(),
    lang: z.enum(['zh', 'en']).default('zh'),
  }),
  execute: async ({ query, lang }) => ({
    notice: 'POC 阶段未接入真实搜索,返回占位结果',
    results: [
      { title: `[mock] ${query}`, url: 'https://example.com/1', snippet: '占位摘要 1...' },
      { title: `[mock] ${query} 相关`, url: 'https://example.com/2', snippet: '占位摘要 2...' },
    ],
  }),
})
```

### `webFetch` (mock)

```ts
export const webFetch = tool({
  description: '抓取一个 URL 的主体内容 (POC 阶段 mock)',
  inputSchema: z.object({ url: z.string().url() }),
  execute: async ({ url }) => ({
    notice: 'POC 阶段未接入真实抓取',
    title: '[mock]', text: '占位内容...',
  }),
})
```

## 学习工具

### `recordLearning`

```ts
export const recordLearning = tool({
  description: '记录从本轮交互中提炼的经验',
  inputSchema: z.object({
    learnings: z.array(z.object({
      scope: z.enum(['project', 'global']).default('project'),
      insight: z.string(),
      evidence: z.string().optional(),
      applicable_agents: z.array(z.enum(['router', 'writer', 'checker', 'validator', 'humanizer'])),
    })),
  }),
  execute: async ({ learnings }, { projectId }) => {
    for (const l of learnings) await db.learnings.add(projectId, l)
    return { ok: true, count: learnings.length }
  },
})
```

## 审批历史读取 (Reflector 用)

### `readApprovalHistory`

```ts
export const readApprovalHistory = tool({
  description: '读取最近 N 条审批记录',
  inputSchema: z.object({ limit: z.number().min(1).max(50).default(10) }),
  execute: async ({ limit }, { projectId }) => {
    return { approvals: await db.approvals.recent(projectId, limit) }
  },
})
```

## 工具分配

每个 Agent 拥有的工具集 (在 Agent 定义里 `tools: { ... }` 注入):

| Agent | readSetting | listSettings | readChapter | searchEntities | writeSetting | writeChapter | proposeChanges | webSearch | webFetch | recordLearning | readApprovalHistory |
|---|---|---|---|---|---|---|---|---|---|---|---|
| Router | ✓ | ✓ | ✓ | ✓ | | | | | | | |
| Writer | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | | ✓ | ✓ | | |
| Checker | | ✓ | ✓ | | | | | | | | |
| Validator | ✓ | ✓ | ✓ | ✓ | | | ✓ | | | | |
| Reflector | | | | | | | | | | ✓ | ✓ |
| Humanizer | ✓ | | ✓ | | | ✓ | | | | | |

## 模式约束

Router 在每次调用前 assert `(agent, mode, tool)` 三元组合法:

```ts
function assertAllowed(agent, mode, tool) {
  if (mode === 'discuss' && WRITE_TOOLS.includes(tool)) throw new Error('discuss 模式禁止写入')
  if (mode === 'plan' && tool === 'writeChapter') throw new Error('plan 模式禁止写章节')
  if (mode === 'write' && tool === 'writeSetting') throw new Error('write 模式禁止改设定')
}
```
