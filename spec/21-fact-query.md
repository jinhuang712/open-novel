# Spec 21 — 事实查询工具 (queryFacts)

> 实现 plan/11-knowledge-graph.md L3 工具层第三项。本文档定义 `queryFacts` 工具签名、4 种查询模式、UI 查询面板、Router 在 discuss 模式下的优先调用策略。

## 用途

作者写作时随时会冒出"事实查询"问题:

- "林川 ch_50 时多大?"
- "林川和王小芳关系演变?他们最后一次见面是哪章?"
- "林川以前对女上司说过什么类似的台词?"
- "这本书提过怀表的所有段落?"
- "ch_005 之前所有提到过北京站的段落?"

这些都是**事实查询**,有确定答案,不需要 LLM 创造,直接查 SQLite + paragraph_embeddings 即可。`queryFacts` 工具把这些查询模式标准化,让 Router(discuss 模式)和 UI 查询面板共用。

## 设计原则

1. **不调 LLM** — 4 种核心模式都是 SQL + 向量索引,毫秒响应
2. **结构化输入,LLM 友好输出** — 让 Router 直接拿结果做答(配合短的 wrapping 即可)
3. **结果含引用** — 每条结果带 `sourcePath` + `anchorId`,UI 可点击跳转
4. **Discuss 模式优先级** — Router 收到用户问题先尝试解析为 queryFacts,失败再走自由 LLM

## 4 种查询模式

### 模式 1 — `entity-at`:实体在某章节的状态

```
"林川 ch_50 时多大?"
"王小芳 ch_30 时身份?"
"主角 ch_100 时在哪个城市?"
```

```ts
type EntityAtQuery = {
  kind: 'entity-at'
  entityId: string
  atChapter: string                      // ch_050 (或 'now' = 最新已写章节)
  attribute?: string                     // 不传则返回所有 attribute
}

type EntityAtResult = {
  entityId: string
  canonicalName: string
  atChapter: string
  attributes: Record<string, {
    value: string
    source: string                       // 'frontmatter' | 'narrative' | 'user-edit'
    confidence: number
    sourcePath: string
  }>
}
```

实现:

```ts
async function queryEntityAt(projectId: string, q: EntityAtQuery): Promise<EntityAtResult> {
  const entity = await db.entities.get(projectId, q.entityId)
  if (!entity) throw new ToolValidationError('ENTITY_NOT_FOUND', q.entityId)

  const targetCh = q.atChapter === 'now' ? await getLatestChapter(projectId) : q.atChapter
  const attrs = q.attribute ? [q.attribute] : ALL_ATTRIBUTES

  const result: EntityAtResult = {
    entityId: q.entityId,
    canonicalName: entity.canonical_name,
    atChapter: targetCh,
    attributes: {},
  }

  for (const attr of attrs) {
    const row = await db.execute(`
      SELECT value, source, confidence, declared_in
      FROM entity_timeline
      WHERE entity_id = ? AND attribute = ?
        AND valid_from_chapter <= ?
        AND (valid_to_chapter IS NULL OR valid_to_chapter > ?)
      ORDER BY confidence DESC,
               CASE source WHEN 'user-edit' THEN 0 WHEN 'frontmatter' THEN 1 ELSE 2 END
      LIMIT 1
    `, q.entityId, attr, targetCh, targetCh)
    if (row[0]) result.attributes[attr] = {
      value: row[0].value,
      source: row[0].source,
      confidence: row[0].confidence,
      sourcePath: row[0].declared_in,
    }
  }
  return result
}
```

### 模式 2 — `relations-of`:实体的所有关系

```
"林川的关系图"
"林川 ch_30 时的活跃关系"
"王老板和林川的关系演变"
```

```ts
type RelationsOfQuery = {
  kind: 'relations-of'
  entityId: string
  atChapter?: string                     // 不传 = 全历史时间线
  withEntityId?: string                  // 仅返回与某 entity 的关系
  kinds?: string[]                       // 仅特定 kind (e.g. ['mentor', 'enemy'])
}

type RelationsOfResult = {
  entityId: string
  canonicalName: string
  relations: {
    sourceId: string
    targetId: string
    targetName: string
    kind: string
    sinceChapter?: string
    untilChapter?: string
    strength: number
    summary: string
    evidence: { file: string; anchorId?: string; quote?: string }[]
  }[]
  timeline?: { chapter: string; event: string }[]   // 仅 withEntityId 模式: 关系演变事件序
}
```

实现:

```ts
async function queryRelationsOf(projectId: string, q: RelationsOfQuery): Promise<RelationsOfResult> {
  let sql = `
    SELECT er.*, e2.canonical_name AS target_name
    FROM entity_relations er
    JOIN entities e2 ON er.target_id = e2.id
    WHERE er.source_id = ?
  `
  const args: any[] = [q.entityId]

  if (q.atChapter) {
    sql += ` AND (er.since_chapter IS NULL OR er.since_chapter <= ?)
            AND (er.until_chapter IS NULL OR er.until_chapter > ?) `
    args.push(q.atChapter, q.atChapter)
  }
  if (q.withEntityId) {
    sql += ` AND er.target_id = ? `
    args.push(q.withEntityId)
  }
  if (q.kinds && q.kinds.length > 0) {
    sql += ` AND er.kind IN (${q.kinds.map(() => '?').join(',')}) `
    args.push(...q.kinds)
  }
  sql += ` ORDER BY er.confidence DESC, er.strength DESC `
  const rows = await db.execute(sql, ...args)

  const result: RelationsOfResult = {
    entityId: q.entityId,
    canonicalName: (await db.entities.get(projectId, q.entityId)).canonical_name,
    relations: rows.map(r => ({
      sourceId: r.source_id,
      targetId: r.target_id,
      targetName: r.target_name,
      kind: r.kind,
      sinceChapter: r.since_chapter,
      untilChapter: r.until_chapter,
      strength: r.strength,
      summary: buildRelationSummary(r),
      evidence: [{ file: r.evidence_file, anchorId: r.evidence_anchor, quote: r.evidence_quote }],
    })),
  }

  // 关系演变 timeline: 仅 withEntityId 模式生成
  if (q.withEntityId) {
    const events: { chapter: string; event: string }[] = []
    for (const r of rows) {
      if (r.since_chapter) events.push({ chapter: r.since_chapter, event: `建立 ${r.kind} 关系 (强度 ${r.strength})` })
      if (r.until_chapter) events.push({ chapter: r.until_chapter, event: `${r.kind} 关系结束` })
    }
    events.sort((a, b) => a.chapter.localeCompare(b.chapter))
    result.timeline = events
  }
  return result
}
```

### 模式 3 — `mentions-of`:实体在文中的所有提及

```
"林川在 ch_001-005 内的所有出场段落"
"怀表(item)的所有提及"
"北京站这个地点出现过几次"
```

```ts
type MentionsOfQuery = {
  kind: 'mentions-of'
  entityId: string                       // 或 conceptId (二选一)
  conceptId?: string
  inRange?: { from: string; to: string } // chapter range
  fileGlob?: string                      // 'chapters/*' / 'settings/characters/*'
  limit?: number                         // 默认 50
}

type MentionsOfResult = {
  totalCount: number                     // 完整命中数 (即使有 limit)
  mentions: {
    anchorId: string
    sourcePath: string
    headingPath: string
    snippet: string
    matchedText: string
    intraOffset: number
  }[]
}
```

实现:

```ts
async function queryMentionsOf(projectId: string, q: MentionsOfQuery): Promise<MentionsOfResult> {
  const isEntity = !!q.entityId
  const table = isEntity ? 'entity_refs' : 'concept_refs'
  const fk = isEntity ? 'entity_id' : 'concept_id'
  const targetId = isEntity ? q.entityId : q.conceptId

  let sql = `
    SELECT r.*, pa.heading_path, pa.file_path
    FROM ${table} r
    JOIN paragraph_anchors pa ON r.anchor_id = pa.anchor_id
    WHERE r.${fk} = ? AND pa.deleted_at IS NULL
  `
  const args: any[] = [targetId]

  if (q.fileGlob) { sql += ` AND pa.file_path GLOB ? `; args.push(q.fileGlob) }
  if (q.inRange) {
    sql += ` AND chapter_within_range(pa.file_path, ?, ?) = 1 `
    args.push(q.inRange.from, q.inRange.to)
  }

  // 总数 (count)
  const [countRow] = await db.execute(`SELECT COUNT(*) AS n FROM (${sql})`, ...args)

  // limit 取详情
  sql += ` ORDER BY pa.file_path, r.position_from LIMIT ? `
  args.push(q.limit ?? 50)
  const rows = await db.execute(sql, ...args)

  return {
    totalCount: countRow.n,
    mentions: rows.map(r => ({
      anchorId: r.anchor_id,
      sourcePath: r.file_path,
      headingPath: r.heading_path ?? '',
      snippet: r.snippet,
      matchedText: r.matched_text,
      intraOffset: r.intra_paragraph_offset ?? r.position_from,
    })),
  }
}
```

### 模式 4 — `semantic-search`:语义相似检索

```
"林川以前对女上司说过什么类似台词?"
"和这段类似情绪的段落"
"主角第一次心动的描写"
```

```ts
type SemanticSearchQuery = {
  kind: 'semantic-search'
  text: string                           // 查询自然语言
  topK?: number                          // 默认 10
  filterFile?: string                    // glob
  excludeAnchors?: string[]
  minSimilarity?: number                 // 默认 0.6
}

type SemanticSearchResult = {
  query: string
  results: {
    anchorId: string
    similarity: number
    sourcePath: string
    headingPath: string
    snippet: string
  }[]
}
```

实现:直接调 spec/18 §`semanticSearch`。

## 工具签名

```ts
// lib/agents/tools/query-facts.ts
export const queryFacts = tool({
  description: '事实查询: 实体状态 / 关系 / 提及 / 语义相关。直查索引,不调 LLM',
  inputSchema: z.object({
    query: z.discriminatedUnion('kind', [
      z.object({
        kind: z.literal('entity-at'),
        entityId: z.string(),
        atChapter: z.string(),
        attribute: z.string().optional(),
      }),
      z.object({
        kind: z.literal('relations-of'),
        entityId: z.string(),
        atChapter: z.string().optional(),
        withEntityId: z.string().optional(),
        kinds: z.array(z.string()).optional(),
      }),
      z.object({
        kind: z.literal('mentions-of'),
        entityId: z.string().optional(),
        conceptId: z.string().optional(),
        inRange: z.object({ from: z.string(), to: z.string() }).optional(),
        fileGlob: z.string().optional(),
        limit: z.number().int().min(1).max(200).default(50),
      }).refine(q => q.entityId || q.conceptId, '必须提供 entityId 或 conceptId'),
      z.object({
        kind: z.literal('semantic-search'),
        text: z.string().min(1),
        topK: z.number().int().min(1).max(50).default(10),
        filterFile: z.string().optional(),
        excludeAnchors: z.array(z.string()).optional(),
        minSimilarity: z.number().min(0).max(1).default(0.6),
      }),
    ]),
  }),
  outputSchema: z.discriminatedUnion('kind', [
    /* 4 种结果 schema 各一 */
  ]),
  execute: async ({ query }, { projectId }) => {
    switch (query.kind) {
      case 'entity-at': return { kind: 'entity-at', ...await queryEntityAt(projectId, query) }
      case 'relations-of': return { kind: 'relations-of', ...await queryRelationsOf(projectId, query) }
      case 'mentions-of': return { kind: 'mentions-of', ...await queryMentionsOf(projectId, query) }
      case 'semantic-search': return { kind: 'semantic-search', ...await querySemanticSearch(projectId, query) }
    }
  },
})
```

工具分配 (附录 spec/02):**Router**(discuss 模式)+ **Writer**(写章节时偶尔需要查事实)。

## Router 集成 (Discuss 模式优先级)

Router 收到 discuss 模式问题后,先尝试解析为 queryFacts:

```ts
// lib/agents/router/discuss-handler.ts
export async function handleDiscussMessage(projectId: string, message: string) {
  // 1. 先尝试结构化解析 (规则 + 短 prompt)
  const parsed = await tryParseAsFactQuery(message)
  if (parsed.success) {
    const result = await queryFacts.execute({ query: parsed.query }, { projectId })
    return await formatFactResult(result, message)  // LLM 包装为自然语言回答
  }
  // 2. 失败 → 走自由 LLM
  return await freeFormDiscuss(projectId, message)
}

async function tryParseAsFactQuery(message: string): Promise<{ success: boolean; query?: any }> {
  // 用 LLM Flash 短 prompt 分类 + 抽参数 (200 token 内)
  // 二期可加规则前置匹配 (e.g. "X 几岁" → entity-at + attribute=age)
  const result = await callStructured('flash', `
判定用户问题是否可被以下 4 种模式之一回答 (输出 JSON):
1. entity-at — 某实体在某章节的状态
2. relations-of — 某实体的关系
3. mentions-of — 某实体的所有提及
4. semantic-search — 语义相似的段落

不能 → { "isFactQuery": false }
能 → { "isFactQuery": true, "kind": "...", "params": {...} }

用户问题: ${message}
当前最新章节: ${await getLatestChapter(projectId)}
项目中的实体列表: ${await getEntityListSummary(projectId)}
  `, factQueryParseSchema, { defaults: { isFactQuery: false } })
  return result.isFactQuery ? { success: true, query: result } : { success: false }
}
```

`formatFactResult` 用 Flash 短 prompt 把结构化结果包成自然语言:

```ts
async function formatFactResult(result: any, originalQuestion: string): Promise<string> {
  // 简化: 直接 Markdown 格式拼,不调 LLM (可读性已经足够)
  switch (result.kind) {
    case 'entity-at': return formatEntityAt(result, originalQuestion)
    case 'relations-of': return formatRelationsOf(result, originalQuestion)
    case 'mentions-of': return formatMentionsOf(result, originalQuestion)
    case 'semantic-search': return formatSemanticSearch(result, originalQuestion)
  }
}
```

## UI 查询面板

新增组件 `components/panels/FactQueryPanel.tsx`,通过 `Cmd+K`(命令面板)选 "查询事实" 进入。

```
┌─────────────────────────────────────────┐
│ 查询模式: ◉ 实体状态  ○ 关系  ○ 提及  ○ 语义搜索 │
├─────────────────────────────────────────┤
│ 实体: [林川 ▼]                            │
│ 章节: [ch_050 ▼]                         │
│ 属性: [全部 ▼]                            │
│                                         │
│ [查询]                                   │
├─────────────────────────────────────────┤
│ 结果:                                    │
│  林川 在 ch_050 时:                       │
│    年龄: 31 岁 (来源: ch_045 § 3, 置信 75) │
│    位置: 北京 (来源: frontmatter)         │
│    身份: 副总 (来源: ch_048 § 7, 置信 80)  │
│    [跳转 ch_045 § 3]                      │
└─────────────────────────────────────────┘
```

实现要点:
- 4 个模式独立 form,切换显示对应输入
- 实体下拉走 `db.entities.search` (LIKE,二期换为 fuzzy)
- 章节下拉自动列出该项目所有章节
- 结果区滚动 + 点击 anchorId 跳转编辑器

## 性能目标

| 模式 | 数据规模 | 目标耗时 |
|---|---|---|
| entity-at | 任意 | < 5ms (单行 SQL) |
| relations-of | 50 关系 | < 10ms |
| mentions-of | 1000 命中 | < 30ms (含 limit) |
| semantic-search | 5K 段全扫 | < 100ms (依赖 spec/18 选型) |

LLM 包装(format / parse)单独 ~200-500ms,但用户感知到的是查询本身。

## 与 backlinks 面板对接 (spec/05)

backlinks 面板("被 N 处引用")已有,可重构为 queryFacts mentions-of 的特化 UI。当前不必改,二期统一。

## 不做什么

- **不做 LLM 自由回答** — discuss 模式遇到 fact query 优先走 queryFacts;无法解析才走 LLM。LLM 不应"猜"事实
- **不做跨项目查询** — queryFacts 受 projectId 隔离,与 Memory `resource` 一致
- **不做模糊实体匹配** — entityId 必须精确;模糊匹配走前端的 entity selector + AC trie
- **不做时间轴自动推理** — entity-at 仅查 entity_timeline 已落库的行,不在线推理"林川 ch_50 时多大 = ch_001 时 28 + (50-1) × 时间步长"。这种推理留给 narrative 抽取 Worker 在写章节时落库

## 测试

| 测试 | 类型 | 覆盖 |
|---|---|---|
| `query-entity-at.test.ts` | 集成 | 多 valid 区间、多 source 仲裁、无数据 |
| `query-relations-of.test.ts` | 集成 | atChapter 过滤、withEntityId、kinds 过滤、timeline 演变 |
| `query-mentions-of.test.ts` | 集成 | inRange / fileGlob / limit / totalCount 准确 |
| `query-semantic-search.test.ts` | 集成 | minSimilarity 过滤、excludeAnchors |
| `discuss-handler.test.ts` | 集成 | LLM 解析意图正确率;fallback 到自由 LLM |
| `fact-query-panel.test.tsx` | 组件 | 4 模式 form 切换、实体下拉、结果点击跳转 |

## 已决策项

✅ **Discuss 自由 LLM fallback 路径**: 全部尝试 queryFacts → 解析不成功才走自由 LLM。代价 = 每个 discuss 消息多一次 Flash ~50ms。高频规则匹配模式 (e.g. "X 是谁" / "X 在哪" 等) 后续可加规则前置匹配降本。

✅ **UI 查询面板形态**: Cmd+K → modal 快进快出。理由 = discuss 是低频高价值操作, modal 不占编辑器空间; 右侧固定面板会侵占已经很挤的写作视口 (spec/12 §快捷键已为 Cmd+K 留位)。若用户高频用 (单 session > 20 次), 提供"固定到右侧"开关。
