# 09 · Style And Humanizer

本文档定义去 AI 味、人味改写和风格守恒的技术边界。它说明润色能力如何参与创作,以及它不能越过哪些红线。

## 职责边界

本篇负责:

- Humanizer 在创作链路中的位置。
- 风格改写与事实守恒的边界。
- 去 AI 味失败时的处理方式。

本篇不负责:

- 章节创作主流程。
- 五大守则的风险定义。
- prompt 模板全文。
- 具体文本改写 schema。

## 主权对象

Style and humanizer 拥有:

- 人味改写请求。
- 风格约束。
- 改写前后差异说明。
- 不改事实、不改设定、不绕审批的约束。

Humanizer 是润色能力,不是事实修改能力。它不能借“润色”修改人物设定、剧情结果、关系状态或世界规则。

## 输入、输出与依赖

输入是待润色文本、用户风格偏好、章节语境和不可改事实约束。输出是改写建议、差异说明、风险提示或失败结果。本篇依赖 creative engine 的质量边界、context and query 的事实约束,以及 turn orchestration 的审批路径。

## 技术路径

Humanizer 接收已经有明确内容边界的文本,按用户风格偏好和章节语境做表达层改写。改写结果需要保留原事实、原剧情意图和已审批约束。

当改写可能影响事实或守则风险时,结果进入审批或 Validator 复核,不能直接替换作品内容。

## 失败语义

- 改写改变事实:结果作废或进入人工确认。
- 风格不稳定:保留原文,用户可要求重试。
- 模型输出不可解析:不写入作品。
- 与用户经验冲突:以用户当前显式指令优先。

## 用户可见结果

用户看到的是改写建议、差异说明和是否需要确认。系统不把“更像人写的”当成可以绕过事实一致性的理由。

## Appendix 引用

- [appendix/prompt-templates](./appendix/prompt-templates.md) 维护 Humanizer prompt。
- [appendix/json-schemas](./appendix/json-schemas.md) 维护改写输出明细。
- [appendix/details/08-de-ai-pipeline](./appendix/details/08-de-ai-pipeline.md) 保留旧去 AI 化 pipeline 细节。
