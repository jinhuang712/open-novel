# design/03 — ReaderPanel 章节风险报告

> 原型:`design/prototypes/03-reader-panel.html` · 上游:[plan/10 读者仿真器](../plan/10-reader-simulator.md) · [spec/11 读者 Persona](../spec/11-reader-personas.md)

5 个 persona(追更党 / 逻辑控 / 情感党 / 毒舌读者 / 潜水大佬)并行读一章,聚合成一份**发布前留存预演报告**。报告嵌在 ApprovalCard 内(write 模式章节工具时),也可从命令面板独立触发后在右栏单独成卡。

## 报告信息架构

```mermaid
flowchart TB
  HEAD["头部: 留存预测 68/100 (环形) + recommendation 徽标 + 5 个 persona 色点"]
  RISK["多人标记的风险 (按标记人数降序)"]
  WIN["多人标记的亮点"]
  DETAIL["展开 5 个读者反馈 (persona 卡)"]
  ACT["行动: 按风险点修改 / 跳过"]
  HEAD --> RISK --> WIN --> DETAIL --> ACT
```

## 头部

- **留存预测环**:64px 环形进度,数值大字居中;色段 0-39 danger / 40-69 warning / 70-100 success
- **recommendation 徽标**:`publish`(success)/ `minor-tweak`(warning)/ `rework`(danger)/ `insufficient`(neutral,<3 persona 成功时,[spec/11 §聚合算法](../spec/11-reader-personas.md#聚合算法))
- persona 色点行:5 个 12px 圆点(成功=实心 agent-reader 色系,失败=空心),hover 显示 persona 名与状态

## 风险 / 亮点行

| 元素 | 规则 |
|---|---|
| 计数徽标 | 「3/5 标」,≥3 人标记 = danger/success 强调,2 人 = 弱化 |
| 类型 chip | 风险:毒点 / 坑 / 突兀 / AI 味(danger 系);亮点:爽点 / 钩子 / 亮点(success 系) |
| 描述 | 一行原因 + 段落定位「第 5-7 段」,点击跳编辑器对应段(anchor 同款跳转) |
| severity | 风险行左缘 2px 条:high=danger / mid=warning / low=neutral |

排序:标记人数 desc → severity desc。各最多直出 4 行,更多收进「全部 N 条」。

## Persona 反馈卡(展开区)

- 折叠头:「展开 5 个读者反馈」+ 各 persona 缩略 sentiment(↑+62 / ↓-35)
- 每卡:persona 名 + 一句人设(如「毒舌读者 · 专挑 AI 味」)、三指标(sentiment -100~100 / 留存 0-100 / 弃书风险 0-1 转百分比)、`naturalLanguageReaction` 全文(像真实读者评论,引用排版:左缘 3px persona 色条 + 衬线斜体)
- highlights / warnings 以 chip 列表附在评论下,点击同样跳段
- 自定义 persona 卡右上角 `badge-neutral「自定义」`;编辑入口跳 Settings §读者仿真器

## 进行态(长任务)

- 触发后 ChatBox 顶部进度条:「ReaderPanel · 3/5 · 毒舌读者 · 4.5s」([plan/07 §长任务进度条](../plan/07-ui-layout.md#长任务进度条))
- 报告区先以骨架卡占位,每个 persona 完成即点亮其色点并填入缩略 sentiment
- 取消:已完成 persona 保留;<3 成功 → 头部显示 `insufficient`,不出 recommendation,提供「补跑失败的 2 个」按钮

## 状态矩阵

| 状态 | 表现 |
|---|---|
| 全部成功 | 完整报告 |
| 部分失败(≥3 成功) | 正常聚合;失败 persona 色点空心 + tooltip 错误摘要 + 单个重跑 |
| <3 成功 | `insufficient` 徽标,只列已完成反馈,无 recommendation |
| 章节过短(<800 字) | 空态:「章节太短,读者还没进入状态」+ 继续写作引导 |
| 嵌在 ApprovalCard 内 | 报告作为卡内一个 section,行动钮「按风险点修改」= 拒绝 + 预填反馈 |

「按风险点修改」预填内容 = 已勾选风险行的 reason 列表,进入拒绝反馈环([design/02 §行动栏](./02-approval-cascade.md#行动栏))。

## 主题适配

- 留存环底环用 `--border`,深色下不发灰;数值与徽标用语义色 token 自动适配
- persona 评论引用块底色 `--bg-sunken`,深色主题下与卡面层次保持(sunken 比 surface 暗)
- 风险/亮点 chip 全部「浅底 + 深字」配对,禁止实底高饱和大色块
