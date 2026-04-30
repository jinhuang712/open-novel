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
  const before = text[from - 1] ?? '\n'
  const after = text[to] ?? '\n'

  // 中文场景 — Aho-Corasick 默认输出全部子串匹配。需要白名单边界判定避免误命中:
  // 例: 角色 "李白" 不应命中 "我家的李白菜很好吃"

  // 黑名单: 后接修饰名词扩展 (e.g. "李白菜")
  const SUFFIX_BLOCK = ['菜', '鸟', '花', '草', '酒', '杯', '种']
  if (SUFFIX_BLOCK.includes(after)) return false

  // 黑名单: 前接修饰使其变成另一词 (e.g. "小刘备" 中 "刘备" 仍命中,但若是别名 "备",前接"小"应过滤)
  if (str.length === 1) {
    const PREFIX_BLOCK = ['小', '大', '老', '阿']
    if (PREFIX_BLOCK.includes(before)) return false
  }

  // 白名单: 前接动作 / 标点 / 句首 (强证据是命名实体)
  const PREFIX_OK = ['\n', ' ', '。', ',', '!', '?', ':', '"', '"', '\'',
                     '见', '看', '听', '说', '问', '答', '叫', '是', '与', '和']
  const SUFFIX_OK = ['\n', ' ', '。', ',', '!', '?', ':', '"', '"', '\'',
                     '说', '道', '答', '问', '笑', '想', '的', '在', '又', '却', '是']
  if (PREFIX_OK.includes(before) || SUFFIX_OK.includes(after)) return true

  // 中间情况: 默认放行,但置信度降低 (UI 可显示淡色)
  // 真要严控可改为默认 false。POC 先放行,实测 false-positive 后再调
  return true
}
```

**调优策略**: 上述 PREFIX/SUFFIX 列表是种子。POC W6 期间在 dev console 落一个 `falsePositiveLog` — 用户 hover 标"误识别"按钮,记录 entity + context 入 SQLite (新表 `entity_match_feedback`)。每周回看,迭代列表。

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

参考目标 (W2/W6 期间用 vitest bench 实测填充,见 spec/14-testing.md):

| 章节大小 | 实体数 | AC trie 构建 | AC 全扫耗时 | 增量扫描耗时 |
|---|---|---|---|---|
| 5K 字 | 50 | < 1ms | < 2ms | < 1ms |
| 20K 字 | 200 | < 5ms | < 8ms | < 2ms |
| 50K 字 | 500 | < 15ms | < 25ms | < 3ms (单段变更) |
| 50K 字 | 500 | — | (Worker 兜底) | < 5ms 主线程 |

**W2 末尾必须跑** 一次基准 (`tests/unit/ahocorasick.bench.ts`),把数据填回此表。文档不允许长期留"待实测"。

## AC trie 重建策略 (新增)

> audit 发现:`BrunoRB/ahocorasick` 不支持增量插入。每改一个角色都要全量重建 trie + 全文重扫,**写设定模式下 Validator cascade 的 reindex 会触发数十次重建**。

**降损策略**:

1. **Codex 变更 debounce 1s**: 用户连续创建/编辑实体时,1s 内的多次"Codex 变了"事件合并为一次重建
2. **trie 版本号**: `entityHighlightPlugin` 缓存当前 trie 与对应 entitySetHash;Codex 事件携带新 hash,plugin 比对 hash 不变就不重建
3. **per-章节 trie 缓存** (W6 优化): 当前章节正文 hash + entity set hash → 计算结果 cache;打开历史章节直接复用
4. **Worker 兜底**: 章节 >30K 字时 trie 构建 + 全扫扔到 Web Worker (主线程仅 apply Decorations);<30K 主线程同步跑 (避免 Worker 通讯开销)

如果 W6 实测发现重建仍是瓶颈,**升级路径**: fork BrunoRB/ahocorasick 加入 `addPattern(pattern)` 增量插入 (Aho-Corasick 算法本身支持增量,只是该库 API 没暴露;扩展约 50 行代码)。

## IME (中文输入法) 安全 (新增)

> audit 发现两个 IME 相关坑,都对中文用户致命:
>
> 1. ChatBox textarea 中 IME 候选窗口活跃时按 Tab — 直接 preventDefault 切模式会破坏 IME 翻页
> 2. TipTap Decoration 重算与 IME composition 重叠时,Decoration 的 from/to 可能落在 composition pending 区间,导致光标跳或字丢

### ChatBox Tab 处理

ShortcutListener 在每次 `keydown` 中先检查:

```ts
function onKeyDown(e: KeyboardEvent) {
  if (e.isComposing || e.keyCode === 229) return    // ← IME composing,放行原生行为
  // 后续走 normal shortcut 解析
}
```

`isComposing` 是 W3C 标准属性,所有现代浏览器支持。`keyCode === 229` 是 Chrome/Edge 在某些情况的兜底。

### TipTap Decoration 重算

`entityHighlightPlugin.apply(tr, old)` 中:

```ts
apply(tr, old, _oldState, newState) {
  // 跳过 IME composition 中的中间状态 — Decoration 重算等到 composition 结束再做
  // ProseMirror EditorView 提供 view.composing 属性
  const view = (newState as any).editorViewRef?.current   // 通过 EditorAdapter 注入
  if (view?.composing) return old.map(tr.mapping, tr.doc)  // 仅 map 位置,不重新计算

  // 后续走 normal increment / rebuild 路径
}
```

`compositionend` 事件触发时 plugin 会自动收到一个新 transaction,届时再做完整 update。

### 单测覆盖 (spec/14)

- `shortcuts.test.ts`: composing=true 时 Tab 不切模式
- `entity-highlight.test.ts`: composing 期间 Decoration 不重算 + composition 结束后重算正确

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
