# Appendix · JSON Schemas

本 appendix 索引结构化输出、报告对象和可机器校验的 schema 明细。核心 spec 只定义输出语义、失败策略和主权边界。

## 结构化输出

- [details/24-json-output](./details/24-json-output.md) 保存统一 JSON 输出、校验、重试和失败升级细节。
- [details/02-agent-tools](./details/02-agent-tools.md) 保存 Agent 工具返回形态和内部调用旧细节。

## 创作报告

- [details/10-narrative-engine](./details/10-narrative-engine.md) 保存叙事诊断输出旧细节。
- [details/11-reader-personas](./details/11-reader-personas.md) 保存模拟读者报告旧细节。
- [details/25-cardinal-rules](./details/25-cardinal-rules.md) 保存五大守则机器化报告旧细节。

## 影响分析与上下文

- [details/19-impact-analysis](./details/19-impact-analysis.md) 保存影响分析结构化结果旧细节。
- [details/20-context-assembly](./details/20-context-assembly.md) 保存上下文装配输出旧细节。
- [details/21-fact-query](./details/21-fact-query.md) 保存事实查询输出旧细节。

## 使用边界

schema 变化如果改变 retry、blocking、approval 或用户可见结果,必须同步更新核心 spec;否则保留在本 appendix。
