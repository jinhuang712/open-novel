# V01 · Test Matrix

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
- Universal Search: `Shift+Shift`、分组排序、hover preview、索引降级和 pending approval 只读限制。
- Discuss Mode: 只读边界、来源缺口、升级到 Planning/Writing、Trace 解释。
- Trace Observability: 可见层级、断线恢复、降级解释、隐私遮蔽。
- Approval Cascade: Search 发起写入、低置信项、关闭 pending、rollback/reindex 失败收场。
- ReaderPanel: persona 并行、inconclusive、注入防御、审批说明联动。
- onboarding、settings、danger action 测试。

## 对应核心文档

- [00 System Contract](../S00-system-contract.md)
- [01 Project Storage](../S01-project-storage.md)
- [03 Agent Runtime](../S03-agent-runtime.md)
- [04 Turn Orchestration](../S04-turn-orchestration.md)
- [05 Streaming UI Protocol](../S05-streaming-ui-protocol.md)
- [07 Context And Query](../S07-context-and-query.md)
- [08 Creative Engine](../S08-creative-engine.md)
- [10 Editor And Interaction](../S10-editor-and-interaction.md)
- [11 Settings And Onboarding](../S11-settings-and-onboarding.md)
- [12 Universal Search](../M01-universal-search.md)
- [13 Discuss Mode](../M04-discuss-mode.md)
- [14 Trace Observability](../M09-trace-observability.md)
- [15 Approval Cascade](../M08-approval-cascade.md)
- [16 ReaderPanel](../M11-reader-panel.md)

## 边界

测试步骤、命令和 fixture 属于 appendix。测试暴露出行为契约不成立时,必须回写根层 spec 或 TODO。
