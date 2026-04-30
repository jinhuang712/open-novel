# Spec 15 — 首启引导 (Onboarding)

> 文档 audit 发现:README §快速启动只 3 步、plan/07 §初次启动 4 步,**没有真正的 wizard / 样例项目 / 7 Agent + 三模式 + 审批流的图文教程**。新作者用了 30 秒不知道点啥就走了。本文档补齐。

## 设计目标

- **3 分钟内首次产出**: 从启动到看到 AI 生成的第一段世界观,不超过 3 分钟
- **不强迫教程**: 老用户能 skip 全部 onboarding,直奔创建项目
- **概念渐进**: 7 Agent / 三模式 / 审批流 — 这些一上来就抛会吓跑作者。**用到时才解释,不一次性灌**
- **样例项目可一键加载**: 有现成的"重生互联网"样例,跑一遍能看完整产品形态

## 首启流程 (FirstRunFlow)

```
应用启动
   ↓
检测 ~/.open-novel/settings.json
   ↓
不存在 (首启) → 进入 OnboardingWizard
存在 → 跳过 wizard,主界面
```

### OnboardingWizard 4 步

```
┌─ 欢迎到 Open Novel ───────────────────────────────────────┐
│  Step 1/4: 你是谁?                                        │
│                                                           │
│  ○ 已经在番茄写过书的作者                                  │
│  ○ 想试试 AI 辅助写网文                                    │
│  ○ 学生 / 业余写作                                         │
│  ○ 跳过这个 (直接用)                                       │
│                                                           │
│              [跳过全部]    [下一步]                        │
└────────────────────────────────────────────────────────────┘
```

(用户身份不影响功能,但用于 telemetry / 后续推荐节奏 — POC 阶段仅记录。)

```
┌─ Step 2/4: 输入 DeepSeek API Key ──────────────────────────┐
│                                                           │
│  Open Novel 用 DeepSeek V4 跑创作。需要你的 API key。       │
│                                                           │
│  📋 怎么拿: https://platform.deepseek.com/api_keys          │
│  💰 成本预估: 写 10 万字小说约消耗 $X (基于 Flash + Pro 混用) │
│  🔒 Key 仅存于你本地: ~/.open-novel/settings.json          │
│                                                           │
│  [_____________________________________] [测试连接]        │
│                                                           │
│              [上一步]    [跳过 — 用 Mock LLM]   [下一步]    │
└────────────────────────────────────────────────────────────┘
```

"跳过 — 用 Mock LLM": 进入 Mock 模式 (二期实现),让用户先看 UI 再决定是否买 key。POC 阶段 Mock 模式仅返回 placeholder 文本,但流程走通。

```
┌─ Step 3/4: 创建你的第一个项目 ────────────────────────────┐
│                                                           │
│  ○ 加载样例项目 "重生互联网"  (推荐 — 5 分钟看完整流程)      │
│  ○ 创建空白项目                                            │
│                                                           │
│  ─ 创建空白时填:                                            │
│  项目名:    [______________]                               │
│  流派:      [▼ 都市重生   ]                                │
│  风格描述: [幽默轻松,节奏快]                              │
│  故事种子: [一个程序员重生回 2010 年互联网创业]             │
│                                                           │
│              [上一步]   [创建并进入]                        │
└────────────────────────────────────────────────────────────┘
```

加载样例: 把 `lib/onboarding/sample-project.zip` 解压到 `~/.open-novel/workspaces/proj_sample_zhongsheng_xxxx/`,自动选中。样例含:

- 已生成的 worldview.md / outline.md / 3 个 character.md
- 第 1 章已写完 outline + draft (3000 字)
- 历史: 5 条审批记录 + 3 条 learnings (展示反馈学习)

```
┌─ Step 4/4: 三件事先了解 ───────────────────────────────────┐
│                                                           │
│  Open Novel 与 ChatGPT 不同的三件事:                       │
│                                                           │
│  1️⃣  三种模式 (右下 ChatBox 顶部)                           │
│      Discuss = 检索讨论,Plan = 改设定,Write = 写章节       │
│      📌 焦点在输入框时按 Tab 循环切换                       │
│                                                           │
│  2️⃣  AI 不会偷偷改文件                                     │
│      所有写入都会先弹审批卡 (右下),你点同意才落盘           │
│                                                           │
│  3️⃣  设定改了系统会扫所有章节                               │
│      把主角性别从男改女,系统会列出所有需要同步改的段落      │
│                                                           │
│              [明白了,开始写吧]                             │
└────────────────────────────────────────────────────────────┘
```

## 主界面渐进式 Tooltip

进主界面后,**第一次出现某种状态时**弹一次性 tooltip (用 react-joyride 或自写):

| 触发 | tooltip |
|---|---|
| 首次焦点 ChatBox | "试试按 Tab 切换 plan/write/discuss 模式" |
| 首次出现 ApprovalCard | "AI 想改文件,先看 diff 再决定" |
| 首次出现 cascade 警告 | "Validator 帮你扫了相关章节,看看哪些段需要一起改" |
| 首次切到 plan 模式 | "现在 AI 只会改 settings/,不会动 chapters/" |
| 首次出现 ReaderPanel 报告 | "这是 5 个虚拟读者的反应,可参考可忽略" |

每条 tooltip 持久化到 `~/.open-novel/settings.json` 的 `seenTips: ['firstChatboxFocus', ...]`,不重复弹。

`重置首启提示` 按钮在 SettingsDialog → 数据管理 §危险区域。

## 样例项目 (sample-project.zip)

`lib/onboarding/sample-project.zip` 内容:

```
proj_sample_zhongsheng_xxxx/
├── project.json
│   {
│     "id": "proj_sample_zhongsheng_xxxx",
│     "name": "[样例] 重生互联网",
│     "genre": "都市重生",
│     "style": "幽默轻松,节奏快,短句多。",
│     "agentPersonality": "毒舌助理...",
│     "_isSample": true                ← 标记,UI 显示 [样例] 徽标
│   }
├── settings/
│   ├── worldview.md (~1500 字,详尽)
│   ├── outline.md (~800 字,前 10 章规划)
│   ├── beats.md (~500 字,关键节拍)
│   ├── characters/
│   │   ├── lin.md (主角)
│   │   ├── wang.md (合伙人)
│   │   └── xiaomei.md (女主)
│   └── places/beijing-2010.md
├── chapters/
│   └── 001-重生那一夜/
│       ├── outline.md
│       ├── draft.md (~3200 字)
│       └── meta.json
└── (无 index.db — 启动时由 Worker 重建)
```

**审批历史 / learnings 也预填** (重建 sql 时一并 seed):
- 5 条已审批 history (能看 diff)
- 3 条 learnings (能看反馈学习是怎么用的)

## "新手指引"面板 (持续可访问)

ActivityBar 加一个 [📚] 图标 → 打开 GuidancePanel:

```
┌─ 新手指引 ──────────────────────────────────────────┐
│  💡 5 件你应该知道的事                               │
│                                                     │
│  ▸ 三模式工作流 (Tab 切换)                          │
│    Discuss / Plan / Write 各自能做什么 [展开]        │
│                                                     │
│  ▸ 审批卡片怎么用                                    │
│    Y/N/E 快捷键 [展开]                              │
│                                                     │
│  ▸ 设定与章节的关系                                  │
│    为什么改性别会影响后面章节 [展开]                │
│                                                     │
│  ▸ 7 Agent 各自的角色                                │
│    Writer 写 / Checker 看 / Validator 校 [展开]      │
│                                                     │
│  ▸ ReaderPanel 是什么                                │
│    5 个虚拟读者帮你预演 [展开]                       │
│                                                     │
│  📺 视频导览 (二期)                                   │
│  📖 完整文档: https://github.com/.../plan/           │
└──────────────────────────────────────────────────────┘
```

每条展开是一段 markdown,内嵌可执行 demo (e.g. "试试现在按 Tab 切到 plan 模式" 后能高亮 ChatBox)。

## 错误时的 Onboarding 兜底

| 错误 | 友好提示 + 跳到 Onboarding 入口 |
|---|---|
| API key 无效 | "DeepSeek key 似乎有问题,要不要看下怎么拿 key?" → Step 2 |
| 没创建过项目就按 Tab | "ChatBox 在三个模式间切。但你还没有项目,先创建一个?" → Step 3 |
| ChatBox 空发送 | "试试输入 '帮我生成主角设定'" |

## 不做什么

- **不做强制教程视频**: 文字 + 渐进 tooltip 已够;视频留 v1+
- **不做游戏化进度条** ("解锁高级模式" 等): 不是消费产品,作者反感这种
- **不做 onboarding 收集详细问卷**: POC 单设备 localhost,不收集数据
- **不做"AI 引导对话"** (e.g. Claude Projects 的 "我帮你设置一下"): 那需要更成熟的对话模型,W12+ 再考虑

## 落地里程碑

| 周 | 动作 |
|---|---|
| W3 | OnboardingWizard 骨架 + Step 1-3 |
| W4 | Step 4 + 主界面渐进 tooltip 框架 |
| W5 | Sample project zip + auto-seed (审批 + learnings) |
| W7 | GuidancePanel + 错误兜底跳转 |
| W11 | 整体重审 + 文案打磨 |

## 持久化字段 (写入 ~/.open-novel/settings.json)

```yaml
onboarding:
  completed: true                       # 跑完 wizard
  identity: "tomato-author"              # Step 1 选项
  seenTips: ["firstChatboxFocus", ...]   # 看过的渐进 tooltip
  sampleLoaded: false                    # 是否加载过样例项目
```
