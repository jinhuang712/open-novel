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
├── .snapshots/                      # 设定快照 (见 spec/16 §Snapshot)
│   └── {projectId}/{timestamp}/
└── workspaces/
    ├── proj_重生互联网_a3f2/
    │   ├── project.json
    │   ├── settings/
    │   │   ├── worldview/                       # ← 拆目录
    │   │   │   ├── _index.md                    # 摘要 + 子文件列表 (供 LLM 快读)
    │   │   │   ├── geography.md                 # 地理总论
    │   │   │   ├── history.md                   # 历史脉络
    │   │   │   ├── politics.md                  # 政治格局
    │   │   │   ├── economy.md                   # 经济体系
    │   │   │   ├── technology.md                # 科技 / 工业 (现代 / 科幻必备)
    │   │   │   ├── culture.md                   # 风俗 / 民族 / 语言
    │   │   │   ├── religion.md                  # 信仰 / 神系
    │   │   │   └── rules.md                     # 世界硬规则 (e.g. "此世界没有手机")
    │   │   ├── outline/                         # ← 拆目录
    │   │   │   ├── _index.md                    # 总纲 + 卷列表
    │   │   │   ├── master.md                    # 全书一句话 / 三幕结构 / 总爽点节奏
    │   │   │   ├── volumes/                     # 卷大纲
    │   │   │   │   ├── 01-rebirth.md            # 第一卷
    │   │   │   │   └── 02-startup.md            # 第二卷
    │   │   │   └── chapter-outlines/            # 章节大纲索引 (内容仍在 chapters/{id}/outline.md)
    │   │   │       └── _registry.md             # 章节-卷映射
    │   │   ├── beats.md                         # 节拍设计 (兼容,不拆)
    │   │   ├── characters/
    │   │   │   ├── lin.md
    │   │   │   └── wang.md
    │   │   ├── factions/                        # ← 新 (阵营)
    │   │   │   ├── _index.md
    │   │   │   ├── donghai-group.md
    │   │   │   └── chaoting.md
    │   │   ├── organizations/                   # ← 新 (公司 / 门派 / 公会 / 政府,与 faction 不同维)
    │   │   │   ├── _index.md
    │   │   │   └── {id}.md
    │   │   ├── locations/                       # ← 新 (替代 places)
    │   │   │   ├── _index.md
    │   │   │   ├── regions/                     # 大区
    │   │   │   ├── cities/                      # 城市
    │   │   │   ├── buildings/                   # 建筑
    │   │   │   └── landmarks/                   # 地标
    │   │   ├── items/                           # ← 新 (重要物品 / 法宝 / 信物)
    │   │   │   ├── _index.md
    │   │   │   └── {id}.md
    │   │   ├── events/                          # ← 新 (历史事件 + 故事内关键事件)
    │   │   │   ├── _index.md
    │   │   │   └── {id}.md
    │   │   ├── timeline/                        # ← 新
    │   │   │   ├── _index.md
    │   │   │   ├── era.md                       # 纪年体系 (大宇宙背景)
    │   │   │   ├── story-clock.md               # 故事内时间推进 (绑章节)
    │   │   │   └── character-ages.md            # 派生 — 由 entity_timeline 表生成
    │   │   ├── relationships/                   # ← 新
    │   │   │   ├── _index.md
    │   │   │   ├── _matrix.md                   # 派生 — 由 entity_relations 表生成
    │   │   │   └── notes/                       # 用户对某关系的注解
    │   │   │       └── {id}.md
    │   │   ├── story-lines/                     # ← 新
    │   │   │   ├── _index.md
    │   │   │   ├── main.md                      # 主线
    │   │   │   └── subplots/                    # 支线
    │   │   │       └── {id}.md
    │   │   ├── foreshadowing/                   # ← 新 (预埋伏笔)
    │   │   │   ├── _index.md
    │   │   │   └── {id}.md                      # 单条伏笔: 埋点 / 收割点 / 状态
    │   │   ├── chapter-arcs/                    # ← 新 (按弧划分章节段落)
    │   │   │   ├── _index.md
    │   │   │   └── {id}.md                      # e.g. 前世篇 ch_001-040
    │   │   ├── power-system/                    # ← 新 (流派相关,仅玄幻 / 修仙 / 系统流用)
    │   │   │   ├── _index.md
    │   │   │   ├── overview.md
    │   │   │   ├── tiers.md                     # 等阶
    │   │   │   ├── techniques.md                # 功法 / 招式
    │   │   │   └── artifacts.md                 # 法宝体系
    │   │   ├── glossary/                        # ← 新 (术语 / 黑话 / 设定专有名词)
    │   │   │   └── _index.md                    # 单文件即可,术语 ≤ 几百条
    │   │   ├── taboos.md                        # ← 新 (作者明确"绝对不能写")
    │   │   ├── themes.md                        # ← 新 (主题 / 核心矛盾 / 价值观)
    │   │   └── reader-promises.md               # ← 新 (已对读者立的旗 / 承诺)
    │   ├── chapters/
    │   │   └── 001-重生那一夜/
    │   │       ├── outline.md
    │   │       ├── draft.md
    │   │       └── meta.json
    │   ├── index.db                 # SQLite per-project (含 7 张新表,见 spec/16-18)
    │   └── trace/
    │       └── 2026-04-29-session-abc.jsonl
    └── proj_末世修仙_b7c1/
        └── ...
```

### 目录设计要点

1. **每个目录有 `_index.md`** — 给 LLM 快速读"这个目录里有什么 + 一句话摘要",不必扫整个目录。结构:
   ```yaml
   ---
   id: index_worldview_a3f2
   type: index
   for_directory: worldview
   ---
   # 世界观索引

   ## 子文件 (8 个)
   - geography.md — 地理总论 (200 字摘要)
   - history.md — 历史脉络 (200 字摘要)
   - ...
   ```
2. **派生文件** (`relationships/_matrix.md` / `timeline/character-ages.md`) — 这些是 SQLite 表的 markdown 投影,frontmatter 标 `derived: true`,UI 锁写 (见 spec/16 §派生文件守卫)。reindex 时自动重生成。
3. **空目录的处理** — 若用户项目流派不需要某目录(都市流不需要 power-system/),目录仍创建,`_index.md` 写一行"此目录适用于玄幻 / 修仙 / 系统流,本项目暂未使用"。空目录不影响 reindex,不影响 token (assembleContext 不会把空目录塞 prompt)。
4. **非派生 `_matrix.md` 用户能扩展** — 用户在 `relationships/notes/{id}.md` 写"林川和王老板的私人恩怨详情",这些 notes 不参与 entity_relations 表派生,只供 Writer assembleContext 时取用。

## Markdown frontmatter 规范

每个内容文件用 YAML frontmatter 携带元数据。

### 角色 (`characters/X.md`)

> ⚠ frontmatter v3 — W2 末新增 `value_axes` / `intelligence_axis` 字段供五大守则人设崩坏检测 (spec/25);v2 字段 `reader_promises` / `taboos` / `arc` 在 W7 加入 (见 spec/16)。

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
# v2 (W7+):
reader_promises:                          # 读者承诺,违反 = critical (spec/25 守则 2)
  - "杀伐果断,不会对队友下手"
  - "重情义,会为队友报仇"
taboos:                                   # 角色禁忌,违反 = critical
  - "不会对老人下手"
  - "不会出卖兄弟"
arc:                                      # 角色弧光 (ArcTracker 跟踪)
  start: 软弱
  end: 杀伐果断
  trajectory: ['受辱', '觉醒', '复仇', '掌权']
# v3 (W7+, spec/25):
value_axes:                               # 行为价值观基线,偏离 > 0.4 = critical
  对敌:                                   # 0=最仁慈, 1=最狠辣
    baseline: 0.85
    range: [0.7, 1.0]
  对友:                                   # 0=最绝情, 1=最重情
    baseline: 0.90
    range: [0.75, 1.0]
  对女:
    baseline: 0.6
    range: [0.4, 0.8]
intelligence_axis:                        # 智力基线 (假智谋检测用)
  baseline: 0.85                          # 0=笨, 1=极聪明
  iq_range: [0.7, 1.0]
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

> ⚠ frontmatter v2 — W2 末新增 `pov` / `pov_breakdown` / `hook_type` (1-3 章必填) / `main_line` / `progress_milestone` / `agency_breakdown` (派生) 字段供五大守则节奏 / 黄金三章 / 金手指检测 (spec/25)。

```yaml
---
id: ch_001
type: chapter
chapter_index: 1                          # 派生 (从 order 字段)
order: 1
title: 重生那一夜
word_count: 3247
status: draft                             # draft | reviewed | published
# v2 字段 (spec/25):
pov:                                      # POV 角色 list (按出场顺序)
  - 林溪
pov_breakdown:                            # 派生 (Validator 扫段后填,主角段比例)
  林溪: 0.78
  王伟: 0.22
hook_type: 冲突                           # 1-3 章必填: 悬念 / 冲突 / 爽点 / 钩子 / 谜团
named_characters:                         # 派生 (本章命名角色出场名单)
  - 林溪
  - 王伟
  - 老板
setting_description_ratio: 0.18           # 派生 (设定/环境描写占比)
main_line: true                           # true=主线 / false=支线
progress_milestone: null                  # null 或: 突破 / 夺宝 / 打脸 / 复仇 / 升级 / 觉醒 / 解谜
pov_protagonist_ratio: 1.0                # 派生 (主角 POV 段比例)
agency_breakdown:                         # 派生 (主角能动性占比, BeatAnalyzer 标段后聚合)
  active_decision: 0.45                   # 主动决策
  passive_receive: 0.20                   # 被动接收
  system_reward: 0.10                     # 系统奖励
  wisdom_choice: 0.15                     # 智慧抉择
  struggle: 0.10                          # 挣扎抗争
referenced_entities:
  - char_lin_a3f2
  - place_beijing_2010
created_at: ...
updated_at: ...
---

# 第一章 重生那一夜

林川猛地从床上坐起来...
```

### 五大守则项目级配置 (`cardinal-rules.json`)

> 项目级硬约束配置;`enabled: true` 锁死,只能微调阈值。详见 [spec/25-cardinal-rules.md](../spec/25-cardinal-rules.md)。

```jsonc
// ~/.open-novel/workspaces/{projectId}/cardinal-rules.json
{
  "version": 1,
  "goldenChapters": {
    "enabled": true,
    "indexRange": [1, 3],
    "minProtagonistPOVRatio": 0.6,
    "maxSettingDescriptionRatio": 0.25,
    "protagonistFirstAppearByWordCount": 1000,
    "maxNamedCharactersInFirst3Chapters": 5,
    "requireHookTypes": ["悬念", "冲突", "爽点", "钩子", "谜团"]
  },
  "characterIntegrity": {
    "enabled": true,
    "promiseViolationThreshold": "any",
    "tabooViolationThreshold": "any",
    "valueAxisDeviationMax": 0.4,
    "minOpponentIntelligenceRatio": 0.7
  },
  "pacing": {
    "enabled": true,
    "maxChaptersBetweenMilestones": 5,
    "minProtagonistPOVRatio": 0.7,
    "maxSideLineRatio": 0.3,
    "maxConsecutiveAbsenceChapters": 2,
    "rollingWindow": 10
  },
  "promiseAccountability": {
    "enabled": true,
    "warnBeforeDeadlineChapters": 3,
    "blockOnOverdueCritical": true
  },
  "protagonistAgency": {
    "enabled": true,
    "systemDependencyAxis": 0.3,
    "minActiveDecisionRatio": 0.3,
    "maxSystemRewardRatio": 0.3
  }
}
```

## SQLite Schema (`index.db` per-project)

详见 [spec/01-storage-schema.md](../spec/01-storage-schema.md) 与 [spec/16-knowledge-schema.md](../spec/16-knowledge-schema.md),核心表:

**基础表 (spec/01)**:
- `entities`: 实体登记 (id, canonical_name, aliases JSON, category, file_path)
- `entity_refs`: 实体在哪个文件哪段被提及 (早期叫 `references` — SQL 保留字,已重命名)
- `backlinks`: 反向索引 (打开角色页时显示 "被 X 章引用")
- `history`: 变更历史 (谁、何时、改了什么、为什么)
- `learnings`: Reflector 提炼的经验
- `approvals`: 审批记录 (含 diff 与决定)
- `traces`: Agent 流式日志归档 (JSONL 形态太重时按需 ingest)
- `narrative_metrics`: BeatAnalyzer / ArcTracker 输出 (spec/10)

**知识图谱表 (spec/16-18)**:
- `entity_relations`: 双向语义关系 (师徒 / 敌友 / 上下级 / ...)
- `entity_timeline`: 角色随章节变化的属性 (age / location / mood / power_level / ...)
- `concepts` + `concept_refs`: worldview 硬规则当作 pseudo-entity 索引
- `dependencies`: 跨文件 / 跨设定显式锚定 (foreshadowing / payoff / callback / ...)
- `paragraph_anchors`: 段级稳定 ID + 邻接双链
- `paragraph_embeddings`: 段级向量索引
- `setting_snapshots`: 重大设定改动自动备份
- `cascade_audits`: cascade 影响半径分析的审计日志
- `reindex_failures`: reindex 失败队列 (供手动重试)

## 数据隔离保证

1. **文件层**: 每个项目独立目录,操作以 `projectId` 为前缀,绝不跨项目读写
2. **数据库层**: `index.db` 在项目目录内,不存在跨库查询
3. **Memory 层**: Mastra `Memory({ resource: projectId })` 自动隔离会话历史
4. **校验**: 所有 storage 函数签名第一个参数是 `projectId`,内部 assert 路径前缀

## 修改提交的全链路 (含审批前内部 cascade 递归)

> ⚠ **关键交互模型**: `writeSetting` / `writeChapter` 是 **proposal-only** 工具 (见 spec/06),**不直接落盘**。从用户输入到磁盘改变,中间隔着完整的 cascade 内部递归 + 用户审批两道闸:

```
用户在 plan 模式发起意图
   ↓
Writer 出主修改 (in-memory)
   ↓
[内部递归循环 — 用户不可见,无任何落盘]
   ├ 第 1 轮 analyzeImpact (基于 main delta) → ChangeProposal[1]
   ├ Writer 内部对 needsChange=true 项生成 afterText (内存)
   ├ 第 2 轮 analyzeImpact (基于第 1 轮 afterText) → ChangeProposal[2]
   └ ... ≤3 轮,半径单调下降 + weight 阈值递增 (见 spec/19)
   ↓ 递归终止
汇总 ChangeSet (主修改 + 所有 cascade proposal,含二级)
   ↓
**一次** ApprovalCard 呈现整批:
  - 顶部影响图谱 (节点 = entity / file,边 = 影响传播)
  - 每条 proposal 一行 diff (默认全展开,可折叠)
  - 每条 proposal 有勾选框 (默认勾)
  - [全选] [全不选] [一键同意勾选项] [手动编辑某条] [拒绝全部]
   ↓
用户决定 → POST /api/approvals/{id}/resolve { decision, accepted_items: [...] }
   ↓
**↓ 此处才开始落盘 ↓**
```

下一节列的"副作用"只在 approve 通过后触发,不是 cascade 的源头。

## 审批通过后的副作用

每次 ApprovalCard 整批 approve 通过后,后端 `POST /api/approvals/{id}/resolve` 在一个 SQLite transaction 内:

1. 按 transaction 一次写所有 `accepted_items` 文件 (主修改 + 勾选的 cascade proposal)
2. 重新解析每个文件 frontmatter,upsert 到 `entities` 表
3. 触发 Worker 异步**差量** reindex (见 spec/17 §差量 reindex,按文件批量入队):
   - 段级 anchor diff (unchanged / modified / rewritten / deleted / added)
   - 仅 dirty 段重扫 entity_refs / concept_refs
   - 仅 dirty 段重算 paragraph_embeddings (见 spec/18 §增量计算)
4. **frontmatter delta 同步知识图谱表**:
   - `relations` 字段变化 → upsert 到 `entity_relations` (source='frontmatter')
   - `initial_state` 变化 → upsert 到 `entity_timeline`
   - 派生文件 (`_matrix.md` / `character-ages.md`) 重生成
5. **若主修改属于 P0 设定文件 (worldview/* / characters/* / outline/master.md)**: 自动 setting snapshot (见 spec/16 §Snapshot)
6. 写一组 `history` 记录 (整批用同一个 `cascade_group_id`,便于"回退某次审批"还原整批)
7. Reflector 按 cascade 链路批次合并入队 (见 plan/06 §Reflector 触发时机)

**事务原子性**: 步骤 1 在一个 transaction 内,任一文件写盘失败 → 全部 rollback;reindex 副作用入队但 Worker 是异步串行,不影响主 transaction。

## 备份策略

- 用户数据完全在 `~/.open-novel/`,iCloud / Time Machine 自然备份
- 提供"Export Project"按钮: 打包成 zip (`projectId.zip`),**含所有 .md + index.db** (审计修正:早期版本说"不含 index.db,可重建",但 narrative_metrics / reader_reports / approvals / learnings 这些是花了 LLM 钱跑出来的,丢了等于丢钱;`entity_refs` `backlinks` 这种纯派生表在导入后由 Worker 重建)
- 提供"Import Project"按钮: 解压后,若 projectId 冲突自动生成新 id;Worker 后台重建 entity_refs / backlinks
- 详细 UI flow 见 [spec/13-settings.md](../spec/13-settings.md) §项目生命周期 UI flow

## 多 Tab 同项目并发 (新增 — 审计补)

> audit 发现:用户开两个浏览器 tab 同一 localhost — 同时改 worldview.md,谁覆盖谁?Mastra Memory 同 thread 双方收 deltas。POC 单用户但**多 tab 是常见使用方式**。

策略: **Web Locks API** 软锁 + 后到的 tab 进只读模式。

```ts
// lib/storage/tab-lock.ts
export async function acquireProjectLock(projectId: string, onLost: () => void) {
  const ac = new AbortController()
  navigator.locks.request(`open-novel:project:${projectId}`, { signal: ac.signal },
    async (lock) => {
      if (!lock) return    // 没拿到 (其他 tab 持有)
      // 拿到了 — 维持 lock 直到 tab 关闭或显式释放
      await new Promise<void>((resolve) => { ac.signal.addEventListener('abort', () => resolve()) })
    },
  ).catch(onLost)
  return ac
}
```

UI 在第二 tab:
- 顶部 banner "另一个标签页正在编辑此项目,本标签页只读";
- 编辑动作 disabled,Esc 切到只读浏览模式
- "强制接管" 按钮: 用户主动释放上一 tab 的锁 (`postMessage` 协议),接管编辑

## 外部编辑器同步 (新增 — 审计补)

> audit 发现:用户在 VSCode/iA Writer 直接改了 `characters/lin.md`,我们不知道;TipTap 仍显示旧内容,审批的 before-state 错位 → diff 出错。

策略: **chokidar 文件 watcher** (Node 端,在 `/api/watch` Route Handler 内挂) + SSE push 到前端。

```ts
// app/api/watch/route.ts (long-lived SSE)
export const runtime = 'nodejs'

export async function GET(req: Request) {
  const projectId = new URL(req.url).searchParams.get('projectId')!
  const watcher = chokidar.watch(getProjectDir(projectId) + '/**/*.md', {
    ignoreInitial: true, atomic: true,
  })
  const stream = new ReadableStream({
    start(controller) {
      watcher.on('change', (path) => {
        controller.enqueue(`event: fs:changed\ndata: ${JSON.stringify({ path })}\n\n`)
      })
    },
  })
  req.signal.addEventListener('abort', () => watcher.close())
  return new Response(stream, { headers: { 'content-type': 'text/event-stream' } })
}
```

前端:
- 收到 fs:changed 后,如果该文件在某个 Tab 打开 + 用户没有未保存编辑 → 静默 reload
- 用户有未保存编辑 → 弹冲突 dialog: "[文件名] 被外部修改。要 [使用磁盘版本] / [保留我的修改] / [手动 merge]"
- 如果该文件在审批流的 before-state 中 → 该审批 invalidate (status='stale'),提示用户重做

## LibSQL 连接池 (新增 — 审计补)

> audit 发现:每项目独立 `index.db`,Node FD ulimit 256,同时打开 5 个项目就贴边。

详见 [spec/01-storage-schema.md](../spec/01-storage-schema.md) §LibSQL 连接池。要点:

- LRU cache (`max: 3`) 维持最多 3 个项目并发活跃
- 切项目时显式 `pool.delete(oldId)` close 连接
- 删项目前必须先 close,再 fs.rm

## 索引刷新策略 (审计加固 + W7 差量升级)

每次 writeSetting / writeChapter 落盘后,**reindex 走单例 Worker 串行 + 差量 anchor diff**:

- 防止 5 个 cascade 并发 reindex 触发 SQLite 写锁竞争
- Worker 内部 queue + LRU dedupe (同 anchor 1s 内只处理一次)
- **差量 anchor diff** (spec/17): 改一段不重扫全文件,只算该段 entity_refs / concept_refs / paragraph_embeddings
- **embedding 增量** (spec/18): 段未变 → embedding 不动;段重写 → 该段 embedding 异步重算
- **失败队列** (spec/17 §reindex Worker §失败回滚): 中途 throw 进 `reindex_failures` 表,UI 可手动重试
- 详见 [spec/01-storage-schema.md](../spec/01-storage-schema.md) §SQLite WAL Mode + 并发写 + [spec/17-paragraph-anchors.md](../spec/17-paragraph-anchors.md) §reindex Worker 升级
