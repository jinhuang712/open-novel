# Spec 01 — 存储 Schema

## 文件系统约定

> **W7 升级**: settings/ 目录大幅拆分,详见 plan/04 §存储位置 + plan/11-knowledge-graph.md。本节只列顶层结构,详细子目录看 plan/04。

```
~/.open-novel/
├── runtime.db                        # Mastra Memory 跨项目会话
├── settings.json                     # 全局设置 (API key 等)
├── .snapshots/{projectId}/{ts}/      # 设定快照 (见 spec/16 §Snapshot)
└── workspaces/
    └── {projectId}/                  # projectId = `proj_{slug}_{shortId}` (e.g. proj_zhongsheng_a3f2)
        ├── project.json
        ├── settings/                 # 详细子目录见 plan/04 §存储位置
        │   ├── worldview/            # 拆目录 (geography/history/politics/economy/technology/culture/religion/rules)
        │   ├── outline/              # 拆目录 (master + volumes/* + chapter-outlines/_registry)
        │   ├── characters/{id}.md
        │   ├── factions/{id}.md
        │   ├── organizations/{id}.md
        │   ├── locations/{regions,cities,buildings,landmarks}/{id}.md
        │   ├── items/{id}.md
        │   ├── events/{id}.md
        │   ├── timeline/{era,story-clock,character-ages}.md
        │   ├── relationships/{_matrix.md, notes/{id}.md}    # _matrix.md 为派生
        │   ├── story-lines/{main.md, subplots/{id}.md}
        │   ├── foreshadowing/{id}.md
        │   ├── chapter-arcs/{id}.md
        │   ├── power-system/{overview,tiers,techniques,artifacts}.md
        │   ├── glossary/_index.md
        │   ├── beats.md
        │   ├── taboos.md
        │   ├── themes.md
        │   └── reader-promises.md
        ├── chapters/
        │   └── {NNN-{slug}}/
        │       ├── outline.md
        │       ├── draft.md
        │       └── meta.json
        ├── index.db                  # SQLite per-project (基础 + 知识图谱表,见下)
        └── trace/
            └── {YYYY-MM-DD}-{sessionId}.jsonl
```

文件命名规则:
- `projectId`: 5-32 字符,`/^proj_[a-z0-9-]{1,24}_[a-f0-9]{4}$/`
- 角色 id: `char_{slug}_{shortId}`,e.g. `char_lin_a3f2`
- 地点 id: `place_{slug}_{shortId}`
- 章节目录: `{order:3pad}-{slug}`,e.g. `001-zhongsheng-na-yi-ye`

slug 由 LLM 生成 (不超过 8 个字符的拼音/英文,fallback 到 hash 前 6 位)。

## frontmatter 公共字段

所有 markdown 文件必须有:

```yaml
---
id: <唯一 id>
type: worldview | outline | beats | character | place | chapter
created_at: ISO 8601
updated_at: ISO 8601
source: writer-agent | user-edit | imported
---
```

## 各类型 frontmatter Schema

### project.json (非 markdown,JSON)

```ts
type Project = {
  id: string                          // proj_xxx_yyyy
  name: string                        // 显示名
  slug: string
  genre: string                       // 都市重生 / 末世修仙 / ...
  style: string                       // 自然语言描述,LLM 生成时遵守
  agentPersonality: string            // Agent 性格
  exampleCorpusFiles?: string[]       // 范文路径 (相对于项目根)
  models: {
    router: 'flash' | 'pro'           // 默认 flash
    writer: 'flash' | 'pro'           // 默认 pro
    checker: 'flash' | 'pro'          // 默认 flash
    validator: 'flash' | 'pro'        // 默认 pro
    reflector: 'flash' | 'pro'        // 默认 flash
    humanizer: 'flash' | 'pro'        // 默认 pro
  }
  createdAt: string
  updatedAt: string
}
```

### Character (`settings/characters/{id}.md`)

> **W7 升级 (\_schemaVersion 1 → 2)**: 加 initial_state / relations / reader_promises / taboos 字段,age 移入 initial_state。完整 zod 见 spec/16 §character.md frontmatter 升级。

```yaml
---
id: char_lin_a3f2
type: character
canonical_name: 林川
aliases: ["川哥", "林总"]
gender: male | female | other | unknown
role: protagonist | support | antagonist | extra
appearance: 短文字描述
personality: 短文字描述
background: 短文字描述
expected_arc: 短文字描述

# === 新增字段 (W7) ===
initial_state:                          # 故事开头的 snapshot,作为 entity_timeline 第一行
  age: 28
  location: place_beijing_2010
  status: alive
  affiliation: org_xxx
  power_level: null
  wealth: middle
  social_rank: commoner
relations:                              # 静态/初始关系,reindex → entity_relations 表 (source='frontmatter')
  - kind: mentor
    target: char_zhang_b1c4
    since: ch_005
    strength: 80
  - kind: enemy
    target: char_wang_c2d3
    strength: 80
reader_promises:                        # 已对读者立的旗 (与 reader-promises.md 双锚)
  - "最终打败王老板"
  - "和林雪有情人终成眷属"
taboos:                                 # 角色级禁区 (Validator lint 用)
  - "绝不主动伤害无辜"
derived: false                          # 派生文件标 true,UI 锁写
_schemaVersion: 2

created_at: 2026-04-29T10:00:00+08:00
updated_at: 2026-04-29T11:30:00+08:00
source: writer-agent
---

# 林川

## 性格
...

## 背景
...
```

### Worldview / Outline / Beats

```yaml
---
id: world_main
type: worldview
title: 2010 年北京互联网圈
created_at: ...
updated_at: ...
source: writer-agent
---

正文...
```

### Chapter Draft (`chapters/{NNN-XX}/draft.md`)

```yaml
---
id: ch_001
type: chapter
order: 1
title: 重生那一夜
word_count: 3247
status: draft | reviewed | published
referenced_entities: ["char_lin_a3f2", "place_beijing_2010"]
created_at: ...
updated_at: ...
source: writer-agent
---

# 第一章 重生那一夜

林川猛地从床上坐起来...
```

## SQLite Schema (`index.db` per-project)

### entities

```sql
CREATE TABLE entities (
  id TEXT PRIMARY KEY,                -- char_lin_a3f2
  canonical_name TEXT NOT NULL,
  aliases TEXT NOT NULL DEFAULT '[]', -- JSON array
  category TEXT NOT NULL,             -- character | place | item | org
  file_path TEXT NOT NULL,            -- relative to project root
  metadata TEXT,                      -- JSON: gender/age/role/...
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);
CREATE INDEX idx_entities_category ON entities(category);
CREATE INDEX idx_entities_canonical ON entities(canonical_name);
```

### entity_refs (实体在何处被提及)

> ⚠ **历史命名修正**: 早期文档草稿里用 `references` — `REFERENCES` 是 SQL 保留字,建表时不加引号会语法错误。统一改为 `entity_refs`。所有 plan/spec 文档中提到此表的位置都已同步。

```sql
CREATE TABLE entity_refs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  entity_id TEXT NOT NULL,
  source_file TEXT NOT NULL,          -- chapters/001-XX/draft.md
  position_from INTEGER NOT NULL,     -- 字符 offset
  position_to INTEGER NOT NULL,
  matched_text TEXT NOT NULL,         -- 实际匹配的别名 ("玄德")
  snippet TEXT NOT NULL,              -- 前后 30 字
  created_at TEXT NOT NULL,
  FOREIGN KEY (entity_id) REFERENCES entities(id) ON DELETE CASCADE,
  UNIQUE(entity_id, source_file, position_from)   -- 防重复扫描入库
);
CREATE INDEX idx_refs_entity ON entity_refs(entity_id);
CREATE INDEX idx_refs_source ON entity_refs(source_file);
```

### backlinks (反向索引,在某文件打开时用)

```sql
CREATE TABLE backlinks (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  target_file TEXT NOT NULL,          -- characters/lin.md (被引用的文件)
  source_file TEXT NOT NULL,          -- chapters/001-XX/draft.md
  source_section TEXT,                -- e.g. "第一章 § 段落 3"
  position_from INTEGER NOT NULL,     -- 与 entity_refs.position_from 对齐
  snippet TEXT NOT NULL,
  created_at TEXT NOT NULL,
  UNIQUE(target_file, source_file, position_from)   -- dedupe 同一位置
);
CREATE INDEX idx_back_target ON backlinks(target_file);
```

UI 显示"被 N 处引用"时按 `source_file` group 计数,而不是 row count。

### history

```sql
CREATE TABLE history (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  action TEXT NOT NULL,               -- write_setting | write_chapter | rename | delete
  target TEXT NOT NULL,               -- file path
  before BLOB,                        -- gzip 后的二进制 (BLOB,非 TEXT;TEXT 存二进制 SQLite 解码会乱)
  after BLOB,
  encoding TEXT NOT NULL DEFAULT 'gzip-utf8',   -- 解释 BLOB 的编码;后续可加 'plain-utf8'
  reason TEXT,                        -- Agent 提供的理由
  agent TEXT,                         -- writer | humanizer | user-edit
  approval_id INTEGER,                -- 关联 approvals.id
  created_at TEXT NOT NULL
);
CREATE INDEX idx_history_target ON history(target);
```

**写策略**:
- 文件 ≤ 4KB: `encoding='plain-utf8'` (跳过 gzip 开销)
- 文件 > 4KB: `encoding='gzip-utf8'`,落 gzip 后字节流
- index.db 体积超 100MB 时,启动 prune Worker 把 90 天前的 history 导出到 `archive/history-{YYYY-MM}.jsonl.gz` 后删表行

### learnings

```sql
CREATE TABLE learnings (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  scope TEXT NOT NULL,                -- project | global | chapter:001
  insight TEXT NOT NULL,
  evidence TEXT,
  applicable_agents TEXT NOT NULL,    -- JSON array
  weight REAL NOT NULL DEFAULT 1.0,
  hit_count INTEGER NOT NULL DEFAULT 0,
  last_hit_at TEXT,
  created_at TEXT NOT NULL
);
CREATE INDEX idx_learnings_scope ON learnings(scope);
```

### approvals

```sql
CREATE TABLE approvals (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  tool_call_id TEXT NOT NULL UNIQUE,
  agent TEXT NOT NULL,
  tool_name TEXT NOT NULL,
  payload TEXT NOT NULL,              -- JSON
  diff TEXT,                          -- pre-rendered diff for audit
  status TEXT NOT NULL,               -- pending | approved | rejected | edited
  user_feedback TEXT,                 -- 拒绝时的反馈
  decided_at TEXT,
  created_at TEXT NOT NULL
);
CREATE INDEX idx_approvals_status ON approvals(status);
```

### traces (流式日志归档,可选 ingest 自 JSONL)

```sql
CREATE TABLE traces (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  session_id TEXT NOT NULL,
  ts TEXT NOT NULL,
  agent TEXT,
  kind TEXT NOT NULL,                 -- text-delta | tool-call | tool-result | reasoning | finish
  content TEXT NOT NULL               -- JSON
);
CREATE INDEX idx_traces_session ON traces(session_id);
```

## 索引刷新流程

每次 `writeSetting` / `writeChapter` 落盘后异步执行:

1. 解析 frontmatter → upsert 到 `entities` (若 type ∈ {character, place, item, org})
2. 解析正文 → 用 AC trie 扫所有实体 → 重写 `references` (DELETE + INSERT for source_file)
3. 用 references 推导 backlinks (反向)
4. 写一条 `history` 记录

整个过程在 Worker 中执行,不阻塞 UI。

## 数据迁移

未来 schema 变更时:
- `index.db` 启动时检查 `PRAGMA user_version`,小于当前版本则跑迁移脚本
- 迁移脚本放在 `lib/storage/migrations/{NNN}-{name}.ts`,**只允许向前**;不写回退脚本 (POC 简化,代价低于双向维护)
- 启动时按 `user_version` 顺序串行跑所有 pending migration,跑完一条 `PRAGMA user_version = N+1`
- markdown frontmatter 变更时,Worker 启动时扫一遍批量升级 (有版本不变性 — frontmatter 字段 `_schemaVersion: 1` 决定走哪个升级路径)
- 用户开启时若发现 `index.db` 存在但 schema 比当前代码版本**更新** (作者降级了 app),弹错并 refuse 启动该项目;不做静默"读一半"

## frontmatter Zod Schema 强制 (新增)

> audit 发现:目前各 .md 的 frontmatter 字段只在文档中描述,没有运行时校验。用户外部编辑器写 `gender: 男` 而非 `male`,下游 ArcTracker / Validator 处理这个不一致没规则。

`lib/storage/frontmatter-schema.ts`:

```ts
import { z } from 'zod'

const isoDate = z.string().datetime({ offset: true })

export const characterFrontmatter = z.object({
  id: z.string().regex(/^char_[a-z0-9-]{1,24}_[a-f0-9]{4}$/),
  type: z.literal('character'),
  canonical_name: z.string().min(1).max(20),
  aliases: z.array(z.string().min(1).max(20)).default([]),
  gender: z.enum(['male', 'female', 'other', 'unknown']).default('unknown'),
  age: z.number().int().min(0).max(200).optional(),
  role: z.enum(['protagonist', 'support', 'antagonist', 'extra']).default('extra'),
  appearance: z.string().max(500).optional(),
  personality: z.string().max(500).optional(),
  background: z.string().max(2000).optional(),
  expected_arc: z.string().max(1000).optional(),
  created_at: isoDate,
  updated_at: isoDate,
  source: z.enum(['writer-agent', 'user-edit', 'imported']),
  _schemaVersion: z.literal(1).default(1),
})

export const worldviewFrontmatter = z.object({ /* ... */ })
export const chapterFrontmatter = z.object({ /* ... */ })
// 等
```

**读策略**:
- 读 .md 时,frontmatter 走 zod `safeParse`
- 失败时不抛 — 进入 `degraded` 模式,UI 角标提示"frontmatter 格式异常,部分功能受限",同时落一条 `history` 记录文件被读出来时的真实 frontmatter 副本
- 用户主动点 "修复" → 弹一个表单,把异常字段引导用户改正,然后 writeSetting 落盘

**写策略**: 任何 writeSetting/writeChapter 在落盘前 `parse` (非 safeParse) — 失败立刻拒绝,绝不让坏数据落盘

## 文件编码归一化 (新增)

> audit 发现:.md 文件 BOM / CRLF/LF / 编码处理完全没规范。用户在 Windows 外部编辑后回写带 BOM 或 CRLF — frontmatter 解析失败 / Aho-Corasick offset 偏移 (CR 占 1 字节) / diff 全红。

`lib/storage/text.ts`:

```ts
export function normalizeForRead(raw: Buffer | string): string {
  let s = typeof raw === 'string' ? raw : raw.toString('utf8')
  // 1. 剥 BOM
  if (s.charCodeAt(0) === 0xFEFF) s = s.slice(1)
  // 2. CRLF / CR → LF
  s = s.replace(/\r\n/g, '\n').replace(/\r/g, '\n')
  return s
}

export function normalizeForWrite(content: string): string {
  // 1. 不写 BOM
  let s = content.startsWith('﻿') ? content.slice(1) : content
  // 2. 强制 LF
  s = s.replace(/\r\n/g, '\n').replace(/\r/g, '\n')
  // 3. 末尾保留单个 \n (POSIX 习惯)
  if (!s.endsWith('\n')) s += '\n'
  return s
}
```

所有 `readSetting / readChapter / fs.readFile` 包装层调 `normalizeForRead`,所有 `writeSetting / writeChapter` 调 `normalizeForWrite`。**UTF-8 之外的编码 (GB2312 / GBK) 一律 reject** — POC 阶段不支持,避免复杂度。检测到非 UTF-8 时 UI 提示用户先在外部转码。

## SQLite WAL Mode + 并发写 (新增)

> audit 发现:多 Agent 并行 reindex 时未指定隔离级别,同时 5 个 cascade 并发各自 trigger reindex 会导致 SQLite 写锁竞争。

每次打开 `index.db` 时:

```ts
db.exec(`
  PRAGMA journal_mode = WAL;        -- LibSQL 默认即 WAL,显式声明保险
  PRAGMA synchronous = NORMAL;      -- WAL 下 NORMAL 已足够安全
  PRAGMA foreign_keys = ON;
  PRAGMA busy_timeout = 5000;       -- 写锁竞争时等 5s
`)
```

**Worker 单例模式**: 所有 reindex / history insert 走同一个 Worker 单线程 (`lib/storage/reindex-worker.ts`),不允许两个 reindex 并发同一项目。Worker 内部用队列串行,避免 PRAGMA busy_timeout 真正触发。

## LibSQL 连接池 (新增)

> audit 发现:每项目独立 `index.db`,用户切项目时旧 DB 连接释放策略未定。Node FD ulimit 256,同时打开 5 个项目就贴边。

`lib/storage/db-pool.ts`:

```ts
import { LRUCache } from 'lru-cache'
import { createClient } from '@libsql/client'

const pool = new LRUCache<string, ReturnType<typeof createClient>>({
  max: 3,                                   // 同时最多 3 个项目活跃
  dispose: (client) => client.close(),     // LRU 淘汰时关闭连接
  ttl: 1000 * 60 * 30,                     // 30min idle 后淘汰
})

export function getDb(projectId: string) {
  let client = pool.get(projectId)
  if (!client) {
    const url = `file:${path.join(getProjectDir(projectId), 'index.db')}`
    client = createClient({ url })
    pool.set(projectId, client)
  }
  return client
}

export async function closeAll() {
  for (const c of pool.values()) await c.close()
  pool.clear()
}
```

**项目切换时**: 显式调 `pool.delete(oldProjectId)` + `pool.get(newProjectId)`。**项目删除时**: `pool.delete()` 后再删目录。

## 知识图谱表 (W7 新增,完整 schema 见 spec/16-18)

> 实现 plan/11-knowledge-graph.md L1 数据层。本节仅占位列出表名 + 用途,完整 SQL / index / FK / 迁移见对应 spec。

| 表名 | 定义 spec | 用途 |
|---|---|---|
| `entity_relations` | spec/16 §表 1 | 双向语义关系 (师徒 / 敌友 / 上下级 / ...) |
| `entity_timeline` | spec/16 §表 2 | 角色随章节变化的属性 (age / location / mood / ...) |
| `concepts` | spec/16 §表 3 | worldview 硬规则当作 pseudo-entity |
| `concept_refs` | spec/16 §表 4 | 概念表面词在文中的提及索引 (与 entity_refs 对称) |
| `dependencies` | spec/16 §表 5 | 跨文件 / 跨设定显式锚定 (foreshadowing / payoff / callback / ...) |
| `paragraph_anchors` | spec/16 §表 6 + spec/17 | 段级稳定 ID + 邻接双链 |
| `paragraph_embeddings` | spec/16 §表 7 + spec/18 | 段级向量索引 |
| `setting_snapshots` | spec/16 §Snapshot | 重大设定改动自动备份 |
| `cascade_audits` | spec/19 §L4 治理 | cascade 影响半径分析的审计日志 (递归 / 用户接受率) |
| `reindex_failures` | spec/17 §reindex Worker §失败回滚 | reindex 失败队列 (供手动重试) |
| `narrative_feedback` | spec/10 §用户不接受 BeatReport (待补) | 用户对 BeatReport 的反馈 (二期 Reflector 用) |
| `entity_match_feedback` | spec/05 §调优策略 (待补) | entity highlight false-positive 反馈 (W6 起记录) |

迁移脚本 (`002-knowledge-graph.ts`) 在 spec/16 §迁移段定义。`PRAGMA user_version = 2` 后所有项目自动启用。

## entity_refs / concept_refs 段锚化 (W7 升级)

> spec/17 §entity_refs / concept_refs 改造 详细说明。简言之:在原 entity_refs 之上新增两列:

```sql
ALTER TABLE entity_refs ADD COLUMN anchor_id TEXT REFERENCES paragraph_anchors(anchor_id);
ALTER TABLE entity_refs ADD COLUMN intra_paragraph_offset INTEGER;  -- 段内字符 offset

CREATE INDEX idx_refs_anchor ON entity_refs(anchor_id);
```

迁移脚本 (`004-paragraph-anchors.ts`) 重扫所有现有 entity_refs,按 file_path + position_from 反查所属 anchor,populate 新两列。`concept_refs` 在 spec/16 表创建时已含此结构,无需 ALTER。

## 索引刷新流程 (W7 升级 — 差量)

> 取代旧"全文件 DELETE+INSERT" 模式,详见 spec/17 §差量 reindex 流程。

每次 `writeSetting` / `writeChapter` 落盘后,Worker 入队:

```
读取旧 paragraph_anchors → splitParagraphs(新内容) → diffAnchors
   ↓
按 (unchanged / modified / rewritten / deleted / added) 分支处理:
   unchanged  → 不动
   modified   → UPDATE anchor + entity_refs 该 anchor 重扫 + embedding 重算
   rewritten  → 软删旧 anchor + 新 anchor + dependencies / entity_relations / entity_timeline 锚点迁移
   deleted    → 软删 anchor + dependencies 标 broken (lint 报警)
   added      → 新 anchor + 全套下游
   ↓
重新编织 prev_anchor / next_anchor 双链
   ↓
broadcast 'anchors:changed' → 下游订阅者刷新
```

**事务原子性**: 单文件 reindex 在一个 SQLite transaction 内提交;失败 rollback + 落 `reindex_failures` 表(spec/17 §失败回滚)。
