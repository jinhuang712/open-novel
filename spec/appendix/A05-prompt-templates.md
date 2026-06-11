# A05 · Prompt Templates

本 appendix 是 prompt 模板全文、公共片段和示例的归口。根层 spec 定义 prompt 的职责、注入顺序、安全边界和失败语义。

## 归口内容

- stable header 公共片段。
- 不可信内容围栏。
- Router、Writer、Validator、Checker、Reflector、Humanizer、ReaderPanel prompt。
- Discuss Mode prompt 和 Search-to-Discuss 转问答片段。
- JSON retry prompt。
- 五大守则、叙事诊断、persona prompt。
- 风格范文分析片段。

## 对应核心文档

- [S03 Agent Runtime](../S03-agent-runtime.md)
- [S07 Context And Query](../S07-context-and-query.md)
- [S08 Creative Engine](../S08-creative-engine.md)
- [S09 Style And Humanizer](../S09-style-and-humanizer.md)
- [M04 Discuss Mode](../M04-discuss-mode.md)
- [M11 ReaderPanel](../M11-reader-panel.md)

## 实现前 prompt 覆盖矩阵

| prompt 族 | 必须固定的边界 |
|---|---|
| Router | 只输出动作,不自行执行写入;非法动作必须结构化失败 |
| Writer / Planning | 只生成 proposal 或草稿,不绕过审批落盘 |
| Validator / Checker | 输出风险、证据和低置信说明,不替作者裁决 |
| Humanizer | 只改表达层,剧情/事实/设定变化必须升级 |
| ReaderPanel | persona 只能给读者视角,不能改系统规则或项目事实 |
| Reflector | 只从作者审定或明确反馈学习,停止/放弃/拒绝不自动变经验 |
| Discuss | 只读回答,升级到 Planning/Writing 必须由用户确认 |
| JSON retry | 只要求修复结构化输出,不能扩大权限或改变原意 |

## 边界

prompt 文案可以在 appendix 迭代。若 prompt 变化改变 Agent 职责、审批边界、写入权限、上下文优先级或失败处理,必须同步根层 spec。
