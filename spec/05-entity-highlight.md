# Spec 05 — 实体高亮与跳转

## 数据流

```
project.{ /settings, /chapters/* } 改动
   ↓
Worker 重扫 frontmatter & 正文
   ↓
upsert entities + references (index.db)
   ↓
广播 'entities:changed' 事件
   ↓
Editor 重新构建 AC trie + 触发 plugin update
   ↓
Decorations 增量刷新
```

## AC trie 构建

```ts
// lib/editor/aho-corasick.ts
import AhoCorasick from 'ahocorasick'

type EntityIndex = Map<string, Entity>  // canonical+alias → Entity

export function buildAC(entities: Entity[]): { ac: AhoCorasick; index: EntityIndex } {
  const patterns: string[] = []
  const index: EntityIndex = new Map()
  for (const e of entities) {
    for (const name of [e.canonicalName, ...e.aliases]) {
      if (!isViableMatch(name)) continue  // 过滤单字别名等高风险 pattern
      patterns.push(name)
      index.set(name, e)
    }
  }
  return { ac: new AhoCorasick(patterns), index }
}

function isViableMatch(name: string): boolean {
  // 过滤单字 (除非用户在 entity 上勾选 forceMatch)
  if (name.length < 2) return false
  return true
}
```

## 边界裁剪 (中文场景)

`BrunoRB/ahocorasick` 默认输出所有重叠匹配。需要后处理:

```ts
type Match = { from: number; to: number; entityId: string }

function postProcess(text: string, rawMatches: AcMatch[], index: EntityIndex): Match[] {
  // 1. 转成 [from, to] (AC 给的是 [endIndex, [matchedStrs]])
  const flat = rawMatches.flatMap(([endIdx, strs]) =>
    strs.map(s => ({ from: endIdx - s.length + 1, to: endIdx + 1, str: s }))
  )
  
  // 2. 边界检查: 命中前后字符
  const filtered = flat.filter(m => isCleanBoundary(text, m.from, m.to, m.str))
  
  // 3. 重叠裁剪: 优先保留更长的匹配
  filtered.sort((a, b) => (b.to - b.from) - (a.to - a.from))
  const taken: Match[] = []
  for (const m of filtered) {
    if (!overlaps(taken, m)) {
      taken.push({ from: m.from, to: m.to, entityId: index.get(m.str)!.id })
    }
  }
  
  return taken.sort((a, b) => a.from - b.from)
}

function isCleanBoundary(text: string, from: number, to: number, str: string): boolean {
  const before = text[from - 1]
  const after = text[to]
  // 名字前接动作词 (如 "见到刘备说") 通常 ok
  // 名字后接修饰 (如 "刘备的") 也 ok
  // 但若 name="刘" 单字而上下文是 "刘氏" 则要排除 — 由 isViableMatch 上游过滤
  return true  // 当前实现宽松,后续按需收紧
}
```

## ProseMirror Plugin 集成

```ts
// lib/editor/entity-highlight.ts
import { Plugin, PluginKey } from 'prosemirror-state'
import { Decoration, DecorationSet } from 'prosemirror-view'

const key = new PluginKey<DecorationSet>('entityHighlight')

export function entityHighlightPlugin(getEntities: () => Entity[]) {
  return new Plugin({
    key,
    state: {
      init(_, { doc }) {
        return computeDecorations(doc, getEntities())
      },
      apply(tr, old, _oldState, newState) {
        const codexChanged = tr.getMeta('codexChanged')
        if (codexChanged) return computeDecorations(tr.doc, getEntities())
        if (!tr.docChanged) return old
        // 增量: 映射旧装饰 + 重扫 dirty range
        const mapped = old.map(tr.mapping, tr.doc)
        const dirty = computeDirtyRange(tr)
        return updateInRange(mapped, tr.doc, dirty, getEntities())
      },
    },
    props: {
      decorations(state) { return key.getState(state) },
      handleDOMEvents: {
        click(view, ev) {
          const target = ev.target as HTMLElement
          const id = target?.dataset?.entityId
          if (id) {
            const rect = target.getBoundingClientRect()
            window.dispatchEvent(new CustomEvent('entity:click', {
              detail: { id, x: rect.left, y: rect.bottom },
            }))
            return true
          }
          return false
        },
        mouseover(view, ev) {
          const target = ev.target as HTMLElement
          const id = target?.dataset?.entityId
          if (id) scheduleHover(id, ev.clientX, ev.clientY)
          return false
        },
      },
    },
  })
}

function computeDecorations(doc, entities) {
  const text = doc.textContent
  const { ac, index } = buildAC(entities)
  const matches = postProcess(text, ac.search(text), index)
  
  // 把字符 offset 转成 ProseMirror position
  // (TipTap 默认每段都是 paragraph,每段开头 +1 偏移)
  const decos = matches.map(m => {
    const { from, to } = textToPmPos(doc, m.from, m.to)
    return Decoration.inline(from, to, {
      class: `entity-mention entity-${index.get(m.str)?.category}`,
      'data-entity-id': m.entityId,
    })
  })
  
  return DecorationSet.create(doc, decos)
}
```

## 性能数据

参考目标 (实测后填充):

| 章节大小 | 实体数 | AC 全扫耗时 | 增量扫描耗时 |
|---|---|---|---|
| 5K 字 | 50 | < 2ms | < 1ms |
| 20K 字 | 200 | < 8ms | < 2ms |
| 50K 字 | 500 | < 25ms | < 3ms (单段变更) |
| 50K 字 | 500 | (Worker 兜底) | < 5ms 主线程 |

## Hover 卡片

```tsx
// components/editor/HoverCard.tsx
export function EntityHoverCard({ entityId, anchorPos }) {
  const entity = useEntity(entityId)  // SWR/react-query
  if (!entity) return null
  return (
    <Floating anchor={anchorPos}>
      <div className="entity-hover-card">
        <div className="header">
          <span className="category-badge">{entity.category}</span>
          <span className="name">{entity.canonicalName}</span>
          {entity.aliases.length > 0 && <span className="aliases">({entity.aliases.join(', ')})</span>}
        </div>
        <p className="summary">{entity.metadata.summary || entity.metadata.background?.slice(0, 80)}</p>
        <button onClick={() => gotoFile(entity.filePath)}>打开 →</button>
      </div>
    </Floating>
  )
}
```

延迟 100ms 出现,移开 200ms 消失。

## Goto Definition 行为

```ts
function gotoFile(filePath: string, modifier?: 'cmd' | 'shift') {
  if (modifier === 'cmd') openInFullscreen(filePath)
  else openInRightSplit(filePath)
}
```

`openInRightSplit` 在 Tabs 区域右栏新增一个 tab,主编辑区不动。这是与 VSCode 的"Go to Definition"(默认是同栏) 的关键差异 — 长篇写作要保留上下文。

## Backlinks 面板

`components/panels/BacklinksPanel.tsx`:

```tsx
export function BacklinksPanel({ filePath }) {
  const { data } = useSWR(`/api/backlinks?file=${filePath}`, fetcher)
  return (
    <div className="backlinks-panel">
      <h3>被 {data?.length ?? 0} 处引用</h3>
      {data?.map(bl => (
        <div key={bl.id} className="backlink-row" onClick={() => goto(bl.source_file, bl.position)}>
          <div className="source">{bl.source_section}</div>
          <div className="snippet">...{bl.snippet}...</div>
        </div>
      ))}
    </div>
  )
}
```

## 重命名实体 (Rename Refactor)

右键实体 → "Rename Across Project":
1. 弹输入框,输入新名
2. 后端: 把 entities.canonicalName 改了
3. 用 references 表找出所有需要替换的位置
4. 生成 batch ApprovalCard,逐文件展示 diff
5. 用户批准后逐个写盘

## 自动从正文抽取新角色 (二期)

打开方式: 右键正文 → "标记为角色" → 弹角色创建对话框,自动填充类型/canonical name/category。

更激进版本 (二期): NER 自动检测正文中"未登记"的人名,在状态栏提示"发现 3 个未登记角色,是否登记?"。
