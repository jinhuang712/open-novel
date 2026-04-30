# 02 — 多 Agent 拓扑

## Agent 总览

| Agent | 模型 | 主职 | 可调用工具 | 是否需审批 |
|---|---|---|---|---|
| **Router** | Flash | 模式分流 + 意图识别 + 子 Agent 编排 | (调用其他 Agent 的子工具) | 否 |
| **Writer** (吐字) | Pro | 生成正文 / 章节概要 / 设定文档 | readSetting, readChapter, listSettings, writeSetting✓, writeChapter✓, webSearch (mock), applyTemplate | 是 (写操作) |
| **Checker** (检查 + **叙事引擎**) | Flash | 风格、流畅度、节奏审阅 + **BeatAnalyzer** (节奏/情绪曲线/钩子) + **ArcTracker** (角色弧光偏离) | readChapter, listSettings, analyzeNarrative, trackArc | 否 (只读) |
| **Validator** (校验) | Pro | 一致性矛盾检测 + cascade 影响范围分析 | readSetting, listSettings, readChapter, searchEntities | 否 (只读,提议变更经 Writer 落盘) |
| **Reflector** (反思) | Flash | 从用户审批/拒绝中提炼经验 | readApprovalHistory, recordLearning | 否 |
| **Humanizer** (去 AI 化) | Pro | 长句拆 + 口语化 + 节奏调整 | readChapter, writeChapter✓ | 是 |
| **ReaderPanel** (读者仿真) | Flash | 5 persona 并行模拟读者反应,生成章节风险报告 | readChapter, simulateReaders | 否 (非闸门信号) |

✓ 标记的工具带 `needsApproval: true`。

**Checker 子能力详见** [09-narrative-engine.md](./09-narrative-engine.md);**ReaderPanel 详见** [10-reader-simulator.md](./10-reader-simulator.md)。

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
Checker → 跑 BeatAnalyzer + ArcTracker → BeatReport + ArcReport
若 Checker / Validator 提出修改建议 → Writer 自我重写一次
        ↓
**ReaderPanel → 5 persona 并行 → ChapterRiskReport**
        ↓
最终 → writeChapter tool (needsApproval=true)
        ↓
ApprovalCard (展示完整章节 + 叙事报告 + 风险报告 + Validator 高亮)
        ↓ 用户同意 → 落盘
        ↓
Reflector → 提炼经验 (含本次风险报告与最终决定的差异)
```

注意 ReaderPanel 是**非闸门**输出 — 信号挂在 ApprovalCard 内,作者可参考可忽略。

### Discuss 模式

只读。Router 直接答复,可调 readSetting / readChapter / searchEntities,**不**调任何 write* 工具。Reflector 不跑 (无审批闭环)。

## 多项目隔离 (Memory)

Mastra Memory 配置:

```ts
const memory = new Memory({
  storage: new LibSQLStore({ url: 'file:~/.open-novel/runtime.db' }),
})
```

每次调用 Agent 时:

```ts
await routerAgent.streamVNext(messages, {
  memory: { thread: `proj:${projectId}:session:${sessionId}`, resource: projectId },
})
```

`resource = projectId` 确保跨项目零串扰。`thread` 切会话,旧对话可恢复。

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

- **Pro 模型**: 创作输出质量第一 → Writer (写正文/设定)、Validator (深度推理一致性)、Humanizer (重写需要风格把控)
- **Flash 模型**: 速度+成本第一 → Router (调度)、Checker (含叙事引擎子能力)、Reflector (短摘要)、**ReaderPanel** (5 persona 并行,Flash 控成本)

通过 `process.env.DEEPSEEK_API_KEY` + Vercel AI Gateway 的 `model: 'deepseek/deepseek-v4-pro'` 选择,**用户在 Settings UI 里可单独覆盖每个 Agent 的模型**。

## ReaderPanel 成本控制

ReaderPanel 每章跑 5 个 (+ N 自定义) persona,潜在 token 开销不小。控制策略:
- 全部走 Flash 模型 (单价低)
- 用户可在 SettingsDialog → "读者仿真器" tab 整体禁用
- 自定义 persona 单独开关 + weight 调节
- 章节 >5K 字时只取关键段 (前 1000 字 + 后 800 字 + 中段冲突点),不全文喂入
