# V01 · Test Matrix

本 appendix 是测试矩阵、验证命令、单测/集成/E2E 场景和 golden case 引用的归口。外部能力的原始 spike 证据归 [V03](./V03-external-spikes.md)。

## 归口内容

- 外部事实审计需要覆盖的验证项,原始证据反链到 V03。
- storage / reindex / internal recovery 测试。
- runner / JSON retry / tool failure 测试。
- turn / approval / cancel / recovery / recap 测试。
- stream 断线、重复、乱序测试。
- context overflow、impact analysis、fact query 测试。
- creative engine golden、reader aggregation、cardinal rules 风险分级测试。
- editor IME、focus trap、shortcut conflict、undo 测试。
- Universal Search: `Shift+Shift`、分组排序、hover preview、索引降级和 pending approval 只读限制。
- Discuss Mode: 只读边界、来源缺口、升级到 Planning/Writing、Trace 解释。
- Trace Observability: 可见层级、断线恢复、降级解释、隐私遮蔽。
- Approval Cascade: Search 发起写入、低置信项、关闭 pending、internal recovery / reindex 失败收场。
- Turn Recap: append-only 时间线、正常/停止/失败/待审/已落盘 recap、作者备注、forward-only 修正和续接入口。
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
- [M17 Turn Recap And Continuation](../M17-turn-recap-and-continuation.md)

## Memory / Reflector 验证项

经验管理和 Reflector 的测试归本篇维护。实施时至少覆盖:

| 场景 | 预期 |
|---|---|
| 经验可见性 | 每条经验展示来源、适用范围、状态和权重;无来源经验不得出现在用户可见列表 |
| 调高 / 调低 | 保存成功后 context builder 使用新权重;保存失败时 UI 保留原值并提示失败 |
| 关闭单条经验 | 经验仍可见但不再注入 context;Trace / Debug 能解释未注入原因 |
| 删除单条经验 | 列表、context 注入和搜索入口都不再出现;删除失败时不得隐藏残留记录 |
| 关闭 Reflector | 后续 turn 不产生新经验候选;已有 active 经验仍按设置注入 |
| 停用经验注入 | Reflector 可继续学习新经验,但已有经验不进入 context |
| 清空经验 | 必须二次确认范围;存在 active writable turn / pending approval 时先阻断或要求处理 |
| 学习冲突 | 相似或相反经验进入合并 / 排队 / 冲突提示路径,不得重复追加多条噪音经验 |

## Turn Recap 验证项

Turn Recap 的测试归本篇维护。实施时至少覆盖:

| 场景 | 预期 |
|---|---|
| 正常完成 | 生成 recap,说明已完成、已修改、可查看结果和下一步 |
| 运行中停止且无 durable change | 不二次确认;生成 stopped recap,明确“没有修改正文或设定”、已完成结果和未完成步骤 |
| pending / applying 状态取消 | 不直接丢弃;先展示 cancel plan 和影响范围 |
| append-only 历史 | 原 recap 不被删除或改写;作者备注和更正以追加记录保存 |
| 撤销 / 恢复入口 | 生成反向修改或恢复 proposal,经审批后向前追加新 recap |
| 事实边界 | recap 不能覆盖项目事实;与项目事实冲突时必须让位 |
| 经验边界 | stopped / abandoned / rejected recap 不自动进入 Reflector 学习 |
| 来源跳转失效 | recap 保留,对应来源标记过期并提供重新定位路径 |

## 边界

测试步骤、命令和 fixture 属于 appendix。测试暴露出行为契约不成立时,必须回写对应根层 spec、platform 文档或 TODO;原始外部能力证据进入 [V03](./V03-external-spikes.md)。
