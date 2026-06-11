# 03 · Agent Runtime

本文档定义 Agent 如何被调用、如何使用工具、如何输出结构化结果。它是模型调用和 Agent runner 的主权文档,不展开 prompt 全文、工具参数全表或 JSON Schema。

## 职责边界

本篇负责:

- Agent runner 的调用路径。
- 工具调用的安全边界。
- 结构化输出与自然语言输出的统一失败语义。
- prompt、工具、JSON、流式事件之间的分工。

本篇不负责:

- 具体 turn 编排。
- 项目数据表结构。
- UI 布局和快捷键。
- prompt 模板全文。

## 主权对象

Agent runtime 拥有:

- 对外 Agent 与内部辅助 Agent 的调用边界。
- 模型选择和调用入口。
- 工具执行边界。
- 结构化输出解析、校验、重试和升级语义。
- prompt 片段的组织方式。

Agent runtime 不拥有“是否把变更写入作品”的最终决定。需要落盘的动作必须交给 turn orchestration 和审批路径。

## 输入、输出与依赖

输入是用户意图、上下文包、prompt 片段、工具结果和模型响应。输出是自然语言回复、结构化动作、报告、提议或可解释失败。本篇依赖 context and query 提供上下文,依赖 turn orchestration 接收可落盘提议,依赖 appendix 维护工具、prompt 和 schema 明细。

## 技术路径

系统使用自定义 runner 执行 Agent。Router 负责把用户意图解析为动作;Writer、Checker、Validator、Reflector、Humanizer、ReaderPanel 等角色按职责生成提议、报告或经验。

Agent 工具分两类:

- 读取工具:读取作品事实、上下文、设定、检索结果。
- 提议工具:构造变更提议,不能绕过审批直接写入作品。

结构化输出统一经过同一条校验路径。输出不合法时,系统先做有限重试;重试仍失败则升级为可解释失败,不得使用静默 fallback 伪造成功。

## Prompt 原则

prompt 只承载角色目标、模式约束、上下文摘要、输出要求和安全边界。不可信内容必须被围栏隔离,不能被当作系统指令执行。

prompt 全文和可复用片段属于 appendix;核心 spec 只说明 prompt 的职责和注入顺序。

## 失败语义

- 模型调用失败:当前 Agent 失败,turn orchestration 决定是否重试、取消或交给用户。
- 工具调用失败:工具结果不得伪造;Agent 只能基于明确失败继续或停止。
- JSON 校验失败:进入统一重试和升级路径。
- prompt 超出能力边界:不能自动裁掉关键一致性信息,必须显式失败或走上下文设计回退。

## 用户可见结果

用户看到的是 Agent 正在做什么、输出是否可信、失败原因是否可解释、需要自己确认什么。用户不需要看到工具参数全表,但系统必须能解释某个 Agent 为什么不能继续。

## Appendix 引用

- [appendix/tool-catalog](./appendix/tool-catalog.md) 维护工具清单和参数明细。
- [appendix/json-schemas](./appendix/json-schemas.md) 维护结构化输出 schema。
- [appendix/prompt-templates](./appendix/prompt-templates.md) 维护 prompt 模板全文。
- [appendix/details/02-agent-tools](./appendix/details/02-agent-tools.md) 保留旧 Agent 工具细节。
- [appendix/details/24-json-output](./appendix/details/24-json-output.md) 保留旧 JSON 输出细节。
