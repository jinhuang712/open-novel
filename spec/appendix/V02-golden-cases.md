# V02 · Golden Cases

Golden Cases 保存 LLM、叙事诊断、ReaderPanel、Humanizer 和关键工作流的样例输入输出。它是验证明细,不是行为主权文档。[S11 · Evaluation And Golden Regression](../S11-evaluation-and-golden-regression.md) 定义 golden 如何成为质量门禁。

## 归口内容

- 写作输出的结构和质量样例。
- 五大守则风险样例。
- ReaderPanel persona 聚合样例。
- Humanizer diff 样例。
- Search / Fact Query / Approval 的 E2E golden。
- Turn Recap / Activity 时间线样例。
- onboarding、settings、project library 的端到端样例。

## Golden 覆盖矩阵

| 能力 | golden case |
|---|---|
| Search / Fact Query | 角色、阵营、概念、章节命中;hover preview;来源跳转失效 |
| Discuss / Planning / Writing | 只读讨论、升级确认、章节 proposal、守则风险进入审批 |
| Prompt / Context / Tooling | prompt injection、context overflow、long-form partition、tool failure、二次 LLM 边界 |
| Harness / Evaluation | replay evidence、golden pass/warn/fail、缺 fixture 的 needs data |
| Inline Review / Humanizer | 句内表达改写、段落批阅、跨文档升级为 ChangeSet |
| Approval / Cascade | 改名 cascade、低置信搁置、部分通过、拒绝理由重做 |
| Trace / Recap | stopped recap、failed recap、applied recap、作者备注、续接动作 |
| Memory / Agent Controls | 经验候选、调权、关闭、删除、agent 开关影响 |
| ReaderPanel / S12 Creative Engine | persona 分歧、inconclusive、确认级/阻断级风险 |
| Settings / Onboarding / Library | 首启开书、样例项目、danger action、项目切换隔离 |
| platform/Rxx | backup restore、migration failure、index repair、diagnostic export |
| Long-form ability gate | 影响分析召回/精确、分段 delta 稳定性、cascade 成本/延迟 preflight |

## 长篇能力 gate fixture

P1-43 对应的 golden 不追求“模型写得好”,而是证明系统能不能知道自己是否覆盖了长篇影响范围。

| fixture | 必须覆盖 | 通过后回写 |
|---|---|---|
| 角色设定跨卷修改 | 改名、别名、关系、状态和 as-of 章节的受影响锚点;记录漏召回和误召回 | S07 影响分析链,S06 entity/relation/timeline |
| 能力代价或世界规则修改 | 直接设定、隐性伏笔、承诺兑现、禁忌冲突和低置信候选 | S07 dependency 规则,S12 守则风险 |
| 大段正文重写 | 分段 delta 的重复运行稳定性、锚点迁移和冲突解释 | S07 delta 策略,S06 anchor/reindex |
| 中等规模 cascade | 章节批次、context 装配、模型调用次数、stream 心跳、用户 checkpoint | S07 overflow/cascade 策略 |
| 全书级 cascade | 成本、耗时、失败恢复、分批审批和不能一次完成时的用户解释 | S07/S12 降级语义,后续成本契约 |

这些 fixture 没有原始 spike 证据时,对应 golden 状态应是 `needs data`,不能标记 pass。

## 边界

golden 可以帮助回归,但不能替代根层 spec。若 golden 与 spec 冲突,以 spec 为准并更新 golden;若 prompt/context/tool/runner 改动没有可判断的 golden 或 replay evidence,按 [S11](../S11-evaluation-and-golden-regression.md) 的 `needs data` 处理。
