# V02 · Golden Cases

Golden Cases 保存 LLM、叙事诊断、ReaderPanel、Humanizer 和关键工作流的样例输入输出。它是验证明细,不是行为主权文档。

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
| Inline Review / Humanizer | 句内表达改写、段落批阅、跨文档升级为 ChangeSet |
| Approval / Cascade | 改名 cascade、低置信搁置、部分通过、拒绝理由重做 |
| Trace / Recap | stopped recap、failed recap、applied recap、作者备注、续接动作 |
| Memory / Agent Controls | 经验候选、调权、关闭、删除、agent 开关影响 |
| ReaderPanel / Creative Engine | persona 分歧、inconclusive、确认级/阻断级风险 |
| Settings / Onboarding / Library | 首启开书、样例项目、danger action、项目切换隔离 |
| platform/Rxx | backup restore、migration failure、index repair、diagnostic export |

## 边界

golden 可以帮助回归,但不能替代根层 spec。若 golden 与 spec 冲突,以 spec 为准并更新 golden。
