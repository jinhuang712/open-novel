# I01 · LLM Provider Contract

LLM Provider Contract 定义 Open Novel 如何接入模型服务。它不决定产品能力,而是证明模型边界真的支持 [S03 Agent Runner](../S03-agent-runner.md)、[S08 Prompt System](../S08-prompt-system.md)、[S10 LLM Quality Harness](../S10-llm-quality-harness.md) 和 [S11 Evaluation](../S11-evaluation-and-golden-regression.md) 需要的调用形态。

## 集成边界

| 能力 | 必须确认 |
|---|---|
| Text generation | 普通自然语言输出稳定 |
| JSON mode | 结构化输出可校验、可 retry |
| Streaming | token/step/error 可映射到 [S05](../S05-streaming-ui-protocol.md) |
| Context length | 支持长篇上下文策略 |
| Prompt cache / stable header | cache 字段或稳定 prompt header 降级可被 S08/S10 记录 |
| Replay evidence | provider 响应、错误和成本能进入 harness |
| Provider fallback | 降级必须显式,不能静默换模型 |

## 审计流

```mermaid
flowchart LR
  Need[模型能力需求] --> Spike[V03 外部 spike]
  Spike --> Result{通过?}
  Result -->|是| Contract[记录能力契约]
  Result -->|否| Route[路线调整]
  Contract --> Runtime[S03 Agent Runner]
  Contract --> Harness[S10 Harness]
```

## 失败收场

| 失败 | 处理 |
|---|---|
| JSON mode 不可用 | 结构化 Agent 不上线或改路线 |
| streaming 缺事件 | UI 不声明可恢复细粒度状态 |
| 模型 ID 不可用 | 阻断配置,不静默替换旧模型 |
| cache 字段不识别 | 降级为稳定 prompt 头部 |

## Appendix

版本和 spike 记录归 [A06](../appendix/A06-migration-notes.md) 与 [V03](../appendix/V03-external-spikes.md)。

## FAQ

**Q: Provider 不满足某个能力时能不能临时换模型?**

A: 不能静默替换。降级或换模型会改变成本、上下文和输出稳定性,必须写入配置状态和 Trace。

**Q: 为什么 provider contract 不写完整 API 参数?**

A: 完整参数属于 A/V 明细。本篇只定义哪些能力会影响主路径,以及能力缺失时系统如何收场。
