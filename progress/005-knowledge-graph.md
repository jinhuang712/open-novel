# 005 — 知识图谱专攻 (cascade + RAG 真正可工作的地基)

**日期**: 2026-05-06
**周次**: 跨期 (W2 末尾,W7-W10 落地前必清)
**主要 Owner**: jin.huang@klook.com
**触发**: 用户主动质询"现在的设计是如何保证'牵一发动全身'和'边写边查'两个诉求的?如果我还停留在 planning 阶段,我需要我改的一小部分能自动索引到所有关联的地方并完成对应的改动。如果我在写的时候我要能查到对应的所有关联的资料。请你深度分析,不要偷懒。不要治标不治本。"

## 背景

audit 003 (UX 治理) + audit 004 (文档加固) 之后,系统在工程基线、安全、一致性等已铺好,但用户在 W2 commit 1 启动前的二次穿透质询暴露了一个**根本架构缺口**:

> 当前 cascade + RAG 设计停留在"实体属性 + 显式提及"一阶图,无法支持长篇网文真实需要的"实体 + 关系 + 时间 + 概念 + 段级依赖 + 语义"六维图。

具体漏检场景:
- 改 `worldview/rules.md` 加"此世界没有手机" → entity_refs 表无可查条目 → cascade 默默通过 → 后续章节继续"掏手机"
- 改 `lin.md` 加 `mentor: char_zhang` → 当前 character.md frontmatter 无 relations 字段 → 关系类 cascade 全靠 LLM 心证
- foreshadowing 锚定 ch_010 § 5 → 作者删了那段 → 没有 dependencies 表 → 伏笔静默失效
- "林川 ch_50 时多大?" → frontmatter 是单 snapshot → 无时间轴查询能力
- Writer 写 ch_050 → 没有 assembleContext 工具 → 半瞎写,token 爆炸或漏知识
- "林川以前对女上司说过什么类似台词?" → 无 embedding → 关键词检索漏多

plan/06 §性能考虑的"按章节范围 ±5 章"是治标策略的代表 — 改了核心设定影响在 ch_50 / ch_100,默认 ±5 漏掉,但根因不是性能,是 schema 漏。

用户明确:**不要表面方案,要做地基**。

## 本期目标

把"知识图谱"作为正式工作域,一次性完成 plan + spec 全套,W7-W10 按里程碑实施。

1. 新建 plan/11 总览
2. 新建 spec/16-21 六个详细 spec (knowledge-schema / paragraph-anchors / embeddings / impact-analysis / context-assembly / fact-query)
3. 同步修改 plan/01 / plan/04 / plan/06 / spec/01 / spec/02 / spec/05
4. 重排 W7-W10 为"知识图谱专攻"周,原计划"联网工具"延后二期 (POC mock 已够)

## 实际完成

### 新建 (7 个文档)

| 文件 | 内容要点 |
|---|---|
| `plan/11-knowledge-graph.md` | 4 层架构总览 (L1 数据 / L2 算法 / L3 工具 / L4 治理);现状漏检场景 8 类;落地里程碑 W7-W10;同类产品差异升级 |
| `spec/16-knowledge-schema.md` | 4 张新表 (entity_relations / entity_timeline / concepts + concept_refs / dependencies) 完整 SQL + zod;character.md frontmatter 升级 (initial_state / relations / reader_promises / taboos);概念抽取 LLM 流程;迁移 002 脚本;L4 治理 (Setting Lint / Plan Inconsistency Lock / Snapshot / 派生守卫) |
| `spec/17-paragraph-anchors.md` | 段级稳定 ID 算法 (heading + 内容指纹 + 邻接段对照);paragraph_anchors 表;差量 reindex 流程 (unchanged / modified / rewritten / deleted / added 5 种);事务 + 失败回滚 + reindex_failures 表 |
| `spec/18-embeddings.md` | paragraph_embeddings 表;三家 provider 对比 (BGE-M3 本地 / DeepSeek / OpenAI) + 推荐 (待用户决);增量计算;朴素 SQL + JS cosine 检索;升级到 sqlite-vss / LibSQL vector 路径 |
| `spec/19-impact-analysis.md` | analyzeImpact 工具签名;extractSemanticDelta (frontmatter / 正文 → 结构化 delta);computeImpactRadius (纯 SQL,各 delta kind 分发);LLM 二次过滤 (Pro 批 5 段);递归 cascade ≤3 层 + 半径单调下降终止;cascade_audits 表 |
| `spec/20-context-assembly.md` | assembleContext 工具签名;9-step retrieve 链路 (NER / timeline snapshot / relations active / dependencies / recent chapters / semantic / worldview / concepts);token 预算分配 (按优先级 + minTokens);Writer prompt 集成;失败降级 |
| `spec/21-fact-query.md` | queryFacts 工具签名;4 种查询模式 (entity-at / relations-of / mentions-of / semantic-search);Router discuss 模式优先级 (短 prompt 解析 + fallback);UI 查询面板 (Cmd+K) |

### 修改 (5 个既有文档)

| 文件 | 修改要点 |
|---|---|
| `plan/01-overview.md` | 不变性扩到 12 条 (新增第 9-12: 影响半径不依赖 LLM / 派生视图只读 / 未决 cascade 阻 write / 段锚点稳定);数据流图加 queryFacts / assembleContext / analyzeImpact 节点;同类产品差异表加 4 行 (知识图谱 / Cascade 影响范围 / 写章节上下文 / 边写边查);引用 plan/11 |
| `plan/04-storage-model.md` | settings/ 目录大拆分 (P0+P1+P2 全建): worldview/ outline/ 拆目录;新增 factions/ organizations/ locations/ items/ events/ timeline/ relationships/ story-lines/ foreshadowing/ chapter-arcs/ power-system/ glossary/ taboos.md themes.md reader-promises.md;每目录 _index.md;派生文件守卫;saved 副作用补"差量 reindex + frontmatter delta 同步知识图谱表 + P0 文件自动 snapshot" |
| `plan/06-cascade-and-reflection.md` | cascade 解决方案改为 Validator 调 analyzeImpact (4 step);Validator prompt 约束更新 (不再现场推);性能策略升级 (±5 章撤、entity hash 标记撤、anchor diff 短路);Reflector 频率上限段已在前轮改 (无 cap,合并按批次语义) |
| `spec/01-storage-schema.md` | 顶部文件系统约定改为引用 plan/04 拆分树;Character zod 升级到 \_schemaVersion=2;追加 §知识图谱表 (12 张表名 + 用途映射 spec);追加 §entity_refs/concept_refs 段锚化 (ALTER TABLE 增列);追加 §索引刷新流程 (差量 anchor diff) |
| `spec/02-agent-tools.md` | 工具分配表追加 §知识图谱工具 注:assembleContext → Writer / analyzeImpact → Validator / queryFacts → Router + Writer |
| `spec/05-entity-highlight.md` | 顶部说明改为 entity + concept 双索引;数据流补差量 reindex;buildAC 接受 Highlightable 类型 (entity 或 concept);Decoration 区分两种类型 (entity-mention / concept-mention,后者按 semantic 加 violation 视觉);hover 卡 Concept Hover 单独组件;追加 §Concept Violation 实时提示 |

## 关键决策

1. **拆分目录全建,不开 genreFlags** — 用户 confirm:都市流也建 power-system/,空目录用 _index.md 标"暂未使用"。一致性优于"看起来精炼"。
2. **影响半径必须 SQL 出候选,LLM 仅二次过滤** — plan/01 §不变性第 9 条上锁。任何"现场让 LLM 推这次改动会影响什么"的设计被禁止 (慢 + 漏 + 不可解释)。
3. **段锚点 ID = 文件 ID + heading hash + 内容签名** — 三段组合,小修改容忍,大段重写不容忍。corner case (改字 anchor 变) 由邻接段对照兜底。
4. **embedding 不上独立 vector DB** — POC 阶段 SQLite + JS cosine 朴素;5K-20K 段可接受,>20K 升级 sqlite-vss / LibSQL vector。不引入 Qdrant / Milvus。
5. **embedding 选型留 placeholder** — 用户"回头再说",spec/18 列三家对比 + 推荐 BGE-M3 本地 (0 边际 + 离线 + 中文 5*),fallback DeepSeek / OpenAI。
6. **递归 cascade ≤3 层 + 半径单调下降终止** — 防止"改主角性别 → 改后产生新影响 → 无限"。weight 阈值递增 (30 → 60 → 90)。
7. **派生视图 frontmatter 标 derived: true,UI 锁写** — `_matrix.md` / `character-ages.md` 等不允许用户手编辑;reindex 时自动覆盖。
8. **Plan inconsistency lock** — 有未决 cascade 时 mode=write 禁用,留逃生口"强制写作"按钮 (后台 audit log 留底)。
9. **W7-W10 重排为知识图谱专攻** — 原计划"联网工具 + Reflector 完善"延后二期,POC 联网 mock 已够。

## 下期计划

W3 启动后(spec/00 audit 完):
- **W3-W6** 仍按原计划:agent loop / settings dialog / editor 骨架 / approval flow / entity highlight 一阶版本
- **W7** L1 schema 落地 (4 张新表 + character frontmatter 升级 + zod 校验 + 迁移 002)
- **W7-W8** L2 段级 anchor + 差量 reindex + paragraph_embeddings + 概念抽取
- **W9** L3 analyzeImpact + assembleContext + Validator/Writer 接入
- **W10** L3 queryFacts + UI 查询面板 + L4 Setting Lint + Plan Lock + Snapshot + 派生守卫

每周末跑 vitest bench 实测填表 (spec/17 / spec/18 / spec/20 各自留了 bench 表)。

## 已知风险

- **段锚点稳定算法对"AI 全章重写"场景退化** — anchor diff 大概率退化为 deleted + added,锚点迁移失败,dependencies 大批 broken。缓解:UI 红色警告 + snapshot 还原入口。
- **embedding 选型未定** — 卡在 spec/18 §选型对比,W8 之前必须关掉。如果 BGE-M3 本地不接,DeepSeek embedding 是否开放需走 spec/00 audit。
- **chapter ID 字典序假设** — 设定 NNN 是 3 位 0-padded;若长篇 > 999 章溢出。POC 阶段不打算支持 >999 章,后期需迁移 4 位。
- **概念抽取依赖 LLM 单次输出稳定性** — worldview/rules.md 长内容 LLM 抽 concepts 可能漏。缓解:用户审视面板可手动添加;`callStructured` 失败重试 + defaults 兜底。
- **递归 cascade 第 3 层仍未决** — 弹"已达递归上限,剩余候选请手动处理"。POC 留逃生口,二期可加"批量延期"机制。

## 关联 commit

- `<待生成>` `docs(plan/spec/progress): knowledge graph foundation — cascade + RAG truly working (1 plan + 6 specs + 5 cross-doc syncs)`
