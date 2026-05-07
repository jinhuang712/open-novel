# 02 — 多 Agent 拓扑

## Agent 总览

| Agent | 模型 | mode | reasoningEffort | 主职 | 输出形态 | 可调用工具 | 是否需审批 |
|---|---|---|---|---|---|---|---|
| **Router** | Flash | primary | default | 模式分流 + 意图识别 + 子 Agent 编排 | **JSON** (spec/24) | (调用其他 Agent 的子工具) | 否 |
| **Writer** (吐字) | Pro | primary | **max** | 生成正文 / 章节概要 / 设定文档 | NL 流式 | readSetting, readChapter, listSettings, writeSetting✓, writeChapter✓, webSearch (mock), applyTemplate | 是 (写操作) |
| **Checker** (章内审阅) | Flash | subagent | default | 风格 / 流畅 / 章内节奏 + **BeatAnalyzer** + **守则 1/3/5 检测** | **JSON** | readChapter, listSettings, analyzeNarrative, checkPacing | 否 (只读) |
| **Validator** (跨章一致性) | Pro | subagent | **max** | 事实矛盾 + cascade 影响 + **ArcTracker** + **守则 2/4 检测** | **JSON** | readSetting, listSettings, readChapter, searchEntities, trackArc, analyzeImpact, checkPromise | 否 (只读,提议变更经 Writer 落盘) |
| **Reflector** (反思) | Flash | subagent | default | 从用户审批/拒绝中提炼经验 | **JSON** | readApprovalHistory, recordLearning | 否 |
| **Humanizer** (去 AI 化) | Pro | subagent | **max** | 长句拆 + 口语化 + 节奏调整 | NL 流式 | readChapter, writeChapter✓ | 是 |
| **ReaderPanel** (读者仿真) | Flash | subagent | default | 5 persona 并行模拟 + **守则 1/2/3/4/5 综合评分** | **JSON** | readChapter, simulateReaders | 否 (非闸门信号) |

✓ 标记的工具带 `needsApproval: true`。

**mode 分类** (借鉴 opencode `agent/agent.ts:31` 三态模型):
- `primary`: 直接面对用户输入入口的 Agent (Router 接 UI 路由 / Writer 接生成请求)
- `subagent`: 由 cascade 流程内部触发, 不直接对用户的 Agent (Checker/Validator/Humanizer/ReaderPanel/Reflector); 这些走 spec/02 §subagent 派发协议 (借鉴 opencode `tool/task.ts`), 续跑同一 threadId 让 Mastra lastMessages 30 保持上下文连续
- 显式分类后 UI 路由 / 权限 / Memory 隔离规则更整齐 (例如 subagent 默认不能调用 needsApproval 工具)

**reasoningEffort 混合分档** (Pro=max + Flash=default):

- **Pro 系 (Writer / Validator / Humanizer) → `max`**: 这些 Agent 输出长 (Writer 单章 5K-10K / Humanizer 整章重写 / Validator cascade 报告) + 质量优先 (创作核心 / 一致性核心), max effort 是正确投入
- **Flash 系 (Router / Checker / Reflector / ReaderPanel) → `default`**: 这些 Agent 输出短 (路由 JSON / 章内分析 JSON / 短摘要 / 单 persona 反应), 关键诉求是低成本快反应。Flash 上 max 会抹平 Flash 的成本优势 — 同价位用 Pro 反而更划算
- 仅 V4-Pro/Flash 支持 reasoningEffort 控制 (借鉴 opencode `provider/transform.ts:695-697`), **禁止 fallback 到旧型号** (见 spec/00 §C 模型选型守约), 因为旧型号 (deepseek-chat / -reasoner / -r1 / -v3) 没有 effort 参数, 行为差异会让 cardinal-rules 检测精度劣化

**Writer 单一 Agent 同时写正文 / 设定的潜在风格混淆**: Writer 在 plan 模式写 worldview.md / character.md (说明文 + frontmatter), 在 write 模式写小说正文 (文学体), 两种文体差异大。**风险缓解**: per-agent context builder (spec/23) 在每次调用前明确注入"你现在是 plan 模式 / write 模式" + 对应文体范例, system prompt 头部 stable header 段 (T7) 含模式区分指令。POC 阶段保留单 Writer + 模式注入区分, **如果实测出现"用写设定的腔调写小说"或反之, W7+ 拆为 SettingsAuthor + ChapterWriter 两个 primary**。

**输出形态 (spec/24)**:

- **JSON** 输出走 DeepSeek 原生 JSON mode (`response_format: { type: 'json_object' }`),应用层 zod 校验 + retry,失败 escalate 用户(详见 [spec/24-json-output.md](../spec/24-json-output.md))
- **NL 流式** 输出自然语言流,用户阅读;Writer / Humanizer 走这条

**叙事引擎拆给两个 Agent**: BeatAnalyzer 是章内分析 → 归 Checker;ArcTracker 是跨章性格偏离 → 归 Validator。两者实现共置于 [09-narrative-engine.md](./09-narrative-engine.md);**ReaderPanel 详见** [10-reader-simulator.md](./10-reader-simulator.md)。

**五大守则检测分工 (spec/25)**:

| 守则 | 主检测 | 二审 |
|---|---|---|
| 1. 黄金三章 | ArcTracker (在 Validator) | ReaderPanel |
| 2. 人设崩坏 | Validator (characterIntegrityCheck) | ReaderPanel |
| 3. 节奏崩盘 | BeatAnalyzer + ArcTracker | — |
| 4. 期待感兑现 | Validator (promiseAccountabilityCheck) | ReaderPanel |
| 5. 金手指依赖 | BeatAnalyzer + ArcTracker | ReaderPanel |

各检测器输出汇成 `CardinalRulesReport` (spec/25 §风险报告输出) 进 ApprovalCard。

## 路由策略 (Router 行为)

Router 是入口,负责把用户输入分流到合适的下游 Agent。它的 system prompt 包含:

1. **当前模式约束**: discuss / plan / write — 决定可调用哪些工具
2. **当前项目上下文**: 项目名、流派、Agent 性格、风格偏好
3. **学习经验注入**: 从 `learnings` 表取 top-N (按 weight + recency)
4. **意图分类示例**:
   - "你觉得主角应该长什么样" → discuss,自答 (RAG 角色文件)
   - "把主角改成女生" → plan,委派 Writer + Validator
   - "写第三章开头" → write,委派 Writer + Checker + Validator

Mastra 的 `AgentNetwork` 让 Router 把下游 Agent 当作工具调用 (`agents-as-tools` 模式)。

## Agent 间协作流程

### Plan 模式 (生成/修改设定)

```
Router → (decide: 调用 Writer)
Writer → 生成 worldview.md draft (含 frontmatter)
Writer → 调 writeSetting tool (needsApproval=true)
        ↓
        AI SDK 挂起 → 前端渲染 ApprovalCard (含 diff)
        ↓ (用户点同意)
        addToolResult({ output: 'approved' }) 让流继续
        ↓
        实际落盘 + index.db.entities 刷新
        ↓
Validator → 自动并行检查: 这个新 worldview 与现存所有 character.md 是否冲突?
       └─ 若冲突: 把冲突列表回喂 Router
              ↓
              Router 提议追加 cascade 修改 (依然走 Writer + needsApproval 链路)
        ↓
Reflector → 取本轮 (Writer 输出 + 用户最终决定),提炼 1-3 条经验,写入 learnings
```

### Write 模式 (生成章节正文)

```
Router → 委派 Writer
Writer → 读 settings/* + chapter outline + 历史章节
Writer → 流式生成正文 (逐段 emit)
        ↓ (流式过程中)
Checker → 并行审风格 (轻量 prompt,只看最近 1000 字)
Validator → 并行扫一致性 (重点查角色行为、地点、时间是否冲突)
        ↓ (writer 完成后)
若 narrative.beatAnalyzer.runOnSave (默认 true) → Checker 跑 BeatAnalyzer
若 narrative.arcTracker.runOnNewChapter (默认 true) → Validator 跑 ArcTracker (本章涉及角色)
若 Checker / Validator 提出修改建议 → Writer 自我重写一次 (≤1 次,避免循环)
        ↓
若 readerPanel.runOnSave (默认 true) → 5 persona 并行 → ChapterRiskReport
        ↓
最终 → writeChapterProposal (落 approvals 表,见 spec/06)
        ↓
ApprovalCard (展示完整章节 + 叙事报告 + 风险报告 + Validator cascade)
        ↓ 用户同意 → POST /api/approvals/{id}/resolve → 落盘 + reindex
        ↓
Reflector 入队 (本批 cascade 合一次,≤5/会话,见 plan/06)
```

各自动触发的开关均在 SettingsDialog → Section 5 (读者仿真器 + 叙事引擎),用户可关闭节省成本。

注意 ReaderPanel 是**非闸门**输出 — 信号挂在 ApprovalCard 内,作者可参考可忽略。

### Discuss 模式

只读。Router 直接答复,可调 readSetting / readChapter / searchEntities,**不**调任何 write* 工具。Reflector 不跑 (无审批闭环)。

## 多项目隔离 (Memory)

> 详细的记忆四层模型 (L1 工作记忆 / L2 会话记忆 / L3 项目记忆 / L4 知识图谱) 与 per-agent 上下文契约见 [plan/12](./12-memory-and-context.md);Mastra Memory 落地细节见 [spec/22](../spec/22-mastra-memory.md);per-agent context builder 实现见 [spec/23](../spec/23-context-contracts.md)。本节只列 Memory 多项目隔离要点。

```ts
// lib/agents/memory.ts
import { Memory } from '@mastra/memory'
import { LibSQLStore } from '@mastra/libsql'

export const memory = new Memory({
  storage: new LibSQLStore({ url: 'file:' + path.join(os.homedir(), '.open-novel', 'runtime.db') }),
  options: {
    lastMessages: 30,        // 1M ctx 下放宽; 与 spec/22 对齐
    semanticRecall: false,   // POC 关; W11 评估
    workingMemory: false,    // 与"L3 仅 Reflector 写"原则冲突
  },
})
```

调用约束 — 所有 Agent 必经 `streamWithGuard` (而非直接 `streamVNext`):

```ts
await streamWithGuard(routerAgent, ctx.messages, {
  memory: { thread: `proj:${projectId}:session:${sessionId}`, resource: projectId },
  providerOptions: ctx.metadata.jsonMode
    ? { deepseek: { response_format: { type: 'json_object' } } }       // spec/24
    : undefined,
})
// 缺 thread/resource 或 thread 中的 projectId 与 resource 不一致直接报错
```

`resource = projectId` 确保跨项目零串扰;`thread` 切会话,旧对话可恢复;guard 函数防御性二次校验。

每次 Agent stream 启动前先调对应 [per-agent context builder (spec/23)](../spec/23-context-contracts.md) — 由它装配 system / learnings / L4 retrieve / messages,并标记 `jsonMode`。**不允许 Agent 自拼 prompt**(plan/01 不变性 L14)。

## 风格 / 性格定制

每个项目 `project.json`:

```json
{
  "id": "...",
  "name": "重生互联网",
  "genre": "都市重生",
  "style": "幽默轻松,节奏快,短句多",
  "agentPersonality": "毒舌助理,会主动指出剧情漏洞",
  "exampleCorpus": [".../范文1.md", ".../范文2.md"]
}
```

Router 在每次调用前把这些字段拼进所有下游 Agent 的 system prompt,确保风格一致。

## 模型选择策略

V4-Pro vs V4-Flash 现在是**输出长度上限**和**单价档**的差异 (两者 ctx 都 1M, 见 spec/00 §C)。配合 reasoningEffort 形成 **`v4-flash + default` (低成本短反应) / `v4-pro + max` (高质量长输出)** 二档:

- **`v4-pro + reasoningEffort: max`**: Writer / Validator / Humanizer — 创作核心 (Writer / Humanizer) + 一致性核心 (Validator); 长输出 + 深度推理同时需要
- **`v4-flash + reasoningEffort: default`**: Router / Checker / Reflector / ReaderPanel — 短输出 (路由判断 / 章内分析 / 短摘要 / 单 persona 反应); 上 max 抹平 Flash 成本优势, 同价位升 Pro 更划算

通过 `process.env.DEEPSEEK_API_KEY` 直连 + 模型名 `deepseek-v4-pro` / `deepseek-v4-flash` (无 `deepseek/` 前缀, 见 spec/00 §C 实查), **用户在 Settings UI 里可单独覆盖每个 Agent 的模型 + reasoningEffort**, 但**不暴露 fallback 到 V3/旧版**。

## ReaderPanel 成本控制

ReaderPanel 每章跑 5 个 (+ N 自定义) persona,潜在 token 开销不小。控制策略:
- 全部走 Flash 模型 (单价低)
- 用户可在 SettingsDialog → "读者仿真器" tab 整体禁用
- 自定义 persona 单独开关 + weight 调节
- 章节 >5K 字时只取关键段 (前 1000 字 + 后 800 字 + 中段冲突点),不全文喂入
