# 03 — 编辑器分层

## 目标

- 中文长文排版舒服,接近 Word/Notion 阅读体验
- 支持自动识别"已写就的"角色名、地点名,实体高亮 + Hover preview + 点击跳转
- 装饰器对原始 markdown **零侵入** (不污染文件内容)
- 抽象成 `EditorAdapter`,**未来可换** CodeMirror / Monaco 而业务代码零改动

## 选型

**TipTap 3.x (基于 ProseMirror)** + 自定义 ProseMirror 装饰器 + Aho-Corasick 自动机。

> 历史注: 早期文档草稿写的是 "TipTap 2.x",但 W2 调研发现 2026-04 现状下稳定版已是 3.16.x。我们使用的 API (`useEditor` / `EditorContent` / `addProseMirrorPlugins` / Decorations) 在 v2/v3 间二进制兼容,本节描述对两版均适用。在 v3 下需要额外注意 SSR: 必须 `useEditor({ ..., immediatelyRender: false })`。

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

业务代码 (Editor 组件、ApprovalCard、框选修改) 只与 `EditorAdapter` 交互。换实现只需替换 `lib/editor/tiptap-impl.ts`。

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

- 使用 `BrunoRB/ahocorasick` (10KB,纯 JS,浏览器友好)
- Trie 在 Codex (实体表) 变更时重建,缓存到 `useRef`
- 单次扫描 O(N + matches),500 实体 + 10K 字 < 5ms
- 中文不分词,匹配后用前后字符黑名单做边界裁剪 (如"刘备" 后接"军" 时仍命中,但 "白" 单字默认要求显式开启)

### 别名映射

实体表结构:

```ts
type Entity = {
  id: string
  canonicalName: string      // "刘备"
  aliases: string[]           // ["玄德", "刘玄德", "皇叔"]
  category: 'character' | 'place' | 'item' | 'org'
  filePath: string            // "characters/liubei.md"
}
```

构建 AC trie 时把 `[canonicalName, ...aliases]` 全部入桶,每个 pattern 反指 `entityId`。点击/Hover 行为只看 `entityId`,所有别名等价。

### 性能策略

- **增量扫描**: plugin `apply()` 中只对 dirty range 重跑 AC,全文扫描只发生在初次加载与 Codex 变更
- **Worker 兜底**: 章节 >50K 字时 AC 扔到 Web Worker,主线程只 apply Decorations
- **debounce**: 用户连续输入时 100ms 防抖

## Goto Definition UX

| 操作 | 行为 |
|---|---|
| Hover (100ms) | 显示 floating-ui 卡片,展示头像/简介/关键属性 |
| 点击 | 右栏 split 打开 `characters/{id}.md` (绝不整页跳转,长篇写作丢上下文是致命的) |
| Cmd/Ctrl + Click | 全屏切换到该文件 |
| 右键 | 菜单: "Goto Definition" / "Find References" / "Rename Across Project" |

## Backlinks 面板

打开某个 `characters/X.md` 时,右栏底部显示"被这些章节引用 (N)":

- 数据源: `index.db.backlinks` 表
- 索引时机: 章节保存时由 Worker 离线扫描更新
- 每条带前后 30 字 snippet
- 点击跳到对应章节的对应位置

## 框选修改交互

- 用户在 TipTap 中框选一段文字
- 浮动按钮 "让 AI 修改" 出现 (类似 Notion 的 AI inline)
- 点击 → ChatBox 自动填入 `[选中文字] 修改要求: ___`
- Writer 生成新版 → diff → ApprovalCard (高亮 from/to)
- 同意 → `replaceRange(from, to, newText)`

## 编辑器迁移路径 (将来切 CodeMirror/Monaco)

要换编辑器,只需:
1. 写新的 `lib/editor/codemirror-impl.ts` 实现 `EditorAdapter`
2. `lib/editor/index.ts` 切默认导出
3. 业务代码 (含 ApprovalCard、框选修改、SearchPanel) 零改动

预计成本: 3-5 天 (主要是装饰器层的迁移,纯文本部分零成本)。
