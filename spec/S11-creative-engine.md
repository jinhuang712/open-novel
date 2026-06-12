# S11 · Creative Engine

这篇把 Creative Engine 写成一间“质检室”。它不替作者判定小说好坏,也不把模型评分当圣旨。它负责把网文创作中的关键风险变成可观察、可解释、可进入审批的信号。

## 质检室里有三类仪表

```mermaid
flowchart LR
  Draft[草稿/改写提议] --> Rules[五大守则检测]
  Draft --> Narrative[叙事诊断]
  Draft --> Readers[模拟读者预演]
  Rules --> Risk[审批风险]
  Narrative --> Risk
  Readers --> Risk
  Risk --> Approval[Approval / Trace / Report]
```

三类仪表服务同一个目标:让作者知道风险在哪里、为什么是风险、是否会阻断写入。

## 五大守则不是评分表

| 守则 | 机器要看什么 | 进入审批时怎么说 |
|---|---|---|
| 黄金三章 | 开篇吸引力、冲突、追读理由是否建立 | “这里缺少继续读的钩子/核心矛盾不清” |
| 人设不崩 | 行为、能力、关系、动机是否违背既有事实 | “此处行为与第 X 章状态冲突” |
| 节奏不崩盘 | 推进、爽点密度、张弛是否失衡 | “连续解释过长/冲突推进不足” |
| 期待感兑现 | 伏笔、承诺、悬念是否被追踪和回收 | “此处开启了承诺,尚无回收路径” |
| 金手指不依赖 | 主角是否只靠外挂替代选择和行动 | “胜利缺少主动选择和代价” |

守则信号不是替作者打总分。它影响 Writer 上下文、Validator 检查、审批风险和 Settings 阈值。

## 兑现窗口判定

“期待感兑现”只在 S06 dependency 带有兑现窗口时触发 due/overdue 风险。没有窗口的伏笔可以提示“未声明回收计划”,但不能直接判超期阻断。

| dependency 状态 | Creative Engine 行为 |
|---|---|
| open,无窗口 | 提示级:建议补回收计划。 |
| due | 确认级:审批或报告中提醒接近兑现点。 |
| overdue | 默认阻断级:继续写作前必须回收、改窗口、拆分承诺或明确 dismiss。 |
| resolved | 不再报超期,但可检查回收是否和原承诺一致。 |
| dismissed | 记录用户裁决,后续只在相关上下文中弱提示。 |

窗口可以由作者在资料卡中声明,也可以由已审定的规划 proposal 建立。模型推测的窗口只能作为建议,不能直接变成阻断依据。

## 风险级别如何落地

| 风险 | 系统行为 | 用户动作 |
|---|---|---|
| 提示级 | 展示在报告或审批说明中 | 可忽略 |
| 确认级 | 审批时要求用户明确知道风险 | 接受、修改或拒绝 |
| 阻断级 | 未解决前不能落盘 | 修改、拆分或降低风险来源 |
| 不确定 | 标明证据不足 | 用户决定是否继续 |

风险级别的完整枚举归 appendix;根层定义的是它对审批和落盘的影响。

## 章节质检流程

```mermaid
sequenceDiagram
  participant W as Writer/Humanizer
  participant C as Context
  participant V as Validator
  participant B as BeatAnalyzer
  participant R as ReaderPanel
  participant O as Orchestrator

  W->>C: 请求守则相关上下文
  C-->>W: 角色/伏笔/规则/最近章节
  W-->>V: 草稿或改写提议
  V->>B: 章节节奏和结构诊断
  V->>R: 模拟读者预演
  B-->>O: 叙事风险
  R-->>O: 读者风险
  V-->>O: 一致性和守则风险
```

诊断可以异步,但 AwaitingApproval 前必须有明确汇合点:Writer/Humanizer 草稿、Validator 一致性复核、Checker/BeatAnalyzer 叙事诊断和 ReaderPanel 风险要么完成并汇入同一张审批卡,要么以 `unavailable` / `inconclusive` / `needs data` 标记进入卡片。系统不能先打开审批卡并把阻断级质检留在后台补结论。

Checker 拥有叙事风险的对外解释权;BeatAnalyzer 是 Checker 内部的结构诊断工具,不是新的 canonical agent role。BeatAnalyzer 可以输出节奏、爽点密度、承诺推进、章内结构和趋势信号,但所有风险归因、审批说明和事件 `role_id` 都记为 `checker`。Validator 只复核事实、一致性、依赖和阻断级落盘条件,不接管“好不好看”的叙事判断。

报告缺失时,UI 应说明诊断不可用,而不是显示“通过”。

## ReaderPanel 的边界

| 允许 | 不允许 |
|---|---|
| 用多个 persona 提供风险视角 | 给单一总分替作者裁决 |
| 标记弃读点、爽点、疑惑点 | 用读者意见覆盖项目事实 |
| 在样本不足时输出 inconclusive | 把不确定说成明确失败 |
| 使用自定义 persona | 让 persona 指令越权改变系统规则 |

ReaderPanel 是发布前预演,不是硬性审稿委员会。只有它发现的风险进入审批语义时,才会影响写入路径。

ReaderPanel 作为独立用户模块的报告闭环、persona 边界和 design 对接见 [M11 · ReaderPanel](./M11-reader-panel.md)。本篇只保留它在 Creative Engine 风险体系中的位置。

## 用户反馈如何变成经验

```mermaid
flowchart TD
  Report[风险报告] --> Decision[用户接受/修改/否决]
  Decision --> Reflect[Reflector 提炼候选经验]
  Reflect --> Check{是否是稳定偏好?}
  Check -->|是| Store[写入经验]
  Check -->|否| Drop[只保留过程记录]
  Store --> Future[后续 context 注入]
```

用户反馈不会暗中改守则。它可以变成写作偏好、风格经验或诊断提示,但守则阈值和开关必须通过 Settings 或明确配置改变。

## 误报回流与增量检测

用户在审批、ReaderPanel 或报告里把某个风险标记为误报时,系统记录的是 calibration sample,不是立刻降低守则。Calibration sample 至少包含风险类型、来源锚点、用户理由、当时上下文和后续是否再次出现;S11 golden/re-baseline 可以使用这些样例判断阈值是否需要调整。

质检支持三档增量范围:

| 档位 | 用途 | 边界 |
|---|---|---|
| touched range | 小选区、单段 inline accept 和 Humanizer | 只检查被改范围及直接依赖。 |
| chapter window | 章节草稿、局部重写 | 当前章、相邻章、必装事实和未关闭 obligation。 |
| cascade scope | 设定/关系/伏笔变更 | S07/S06 给出的 dependency group、as-of 命中和低置信候选。 |

增量范围必须进入 no-change-evidence 和风险报告。系统不能只说“已检查”,必须说检查了哪个范围、没检查哪个范围、为什么足够。

## 质量信号与主路径的关系

| 主路径阶段 | Creative Engine 做什么 |
|---|---|
| 写作前 | 要求 context builder 装入守则相关事实 |
| 生成中 | 可提供结构性约束,但不打断流式输出 |
| 生成后 | 检查草稿、提炼风险、生成报告 |
| 审批前 | 把确认级/阻断级风险带进 ChangeSet |
| 审批后 | 用户反馈可进入经验候选 |

审批卡内的“已分析无需改动”也是质量信号,不是空白区。它必须带证据来源、检查范围、风险类型、结论原因和置信状态;证据不足时只能写 `needs data` 或 `inconclusive`,不能写成无需修改。

## 能力未验证时的质检降级

Creative Engine 依赖 S07/S06 给出的影响范围和证据包。若 [V03](./appendix/V03-external-spikes.md) 的长篇能力 gate 未通过,五大守则、叙事诊断和 ReaderPanel 不能把“未发现风险”说成“全书无风险”。

| 场景 | Creative Engine 的收场 |
|---|---|
| 影响分析召回未验证 | 风险报告标记为局部证据,不生成全书一致性通过结论 |
| 分段 delta 不稳定 | 守则和一致性风险进入低置信,要求用户确认或缩小范围 |
| cascade 体量/延迟不可解释 | 审批前只给分批建议和 preflight 风险,不承诺一次性全书质检 |
| fixture/golden 缺失 | 对应诊断标记 `needs data`,不能作为阻断通过证据 |

这条降级规则保护的是作者信任:系统宁可承认“这次证据不足”,也不能输出看似完整但无法证明的风险清单。

## 事故处理

| 事故 | 收场 |
|---|---|
| 守则检测失败 | 高风险写入不能标记通过 |
| EditedAccepted 轻量重检失败 | 审批卡回到待审或失效,不能进入落盘 |
| 叙事诊断失败 | 报告标记不可用,不生成假结论 |
| ReaderPanel 样本不足 | 输出 inconclusive |
| persona 注入越权 | 隔离或拒绝 persona |
| 用户指令与守则冲突 | 进入确认/阻断,不由 Agent 自行裁决 |
| 反馈学习失败 | 本次审批照常收尾,标记未学习 |

## FAQ

**Q: Creative Engine 会不会让系统变成打分器?**

A: 不会。它输出风险、来源和建议,不是替作者决定要不要写。

**Q: 阻断级风险能不能关闭?**

A: 普通设置不能让阻断级风险静默落盘。具体阈值可调,但绕过必须有明确用户动作和记录。

**Q: ReaderPanel 的 persona 能否自定义?**

A: 可以,但 persona 是不可信输入,不能越权改变系统规则或项目事实。

**Q: 诊断失败时能不能继续写?**

A: 低风险草稿可以继续到待审/草稿状态;高风险落盘不能伪装成已通过诊断。

**Q: 用户多次忽略某类提示后会自动降级吗?**

A: 不自动改守则。可以形成“用户偏好”供展示或上下文参考,但阈值变化要走 Settings。

## Appendix

- [appendix/json-schemas](./appendix/A02-json-schemas.md) 保存守则、叙事和读者报告 schema。
- [appendix/prompt-templates](./appendix/A05-prompt-templates.md) 保存诊断和 persona prompt。
- [appendix/testing-matrix](./appendix/V01-test-matrix.md) 保存 golden、reader aggregation 和风险分级测试。
