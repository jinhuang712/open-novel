# Spec 10 — 叙事引擎实现

> 实现 plan/09-narrative-engine.md 描述的三个能力模块: BeatAnalyzer / ArcTracker / 结构模板库。

## 文件分布

```
lib/narrative/
├── index.ts                       # 对外导出
├── beat-analyzer.ts               # BeatAnalyzer 实现
├── arc-tracker.ts                 # ArcTracker 实现
├── templates/
│   ├── README.md                  # 模板使用说明
│   ├── three-act.md               # 三幕剧
│   ├── hero-journey.md            # 英雄之旅
│   ├── chinese-classic.md         # 起承转合
│   ├── fantome-3-chapters.md      # 番茄黄金三章
│   └── _registry.ts               # 模板注册表
├── prompts/
│   ├── beat-analyzer.md
│   ├── arc-tracker.md
│   └── apply-template.md
└── schemas.ts                      # zod schemas (BeatReport / ArcReport / Template)
```

## BeatAnalyzer

### Tool 签名

```ts
// lib/narrative/beat-analyzer.ts
import { tool } from 'ai'
import { z } from 'zod'

const beatReportSchema = z.object({
  emotionCurve: z.array(z.object({
    from: z.number().int().min(0),    // 字符 offset
    to: z.number().int().min(0),
    valence: z.number().min(-1).max(1),     // 情绪正负
    arousal: z.number().min(0).max(1),       // 情绪强度
  })),
  conflictDensity: z.number().min(0),         // events per 1k chars
  conflictTypes: z.object({
    inner: z.number().int().min(0),
    interpersonal: z.number().int().min(0),
    environmental: z.number().int().min(0),
    class: z.number().int().min(0),
    setting: z.number().int().min(0),
  }),
  pacing: z.object({
    avgSentenceLength: z.number(),
    dialogueRatio: z.number().min(0).max(1),
    descriptionRatio: z.number().min(0).max(1),
    transitionDensity: z.number().min(0),
  }),
  hooks: z.array(z.object({
    position: z.number().int().min(0),
    kind: z.enum(['opener', 'cliffhanger', 'mid-spike']),
    strength: z.number().min(0).max(100),
  })),
  rhythmScore: z.number().min(0).max(100),
  flagsForAuthor: z.array(z.string()),
})

export const analyzeNarrative = tool({
  description: '分析章节的叙事力学指标 (情绪曲线 / 冲突密度 / 节奏 / 钩子 / 节奏分)',
  inputSchema: z.object({
    chapterId: z.string(),
  }),
  outputSchema: beatReportSchema,
  execute: async ({ chapterId }, { projectId }) => {
    const chapter = await readChapterDraft(projectId, chapterId)
    const report = await callDeepSeekFlash(beatAnalyzerPrompt, { content: chapter })
    await db.narrative_metrics.upsert(projectId, {
      chapterId, kind: 'beat', report, version: 'v1', generatedAt: now(),
    })
    return report
  },
})
```

### Prompt 大纲 (`lib/narrative/prompts/beat-analyzer.md`)

```
你是 Open Novel 系统的 BeatAnalyzer,任务是把一章网文正文解构为叙事力学指标。

# 输入
{{chapter_content}}

# 输出
严格遵循以下 JSON Schema (见 schemas.ts BeatReport)。

# 分析准则
- 情绪曲线: 把章节按段落切分,对每段评估情绪正负 (valence: -1..+1,负向=压抑/挫败/愤怒,正向=喜悦/释放/胜利) 和情绪强度 (arousal: 0..1)
- 冲突密度: 标记每个独立的"冲突事件" (内心 / 人际 / 环境 / 阶层 / 设定 5 类),除以章节字数 × 1000
- 节奏: 平均句长、对话占比、描写占比、段落间过渡 (有/无明显过渡句)
- 钩子: 找出 opener (开篇钩子) / cliffhanger (章末悬念) / mid-spike (中段高潮),为每个钩子评估强度 (0..100,越高吸引力越强)
- rhythmScore: 综合考虑节奏张弛、爽点频率、钩子强度,给出 0-100 总评
- flagsForAuthor: 1-5 条自然语言提示,e.g. "前 800 字过密集对话,缺场景定位"、"章末钩子较弱,建议增加悬念"

# 严格规则
- 你**不修改正文**
- 你**不评价文笔好坏**(那是 Checker.critique 的职责)
- 仅输出结构化指标 + 简短自然语言提示
```

### 调用方式

Checker 在分析章节时**自动**调 `analyzeNarrative`。Writer 也可主动调。

## ArcTracker

### Tool 签名

```ts
const arcReportSchema = z.object({
  characterId: z.string(),
  expectedArc: z.string(),
  observedShifts: z.array(z.object({
    chapter: z.string(),
    position: z.number().int().min(0),
    kind: z.enum(['belief', 'relationship', 'capability', 'goal']),
    summary: z.string(),
  })),
  deviation: z.object({
    score: z.number().min(0).max(100),
    reason: z.string(),
    examples: z.array(z.object({
      chapter: z.string(),
      snippet: z.string().max(200),
    })),
  }),
})

export const trackArc = tool({
  description: '追踪一个角色的成长轨迹与 expected arc 偏离度',
  inputSchema: z.object({
    characterId: z.string(),
    upToChapter: z.string().optional(),    // 截止章节,默认全部
  }),
  outputSchema: arcReportSchema,
  execute: async ({ characterId, upToChapter }, { projectId }) => {
    const character = await readSettingByEntityId(projectId, characterId)
    const expectedArc = character.frontmatter.expected_arc ?? '(未指定 expected_arc)'
    const chapters = await listChaptersUpTo(projectId, upToChapter)
    const mentions = await db.references.findByEntity(projectId, characterId)
    const report = await callDeepSeekPro(arcTrackerPrompt, {
      character, expectedArc, chapters, mentions,
    })
    await db.narrative_metrics.upsert(projectId, {
      characterId, kind: 'arc', report, version: 'v1', generatedAt: now(),
    })
    return report
  },
})
```

### Prompt 大纲 (`lib/narrative/prompts/arc-tracker.md`)

```
你是 Open Novel 系统的 ArcTracker,任务是观测一个角色在已写章节中的言行变化,与作者设定的 expected_arc 比对偏离度。

# 输入
- 角色档案 (含 expected_arc): {{character}}
- 该角色出现的章节及上下文片段: {{mentions}}

# 输出
严格遵循 ArcReport schema。

# 分析准则
- observedShifts: 找出该角色在已写章节中所有"显著的转变" (信念 / 关系 / 能力 / 目标 4 类),每个标记章节 + 字符位置 + 简短描述
- deviation.score: 对照 expected_arc 评估偏离度 (0=完全符合,100=完全偏离)
- deviation.reason: 一句话解释为什么这样评分
- deviation.examples: 取最多 3 个最典型的偏离片段 (前后 200 字以内 snippet)

# 严格规则
- 不要建议修改正文
- 不要评价"是否合理"(可能是合理的成长,也可能是 bug — 由作者判断)
- 仅给出客观观测 + 偏离度
- expected_arc 为空时,deviation.score 设为 0,reason 写"未指定 expected_arc"
```

### Character.md frontmatter 扩展

```yaml
---
id: char_lin_a3f2
type: character
canonical_name: 林川
expected_arc: |
  从 IT 民工到互联网巨头创始人;性格从隐忍内敛到果决霸气;
  关键转折点在第 50 章被合伙人背叛后。
---
```

ArcTracker 读取此字段。

## 结构模板库

### 模板格式 (markdown + YAML frontmatter)

`lib/narrative/templates/three-act.md`:

```markdown
---
id: three-act
name: 三幕剧
genres: [都市, 言情, 悬疑, 全适用]
description: 西方经典三幕结构,适合长度可控的中篇与短篇
---

# 三幕剧 (Three-Act Structure)

## 第一幕: Setup (建立) — 占总长 25%

- **Hook (钩子)**: 第 1 章前 1000 字内必须有冲突或悬念
- **Inciting Incident (诱发事件)**: 触发主角离开舒适区的事件
- **Plot Point 1**: 第一幕末尾,主角被迫接受新世界 / 新任务

## 第二幕: Confrontation (对抗) — 占总长 50%

- **Rising Action**: 不断升级的挑战
- **Midpoint**: 中段一个重大反转或揭露
- **Plot Point 2**: 主角面临最低谷,所有线索汇聚

## 第三幕: Resolution (解决) — 占总长 25%

- **Climax**: 最终对决
- **Falling Action**: 余波平息
- **Resolution**: 新平衡,角色弧光闭环

## 适用提醒

- 长篇网文 (200+ 章) 不适合单一三幕,建议每 100 章一个三幕循环
- 番茄上推荐用于 10-50 章的开局段
```

### 注册表 (`lib/narrative/templates/_registry.ts`)

```ts
import threeAct from './three-act.md?raw'
import heroJourney from './hero-journey.md?raw'
import chineseClassic from './chinese-classic.md?raw'
import fantome from './fantome-3-chapters.md?raw'

export const templates: Record<string, string> = {
  'three-act': threeAct,
  'hero-journey': heroJourney,
  'chinese-classic': chineseClassic,
  'fantome-3-chapters': fantome,
}
```

### Tool 签名

```ts
export const applyTemplate = tool({
  description: '把一个叙事结构模板嵌入大纲生成 prompt 的 context',
  inputSchema: z.object({
    templateId: z.enum(['three-act', 'hero-journey', 'chinese-classic', 'fantome-3-chapters']),
  }),
  execute: async ({ templateId }) => {
    const content = templates[templateId]
    if (!content) throw new Error(`Unknown template: ${templateId}`)
    return { templateId, content }
  },
})
```

Writer 在生成大纲时,如检测到用户 prompt 中含"用 X 结构"或显式调用 applyTemplate,把模板内容塞进 context。

## SQLite Schema 追加

附在 spec/01-storage-schema.md 的 `index.db` 表组里:

```sql
CREATE TABLE narrative_metrics (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  kind TEXT NOT NULL,                   -- 'beat' | 'arc'
  target_id TEXT NOT NULL,              -- chapterId 或 characterId
  report TEXT NOT NULL,                 -- JSON
  version TEXT NOT NULL,                -- 'v1' (prompt 版本号)
  generated_at TEXT NOT NULL,
  UNIQUE(kind, target_id, version)
);
CREATE INDEX idx_narrative_target ON narrative_metrics(kind, target_id);
```

`UNIQUE` 约束保证同一 chapter 同 version 只有一条记录,prompt 升级时 version 号 bump 后重跑可生成新行。

## UI 集成

ThinkingPanel 渲染 Checker 输出时,识别 `beats` 与 `arcs` 字段:

- **beats**: 渲染为 sparkline 情绪曲线 + 节奏热度色块 + flagsForAuthor 列表
- **arcs**: 每个 ArcReport 一个折叠卡,顶部显示 deviation.score (用警告色彩),展开看 examples

UI 实现在 `components/panels/NarrativeReport.tsx` (W9 落地)。

## 不做什么

- **不做实时分析**: 编辑器输入时不调用 BeatAnalyzer。**只在章节完成 + 显式触发**时跑
- **不做跨章节因果推理**: 那是因果图谱的事 (已砍)
- **不做"AI 改写"建议**: BeatAnalyzer 报告纯诊断,不主动改稿。改稿仍由 Writer 在用户授权下进行
