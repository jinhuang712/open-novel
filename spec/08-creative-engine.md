# 08 · Creative Engine

本文档定义叙事诊断、模拟读者和五大网文守则如何进入创作链路。它是创作质量与风险判断的主权文档。

## 职责边界

本篇负责:

- 五大网文守则的工程承载边界。
- 叙事力学诊断的输入、输出和使用位置。
- 模拟读者报告的非闸门性质。
- 创作质量信号如何进入审批和上下文。

本篇不负责:

- 具体 prompt 全文。
- 读者 persona 输出 schema 全表。
- UI 报告布局。
- 写作 Agent 的完整生成流程。

## 主权对象

Creative engine 拥有:

- 五大网文守则的风险定义。
- 章节级叙事指标。
- 跨章偏离信号。
- 模拟读者反馈。
- 创作质量报告。

守则可以阻断或要求确认高风险变更。模拟读者报告提供发布前反馈,默认不作为硬闸门。

## 输入、输出与依赖

输入是章节文本、故事上下文、守则配置、读者 persona 和用户目标。输出是守则风险、叙事诊断、模拟读者报告和审批可展示的解释。本篇依赖 context and query 提供创作上下文,依赖 agent runtime 执行分析,依赖 turn orchestration 决定风险如何进入审批。

## 技术路径

Writer 生成章节或改稿时,系统把守则、设定、一致性上下文和用户经验注入生成路径。Checker 做章内质量诊断,Validator 做跨章与守则风险判断,ReaderPanel 做发布前读者预演。

质量信号进入审批时必须可解释:是哪条守则、哪段文本、哪类读者或哪条叙事指标触发了风险。

## 失败语义

- 守则检测失败:高风险写入不能伪装成通过。
- 叙事诊断失败:不阻塞所有写作,但不能展示假报告。
- 模拟读者不足:报告标记为样本不足,不输出过度确定结论。
- 守则与用户明确指令冲突:进入用户确认,不由 Agent 自行裁决。

## 用户可见结果

用户看到的是章节风险、守则命中、读者预演反馈和审批卡中的解释。系统不把复杂模型评分直接当作替作者决策的闸门。

## Appendix 引用

- [appendix/json-schemas](./appendix/json-schemas.md) 维护叙事、读者和守则报告 schema。
- [appendix/prompt-templates](./appendix/prompt-templates.md) 维护相关 prompt 模板。
- [appendix/details/25-cardinal-rules](./appendix/details/25-cardinal-rules.md) 保留旧五大守则细节。
- [appendix/details/10-narrative-engine](./appendix/details/10-narrative-engine.md) 保留旧叙事引擎细节。
- [appendix/details/11-reader-personas](./appendix/details/11-reader-personas.md) 保留旧模拟读者细节。
