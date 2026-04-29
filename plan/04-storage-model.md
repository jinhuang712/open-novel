# 04 — 存储模型

## 设计原则

- **内容人类可读**: 设定与正文必须是 markdown,可编辑可 diff 可备份
- **索引/历史/学习独立**: 用 SQLite (LibSQL) 管引用图、变更历史、反馈经验,**用户不感知**
- **多项目无串扰**: 每个项目一个目录,一个独立 `index.db`
- **存放在用户目录**: 不污染代码仓库,iCloud/Time Machine 友好

## 存储位置

```
~/.open-novel/
├── runtime.db                       # Mastra Memory 全局会话 (跨项目)
├── settings.json                    # API keys / 用户偏好 (UI 修改)
└── workspaces/
    ├── proj_重生互联网_a3f2/
    │   ├── project.json
    │   ├── settings/
    │   │   ├── worldview.md
    │   │   ├── outline.md
    │   │   ├── beats.md
    │   │   ├── characters/
    │   │   │   ├── lin.md
    │   │   │   └── wang.md
    │   │   └── places/
    │   │       └── beijing-2010.md
    │   ├── chapters/
    │   │   └── 001-重生那一夜/
    │   │       ├── outline.md
    │   │       ├── draft.md
    │   │       └── meta.json
    │   ├── index.db                 # SQLite per-project
    │   └── trace/
    │       └── 2026-04-29-session-abc.jsonl
    └── proj_末世修仙_b7c1/
        └── ...
```

## Markdown frontmatter 规范

每个内容文件用 YAML frontmatter 携带元数据。

### 角色 (`characters/X.md`)

```yaml
---
id: char_lin_a3f2
type: character
canonical_name: 林川
aliases:
  - 川哥
  - 林总
gender: male
age: 28
role: protagonist
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

### 世界观 (`settings/worldview.md`)

```yaml
---
id: world_main
type: worldview
title: 2010 年北京互联网圈
era: 现代-2010
genre: 都市重生
created_at: ...
---

# 世界观设定
...
```

### 章节 (`chapters/001-XX/draft.md`)

```yaml
---
id: ch_001
type: chapter
order: 1
title: 重生那一夜
word_count: 3247
status: draft  # draft | reviewed | published
referenced_entities:
  - char_lin_a3f2
  - place_beijing_2010
created_at: ...
updated_at: ...
---

# 第一章 重生那一夜

林川猛地从床上坐起来...
```

## SQLite Schema (`index.db` per-project)

详见 [spec/01-storage-schema.md](../spec/01-storage-schema.md),核心表:

- `entities`: 实体登记 (id, canonical_name, aliases JSON, category, file_path)
- `references`: 实体在哪个文件哪段被提及
- `backlinks`: 反向索引 (打开角色页时显示 "被 X 章引用")
- `history`: 变更历史 (谁、何时、改了什么、为什么)
- `learnings`: Reflector 提炼的经验
- `approvals`: 审批记录 (含 diff 与决定)
- `traces`: Agent 流式日志归档 (JSONL 形态太重时按需 ingest)

## 数据隔离保证

1. **文件层**: 每个项目独立目录,操作以 `projectId` 为前缀,绝不跨项目读写
2. **数据库层**: `index.db` 在项目目录内,不存在跨库查询
3. **Memory 层**: Mastra `Memory({ resource: projectId })` 自动隔离会话历史
4. **校验**: 所有 storage 函数签名第一个参数是 `projectId`,内部 assert 路径前缀

## 保存触发的副作用

每次 `writeSetting` / `writeChapter` 落盘后:

1. 更新对应 markdown 文件 (含 frontmatter `updated_at`)
2. 重新解析 frontmatter,upsert 到 `entities` 表
3. 触发 Worker 异步扫描所有正文文件,刷新 `references` + `backlinks`
4. 写一条 `history` 记录 (含 before/after diff)
5. 调用 Reflector 入队反思 (无需阻塞)

## 备份策略

- 用户数据完全在 `~/.open-novel/`,iCloud / Time Machine 自然备份
- 提供"Export Project"按钮: 打包成 zip (`projectId.zip`),含所有 .md + 不含 index.db (可重建)
- 提供"Import Project"按钮: 解压后扫描 markdown 重建 index.db
