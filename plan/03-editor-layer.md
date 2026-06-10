# 03 — 编辑器分层

## 目标

- 中文长文排版舒服,接近 Word / Notion 阅读体验
- 支持自动识别"已写就的"角色名、地点名,实体高亮 + Hover preview + 点击跳转
- 装饰器对原始 markdown **零侵入**(不污染文件内容)
- 抽象成 `EditorAdapter`,**未来可换** CodeMirror / Monaco 而业务代码零改动

## 选型

**TipTap 3.x(基于 ProseMirror)** + 自定义 ProseMirror 装饰器 + Aho-Corasick 自动机。SSR 下要求 `useEditor({ ..., immediatelyRender: false })`。

为什么不用 TipTap 的 `Mention` 节点:

- Mention 是 atomic node,会插入显式标记节点,破坏纯文本流
- 我们的需求是**已经写好的名字被自动识别**,不是"打 `@` 召唤选择器"
- ProseMirror 创始人本人推荐这个场景用 `addProseMirrorPlugins` + Decorations

## EditorAdapter 接口

```ts
// lib/editor/adapter.ts
export interface EditorAdapter {
  // 文件操作
  open(filePath: string): Promise<void>
  save(): Promise<void>
  isDirty(): boolean

  // 内容读写
  getContent(): string
  setContent(text: string): void
  getSelection(): { from: number; to: number; text: string } | null
  replaceRange(from: number, to: number, text: string): void

  // 实体装饰
  decorateEntities(entities: Entity[]): void
  clearDecorations(): void

  // 事件
  onSelectionChange(cb: (sel) => void): Unsubscribe
  onEntityClick(cb: (entityId: string, pos: { x: number; y: number }) => void): Unsubscribe
  onEntityHover(cb: (entityId: string, pos: { x: number; y: number }) => void): Unsubscribe
  onContentChange(cb: (content: string) => void): Unsubscribe
}
```

业务代码(Editor 组件、ApprovalCard、框选修改)只与 `EditorAdapter` 交互。换实现只需替换 `lib/editor/tiptap-impl.ts`。

## TipTap 实现要点

### 实体高亮扩展

```ts
// lib/editor/entity-highlight.ts (草案)
export const EntityHighlightExtension = Extension.create({
  name: 'entityHighlight',
  addProseMirrorPlugins() {
    return [
      new Plugin({
        key: new PluginKey('entityHighlight'),
        state: {
          init: (_, { doc }) => buildDecorationSet(doc, getCurrentEntities()),
          apply(tr, old) {
            if (!tr.docChanged && !codexVersionChanged()) return old.map(tr.mapping, tr.doc)
            const dirty = computeDirtyRange(tr)
            return rebuildOnRange(old, tr.doc, dirty, getCurrentEntities())
          },
        },
        props: {
          decorations(state) { return this.getState(state) },
          handleClick(view, pos, ev) {
            const target = ev.target as HTMLElement
            const id = target.dataset.entityId
            if (id) { onEntityClick(id, ev.clientX, ev.clientY); return true }
            return false
          },
        },
      }),
    ]
  },
})
```

### Aho-Corasick 字符串多模式匹配

- 使用 `BrunoRB/ahocorasick`(10KB,纯 JS,浏览器友好)
- Trie 在 Codex(实体表)变更时重建,缓存到 `useRef`
- 单次扫描 O(N + matches),500 实体 + 10K 字 < 5ms
- 中文不分词,匹配后用前后字符黑名单做边界裁剪(如"刘备"后接"军"时仍命中,但"白"单字默认要求显式开启)

### 别名映射

```ts
type Entity = {
  id: string
  canonicalName: string      // "刘备"
  aliases: string[]           // ["玄德", "刘玄德", "皇叔"]
  category: 'character' | 'place' | 'item' | 'org'
  filePath: string            // "characters/liubei.md"
}
```

构建 AC trie 时把 `[canonicalName, ...aliases]` 全部入桶,每个 pattern 反指 `entityId`。点击 / Hover 行为只看 `entityId`,所有别名等价。

### 性能策略

- **增量扫描**:plugin `apply()` 中只对 dirty range 重跑 AC,全文扫描只发生在初次加载与 Codex 变更
- **Worker 兜底**:章节 >30K 字时 AC 扔到 Web Worker,主线程只 apply Decorations
- **debounce**:用户连续输入时 100ms 防抖
- **Codex 变更 debounce 1s**:一次连续创建 5 个角色,trie 仅重建一次(而不是 5 次);详见 [spec/05](../spec/05-entity-highlight.md) §AC trie 重建策略
- **trie 版本号**:entitySetHash 不变就跳过重建

### IME(中文输入法)安全

- TipTap Decoration 重算在 `view.composing === true` 期间**跳过**(仅 mapping 位置,不重新计算 AC)— 避免 composition pending 区间被装饰器穿透导致光标跳 / 字丢
- ChatBox textarea 与 TipTap 同样要求 — 详见 [spec/12](../spec/12-shortcuts.md) §IME 闸门

### 富文本粘贴策略

用户从 Word / 微信 / 网页粘贴带格式段落 → TipTap 默认会保留 HTML 格式,污染纯文本流。策略:TipTap `editor.setOptions({ enablePasteRules: false })` + 自定义 paste handler:

```ts
editorView.props.handleDOMEvents = {
  paste(view, event) {
    const text = event.clipboardData?.getData('text/plain') ?? ''
    if (text) {
      event.preventDefault()
      view.dispatch(view.state.tr.insertText(text))   // 仅插纯文本
      return true
    }
    return false
  },
}
```

例外:粘贴自身(TipTap → TipTap 的内部 paste,如 reorder 段落)走默认 schema-aware 路径,不剥格式。

## Goto Definition UX

| 操作 | 行为 |
|---|---|
| Hover(100ms) | 显示 floating-ui 卡片,展示头像 / 简介 / 关键属性 |
| 点击 | 右栏 split 打开 `characters/{id}.md`(绝不整页跳转,长篇写作丢上下文是致命的) |
| Cmd/Ctrl + Click | 全屏切换到该文件 |
| 右键 | 菜单:"Goto Definition" / "Find References" / "Rename Across Project" |

## Backlinks 面板

打开某个 `characters/X.md` 时,右栏底部显示"被这些章节引用(N)":

- 数据源:`index.db.backlinks` 表
- 索引时机:章节保存时由 worker 离线扫描更新
- 每条带前后 30 字 snippet
- 点击跳到对应章节的对应位置

## 框选修改交互

- 用户在 TipTap 中框选一段文字
- 浮动按钮"让 AI 修改"出现(类似 Notion 的 AI inline)
- 点击 → ChatBox 自动填入 `[选中文字] 修改要求: ___`
- Writer 生成新版 → diff → ApprovalCard(高亮 from/to)
- 同意 → `replaceRange(from, to, newText)`

## 编辑器迁移路径(将来切 CodeMirror / Monaco)

要换编辑器,只需:

1. 写新的 `lib/editor/codemirror-impl.ts` 实现 `EditorAdapter`
2. `lib/editor/index.ts` 切默认导出
3. 业务代码(含 ApprovalCard、框选修改、SearchPanel)零改动

预计成本:3-5 天(主要是装饰器层的迁移,纯文本部分零成本)。

## 关联文档

- **上游**:[plan/01](./01-overview.md) 系统概览 · [plan/07](./07-ui-layout.md) UI 布局
- **核心 spec**:[spec/05](../spec/05-entity-highlight.md) 实体高亮 · [spec/12](../spec/12-shortcuts.md) 快捷键(含 IME 闸门 / @file 引用)

## ADR · 设计决策

| 编号 | 决策 | 选项 | 选择 | 理由 |
|---|---|---|---|---|
| ADR-01 | 编辑器框架 | TipTap 3.x / CodeMirror 6 / Monaco / Slate | **TipTap 3.x** | 中文长文排版最舒服;ProseMirror 底层成熟;装饰器 API 适合实体高亮场景;Monaco 偏代码,Slate API 不稳 |
| ADR-02 | 实体识别方式 | TipTap Mention 节点 / **ProseMirror Decorations + AC trie** | **Decorations + AC trie** | 需求是"已写就的名字自动识别"而非"@ 召唤";Mention atomic node 破坏纯文本流且不能自动识别已有文本 |
| ADR-03 | 抽象 EditorAdapter 接口 | 直接耦合 TipTap / **抽象适配器** | **抽象适配器** | 未来如发现 TipTap 性能瓶颈或社区下沉,可换 CodeMirror 而业务代码零改动;接口稳定的代价是少量样板 |
