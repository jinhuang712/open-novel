# Spec 08 — 去 AI 化 (Humanizer) Pipeline

## 触发

- UI: 在某个 chapter draft 文件打开时,顶部按钮"去 AI 化"
- 命令面板: `Cmd+Shift+P` → "Humanize Chapter"
- ChatBox 输入"把第 1 章去 AI 化" → Router 识别 → 委派 Humanizer

## 输入

- 当前章节 `chapters/{NNN-XX}/draft.md` 完整内容 (含 frontmatter)
- 风格目标:
  - 默认: 番茄热门书风格 (内置一组特征描述)
  - 用户指定范文: `project.exampleCorpusFiles` 中的一个或多个
  - 临时风格: 用户在 ChatBox 给的一句话 (e.g. "再口语化一点,像吐槽")

## 多轮重写策略

每一轮一个独立 LLM 调用,Humanizer 内部串行,产出叠加:

### Round 1 — 断句

prompt 指令:

> **[info]** 把所有超过 30 字的长句拆成 ≤25 字的短句。
> 保留原意,可调整语序与连接词。
> 不要新增信息,不要删除关键内容。
> 输出修改后的完整章节正文。

LLM 输出后:

- diff 计算,生成 `roundResults[1]`
- 通过率 (修改了 X% 的句子) 进入 round 2

### Round 2 — 口语化

prompt 指令:

> **[info]** 把书面词替换为口语词,但不要过度。
> 保留作者的笔触特征。
> 替换示例:
>   "由此" → "所以" / "因此" → "所以"
>   "随之" → "然后"
>   "进行" → "做" (如果可以)
>   "目睹" → "看见"
>   "颇为" → "挺"
> 不要替换人物对话内容 (对话本身就是口语)。
> 输出修改后的完整章节正文。

### Round 3 — 节奏

prompt 指令:

> **[info]** 调整段落节奏:
>
> - 紧张段加短句切入,营造紧凑感
> - 缓慢段允许稍长,但不要超过 4 句一段
> - 段落之间用简短的过渡句
>   不要改变剧情、人物、对话内容。
>   输出修改后的完整章节正文。

### Round 4 — 网络感 (可选,用户在 SettingsDialog 启用)

prompt 指令:

> **[info]** 适度加入番茄网文常见表达:
>
> - 心理活动加入"卧槽" "我去" "tnnd" 等口语词 (但不脏)
> - 旁白偶尔用"听好了" "你猜怎么着" 之类口吻
> - 不要每段都加,大约每 3-5 段一处即可
>   保留原文的所有信息与剧情。
>   输出修改后的完整章节正文。

## Humanizer Agent 实现

```ts
// lib/agents/humanizer.ts
export const humanizerAgent = new Agent({
  id: 'humanizer',
  model: 'deepseek/deepseek-v4-pro',
  instructions: humanizerPrompt,
  tools: { readChapter, writeChapter },
})

// 多轮编排
export async function humanizeChapter(projectId: string, chapterId: string, options: HumanizeOptions) {
  const original = await readChapter(projectId, chapterId, 'draft')
  
  let current = original.content
  const rounds: RoundResult[] = []
  
  for (const round of pickRounds(options)) {
    const result = await humanizerAgent.generate({
      prompt: roundPrompts[round],
      context: { current, style: options.style, examples: options.examples },
    })
    rounds.push({ round, before: current, after: result.text })
    current = result.text
  }
  
  // 通过 writeChapter (needsApproval) 触发审批流
  await humanizerAgent.runTool('writeChapter', {
    chapterId,
    section: 'draft',
    content: current,
    reason: `去 AI 化:运行轮次 ${rounds.map(r => r.round).join(',')}`,
  })
  
  return { rounds }
}
```

## ApprovalCard 展示

去 AI 化的 ApprovalCard 比普通的丰富:

- 多标签页 (UI Tabs 组件): "整体 diff" / "Round 1" / "Round 2" / "Round 3" / "Round 4"
- 每 tab 显示该轮的 before/after
- 用户可以选择"接受 round 1+2,跳过 round 3+4"
- 接受规则: 只把选中的轮次叠加,最终内容用 writeChapter 写盘

## 风格特征提取 (用户范文)

如果用户提供了 `exampleCorpusFiles`,启动时 Humanizer 会跑一次"特征提取":

```
prompt:
  我提供了 N 篇范文,你的任务是抽取它们共同的语言风格特征。
  请输出 JSON:
  {
    "averageSentenceLength": 数字,
    "commonOpeners": ["接着", "然后", ...],
    "punctuationDensity": "高 / 中 / 低",
    "dialoguePattern": "...",
    "narrativeRhythm": "...",
    "uniqueExpressions": [...]
  }
```

提取的特征缓存到 `project.json.styleFeatures`,后续每轮 humanize 都注入到 prompt。

## 防过度修改

- diff 比例 >50% 时弹警告: "本次修改超过原文一半,可能偏离原意,确认继续?"
- 对话 (引号内的内容) 不被 round 1/3 修改 (prompt 严格指令)
- 关键名词 (主角名、地点名) 不被 round 2/4 替换 (用 entity 表 + prompt 提醒)

## 测试

- 单测: 每个 round 的 prompt 给定 input,LLM 输出符合预期模式 (sentence length 下降 / 口语词比例上升)
- E2E: 从 ChatBox 触发到 ApprovalCard 出现完整流程

## 失败回退

- 任意一 round 失败 → 中断,返回已完成轮次的产物,提示"X 轮成功 + Y 轮失败,是否就此审批?"
- 全部失败 → 错误卡片,不触发 writeChapter

## 与风格定制的关系

- 风格定制 (project.style) 影响**生成时**的写作 (Writer agent)
- 去 AI 化 (humanizer) 是**生成后**的二次加工
- 两者可叠加: Writer 已遵守 style,humanizer 进一步贴近范文
