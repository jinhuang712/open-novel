# Appendix · Testing Matrix

本 appendix 是测试矩阵、验证命令、golden case、E2E 场景和外部能力 spike 结果的归口。根层 spec 只说明哪些行为必须可验证。

## 归口内容

- 外部事实审计 spike。
- storage / reindex / rollback 测试。
- runner / JSON retry / tool failure 测试。
- turn / approval / cancel / recovery 测试。
- stream 断线、重复、乱序测试。
- context overflow、impact analysis、fact query 测试。
- creative engine golden、reader aggregation、cardinal rules 风险分级测试。
- editor IME、focus trap、shortcut conflict、undo 测试。
- onboarding、settings、danger action 测试。

## 对应核心文档

- [00 System Contract](../00-system-contract.md)
- [01 Project Storage](../01-project-storage.md)
- [03 Agent Runtime](../03-agent-runtime.md)
- [04 Turn Orchestration](../04-turn-orchestration.md)
- [05 Streaming UI Protocol](../05-streaming-ui-protocol.md)
- [07 Context And Query](../07-context-and-query.md)
- [08 Creative Engine](../08-creative-engine.md)
- [10 Editor And Interaction](../10-editor-and-interaction.md)
- [11 Settings And Onboarding](../11-settings-and-onboarding.md)

## 边界

测试步骤、命令和 fixture 属于 appendix。测试暴露出行为契约不成立时,必须回写根层 spec 或 TODO。
