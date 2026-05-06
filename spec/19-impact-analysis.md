# Spec 19 — 影响半径与 Cascade 工具 (analyzeImpact)

> 实现 plan/11-knowledge-graph.md L2 算法层第三项 + L3 工具层第一项。本文档定义影响半径计算器 (纯 SQL,不调 LLM)、`analyzeImpact` 工具签名、LLM 二次过滤流程、递归 cascade 终止条件。

## 设计原则

1. **影响候选必须由 SQL 出**,不靠 LLM 现场推。漏 SQL 索引 = bug,不应用 LLM "猜"补救
2. **LLM 仅做"是不是真受影响"的二次判断**,不做"找哪些段受影响"的一次发现
3. **递归 cascade 必须有终止条件**,且 metric 是"影响半径单调下降"
4. **置信度全程透传**,UI 据此分级显示

## 工作链路 (取代 plan/06 §解决方案)

> ⚠ **关键交互模型**: 整个 cascade 递归在 **审批之前** 的内部循环里完成。Writer 生成主修改 (in-memory),`analyzeImpact` 内部递归 ≤3 层把所有 cascade proposal 算清楚,**汇总成一个 ChangeSet 一次审**。用户审完后才落盘。任何"先落盘 → 再触发 cascade"或"逐项 ApprovalCard"的设计都是错的。

```
Writer agent 出主修改 (in-memory)
   ↓
Validator agent execute → 调 analyzeImpact 工具,传入 main delta
   ↓
[analyzeImpact 内部递归循环]
   │
   ├ 第 1 轮 (轮次记 round=1, weightFloor=30):
   │   step 1: extractSemanticDelta(main delta) — LLM Flash 抽结构化 delta
   │            (entity-attribute / relation-add / concept-add / paragraph-rewrite ...)
   │   step 2: computeImpactRadius — 纯 SQL 出候选段集 (weight ≥ 30)
   │            - entity_refs / concept_refs (weight=100)
   │            - 关系上下游 1 跳 (weight=50-90)
   │            - dependencies 锚点上下游 (weight=70)
   │            - timeline 区间内引用 (weight=80)
   │            - embeddings 语义相关 topK (weight=cos×100)
   │   step 3: filterByLLM — Pro 批 5 段 → ChangeProposal[round=1]
   │
   ├ Writer 内部短调用: 对每条 needsChange=true 的 proposal 生成 afterText (in-memory)
   │
   ├ 第 2 轮 (round=2, weightFloor=60):
   │   step 1: extractSemanticDelta(round=1 的 afterText 集合) — 把这些当作新 delta
   │   step 2: computeImpactRadius — 必须严格收缩 (候选 ⊆ 第 1 轮剩余)
   │   step 3: filterByLLM → ChangeProposal[round=2]
   │
   ├ Writer 内部短调用 (round=2 afterText)
   │
   ├ 第 3 轮 (round=3, weightFloor=90)... 同上
   │
   └ 终止 — 任一条件成立即停:
        a. 候选段集为空
        b. 半径未严格收缩 (currSet 不是 prevSet 子集 / |currSet| ≥ |prevSet|)
        c. round = 3
   │
   ↓
汇总 ChangeSet:
   - 主修改 (cascadeLevel=0,Writer 原始输出)
   - 第 1 轮 ChangeProposal[] (cascadeLevel=1)
   - 第 2 轮 ChangeProposal[] (cascadeLevel=2)
   - 第 3 轮 ChangeProposal[] (cascadeLevel=3)
   - 影响图谱 (节点 = entity / file / concept,边 = 影响传播,标 cascadeLevel)
   ↓
analyzeImpact 工具返回 → Validator agent 把 ChangeSet 提交给 ApprovalCard
   ↓
**一次** ApprovalCard 呈现整批 (见 spec/06):
   用户勾选 + 一键同意 / 部分同意 / 拒绝
   ↓
用户 approve → POST /api/approvals/{id}/resolve
   ↓
后端 transaction 一次落盘所有 accepted 文件
   ↓
落盘副作用 (差量 reindex / snapshot / history group / Reflector;见 plan/04)
```

**Writer 内部短调用** 是新加的概念 — 它不走完整的 chat / streaming,直接调 Writer agent 的 generate 模式 (无审批,因为产物只在内存),输入 `(原 anchor 文本, proposal.proposedText 或 LLM 第 3 步给的修改建议)`,输出 `afterText`。这次调用本身**不**触发任何工具(包括嵌套 analyzeImpact),纯文本生成,~1-3s。

## Step 1 — Semantic Delta 抽取

```ts
// lib/impact/delta-extractor.ts
export type SemanticDelta =
  | { kind: 'entity-attribute'; entityId: string; attribute: string; before: string; after: string }
  | { kind: 'entity-relation-add'; sourceId: string; targetId: string; relKind: string; since?: string }
  | { kind: 'entity-relation-remove'; sourceId: string; targetId: string; relKind: string }
  | { kind: 'entity-timeline-update'; entityId: string; attribute: string; valid: { from: string; to?: string }; before: string; after: string }
  | { kind: 'concept-add'; conceptId: string; semantic: string; surfaceForms: string[] }
  | { kind: 'concept-remove'; conceptId: string }
  | { kind: 'concept-semantic-change'; conceptId: string; before: string; after: string }
  | { kind: 'paragraph-rewrite'; anchorId: string; beforeText: string; afterText: string }
  | { kind: 'frontmatter-other'; entityId: string; field: string; before: any; after: any }

export async function extractSemanticDelta(
  projectId: string,
  filePath: string,
  before: string,
  after: string,
): Promise<SemanticDelta[]> {
  // 1. frontmatter diff
  const beforeFm = parseFrontmatter(before)
  const afterFm = parseFrontmatter(after)
  const deltas: SemanticDelta[] = []

  // 1a. 普通字段
  for (const [key, beforeVal] of Object.entries(beforeFm)) {
    if (afterFm[key] !== beforeVal) {
      // 已知字段 → 映射到 entity-attribute
      if (key === 'gender' || key === 'role' || key === 'expected_arc' || ...) {
        deltas.push({ kind: 'entity-attribute', entityId: beforeFm.id, attribute: key, before: beforeVal, after: afterFm[key] })
      } else {
        deltas.push({ kind: 'frontmatter-other', entityId: beforeFm.id, field: key, before: beforeVal, after: afterFm[key] })
      }
    }
  }

  // 1b. relations 数组 diff (add/remove/update)
  const beforeRels = beforeFm.relations ?? []
  const afterRels = afterFm.relations ?? []
  for (const newRel of afterRels) {
    const exist = beforeRels.find(r => r.kind === newRel.kind && r.target === newRel.target)
    if (!exist) deltas.push({ kind: 'entity-relation-add', ... })
  }
  for (const oldRel of beforeRels) {
    const stillExist = afterRels.find(r => r.kind === oldRel.kind && r.target === oldRel.target)
    if (!stillExist) deltas.push({ kind: 'entity-relation-remove', ... })
  }

  // 1c. initial_state 字段 diff → entity-timeline-update
  // ... 类似处理

  // 2. 正文 diff (worldview/rules.md → 概念变化)
  if (filePath.includes('worldview/rules.md') || filePath.includes('worldview/')) {
    // 调 LLM Flash 抽 concepts delta (与 spec/16 §概念抽取流程类似,但作 delta 比较)
    const beforeConcepts = await extractConceptsFromText(before)
    const afterConcepts = await extractConceptsFromText(after)
    deltas.push(...diffConcepts(beforeConcepts, afterConcepts))
  }

  // 3. 章节正文 diff → paragraph-rewrite (按 spec/17 anchor diff 结果)
  if (filePath.startsWith('chapters/')) {
    const anchorDiff = await diffAnchors(beforeRows, afterParagraphs)
    for (const m of anchorDiff.modified) {
      deltas.push({ kind: 'paragraph-rewrite', anchorId: m.old.anchor_id, beforeText: m.old.text, afterText: m.new.text })
    }
    // rewritten 同等
  }

  return deltas
}
```

`extractConceptsFromText` 调用 spec/16 §concept-extractor prompt,但短 prompt 化(只问"列举此文中所有硬规则",不问 diff)。然后在 JS 层比对前后两次抽取结果。

### LLM 介入策略

POC 阶段:
- frontmatter / relations / initial_state diff: **不调 LLM**,纯结构化 diff
- 正文 → concepts diff: **调 LLM Flash**(必要,因为概念是从自然语言抽出来的)
- 正文 → paragraph diff: 不调 LLM(用 anchor diff)

## Step 2 — SQL 影响半径

```ts
// lib/impact/radius.ts
export type ImpactRadius = {
  candidateAnchors: { anchorId: string; reason: string; weight: number }[]
  affectedFiles: { filePath: string; reason: string }[]
  affectedEntities: { entityId: string; reason: string }[]
  graph: ImpactGraph                     // 节点 + 边,UI 可视化
}

export async function computeImpactRadius(
  projectId: string,
  deltas: SemanticDelta[],
): Promise<ImpactRadius> {
  const candidates: { anchorId: string; reason: string; weight: number }[] = []

  for (const d of deltas) {
    switch (d.kind) {
      case 'entity-attribute': {
        // 直接受影响: 所有 entity_refs 该 entity
        const refs = await db.execute(`
          SELECT er.anchor_id, er.snippet, pa.file_path
          FROM entity_refs er
          JOIN paragraph_anchors pa ON er.anchor_id = pa.anchor_id
          WHERE er.entity_id = ? AND pa.deleted_at IS NULL
        `, d.entityId)
        for (const r of refs) {
          candidates.push({ anchorId: r.anchor_id, reason: `提及 ${d.entityId} 的 ${d.attribute}`, weight: 100 })
        }

        // 间接受影响: 该 entity 的关系上下游 (1 跳)
        if (d.attribute === 'gender' || d.attribute === 'role' || d.attribute === 'name') {
          const relPartners = await db.execute(`
            SELECT DISTINCT target_id AS partner FROM entity_relations WHERE source_id = ?
            UNION
            SELECT DISTINCT source_id AS partner FROM entity_relations WHERE target_id = ?
          `, d.entityId, d.entityId)
          for (const p of relPartners) {
            const partnerRefs = await db.execute(`
              SELECT er.anchor_id FROM entity_refs er
              JOIN paragraph_anchors pa ON er.anchor_id = pa.anchor_id
              WHERE er.entity_id = ? AND pa.deleted_at IS NULL
            `, p.partner)
            for (const r of partnerRefs) {
              candidates.push({ anchorId: r.anchor_id, reason: `${d.entityId} 的关系方 ${p.partner}`, weight: 50 })
            }
          }
        }
        break
      }

      case 'entity-relation-add':
      case 'entity-relation-remove': {
        // 直接受影响: 两端 entity 同时出现的段
        const sql = `
          SELECT er1.anchor_id FROM entity_refs er1
          JOIN entity_refs er2 ON er1.anchor_id = er2.anchor_id
          JOIN paragraph_anchors pa ON er1.anchor_id = pa.anchor_id
          WHERE er1.entity_id = ? AND er2.entity_id = ? AND pa.deleted_at IS NULL
        `
        const refs = await db.execute(sql, d.sourceId, d.targetId)
        for (const r of refs) {
          candidates.push({ anchorId: r.anchor_id, reason: `${d.sourceId} 和 ${d.targetId} 同段`, weight: 90 })
        }
        break
      }

      case 'concept-add':
      case 'concept-semantic-change': {
        // 直接受影响: 表面词命中的所有段 (concept_refs)
        const refs = await db.execute(`
          SELECT cr.anchor_id, cr.snippet FROM concept_refs cr
          JOIN paragraph_anchors pa ON cr.anchor_id = pa.anchor_id
          WHERE cr.concept_id = ? AND pa.deleted_at IS NULL
        `, d.conceptId)
        for (const r of refs) {
          candidates.push({ anchorId: r.anchor_id, reason: `命中概念 ${d.conceptId}`, weight: 95 })
        }
        // 若新增 concept 是 'absent' 语义 (e.g. "无手机") → 命中的段全部 violation,需重写
        if (d.kind === 'concept-add' && d.semantic === 'absent') {
          // ... 自动 mark is_violation = 1 (在 reindex 时已做,这里不重复)
        }
        break
      }

      case 'concept-remove': {
        // 该 concept 的 concept_refs 全部失效 → 但段本身不需重写,只是 lint 提示
        // 不加 candidate
        break
      }

      case 'entity-timeline-update': {
        // 受影响: 该 entity 在 valid 区间内的所有 entity_refs
        const refs = await db.execute(`
          SELECT er.anchor_id, pa.file_path FROM entity_refs er
          JOIN paragraph_anchors pa ON er.anchor_id = pa.anchor_id
          WHERE er.entity_id = ? AND pa.deleted_at IS NULL
            AND pa.file_path GLOB 'chapters/*'
            AND chapter_within_range(pa.file_path, ?, ?)
        `, d.entityId, d.valid.from, d.valid.to ?? 'ch_zzz')
        for (const r of refs) {
          candidates.push({ anchorId: r.anchor_id, reason: `${d.entityId}.${d.attribute} 在该章节区间变化`, weight: 80 })
        }
        break
      }

      case 'paragraph-rewrite': {
        // 受影响: 依赖此段的 dependencies 上下游
        const deps = await db.execute(`
          SELECT * FROM dependencies
          WHERE (source_anchor = ? OR target_anchor = ?)
            AND status IN ('pending', 'planted', 'paid-off')
        `, d.anchorId, d.anchorId)
        for (const dep of deps) {
          const otherAnchor = dep.source_anchor === d.anchorId ? dep.target_anchor : dep.source_anchor
          candidates.push({ anchorId: otherAnchor, reason: `dependency ${dep.kind} #${dep.id}`, weight: 70 })
        }

        // 若是章节段,后续章节里相同 entity 的近 N 段也是候选 (语义连续性)
        // → 用 embeddings.semanticSearch (spec/18) 取 topK
        if (await isChapterAnchor(projectId, d.anchorId)) {
          const semantic = await semanticSearch(projectId, d.afterText, { topK: 5, excludeAnchors: [d.anchorId] })
          for (const s of semantic) {
            candidates.push({ anchorId: s.anchorId, reason: `语义相关 (cosine ${s.similarity.toFixed(2)})`, weight: Math.round(s.similarity * 100) })
          }
        }
        break
      }

      // ... 其他 kind 类似
    }
  }

  // 去重 + 合并 (同 anchor 的多 reason 合一,weight 取 max)
  const merged = new Map<string, { anchorId: string; reason: string; weight: number }>()
  for (const c of candidates) {
    const exist = merged.get(c.anchorId)
    if (!exist || exist.weight < c.weight) merged.set(c.anchorId, c)
  }

  const sortedCandidates = Array.from(merged.values()).sort((a, b) => b.weight - a.weight)

  return {
    candidateAnchors: sortedCandidates,
    affectedFiles: ...,
    affectedEntities: ...,
    graph: buildImpactGraph(deltas, sortedCandidates),
  }
}
```

### 章节区间 helper

```ts
// SQL 中没有直接支持,在 lib 层提供
function chapter_within_range(filePath: string, from: string, to: string): boolean {
  // 'chapters/050-XX/draft.md' → '050'
  // from = 'ch_010' → '010', to = 'ch_080' → '080'
  const match = filePath.match(/chapters\/(\d{3})-/)
  if (!match) return false
  const ord = match[1]
  const fromOrd = from.replace(/[^\d]/g, '').padStart(3, '0')
  const toOrd = to.replace(/[^\d]/g, '').padStart(3, '0')
  return ord >= fromOrd && ord <= toOrd
}

// 注册为 SQLite custom function (better-sqlite3 / LibSQL 都支持)
db.function('chapter_within_range', chapter_within_range)
```

### Weight 语义

- `weight = 100` 必查(直接 entity 提及 / 同段 relation / 概念表面词命中)
- `weight = 70-95` 高优先(关系上下游 / dependencies / timeline 区间)
- `weight = 30-70` 中优先(语义相关)
- `weight < 30` POC 阶段不进入 LLM filter(降本)

LLM filter 的输入按 weight 降序,**最多 50 个候选段**(POC 上限,防止 LLM 过载)。超出的按 weight 排序后裁剪,UI 提示"还有 X 段未审"。

## Step 3 — LLM 二次过滤

```ts
// lib/impact/llm-filter.ts
export async function filterByLLM(
  projectId: string,
  deltas: SemanticDelta[],
  candidates: { anchorId: string; reason: string; weight: number }[],
): Promise<ChangeProposal[]> {
  // 单 prompt 处理多个候选,降本
  const proposals: ChangeProposal[] = []
  const batches = chunk(candidates, 5)         // 每 5 段一批喂 LLM Pro

  for (const batch of batches) {
    const anchorTexts = await Promise.all(batch.map(c => fetchAnchorText(projectId, c.anchorId)))
    const prompt = renderPrompt('lib/impact/prompts/filter.md', {
      deltas, candidates: batch.map((c, i) => ({ ...c, text: anchorTexts[i] })),
    })

    const response = await callStructured('pro', prompt, changeProposalBatchSchema, {
      defaults: { proposals: [] },
    })
    proposals.push(...response.proposals)
  }

  return proposals
}

const changeProposalBatchSchema = z.object({
  proposals: z.array(z.object({
    anchorId: z.string(),
    targetFile: z.string(),
    needsChange: z.boolean(),
    proposedText: z.string().optional(),
    reason: z.string(),
    confidence: z.enum(['high', 'medium', 'low']),
  })),
})
```

### filter prompt (`lib/impact/prompts/filter.md`)

```markdown
你是 Open Novel 影响过滤器。任务:对一组**候选受影响段**,判定每段是否真的需要改写,并给出建议。

# 设定改动 (semantic delta)
{{#deltas}}
- {{kind}}: {{summary}}
{{/deltas}}

# 候选段 (按相关性排序)
{{#candidates}}
## #{{i}} ({{reason}}, weight={{weight}})
File: {{anchorId}} ({{filePath}})
Text:
"""
{{text}}
"""
{{/candidates}}

# 输出
JSON:
{
  "proposals": [
    {
      "anchorId": "anc_xxx",
      "targetFile": "...",
      "needsChange": true,
      "proposedText": "...",
      "reason": "为什么这段需要改 — 引用 delta 第 N 条",
      "confidence": "high"
    },
    {
      "anchorId": "anc_yyy",
      "needsChange": false,
      "reason": "虽然命中关键词,但语境是反讽,无需改",
      "confidence": "high"
    }
  ]
}

# 严格规则
- needsChange=false 也必须给 reason (作者审计需要解释)
- proposedText 仅在 needsChange=true 时给
- 若不确定,confidence='low' 并给保守的 proposedText
- 不要超出 deltas 描述的改动范围 (e.g. 改 lin.gender 时不要顺带改其他无关属性)
```

## Step 4 — 输出最终 ChangeSet + 影响图谱

`analyzeImpact` 工具的最终返回 (内部 ≤3 轮递归后汇总):

```ts
type AnalyzeImpactResult = {
  proposals: ChangeProposal[]            // 全 cascade 层级合并 (cascadeLevel: 1 / 2 / 3)
  graph: {
    nodes: { id: string; kind: 'entity' | 'file' | 'concept'; label: string; cascadeLevel: number }[]
    edges: { from: string; to: string; kind: 'ref' | 'relation' | 'concept' | 'dep'; weight: number; cascadeLevel: number }[]
  }
  metadata: {
    rounds: number                       // 实际跑了几轮 (1-3)
    totalCandidatesPerRound: number[]    // 每轮候选段数,递减序
    filteredByLLM: number                // 累计 needsChange=false
    droppedByWeight: number              // 累计 weight < weightFloor 未送 LLM
    terminationReason: 'depth-limit' | 'no-candidates' | 'no-shrink' | 'no-needs-change'
  }
}
```

UI 在 ApprovalCard 顶部展示影响图 (Mermaid graph / reactflow),用 cascadeLevel 着色 (主修改红 / 一级橙 / 二级黄 / 三级浅黄),作者一眼看到"这次改动逐层辐射到哪些 entity / 文件"。

## 工具签名 (注册到 spec/02 工具集)

```ts
// lib/agents/tools/analyze-impact.ts
export const analyzeImpact = tool({
  description: '分析一次 setting / 章节改动的影响范围,返回 ChangeProposal[] 与影响图谱',
  inputSchema: z.object({
    filePath: z.string(),
    before: z.string(),                  // 旧内容 (含 frontmatter)
    after: z.string(),                   // 新内容
  }),
  outputSchema: analyzeImpactResultSchema,
  execute: async ({ filePath, before, after }, { projectId }) => {
    // 路径 safePath
    const safe = safeFromProjectRoot(projectId, filePath)
    // step 1: extract initial semantic delta
    const initialDelta = await extractSemanticDelta(projectId, filePath, before, after)
    // step 2-4: 内部递归 (≤3 轮) 出全部 cascade level 的 proposals
    const allProposals = await runCascadeRecursion(projectId, initialDelta)
    const graph = buildImpactGraph(initialDelta, allProposals)
    return {
      proposals: allProposals,
      graph,
      metadata: { /* rounds / totalCandidatesPerRound / ... */ },
    }
  },
})
```

工具分配 (附录 spec/02 §工具分配):**Validator**。其他 agent 不得调用。

## 递归 Cascade 终止条件 (在 analyzeImpact 内部循环中)

> 注: 递归发生在 analyzeImpact 工具的**单次调用**内部,不是用户跨多个 ApprovalCard 的多次审批。用户只看到一次 ApprovalCard,内部已经迭代到稳态。

```
analyzeImpact 工具入口 (传入 main delta)
   ↓
round = 1, weightFloor = 30
   ↓
loop:
   computeImpactRadius(weightFloor) → 出候选
   if 候选空: break
   filterByLLM(候选) → ChangeProposal[round]
   if needsChange=true 的 proposal 数 = 0: break (LLM 判全部不需要改)
   Writer 内部短调用 → 各 proposal 生成 afterText (in-memory)
   round += 1
   if round > 3: break
   weightFloor += 30                              # 30 → 60 → 90
   nextDelta = 把 afterText 集合算成 paragraph-rewrite + concept-* delta
   if 半径不严格收缩 (currSet 不是 prevSet 子集 / |currSet| ≥ |prevSet|): break
   delta = nextDelta; continue
```

**实现伪码**:

```ts
async function runCascadeRecursion(
  projectId: string,
  initialDelta: SemanticDelta[],
): Promise<ChangeProposal[]> {
  let allProposals: ChangeProposal[] = []
  let currentDelta = initialDelta
  let prevCandidateSet: Set<string> | null = null
  let weightFloor = 30

  for (let round = 1; round <= 3; round++) {
    const radius = await computeImpactRadius(projectId, currentDelta, { weightFloor })
    if (radius.candidateAnchors.length === 0) break

    // 半径单调收缩检查 (round ≥ 2)
    const currSet = new Set(radius.candidateAnchors.map(c => c.anchorId))
    if (prevCandidateSet) {
      if (currSet.size >= prevCandidateSet.size) break       // 没收缩
      for (const id of currSet) {
        if (!prevCandidateSet.has(id)) {                     // 出现新段
          // 半径破坏单调性 — 停 (不能让系统不停发散)
          return allProposals
        }
      }
    }
    prevCandidateSet = currSet

    const proposals = await filterByLLM(projectId, currentDelta, radius.candidateAnchors)
    const toRewrite = proposals.filter(p => p.needsChange)
    if (toRewrite.length === 0) break                        // 全判不需要改

    proposals.forEach(p => p.cascadeLevel = round)
    allProposals.push(...proposals)

    // Writer 内部短调用 (生成 afterText) — 这次调用不带任何 tool
    const afterTexts = await Promise.all(toRewrite.map(p =>
      writerInternalRewrite(projectId, p.anchorId, p.proposedText)
    ))

    // 把这些 afterText 转为下一轮 delta
    currentDelta = afterTexts.map((text, i) => ({
      kind: 'paragraph-rewrite',
      anchorId: toRewrite[i].anchorId,
      beforeText: '...',  // 已存在内容
      afterText: text,
    }))

    weightFloor += 30
  }

  return allProposals
}
```

**Writer 内部短调用 `writerInternalRewrite`**: 调用 Writer agent 的 generate 模式 (无 tool,无审批),输入 `(原 anchor 文本 + proposedText 提示)`,输出最终 afterText。~1-3s 单段。

**UI 显示进度**: ApprovalCard 出现前的"分析中"页面显示"正在分析影响范围...
- 第 1 轮: 找到 N 段候选,LLM 过滤中...
- 第 2 轮: N 段二级 cascade,LLM 过滤中...
- 第 3 轮: N 段三级 cascade
- 完成: 整批 K 段 ChangeSet 准备就绪 [查看]"

用户**不能干预内部循环**(无法"在第 2 轮就提前 approve"),只能等汇总完整批审。如果用户耐心不足,可在 SettingsDialog 调"递归深度上限"= 1 / 2 / 3 (默认 3)。

## 取代 plan/06 §性能考虑

- ❌ 旧:"按章节范围 ±5 章" — 已删 (治标策略,本 spec 取代)
- ❌ 旧:"基于 entity hash 的'已审过'标记" — 已无意义,LLM 二次过滤本就只对未审过段调用
- ❌ 旧:"章节级 word_count + entity_count diff 短路" — 改为按 anchor diff 短路 (无段变化即跳过)

## L4 治理 — Cascade Audit

每次 analyzeImpact 调用记录到新表:

```sql
CREATE TABLE cascade_audits (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  project_id TEXT NOT NULL,
  triggered_by_approval_id INTEGER NOT NULL,
  parent_audit_id INTEGER,                          -- 递归层级
  total_candidates INTEGER NOT NULL,
  filtered_by_llm INTEGER NOT NULL,
  proposals_count INTEGER NOT NULL,
  llm_token_cost INTEGER,                           -- 累计 (Pro tokens)
  duration_ms INTEGER NOT NULL,
  graph_json TEXT NOT NULL,                         -- 完整影响图,审计 / 复盘用
  created_at TEXT NOT NULL,
  FOREIGN KEY (parent_audit_id) REFERENCES cascade_audits(id)
);
CREATE INDEX idx_cascade_project ON cascade_audits(project_id, created_at DESC);
```

UI: SettingsDialog → "Cascade 历史"显示每次 cascade 的影响图、proposals 数、用户接受率。Reflector 输入也包括 cascade_audits 数据 (用户拒绝某 proposal 时,提炼"这种类型的 cascade 用户倾向 / 不倾向接受")。

## 测试

| 测试 | 类型 | 覆盖 |
|---|---|---|
| `delta-extractor.test.ts` | 单元 | frontmatter diff / relations diff / paragraph-rewrite diff 各 case |
| `impact-radius.test.ts` | 集成 | 各 delta kind 的 SQL 查询命中预期段 |
| `impact-radius-edge.test.ts` | 单元 | 关系上下游、章节区间、语义相关边界 |
| `llm-filter.test.ts` | golden | 给 fixture deltas + 候选,验 LLM 输出稳定 |
| `cascade-recursion.test.ts` | 集成 | 三层递归终止;循环候选检测 |
| `cascade-audit.test.ts` | 集成 | cascade_audits 落库正确 |
