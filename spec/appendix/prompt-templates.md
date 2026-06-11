# Appendix · Prompt Templates

本 appendix 是 prompt 模板全文、公共片段和示例的归口。根层 spec 定义 prompt 的职责、注入顺序、安全边界和失败语义。

## 归口内容

- stable header 公共片段。
- 不可信内容围栏。
- Router、Writer、Validator、Checker、Reflector、Humanizer、ReaderPanel prompt。
- JSON retry prompt。
- 五大守则、叙事诊断、persona prompt。
- 风格范文分析片段。

## 对应核心文档

- [03 Agent Runtime](../03-agent-runtime.md)
- [07 Context And Query](../07-context-and-query.md)
- [08 Creative Engine](../08-creative-engine.md)
- [09 Style And Humanizer](../09-style-and-humanizer.md)

## 边界

prompt 文案可以在 appendix 迭代。若 prompt 变化改变 Agent 职责、审批边界、写入权限、上下文优先级或失败处理,必须同步根层 spec。
