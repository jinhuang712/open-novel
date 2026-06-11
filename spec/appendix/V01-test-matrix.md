# V01 · Test Matrix

本 appendix 是测试矩阵、验证命令、单测/集成/E2E 场景和 golden case 引用的归口。外部能力的原始 spike 证据归 [V03](./V03-external-spikes.md)。

## 归口内容

- 外部事实审计需要覆盖的验证项,原始证据反链到 V03。
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

- [S00 System Contract](../S00-system-contract.md)
- [S01 Project Storage](../S01-project-storage.md)
- [S03 Agent Runtime](../S03-agent-runtime.md)
- [S04 Turn Orchestration](../S04-turn-orchestration.md)
- [S05 Streaming UI Protocol](../S05-streaming-ui-protocol.md)
- [S07 Context And Query](../S07-context-and-query.md)
- [S08 Creative Engine](../S08-creative-engine.md)
- [S10 Editor And Interaction](../S10-editor-and-interaction.md)
- [S11 Settings And Onboarding](../S11-settings-and-onboarding.md)
- [M01 Universal Search](../M01-universal-search.md)
- [M04 Discuss Mode](../M04-discuss-mode.md)
- [M09 Trace Observability](../M09-trace-observability.md)
- [M08 Approval Cascade](../M08-approval-cascade.md)
- [M11 ReaderPanel](../M11-reader-panel.md)

## 边界

测试步骤、命令和 fixture 属于 appendix。测试暴露出行为契约不成立时,必须回写对应根层 spec、platform 文档或 TODO;原始外部能力证据进入 [V03](./V03-external-spikes.md)。
