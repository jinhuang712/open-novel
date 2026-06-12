# S06 · Knowledge Graph

这篇解释系统如何把小说正文和设定变成可查询、可引用、可用于一致性判断的知识图谱。它不是第二份小说,也不是模型总结出的“真相库”。它是从作者事实派生出来的一组索引。

## 从一段正文到可用事实

```mermaid
flowchart LR
  Paragraph[正文段落] --> Anchor[段落锚点]
  Anchor --> Mention[实体/概念引用]
  Mention --> Entity[实体和别名]
  Mention --> Concept[世界规则/能力/禁忌]
  Entity --> Relation[关系/状态/时间线]
  Concept --> Dependency[伏笔/承诺/依赖]
  Anchor --> Embedding[语义向量]
  Relation --> Query[查询/上下文/cascade]
  Dependency --> Query
  Embedding --> Query
```

每条派生事实都应能追溯到作者文件、审批记录或段落锚点。追溯不清的内容不能作为高风险生成依据。

## 图谱里的对象

| 对象 | 回答的问题 | 典型用途 |
|---|---|---|
| entity | 谁/哪里/什么东西 | 高亮、关系、状态查询 |
| alias | 同一个对象有哪些叫法 | 召回和消歧 |
| concept | 世界规则、能力体系、禁忌、设定约束是什么 | 守则和一致性检查 |
| relation | 两个对象是什么关系 | 角色关系、阵营、敌友变化 |
| timeline | 某对象什么时候发生了什么 | 章节连续性 |
| dependency | 哪些伏笔/承诺/禁忌依赖哪些文本 | cascade 和兑现检查 |
| anchor | 事实落在哪个文件哪段 | 跳转、引用、内部恢复 |
| embedding | 哪些段落语义相关 | 语义召回 |

对象定义的字段明细不在根层。根层只定义它们的职责和失败后果。

## 时点、卷和兑现窗口

图谱查询必须能按章节时点回答。relation、timeline、dependency 和 entity state 都要带来源章节、有效起止或至少可比较的 chapter order;否则只能作为低置信提示,不能支撑前文改写。

卷/册 summary 是派生索引对象,来源于 S01 的作者文件结构和章节范围。它服务 S07 的 long-form partition,但不能成为比原文更高的事实源。卷边界变更会使对应 summary、跨卷依赖和 volume arc 健康度 stale。

伏笔和承诺 dependency 必须允许声明兑现窗口:

| 字段 | 行为意义 |
|---|---|
| opened_at | 伏笔/承诺首次建立的来源锚点。 |
| expected_window | 预计兑现章节、卷内阶段或明确截止点。 |
| latest_safe_point | 超过后会触发确认级或阻断级风险的位置。 |
| resolved_at | 审定后的回收/兑现来源。 |
| status | open、due、overdue、resolved、dismissed。 |

没有 expected window 的伏笔不能触发“超期”阻断,只能提示“未声明兑现窗口”。一旦用户或审批明确给出窗口,S12 可以用 due/overdue 判定期待感兑现风险。

## 实体身份治理

entity 身份是图谱主权对象,不是展示层临时猜测。同名、别名、改名和误合并必须有可追踪治理动作:

| 动作 | 适用场景 | 结果 |
|---|---|---|
| 确认别名 | 用户确认“青岚”“岚儿”指同一对象 | alias 进入已确认状态,后续召回可作为高置信证据 |
| 合并实体 | 抽取或用户发现两个 entity 实为同一对象 | 生成可审批派生修正,保留被合并 id 的历史映射 |
| 拆分实体 | 同名角色、地点或组织被误并 | 生成可审批派生修正,重分配 mention/relation/timeline |
| 改名 | 作者审定对象名称变化 | 新名成为当前显示名,旧名默认降级为历史别名 |

这些动作不能直接改正文。它们改变的是图谱身份、别名状态和后续召回证据,因此必须带来源、影响范围和审批记录。改名 cascade 若同时替换正文称谓,正文写入仍走 M08 ChangeSet;图谱只记录身份连续性。

误并/误拆是高风险索引事故。R04 可以重建派生索引,但不能替用户裁决实体身份;没有用户确认或审批记录时,系统只能把候选标为歧义,不能自动合并。

## 事实优先级

```mermaid
flowchart TB
  A[作者文件/直接编辑] --> B[审批通过并落盘的 ChangeSet]
  B --> C[明确设定快照]
  C --> D[派生抽取结果]
  D --> E[语义召回提示]
```

越上层越权威。派生抽取不能覆盖作者文件;embedding 只能提示相关段落,不能单独断言事实。

## Reindex 是维护健康度,不是重写作品

```mermaid
stateDiagram-v2
  [*] --> Healthy
  Healthy --> Dirty: file/change applied
  Dirty --> Anchoring: update paragraph anchors
  Anchoring --> Extracting: mentions/concepts/relations
  Extracting --> Embedding: semantic index
  Embedding --> Healthy
  Anchoring --> Partial: anchor drift
  Extracting --> Partial: extraction conflict
  Embedding --> Partial: embedding failure
  Partial --> Dirty: retry requested
  Partial --> Healthy: repaired
```

局部 reindex 优先。能保留的锚点保留,小幅编辑迁移,大幅重写或删除导致相关引用失效。

## 锚点失稳的连锁反应

| 锚点状态 | 查询 | 高亮/旁注 | 影响分析 | Agent 写作 |
|---|---|---|---|---|
| healthy | 正常返回来源 | 正常展示 | 可用 | 可作为上下文 |
| migrated | 返回新位置并记录迁移 | 正常或轻提示 | 可用但记录版本 | 可用 |
| stale | 标记低置信 | 弱化/隐藏 | 保守扩大范围 | 高风险任务需补证据 |
| missing | 不返回为可靠来源 | 不展示 | 需重建或人工确认 | 不作为关键事实 |

段落锚点是图谱可信度的地基。锚点不稳,下游必须跟着降级。

锚点、差量 reindex 和 paragraph embeddings 必须一起验证。任何会改变段落切分、锚点迁移或 embedding 刷新策略的实现,都要在 [V01](./appendix/V01-test-matrix.md) 覆盖 mutation 测试;涉及 native binding、watcher 或 provider 行为时,原始证据进入 [V03](./appendix/V03-external-spikes.md)。

## 冲突不是自动修复信号

如果抽取发现“同一角色在同一时间既失明又正常视物”,系统不能自动改正文。它应该:

1. 保留作者文件事实。
2. 记录冲突来源和段落锚点。
3. 把冲突交给一致性报告或审批。
4. 等用户决定是否修改。

图谱的职责是发现和解释冲突,不是替作者裁决设定。

## 谁消费图谱

| 消费方 | 使用方式 | 失败时降级 |
|---|---|---|
| Context Management | 装配事实、查询来源、语义召回 | 缺失关键事实则阻断高风险 Agent |
| Turn Orchestration | cascade 候选范围、审批冲突 | 低置信候选进入审批 |
| Creative Engine | 守则、人设、伏笔兑现 | 不展示假通过 |
| Editor Interaction | 高亮、旁注、跳转 | 弱化或隐藏过期提示 |
| Project Storage | 文件变更后触发 reindex | 作品事实保留,索引过期 |

## 影响分析证据门槛

图谱可以提供 entity、relation、timeline、dependency、anchor 和 embedding 候选,但它们能否支撑“全书连带改”必须由 [V03](./appendix/V03-external-spikes.md) 的长篇能力 spike 证明。未通过前,图谱输出只能作为候选证据,不能宣称已经覆盖全部受影响位置。

| 证据能力 | 必须被 spike 覆盖 | 不达标时的降级 |
|---|---|---|
| entity / alias 召回 | 改名、别名、称谓变化能跨章节找回相关锚点 | 要求用户确认别名或限制在显式命中范围 |
| relation / timeline | 关系、状态、时间点变化能按 as-of 语义返回正确候选 | 高风险写作阻断或进入低置信审查 |
| dependency | 伏笔、承诺、禁忌和世界规则能被关联到来源段落 | cascade 只处理已声明依赖,未声明部分改为提示 |
| embedding | 语义相似段落能补召回但不制造无来源事实 | 语义召回只作为补充,不进入主权候选 |

如果 spike 暴露系统性漏召回,应先重设计图谱对象、锚点粒度或依赖声明方式,再恢复高风险 cascade。

Embedding 模型、维度和索引版本必须来自 I01/V03。模型未知或维度未落定时,embedding 对象处于 `needs data`;语义搜索、相似桥段和补召回必须降级为不可用或低置信,不能提前落地不可迁移的向量表结构。

## 事故表

| 事故 | 系统状态 | 用户可见 |
|---|---|---|
| embedding provider 不可用 | 语义召回降级 | 精确查询仍可用,语义结果不足 |
| entity 抽取冲突 | 图谱局部 partial | 冲突报告带来源 |
| 派生写入越权 | 操作阻断 | 错误提示和 trace |
| 索引健康度过低 | 高风险生成阻断或要求确认 | “当前索引不足以保证一致性” |
| 旧锚点指向删除段落 | 相关引用失效 | 跳转/高亮不可用 |

## FAQ

**Q: 图谱里的事实会不会比正文更新?**

A: 不应该。图谱派生自正文和审批后事实。它可以标记待刷新,不能超前改写事实。

**Q: embedding 找到的段落能不能直接当证据?**

A: 不能。embedding 只是召回方式;证据必须回到原文段落、设定文件或审批记录。

**Q: 为什么关系、时间线和依赖都需要?**

A: 它们回答不同问题:关系说明对象连接,时间线说明变化顺序,依赖说明改一处会影响哪些承诺和伏笔。

**Q: reindex 失败时写作要全部停止吗?**

A: 不一定。低风险讨论可继续;依赖完整一致性的写作、cascade、守则判断需要阻断或降级。

**Q: 图谱是否允许人工修正?**

A: 可以通过作者文件或明确设置/审批修正主权事实;不应直接手改派生索引来制造真相。

## Appendix

- [appendix/schema-tables](./appendix/A01-schema-tables.md) 保存知识图谱、锚点、embedding 和派生索引表结构。
- [appendix/tool-catalog](./appendix/A04-tool-catalog.md) 保存 reindex、查询和索引工具明细。
