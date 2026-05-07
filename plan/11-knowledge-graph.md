# 11 — 知识图谱:让"牵一发动全身"和"边写边查"真正可工作

> 此文档定义知识图谱层的总体架构。详细 schema / 算法 / 工具签名分散在 spec/16-21,本文档只讲 **Why / What / How 总线**。

## 为什么要有这一层

### 现状的薄弱(audit 分析,见 progress/005)

当前 cascade 与 entity 索引的真实运作:

```
writeSetting 落盘 (e.g. 改 lin.gender = female)
   ↓
Validator 查 entities 表 → 找 lin 的 entity_id
   ↓
查 entity_refs 表 → WHERE entity_id = char_lin → source_file 列表
   ↓
对每个 source_file 抽相关段 → LLM 逐段判 "是否与 lin.gender=female 矛盾"
   ↓
输出 ChangeProposal[]
```

**这个机制只能 cover "实体属性单字段改动 + 实体显式提及" 的场景**。下面这些场景全部漏检:

| 场景 | 漏检原因 |
|---|---|
| 改 `worldview/rules.md` 加"此世界没有手机" | "无手机" 不是 entity,entity_refs 表里压根无条目可查;LLM 写章节也不会显式引用 world_main ID |
| 改 `lin.md` 加 `mentor: char_zhang` | character.md frontmatter 当前 schema 没 relations 字段;entity_relations 表不存在 → 关系类 cascade 全靠 LLM 自由心证 |
| `foreshadowing/001-pocket-watch.md` 锚定 ch_010 § 5 埋怀表,作者删了 ch_010 第 5 段 | 没有 dependencies 表;foreshadowing 文件与章节段的依赖关系不可表达 → 伏笔静默失效 |
| 章节内"林川"出现 100 次,plan/06 默认 ±5 章范围审 | 这是治标:你改了核心设定,影响在 ch_50 / ch_100 — 默认范围漏掉,不是性能问题是 schema 漏 |
| 改 `lin.md` 改 `age: 28` → 故事 ch_050 5 年后,林川多大? | frontmatter 是单 snapshot,没有"林川 ch_050 时年龄"的查询能力 |
| Writer 写 ch_050"林川和张三第一次合作" | 没有 assembleContext 工具;Writer 是"半瞎"写的,token 爆炸 (全塞) 或漏知识 (只塞 referenced_entities) |
| 作者问 "林川上次见王小芳是哪一章?" | 没有按角色对查询 + 时间排序的查询面板;只能翻全章节 |
| "林川以前对女上司说过什么类似台词?" | 没有 embedding 索引;SQLite LIKE 关键词检索漏多 |

### 一句话总结

当前是"实体属性 + 显式提及" 一阶图;真实长篇网文需要"实体 + 关系 + 时间 + 概念 + 段级依赖 + 语义"六维图。**不补上这一层,所谓的 cascade 和 RAG 都是表面 demo**。

## 总体架构 (4 层)

```
┌────────────────────────────────────────────────────────────┐
│ L4 治理层 (Workflow)                                        │
│  - Plan inconsistency lock (有未决 cascade 时禁 write)      │
│  - Setting Lint (孤儿 entity / 循环 relation / 失效锚点)    │
│  - Snapshot (重大设定改动自动备份)                          │
│  - 派生文件守卫 (派生视图只读 + reindex 覆盖警告)           │
└────────────────────────────────────────────────────────────┘
                             ▲
┌────────────────────────────────────────────────────────────┐
│ L3 工具层 (Agent 接入,见 spec/19-21)                       │
│  - assembleContext  (Writer 写章节前调,自动 retrieve)       │
│  - analyzeImpact    (Validator 收 setting diff 后调)        │
│  - queryFacts       (作者主动查 / Router 转发)              │
└────────────────────────────────────────────────────────────┘
                             ▲
┌────────────────────────────────────────────────────────────┐
│ L2 算法层 (Index Pipeline,见 spec/17-19)                   │
│  - 段级稳定 ID (paragraph anchors)                          │
│  - 段级 embedding (语义检索)                                │
│  - 概念抽取 (LLM 跑 worldview/rules → concepts 表)          │
│  - 影响半径计算器 (纯 SQL 出候选,不调 LLM)                 │
│  - 差量 reindex (只重算 dirty 段)                           │
└────────────────────────────────────────────────────────────┘
                             ▲
┌────────────────────────────────────────────────────────────┐
│ L1 数据层 (Schema 增强,见 spec/16)                         │
│  - entity_relations  (双向语义关系: 师徒/敌友/上下级/...)   │
│  - entity_timeline   (随章节变化的属性: age/location/...)   │
│  - concepts + concept_refs (worldview 硬规则当 pseudo-entity)│
│  - dependencies      (foreshadowing / callback / 跨文件锚定) │
│  - paragraph_anchors (段级稳定 ID)                          │
│  - paragraph_embeddings (段级向量索引)                      │
│  + character.md frontmatter 升级 (initial_state/relations/  │
│    reader_promises/taboos)                                  │
└────────────────────────────────────────────────────────────┘
```

## 核心数据流改造

### Cascade 改造 (写设定时)

```
旧:
  writeSetting → Validator 取 entity_refs → 全段送 LLM 心证 → ChangeProposal[]

新:
  writeSetting → analyzeImpact (spec/19)
   │  step 1: LLM 抽 semantic delta (`lin.gender: male → female`)
   │  step 2: 纯 SQL 查影响半径 (entity_refs ∪ relations 上下游 ∪
   │          events 参与 ∪ concept_refs ∪ dependencies)
   │  step 3: LLM 二次过滤 (逐段判这段是否真的受影响 + 给修改建议)
   │  step 4: 输出 ChangeProposal[] + 影响图谱 (UI 用)
   └→ 用户审 → 接受 → Writer 重写 → 触发递归一次
                                  ↑
                       (单层递归,防止环;详见 spec/19 §递归终止)
```

L2 §影响半径计算器 取代了 plan/06 的"按章节范围 ±5"治标策略。**作者改任何 setting,系统能给出**完整、确定、毫秒级的候选影响列表**,LLM 仅做"是不是真受影响"的二次判断。

### Context Assembly 改造 (写章节时)

```
旧:
  Writer prompt = system + project.style + outline + referenced_entities (人工选)
  → 漏 / 爆 token 二选一

新:
  Writer 接到 chapterId + outline
   ↓
  调 assembleContext (spec/20)
   │  step 1: 从 outline NER 抽出涉及的 entities
   │  step 2: timeline.snapshotAt(entity, chapterId)  → 取该角色到本章的最新状态
   │  step 3: relations.activeAt(entities, chapterId) → 取本章时间点活跃关系
   │  step 4: dependencies.pendingFor(chapterId) → 取本章应当回收/埋设的伏笔
   │  step 5: embeddings.search(outline, topK=5) → 语义最相关的历史段
   │  step 6: 按 token 预算裁剪 → 拼成 context block
   └→ 喂回 Writer prompt
   ↓
  Writer 拿到完整 context 写章节,不再"半瞎"
```

token 预算控制详见 spec/20。

### 边写边查改造 (作者主动查)

```
旧:
  entity highlight + hover 卡 (spec/05) — 只能跳实体文件全文
  backlinks 面板 — 只显示"被 N 处引用"

新:
  + queryFacts 工具 (spec/21):
    - "林川 ch_50 时多大" → entity-at 查询 → 直查 timeline 表
    - "林川和王小芳关系演变" → relations-of 查询 → 时间排序输出
    - "林川对女上司说过什么类似台词" → semantic-search → embeddings 检索
    - "ch_005 之前提到过怀表的所有段落" → mentions-of 查询 + 范围过滤
  + UI 查询面板 (Cmd+K → query-facts 模式) 直接出结果,不走 LLM
  + Router 在 discuss 模式自动调 queryFacts,把"事实查询"和"自由对话"分开
```

## 与现有架构的对接

| 现有组件 | 改造点 |
|---|---|
| `entities` 表 (spec/01) | 不动,作为根 ID 注册 |
| `entity_refs` 表 (spec/01) | 不动,概念维度由新 `concept_refs` 表承载 (与 entity_refs 对称) |
| `backlinks` 表 (spec/01) | 不动,作为 entity 反向索引 |
| `history` 表 (spec/01) | 不动 |
| `learnings` 表 (spec/01) | 不动 |
| `approvals` 表 (spec/01) | 不动;cascade 链路通过 `parent_approval_id` 关联 (新字段,见 spec/19) |
| `narrative_metrics` 表 (spec/01 + spec/10) | 不动 |
| character.md frontmatter | 升级 — 加 `initial_state` / `relations` / `reader_promises` / `taboos`,见 spec/16 |
| Validator (plan/02) | execute 内调 analyzeImpact,不再现场 LLM 推 |
| Writer (plan/02) | execute 内调 assembleContext,不再人工塞 referenced_entities |
| Router (plan/02) | discuss 模式优先调 queryFacts,如查不到再调 LLM 自由答 |
| reindex Worker (plan/04) | 升级为差量,见 spec/17 |
| AC trie (spec/05) | 同时索引 entity 名 + concept surface_forms,hover 卡区分视觉 |

## 文件系统拓扑变化

详见 plan/04 §settings 目录 (拆分后)。

要点:
- `worldview/` 拆为多个子文件
- `outline/` 拆为多个子文件
- 新增:`factions/` `organizations/` `locations/` `items/` `events/` `timeline/` `relationships/` `story-lines/` `foreshadowing/` `chapter-arcs/` `power-system/` `glossary/` `taboos.md` `themes.md` `reader-promises.md`
- 派生视图:`relationships/_matrix.md` / `timeline/character-ages.md` (从 SQLite 表自动生成,只读)

## 不变性 (Invariants)

加进 plan/01 §不变性 第 9-12 条:

9. **影响半径不依赖 LLM** — Validator cascade 第一步必须是 SQL 查影响半径 (analyzeImpact step 2);LLM 只做二次过滤。漏 SQL 索引 = bug,不是 LLM "推不准"。
10. **派生视图只读** — `relationships/_matrix.md` / `timeline/character-ages.md` 等是 SQLite 表 → markdown 投影,reindex 覆盖,UI 锁写,frontmatter 标 `derived: true`。
11. **未决 cascade 阻断 write** — plan 模式产生的 ChangeProposal[] 未全部 resolve 时,write 模式禁用 (Setting Lint 一项)。
12. **段锚点稳定** — 段移动 / 重命名不应使 dependencies / paragraph_embeddings 失效;reindex 走"内容签名 + 邻接段对照"维持锚点。

## 落地里程碑 (W7-W10 专攻)

W7-W10 安排:

| 周 | 内容 | 对应 spec |
|---|---|---|
| **W7** | L1 schema 全部 4 张新表落地 + character frontmatter 升级 + zod 强校验 + 迁移脚本 | spec/16 |
| **W7-W8** | L2 段级稳定 ID + 差量 reindex + paragraph_anchors 表 + Worker 升级 | spec/17 |
| **W8** | L2 embedding 接入 + paragraph_embeddings 表 + 增量计算 | spec/18 |
| **W8-W9** | L2 概念抽取 (worldview/rules.md → concepts) + LLM prompt + 用户审流程 | spec/16 §概念抽取 |
| **W9** | L2 影响半径计算器 + L3 analyzeImpact 工具 + Validator 接入 | spec/19 |
| **W9** | L3 assembleContext 工具 + Writer 接入 + token 预算控制 | spec/20 |
| **W10** | L3 queryFacts 工具 + UI 查询面板 (Cmd+K query 模式) | spec/21 |
| **W10** | L4 Setting Lint + Plan inconsistency lock + Snapshot + 派生守卫 | spec/16 §治理 |

合计 4 周,占 W7-W10 全部带宽。联网工具能力推迟至二期(mock 已够)。

## 与同类产品的差异(更新)

(对照 plan/01 §与同类产品的差异表)

| 维度 | NovelCrafter / Sudowrite | Open Novel |
|---|---|---|
| 实体索引 | 静态卡片 (Codex) | 动态实体 + 时间轴 + 关系图 |
| Cascade 影响范围 | 无 / 全人工 | 纯 SQL 出候选 + LLM 二次过滤 + 递归 |
| 写章节上下文 | 用户手动选 cards 塞 prompt | assembleContext 自动 retrieve + token 预算 |
| 边写边查 | 静态搜索 / 跳卡片 | queryFacts 4 模式 + 语义检索 + 时间感知 |
| 伏笔 / 跨文件依赖 | 无 | dependencies 表显式锚定 + lint |
| 概念级一致性 | 无 (只懂实体) | concepts 表 + 表面词 NER 索引 |

后四条 (assembleContext / queryFacts / dependencies / concepts) 是与"AI 代笔工具"赛道的二阶区分点:**NovelCrafter / Sudowrite 是把 AI 装进文字编辑器,Open Novel 是把世界装进 AI**。

## 不做什么

- **不做实时 LLM 影响分析** — 影响半径必须是 SQL 出候选,LLM 仅二次过滤。任何"现场让 LLM 推这次改动会影响什么"的设计都禁止 (慢 + 漏 + 不可解释)。
- **不做向量数据库** — 段级 embedding 落 SQLite + sqlite-vss 扩展或 LibSQL 原生 vector 支持。不引入 Qdrant / Milvus 等独立服务,详见 spec/18。
- **不做"全自动派生设定"** — 派生视图(关系矩阵 / 时间轴)是表的投影,不替作者写设定。"建议给林川加一个师父"这种主动建议留给 Validator / Reflector 的二期能力,不在本层。
- **不做"无 schema 自由文本扫描"** — 所有 cascade / context 必须依赖 schema 化字段。自由文本里隐式提到的关系(e.g. 章节正文里写"林川的师父张三")不会被自动归一为 entity_relations 表条目;必须由作者在 character.md 显式声明,或由 Reflector 二期主动建议补全。
- **不做跨项目知识图谱共享** — 知识图谱按项目独立,与 Memory 的 `resource = projectId` 一致。
