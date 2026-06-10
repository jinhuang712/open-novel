# 002 — 战略升级: 纳入叙事引擎 + 读者仿真器

**日期**: 2026-04-30 **周次**: (跨期决策,影响 W7~W11) **主要 Owner**: `jin.huang@klook.com` **状态**: 计划已立 / 等用户 approve / 实施跨 W9-W10

> **[info]** 本条目按 docs-before-code 三段式 (docs → approve → code) 在 W2 实施期间插入。**不**打断 W2 工作流;W2 docs 单独走自己的 approve 通道。

## 决策来源

外部 LLM 提了一份 9 条的"护城河升级"建议,涵盖三层 (创作智能 / 世界仿真 / 创作生态)。Claude 逐条评估后,用户从中选取了 **#1 叙事引擎** 与 **#5 读者仿真器** 两条纳入 POC 范围,其余明确砍掉。

## 选中的两条

### 1. 叙事引擎 (Narrative Engine)

- 目的: 让 Agent 从"文字生成器"进化为"叙事工程师" — 不只看文笔,看节奏 / 结构 / 角色弧光
- 三个能力模块:
  - **BeatAnalyzer**: 章节情绪曲线、冲突密度、节奏张弛分析
  - **ArcTracker**: 角色成长轨迹追踪与偏离检测
  - **结构模板库**: 三幕剧 / 英雄之旅 / 网文起承转合 / **番茄黄金三章** 等可显式调用的结构模板
- 集成: 作为 Checker 的子能力 (而非新增独立 Agent),与现有 Checker 共用调用入口
- 落点: plan/09-narrative-engine.md, spec/10-narrative-engine.md

### 5. 读者仿真器 (Reader Simulator)

- 目的: 番茄的核心游戏是留存。模拟多类型读者反应,让作者在发布前就能预判风险
- 形式: **新增第 7 个 Agent — ReaderPanel** (Flash 模型,多 persona 并行)
- 默认 5 personas: 追更党 / 逻辑控 / 情感党 / 毒舌读者 / 潜水大佬
- 触发: 每次章节生成完成后自动跑,**非闸门**输出 (作者可参考可忽略)
- 输出: 本章风险报告 (毒点 / 爽点 / 弃书风险评分 / 钩子强度)
- 二期: 接入真实番茄留存数据后用作 persona 校准
- 落点: plan/10-reader-simulator.md, spec/11-reader-personas.md

## 砍掉的 7 条及理由

| # | 建议 | 砍因 |
|---|---|---|
| 2 | 因果图谱 | LLM 因果抽取不稳;图谱维护代价高;先观察叙事引擎是否覆盖大部分价值 |
| 3 | Strategist Agent | 不是壁垒;先看 ReaderPanel 上线后用户是否真要"被挑战决策" |
| 4 | 世界时钟 / 历史生成 | 玄幻强、都市弱;番茄主流流派受益面有限;执行差风险高 |
| 6 | 多模态 (立绘 / 配音) | 番茄纯文本平台,scope creep |
| 7 | 协作版 (Git for Novel) | 网文 95% 单作者,Yjs+sync 是 6 月项目,场景错配 |
| 8 | IP 资产市场 | 平台层,与 POC 无关 |
| 9 | 个性化微调即服务 | DeepSeek 暂不开放微调;开源权重模型成本远超 ROI;现有 RAG+learnings 已覆盖 80% 价值 |

## 对里程碑的影响

原 12 周计划 → **新 14 周计划**。核心创作路径稳;新增 2 周专项实现两个新能力。

| 周 | 原 W7-W12 | 新 W7-W14 |
|---|---|---|
| W7 | Cascade 一致性 | Cascade 一致性 (不变) |
| W8 | 章节 pipeline | 章节 pipeline (不变) |
| W9 | 联网工具接口 + Reflector | **叙事引擎 (BeatAnalyzer + ArcTracker + 模板库)** ← 新 |
| W10 | 去 AI 化 + 风格 | **读者仿真器 (ReaderPanel + 5 personas)** ← 新 |
| W11 | 多项目压测 + 错误兜底 | 联网工具接口 + Reflector |
| W12 | 文档完善 + Demo | 去 AI 化 + 风格 |
| W13 | — | 多项目压测 + 错误兜底 |
| W14 | — | 文档完善 + Demo |

## 范围内对现有文档的修改

approve 后实施:

- **plan/01-overview.md** — Agent 数 6 → 7;"差异化"表追加 narrative + reader 两行
- **plan/02-multi-agent.md** — Agent 表追加 ReaderPanel;Checker 描述补 BeatAnalyzer/ArcTracker 子能力,链接到 plan/09
- **plan/09-narrative-engine.md** — 新建
- **plan/10-reader-simulator.md** — 新建
- **spec/10-narrative-engine.md** — 新建
- **spec/11-reader-personas.md** — 新建
- **README.md** — 文档导航追加 plan/09 + plan/10 + spec/10 + spec/11
- **progress/README.md** — 索引追加 002 行

## 风险

- **新增 ReaderPanel 增加 token 用量**: 每章生成完跑一次 5 persona,约多 5×短输出。Flash 单价低,问题不大,但需在 SettingsDialog 暴露开关让用户禁用
- **BeatAnalyzer 输出可能与 Checker 已有自然语言审阅重复**: 解决办法是 Checker 输出从单一字段改为 `{ critique: string, beats: BeatReport, arcs: ArcReport[] }` 的结构体,让 UI 可分段展示
- **结构模板 vs 用户自由风格**: 模板必须**可选不强制**,Writer 在没有显式 template 引用时按用户风格生成
- **校准缺失**: 读者 persona 在没有真实番茄留存数据校准前,只是"专家共识"层面。要在 plan/10 明确说明这一限制,避免误用为"准确预测"

## 不在本次升级范围

外部 LLM 提的 7 条全部不做。后续若用户改主意,各做单独的战略升级 progress 条目 (003 起)。

---

## 实际完成 / 偏差 / 教训 (实施完成后追加)

> **[info]** 本节将在 W9 / W10 各自实施完成后追加 — 两期独立 retro。
