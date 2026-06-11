# 07 · Context And Query

本文档定义系统如何为 Agent 装配上下文、分析影响范围、回答事实查询。它是 L4 知识检索到 L1 工作记忆之间的桥。

## 职责边界

本篇负责:

- 影响分析的职责边界。
- 上下文装配的优先级和失败语义。
- 用户事实查询与 Agent 内部检索的关系。
- 上下文溢出时的处理原则。

本篇不负责:

- 知识图谱底层索引生成。
- Agent 输出校验。
- UI 查询浮层视觉。
- 完整工具参数表。

## 主权对象

Context and query 拥有:

- impact analysis 结果。
- context package。
- fact query 结果。
- 每类 Agent 的上下文需求。
- context overflow 语义。

它不拥有项目事实本身。它只能读取、筛选、组织和解释事实。

## 输入、输出与依赖

输入是 Agent 任务、用户查询、变更 delta、知识图谱结果、会话历史和长期经验。输出是上下文包、影响范围、事实查询答案和 overflow 失败。本篇依赖 knowledge graph 提供可检索事实,依赖 runtime state 提供历史和经验,并为 agent runtime 与 turn orchestration 提供依据。

## 技术路径

当用户提问、Agent 写作或系统执行 cascade 时,context builder 根据当前任务装配上下文。装配来源包括项目事实、知识图谱、近期会话、长期经验、章节摘要和语义召回。

一致性所需数据优先于成本节流。系统不能为了省 token 静默裁掉关键设定、红线、承诺或已知冲突。确实无法装下时,进入显式 overflow 失败或用户可理解的分步处理。

影响分析先用确定性规则找半径,再用模型判断是否真正受影响。模型只做复核和解释,不拥有影响半径主权。

用户查询使用同一批事实来源,但输出面向解释和跳转,而不是直接驱动写入。

## 失败语义

- 影响分析不确定:升级为用户确认或保守扩大审查范围。
- 上下文缺关键事实:当前 Agent 不继续生成高风险内容。
- 语义检索失败:退回精确事实查询和显式提示。
- context overflow:不静默裁剪关键约束,记录为待设计或要求拆分处理。

## 用户可见结果

用户看到的是查询答案、影响范围、生成依据和需要确认的风险。系统必须能说明“为什么这段内容被纳入上下文”或“为什么某次改动影响这些位置”。

## Appendix 引用

- [appendix/tool-catalog](./appendix/tool-catalog.md) 维护 analyzeImpact、assembleContext、queryFacts 等工具明细。
- [appendix/json-schemas](./appendix/json-schemas.md) 维护影响分析和查询输出 schema。
- [appendix/details/19-impact-analysis](./appendix/details/19-impact-analysis.md) 保留旧影响分析细节。
- [appendix/details/20-context-assembly](./appendix/details/20-context-assembly.md) 保留旧上下文装配细节。
- [appendix/details/21-fact-query](./appendix/details/21-fact-query.md) 保留旧事实查询细节。
- [appendix/details/23-context-contracts](./appendix/details/23-context-contracts.md) 保留旧 per-agent 上下文细节。
