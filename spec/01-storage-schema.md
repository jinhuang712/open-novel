# Spec 01 — 存储 Schema

## 文件系统约定

```
~/.open-novel/
├── runtime.db                        # Mastra Memory 跨项目会话
├── settings.json                     # 全局设置 (API key 等)
└── workspaces/
    └── {projectId}/                  # projectId = `proj_{slug}_{shortId}` (e.g. proj_zhongsheng_a3f2)
        ├── project.json
        ├── settings/
        │   ├── worldview.md
        │   ├── outline.md
        │   ├── beats.md
        │   ├── characters/{id}.md
        │   └── places/{id}.md
        ├── chapters/
        │   └── {NNN-{slug}}/
        │       ├── outline.md
        │       ├── draft.md
        │       └── meta.json
        ├── index.db                  # SQLite per-project
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

```yaml
---
id: char_lin_a3f2
type: character
canonical_name: 林川
aliases: ["川哥", "林总"]
gender: male | female | other | unknown
age: 28
role: protagonist | support | antagonist | extra
appearance: 短文字描述
personality: 短文字描述
background: 短文字描述
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

### references (实体在何处被提及)

```sql
CREATE TABLE references (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  entity_id TEXT NOT NULL,
  source_file TEXT NOT NULL,          -- chapters/001-XX/draft.md
  position_from INTEGER NOT NULL,     -- 字符 offset
  position_to INTEGER NOT NULL,
  matched_text TEXT NOT NULL,         -- 实际匹配的别名 ("玄德")
  snippet TEXT NOT NULL,              -- 前后 30 字
  created_at TEXT NOT NULL,
  FOREIGN KEY (entity_id) REFERENCES entities(id) ON DELETE CASCADE
);
CREATE INDEX idx_refs_entity ON references(entity_id);
CREATE INDEX idx_refs_source ON references(source_file);
```

### backlinks (反向索引,在某文件打开时用)

```sql
CREATE TABLE backlinks (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  target_file TEXT NOT NULL,          -- characters/lin.md (被引用的文件)
  source_file TEXT NOT NULL,          -- chapters/001-XX/draft.md
  source_section TEXT,                -- e.g. "第一章 § 段落 3"
  snippet TEXT NOT NULL,
  created_at TEXT NOT NULL
);
CREATE INDEX idx_back_target ON backlinks(target_file);
```

### history

```sql
CREATE TABLE history (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  action TEXT NOT NULL,               -- write_setting | write_chapter | rename | delete
  target TEXT NOT NULL,               -- file path
  before TEXT,                        -- 全文 (gzip 后存以省空间)
  after TEXT,
  reason TEXT,                        -- Agent 提供的理由
  agent TEXT,                         -- writer | humanizer | user-edit
  approval_id INTEGER,                -- 关联 approvals.id
  created_at TEXT NOT NULL
);
CREATE INDEX idx_history_target ON history(target);
```

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
- 迁移脚本放在 `lib/storage/migrations/{NNN}-{name}.ts`
- markdown frontmatter 变更时,Worker 启动时扫一遍批量升级
