# 008 — plan/ 重写实施计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 把 plan/ 从 12 篇被技术细节污染的"半技术 PRD"重写为 10 篇纯产品 PRD,技术内容全部迁入 spec/,UI 内容归 design/,并同步章程(README / CLAUDE.md / AGENTS.md)与全仓引用。

**Architecture:** 三波执行——①章程与技术内容迁移(先立规矩、先搬家,保证删旧篇时零信息丢失);②按定稿骨架写 10 篇新 plan(每篇一个任务一个 commit);③删旧篇、修全仓引用、更新 README / CHANGELOG / TODO、终验扫描。

**涉及范围:** plan/(重写)、spec/(新增 28 + 若干补全)、design/(少量补全)、README.md、CLAUDE.md、AGENTS.md、TODO.md、CHANGELOG.md、progress/(本计划 + 历史链接降级)。

---

## 全局约定(所有任务必读)

### G1 · 新 plan 的写作红线

plan 正文**禁止出现**:

- 库名 / 框架名 / 版本号(Next.js、TipTap、XState、Drizzle、sqlite、Tailwind、DeepSeek 等)
- 代码块(ts / sql / json / bash / yaml)、类型定义、函数名、工具签名
- 数据库表名 / 字段名 / SQL / 索引 / 向量 / embedding / reindex
- API 路径 / endpoint / 协议细节(SSE / JSON mode / zod / stopWhen)
- 模型 ID 与调用参数(reasoningEffort / ctx / max output / token 数字)
- 毫秒级 / token 级性能数字
- "Hidden Agent / callJsonAgent" 概念(用户感知的团队只有 7 个角色)

**允许**:用户场景、产品行为与承诺、领域知识数字(如"爽点密度 1500-2500 字一个")、产品级 mermaid(用户视角,节点不嵌 spec 编号 / 接口名)、plan 内部互链。

### G2 · 无历史包袱纪律

- 禁止出现:TODO、开放问题、历史决策表(ADR)、阶段词(MVP / 一期 / 二期 / W3 / phase / roadmap)、"简化版 / 砍掉 / 暂不 / 后续补 / 二期补"。
- 全部**现在时**陈述("系统做 X"),不出现"原来 / 现有 / 我们曾考虑"。
- 设计理由内联到叙述里("为什么整批审"是设计的一部分,不是决策记录)。
- 未决事项一律写 TODO.md,变更历史一律写 CHANGELOG.md,都不进 plan。

### G3 · 结构模板

- 能力章(05-10)开篇:H1 后第一段用两行"**你此刻的问题**:…。**产品的回答**:…"。
- 正文零 spec/design 链接;每篇文末固定小节 `## 实现承载`,集中列出本篇能力对应的 spec / design 文档链接(唯一允许出现这两类链接的位置)。
- 篇间权威归属:红线全文只在 03;审批卡结构只在 07(守则风险区 / 读者预演区是占位,内容在 10、通过语义在 03);可关矩阵只在 05;队列语义以"审批卡出现"为界,出现前归 06、出现后归 07;09 对故事世界只回指 08,不重述。

### G4 · 术语对照(plan 用语)

| 禁用 / 旧词 | plan 用语 |
|---|---|
| Writer / Checker / Validator / ReaderPanel / Humanizer / Reflector / Router | 写手 / 审稿人 / 一致性守护者 / 读者评审团 / 润色师 / 反思学习者 / 调度员(05 首次提及可括注英文名) |
| ApprovalCard | 审批卡 |
| cascade / ChangeSet | 连带修改 / 整批修改 |
| learnings | 经验 |
| frontmatter | 资料卡要素(角色卡 / 章节卡) |
| persona | 虚拟读者 |
| token 用量 | 用量 |
| doom-loop | 重做循环保护 |
| embedding / 语义检索 | 文意关联(能力名) |

### G5 · 验证命令(每篇写完后跑;Task 21 全量跑)

```bash
cd /Users/huangjin/dev/projects/open-novel

# 1) 技术词扫描(期望:plan/ 零命中)
rg -ni "next\.js|react|typescript|tiptap|prosemirror|xstate|zustand|drizzle|sqlite|tailwind|shadcn|pnpm|chokidar|zod|deepseek|stopwhen|endpoint|/api/|embedding|frontmatter|schema|\bsql\b|json|sse\b|reasoningeffort|calljsonagent|hidden agent" plan/

# 2) 阶段词 / 历史包袱扫描(期望:零命中)
rg -n "MVP|一期|二期|W[0-9]|[Pp]hase|roadmap|TODO|待定|开放问题|遗留|暂不|后续再|后续补|简化版|砍掉|ADR" plan/

# 3) spec/design 链接纪律(命中行必须全部位于各篇"## 实现承载"小节内,人工核对)
rg -n "\]\((\.\./)?(spec|design)/" plan/

# 4) 禁 .html 链接(期望:零命中)
rg -n "\.html\)" plan/

# 5) 断链检查(期望:无 BROKEN 输出)
rg -o '\]\(([^)#]+\.md)' -r '$1' --no-filename plan/ | sort -u | while read p; do [ -f "plan/$p" ] || echo "BROKEN: $p"; done
```

### G6 · 旧文内容获取与 git 约定

- 执行开始时记录基线:`BASE=$(git -C /Users/huangjin/dev/projects/open-novel rev-parse HEAD)`。任何任务需要旧 plan 内容时用 `git show $BASE:plan/<file>` 读取,不依赖工作树中文件是否还在。
- 每个任务一个 commit,message 用 `docs(<scope>): <动作>` 风格(参照仓库历史)。
- commit 身份 `jinhuang712 <36698563+jinhuang712@users.noreply.github.com>`;使用原生 git。
- **执行前置条件:工作树必须干净**(2026-06-11 检查发现 design/01、plan/07 等有未提交的外部修改,须由 owner 先处理)。

### G7 · 旧 → 新内容总映射(执行时的寻路表)

| 旧篇 | 产品内容去向 | 技术内容去向 |
|---|---|---|
| 01-overview | 新 01 / 02 / 03 / 04 | 技术决策表 → spec/28 |
| 02-multi-agent | 新 05(团队)/ 06(队列)/ 09(学习边界) | 模型分配、Hidden Agent、Router JSON、memory-guard → spec/02/11/13/22/24 |
| 03-editor-layer | 新 08(边写边查);交互细节 → design/01 | EditorAdapter、高亮实现、粘贴、IME → spec/05 |
| 04-storage-model | 新 08(设定体系、资料卡)/ 02(数据归你)/ 04(单窗口) | 目录 schema、连接池、watcher → spec/01/13/16/17/27 |
| 05-modes-and-approval | 新 06(模式)/ 07(审批) | 状态机、proposal 工具、endpoint → spec/06/07 |
| 06-cascade-and-reflection | 新 07(连带修改)/ 09(学习) | 算法步骤、权重阈值、weight 参数 → spec/19/22 |
| 07-ui-layout | design/01 等;零散产品语义 → 新 05 / 06 | — |
| 08-tech-stack | 姿态句 → 新 02 / 04 | 整篇 → spec/28(新建) |
| 09-narrative-engine | 新 10 | 报告类型 → spec/10 |
| 10-reader-simulator | 新 10 | 报告类型、采样 → spec/11 |
| 11-knowledge-graph | 新 08 | 表 / 算法 / 对接表 → spec/16-21 |
| 12-memory-and-context | 新 08(一致性立场)/ 09(记忆) | 参数表、分层实现 → spec/22/23 |

### G8 · 旧不变性 → 新红线编号映射(Task 9 与 Task 18 共用)

| 旧 plan/01 不变性 | 新去向 |
|---|---|
| #1 写入必经审批 | 03 红线 R1 |
| #2 多项目零串扰 | 03 红线 R2 |
| #3 三模式严格分离 | 03 红线 R3 |
| #4 未决连带修改阻断写作 | 03 红线 R4 |
| #5 路径与不可信内容零信任 | spec/02(工程红线,确认已覆盖后从 plan 移除) |
| #6 每轮必反思、取消不学 | 03 红线 R5 |
| #7 docs-before-code | CLAUDE.md / AGENTS.md(工作规范) |
| #8 影响半径不依赖 LLM | 03 红线 R6(表述为"连锁影响列表确定、完整、可解释") |
| #9 派生视图只读、锚点稳定 | 03 红线 R7(产品面) |
| #10 四层记忆、事实库为准 | 03 红线 R8 |
| #11 上下文契约不裁剪 | 03 红线 R9 |
| #12 JSON 校验 + 守则不可绕过 | 守则面 → 03 红线 R10;JSON 工程面 → spec/24(确认已覆盖) |

---

## Wave A · 章程与技术内容迁移

### Task 1: 执行基线检查

- [ ] **Step 1:** `git -C /Users/huangjin/dev/projects/open-novel fetch origin && git status -sb` — 确认工作树干净、基于最新 origin/main(或 owner 已确认的本地领先提交)。不干净则停止,交还 owner。
- [ ] **Step 2:** `BASE=$(git rev-parse HEAD)` 记录基线 commit,写进执行笔记。

### Task 2: 章程更新(CLAUDE.md + AGENTS.md)

**Files:** Modify `CLAUDE.md`、`AGENTS.md`(两份内容必须完全一致)

- [ ] **Step 1:** "文档体系"与"文档职责边界"中 plan 的定义改为:`plan/*.md: 纯产品 PRD——产品设计、原则、红线、目标与边界、核心能力;零技术细节`。
- [ ] **Step 2:** 新增小节"plan 写作纪律",内容 = 本计划 G1 + G2 + G3(红线清单、无历史包袱纪律、实现承载小节约定)。
- [ ] **Step 3:** 在 Git 规则或核心原则中补一条:docs-before-code(代码 commit 前对应 plan/spec 必须先有并经 owner 认可)——从旧 plan/01 不变性 #7 移籍至此。
- [ ] **Step 4:** 核对两份文件 diff 一致:`diff CLAUDE.md AGENTS.md`(允许仅标题行差异;本仓库两份全文一致,期望无差异)。
- [ ] **Step 5:** Commit:`docs(charter): redefine plan/ as pure product PRD with writing discipline`

### Task 3: 新建 spec/28-tech-stack.md(承接旧 plan/08 全部技术内容)

**Files:** Create `spec/28-tech-stack.md`;Modify `spec/00-version-audit.md`(互链)

- [ ] **Step 1:** 以 `git show $BASE:plan/08-tech-stack.md` 为底稿创建 spec/28,保留:栈分层总览图、锁定的库版本表、锁定策略原则、集成关键点全部小节(Next+sqlite / TipTap / Tailwind v4 / shadcn / Drizzle+sqlite-vec 代码 / DeepSeek 配置与调用形态 / 应用层 memory 示例)、版本升级流程、ADR A-E(改标题为"设计取舍")。
- [ ] **Step 2:** 并入旧 plan/01 §关键技术决策汇总表,作为 spec/28 开头的"技术决策总览"。
- [ ] **Step 3:** 修正文内链接:原 `../spec/xx` 改 `./xx`;原指向 plan/04/12 的链接按 G7 改指新 plan 篇或对应 spec。与 spec/00、spec/09 重叠的内容(版本实查清单、构建配置)改为链接引用,不复制。
- [ ] **Step 4:** 在 spec/00 开头"关联文档"加 spec/28 互链。
- [ ] **Step 5:** 跑 G5-5 断链检查(范围换成 spec/28);Commit:`docs(spec): add 28-tech-stack carrying plan/08 technical content`

### Task 4: spec/05 编辑器实现补全(承接旧 plan/03 技术块)

**Files:** Modify `spec/05-entity-highlight.md`;可能 Modify `design/01-main-layout.md`

- [ ] **Step 1:** 对照 `git show $BASE:plan/03-editor-layer.md`,逐块检查 spec/05 是否已含:EditorAdapter 完整接口、实体高亮 plugin 草案、AC trie 选型与性能策略(增量扫描 / Worker / debounce / trie 版本号)、别名映射类型、IME 安全、富文本粘贴 handler、编辑器迁移路径、TipTap 三条设计取舍。检查命令例:`rg -n "EditorAdapter|ahocorasick|immediatelyRender|handleDOMEvents" spec/05-entity-highlight.md`
- [ ] **Step 2:** 缺失块迁入 spec/05(新小节"EditorAdapter 与实现要点"),已有的不重复。
- [ ] **Step 3:** 检查 design/01 是否覆盖 Goto Definition UX 表、Backlinks 面板、框选修改交互、**Rename Across Project**;缺则在 design/01 追加小节(只追加,不改既有内容——该文件可能有并行修改)。
- [ ] **Step 4:** Commit:`docs(spec): absorb editor-layer implementation details into spec/05`

### Task 5: spec/01 / 17 / 13 存储实现补全(承接旧 plan/04 技术块)

**Files:** Modify `spec/01-storage-schema.md`、`spec/17-paragraph-anchors.md`、`spec/13-settings.md`

- [ ] **Step 1:** 对照 `git show $BASE:plan/04-storage-model.md`,核查并迁入缺失块:连接池策略(LRU / runtime.db 常驻 / globalThis 缓存 / 删项目先 close)→ spec/01;chokidar watcher 代码与外部修改→审批 invalidate 协议 → spec/17(已有 chokidar 提及,补全协议);导出包内容清单与导入冲突处理 → spec/13;单 tab 假设的工程语义 → spec/13。两库拆分 / LRU / chokidar 三条设计取舍并入对应 spec 的"设计取舍"小节。
- [ ] **Step 2:** 核查命令例:`rg -n "LRU|globalThis|chokidar|fs:changed|单 tab" spec/01-storage-schema.md spec/17-paragraph-anchors.md spec/13-settings.md`
- [ ] **Step 3:** Commit:`docs(spec): absorb storage-model implementation details into spec/01,13,17`

### Task 6: spec/11 / 22 / 19 / 24 Agent 层补全(承接旧 plan/02 / 06 / 12 技术块)

**Files:** Modify `spec/11-reader-personas.md`、`spec/22-memory-and-history.md`、`spec/19-impact-analysis.md`、`spec/24-json-output.md`、`spec/13-settings.md`

- [ ] **Step 1:** 对照 `git show $BASE:plan/02-multi-agent.md`:ReaderPanel 长章采样策略(>5K 字取前 1000 + 后 800 + 中段冲突点)→ spec/11;memory-guard 代码与 thread/resource 命名 → spec/22(核查已有则不动);模型分配表(Pro/Flash × reasoningEffort、禁 fallback 旧型号)→ spec/13 §模型分配(核查);Router actions 枚举与 JSON 示例 → spec/24/26(核查);Hidden Agent 清单表 → spec/24 §callJsonAgent 调用点(核查,缺则加)。
- [ ] **Step 2:** 对照 `git show $BASE:plan/06-cascade-and-reflection.md` 与 `$BASE:plan/12-memory-and-context.md`:SQL 权重 / 阈值 / 耗时与 weight 衰减参数、注入 top-K 参数表 → spec/19/22/23(核查,这些大概率已有,缺则迁)。
- [ ] **Step 3:** 核查命令例:`rg -n "前 1000|memory-guard|deepseek-v4|actions\[\]|topK|0\.95" spec/`
- [ ] **Step 4:** Commit:`docs(spec): absorb remaining agent-layer technical details from old plan`

---

## Wave B · 写 10 篇新 plan(每篇:写 → 跑 G5 单文件检查 → commit)

> 每篇都遵守 G1-G4。来源一律 `git show $BASE:plan/<旧篇>`。commit message 统一 `docs(plan): rewrite NN-<slug> as pure product PRD`。

### Task 7: plan/01-overview.md(覆盖旧文件)

**结构与内容要求:**

- [ ] H1 + 定位段:面向番茄小说作者的 AI 长篇创作工作台;写作优先——纸面是唯一主角,AI 团队的能力召唤即来("IDE 的能力,纸面的外观",2026-06-11 writing-first pivot);"驾驶位上的创作合伙人,不是一键生成器"。
- [ ] `## 解决什么问题`:三个根本问题各一段——前后不一致崩坏 / 节奏与结构失控 / 作者的读者视角缺失;每段末尾指向对应能力章(08 / 10)。
- [ ] `## 核心场景速览`:5 条一行式——①故事种子 → 世界观 / 大纲 / 角色逐项生成与审定(开书含样例项目);②改核心设定 → 系统给出全部连锁影响 → 一次审完;③章节概要 → 正文 → 去 AI 化的一键流水线;④边写边查:点角色名跳资料、随口问"林川上次见王小芳是哪一章";⑤多项目并行互不污染。
- [ ] `## 能力亮点`:一页清单,每条一行用户语言(AI 角色编辑部 / 整批审批 / 连带修改 / 故事世界 / 写前自动备料 / 边写边查 / 叙事诊断 / 读者预演 / 越用越懂你 / 去 AI 化 / 数据归你)。
- [ ] `## 与同类产品的差异`:紧凑对照表(NovelCrafter / Sudowrite),全部能力语言:自动连锁一致性 vs 手动百科;发布前读者预演 vs 无;反馈学习 vs 无;角色团队 vs 单 AI;过程透明 vs 黑盒;中文一等公民。**禁出现 SQL / 向量 / 上下文容量数字。**
- [ ] `## 阅读地图`:10 篇各一行 + 三层文档体系一句话(plan 产品 / spec 实现 / design 界面)。
- [ ] `## 实现承载`:链 spec/、design/ 总入口即可。
- [ ] 图:无。来源:旧 01、11(差异表)。

### Task 8: plan/02-principles.md

- [ ] 开篇段:本篇是一切功能设计的依据;每条原则配反模式("永不这么做")。
- [ ] 七条原则,每条固定四段(**原则 / 含义 / 约束什么 / 反模式**):
  1. **用户驾驶位** — 一切写入作品的动作必经你的审批 → 反模式:一键全自动代笔、静默落盘。
  2. **透明非黑盒** — AI 的每一步都可查:默认收敛为一句话状态,全量推理与动作随时召唤回看 → 反模式:不可见的内部决策、查不到的执行过程。
  3. **给信号不替决策** — 诊断与预演只标记不阻断 → 反模式:总分排行 / gamification、强制修正、低分阻断发布。
  4. **心流保护** — 纸面是唯一主角;一切诊断在章节完成后批量给出;唯一允许主动打断你的是审批 → 反模式:写作中途实时打断、常驻信息过载。
  5. **一致性 > 一切** — 一致性所需材料必装齐;装不下明确告知分卷 → 反模式:为省成本悄悄裁剪、静默降级。
  6. **数据归你** — 作品是本机纯文本文件,任何编辑器可打开、可版本管理、随时整体带走、卸载不丢;粘贴永远只保留纯文本;外部修改会被感知并礼貌处理;项目与设置可整体导出 → 反模式:云锁定、账号绑架、私有格式。
  7. **成本透明可控** — 用量随时可见、能力档位可调、高成本能力可关 → 反模式:不可见的消耗、不可关的开销。
- [ ] 各条句尾可引 03 红线编号(如"对应红线 R1")。`## 实现承载`。图:无。
- [ ] 来源:散落旧各篇的立场句(旧 01 设计原则、04 目标、09/10 不做什么、12 一致性优先)。

### Task 9: plan/03-guardrails.md

- [ ] 开篇段:红线 = 绝不允许发生的事;与 02(我们信什么)、04(我们不做什么)的三筐分工一句话。
- [ ] `## 五大网文守则`:守则 1-5 各一小节——定义、领域依据(数字保留:前 3000 字 / 爽点 1500-2500 字一个 / 价值观偏离基线等)、检测时机(每章完成后)、风险等级的用户语义(提示级仅展示;critical 必须勾"明知违反仍通过"才能通过;blocking 直接禁止通过);守则检测不可整体关闭、阈值可微调。
- [ ] `## 产品红线`:R1-R10(按 G8 映射产品语言化,每条一短段、现在时,不带任何机制描述)。
- [ ] `## 红线变更纪律`:红线全文只在本篇,其他篇只引用编号;任何红线调整是跨文档事件,必须同步 spec 与 CHANGELOG。
- [ ] `## 实现承载`:spec/25、06、07、19、24。图:无。来源:旧 01 不变性、spec/25 概念面。

### Task 10: plan/04-goals-and-non-goals.md

- [ ] `## 产品目标`:4-5 条 + 各自的作者可感知成功标准(写百章不出一致性事故 / 改设定一次审完不留尾巴 / 发布前预知留存风险 / 越用越合手 / 作品永远可带走)。
- [ ] `## 非目标`:清单,每条只有两个字段——不做什么 + 为什么(设计立场口吻,无排期暗示):联网研究 / 多用户协作与实时协同 / 云同步与多设备 / 移动端 / 平台自动发布 / 模型微调 / 真实留存数据校准 / 跨项目共享记忆与经验 / 写作中实时干预 / 替作者做发布决策 / 独立向量服务这类条目**不出现**(那是技术选型,归 spec)。
- [ ] `## 平台约束`:本地优先、单机单用户、单窗口(开第二个窗口不做协调,以最后写入为准的诚实声明)、桌面平台范围。
- [ ] `## 新需求裁决原则`:三问——伤不伤 02 的原则?撞不撞 03 的红线?是否已是本篇非目标?
- [ ] `## 实现承载`。图:无。来源:旧各篇"不做什么"、README §不在 POC 范围、旧 04 单 tab。

### Task 11: plan/05-agent-team.md

- [ ] 开篇问答(G3)。`## 一个编辑部,不是一个 AI`:团队隐喻段。
- [ ] `## 七个角色`:各一小节(职责 / 出场时机 / 产出给你什么),首提括注英文名:调度员(Router)、写手(Writer)、审稿人(Checker)、一致性守护者(Validator)、读者评审团(ReaderPanel)、润色师(Humanizer)、反思学习者(Reflector)。
- [ ] `## 协作流水线`:mermaid 一张(你的输入 → 调度 → 写手起草 → 风格 / 事实 / 读者三路并行审 → 汇成一张审批卡 → 你决定 → 反思学习者复盘)。节点零技术词。
- [ ] `## 你的控制权`:能力档位(深度档 / 快速档)按角色可调;**可关矩阵**(本篇为唯一权威):读者评审团可整体关、单个虚拟读者可开关调权,润色师按需调用,守则检测永不可关(对应 03);用量随时可见;助手性格 / 文风 / 流派 / 范文定制。
- [ ] `## 实现承载`:spec/02、03、13。来源:旧 02(产品面)、07(Settings 概念、ThinkingPanel 归 06)。

### Task 12: plan/06-collaboration-and-modes.md

- [ ] 开篇问答。`## 铁三角`:提议 → 审批 → 持久,一段。
- [ ] `## 三种工作模式`:表(讨论 / 设定 / 写作 × 用户场景 / AI 可读 / AI 可改);模式只能你显式切换,AI 永不自行切换;有待审事项时模式锁定、输入锁定(给出提示)。
- [ ] `## 一次输入,多个动作`:排队顺序执行;新输入可插队、可取消排队中的动作、可继续审批;两个口语示例("写第三章开头,顺便看第二章节奏" / "等下,先别写第三章了")。**本篇只管审批卡出现之前的队列语义**(G3)。
- [ ] `## 长任务体验`:进度逐步可见;随时可取消;取消时已完成的部分保留;重做循环保护——AI 带着你的拒绝理由反复重做仍高度相似时,升级交还你人工裁定。
- [ ] `## 透明工作台`:AI 过程默认收敛为一句话状态(谁在干什么、进行到哪);全量推理与动作随时召唤回看、可复制粘贴给 AI 当反馈;过程细节是信任的备查证据,不是时刻必读的内容。
- [ ] mermaid 一张:三模式切换(用户视角)。`## 实现承载`:spec/04、07、26;design/01、06。来源:旧 05(模式)、02(路由产品面)、07(ThinkingPanel / 进度条)。

### Task 13: plan/07-approval-and-cascade.md

- [ ] 开篇问答(改一处设定,后面几十章怎么办?)。
- [ ] `## 设计核心`:连锁影响先算完整、再一次呈现;为什么整批审而不是逐条审(全貌可见、一次决策、要么全生效要么全不生效)——理由内联成叙述。
- [ ] `## 审批卡`(结构唯一权威):影响图谱;逐条改动对比;按置信度默认勾选(高 / 中默认勾,低置信黄色提示默认不勾);"已分析但无需改动"的条目也展示理由;守则风险区与读者预演区两个占位(内容见 10,通过语义见 03)。
- [ ] `## 勾选语义`:不勾 = 显式搁置,之后写到相关内容系统会重新发现并再次提议;全部拒绝 = 这次修改如同没发生;每条可手动编辑后同意。
- [ ] `## 拒绝反馈环`:拒绝必填理由;AI 带着理由重做。
- [ ] `## 审批的可靠性`:永不过期(跨日可回来继续审);关闭应用重开能恢复全部待审;同一审批重复确认与确认一次结果相同;整轮取消 = 完整回退,且取消的交互不进入学习。
- [ ] `## 审批历史`:全量回看、按批回退、可导出。
- [ ] mermaid 一张:用户视角审批旅程(提议 → 影响分析(进度可见) → 整批审 → 生效 → 复盘)。`## 实现承载`:spec/06、19、26;design/02。来源:旧 05、06、04(链路产品面)。

### Task 14: plan/08-story-world.md

- [ ] 开篇问答(写到第 50 章,它还记得第 3 章吗?)。
- [ ] `## 一致性立场`:一致性 > 一切;材料装齐;装不下明确告知分卷,绝不悄悄省略(对应 R9)。
- [ ] `## 故事世界的六个维度`:每维一段 + 一个"没有它会漏什么"的作者场景——人事物(实体)/ 关系网 / 时间线 / 世界规则("此世界没有手机"改了之后,所有用过手机的段落都能被找到)/ 伏笔与呼应(删掉埋伏笔的段落会被提醒)/ 文意关联(找得到"类似的台词写过没有")。mermaid 一张概念图(六维围绕作品,零表名)。
- [ ] `## 设定体系`:维度清单(世界观 / 大纲 / 节拍 / 角色 / 阵营 / 组织 / 地点 / 道具 / 事件 / 时间线 / 关系 / 故事线 / 伏笔 / 章节弧线 / 力量体系 / 术语 / 禁忌 / 主题 / 读者承诺);空置维度不打扰。
- [ ] `## 资料卡`:角色卡要素(本名与别名 / 弧光起点-终点-轨迹 / 读者承诺 / 角色禁忌 / 价值观基线 / 智力基线)+ 章节卡要素(钩子类型——前三章必填 / 主线支线 / 进度里程碑 / 视角角色 / 预期弧光可编辑);说明这些要素如何支撑守则检测与弧光追踪。
- [ ] `## 写前自动备料`:结果承诺句式("写第 50 章时,它已经知道林川此刻多大、和谁敌对、哪个伏笔该收了"),不列装配步骤。
- [ ] `## 边写边查`:点角色名跳资料 / 悬停看摘要 / 引用回链("这个角色被哪些章节引用")/ 全项目改名 / 框选一段让 AI 改 / 四类提问(某角色某章时的状态、两人关系演变、说过什么类似台词、哪些段落提过某物)——即问即答,不经创作模型杜撰。
- [ ] `## 世界治理`:派生资料(关系矩阵 / 年龄表)由系统维护,你不必也不能改;你的私人补充写在自己的笔记里;重大设定改动自动快照可回退;设定体检(孤儿设定 / 失效伏笔 / 失效关联提醒)。
- [ ] `## 约束`:系统不替你写设定;关系需你显式声明才被守护(正文里隐式提到不算);有未决连带修改时不能写正文(R4)。
- [ ] `## 实现承载`:spec/01、05、16-21;design/01。来源:旧 11、04、12、03。

### Task 15: plan/09-memory-and-learning.md

- [ ] 开篇问答。`## 四个记忆问题`:这一轮它记得吗 / 上回聊的还在吗(旧会话可回看、可恢复)/ 它学到我了吗 / 事实以哪为准——事实永远以故事世界为准(见 08,本篇不重述)。
- [ ] `## 历史不自动压缩`:立场——有损摘要伤一致性;极长会话由你主动开启压缩。
- [ ] `## 越用越懂你`:学习来源(你的同意 / 拒绝 / 手改与理由);整轮合并提炼(跨动作因果——改了性别又写了章,漏改称谓被拒,这串经验只有整轮看才学得到);学习边界(你取消的不学;纯讨论轮不学);经验生效(自动用于后续生成;与通用写法冲突时**你的偏好优先**;守则类经验优先保留;一般经验随时间淡化)。
- [ ] `## 经验对你透明`:它学到了什么,你随时可见、可调、可删。
- [ ] `## 为什么不是微调`:即时生效 / 全可见可解释 / 零启动成本——一段内联理由。
- [ ] mermaid 一张:学习闭环(你的决定 → 经验 → 下次生成 → 你的决定)。`## 实现承载`:spec/01、22、23;design/04。来源:旧 12、06。

### Task 16: plan/10-narrative-and-reader.md

- [ ] 开篇问答(写得爽不爽,读者买不买账?)。`## 立场`:网文胜负在节奏与结构,不在文笔;只给信号不替决策;心流保护——一切报告在章节完成后批量给出。
- [ ] `## 叙事诊断`:章内节拍(情绪曲线 / 冲突密度 / 节奏张弛 / 钩子强弱);跨章弧光偏离(软提示示例:"隐忍主角第 12 章顶嘴,与第 1 章人设偏离,是否合理交回你判断");全书趋势概览(看出卡文区 / 水章区);报告全部留档,可回看风险曲线变化,可对任意旧章主动发起分析(可只跑某个维度)。
- [ ] `## 结构模板库`:三幕剧 / 英雄之旅 / 起承转合 / 番茄黄金三章;可调用不强制,默认无偏好——模板是工具不是镣铐,散文式慢节奏也合法。
- [ ] `## 读者预演`:5 个虚拟读者表(追更党 / 逻辑控 / 情感党 / 毒舌读者 / 潜水大佬 × 关注什么 / 弃书触发 / 追更触发);章节风险报告(留存预测 / 多人共同标记的风险与亮点 / 发布建议);预演深度是产品参数(关键段 / 全文,默认关键段);自定义目标读者画像,可加可调权;非闸门——全员低分你仍可一键发布;只显标记不显总分排名(内联理由:评分排行会诱导你迎合虚拟读者、丢掉个人风格);诚实声明——文案反复出现"模拟读者,非真实预测,仅供参考"。
- [ ] `## 去 AI 化`:一键消除 AI 腔(长句过密 / 套话 / 翻译腔);与毒舌读者的 AI 味检测呼应;修改同样过审批。
- [ ] `## 实现承载`:spec/08、10、11、25;design/03。图:无(两张表足够)。来源:旧 09、10。

---

## Wave C · 删旧、修引用、收尾

### Task 17: 删除旧 plan 11 篇

- [ ] **Step 1:** `git rm plan/02-multi-agent.md plan/03-editor-layer.md plan/04-storage-model.md plan/05-modes-and-approval.md plan/06-cascade-and-reflection.md plan/07-ui-layout.md plan/08-tech-stack.md plan/09-narrative-engine.md plan/10-reader-simulator.md plan/11-knowledge-graph.md plan/12-memory-and-context.md`(01-overview.md 已在 Task 7 原地重写)。
- [ ] **Step 2:** Commit:`docs(plan): remove legacy semi-technical PRD files`

### Task 18: 全仓引用修复

**Files:** Modify `spec/*.md`、`design/*.md`、`progress/*.md`、`TODO.md`

- [ ] **Step 1:** 清点:`rg -n "plan/0|plan/1" spec/ design/ progress/ TODO.md CHANGELOG.md README.md`
- [ ] **Step 2:** 按 G7 + G8 重写每处引用:指向旧篇文件 → 改指新 plan 篇或对应 spec(如 `plan/08` → `spec/28`;`plan/07` → `design/01`;`plan/01 不变性 #8` → `plan/03-guardrails.md 红线 R6`)。
- [ ] **Step 3:** progress/ 内的旧 plan 链接降级为行内代码(非链接)并括注去向,例:`` `plan/08-tech-stack.md`(已并入 spec/28) ``——历史叙述本身不改。
- [ ] **Step 4:** 复跑 Step 1 命令确认无指向已删除文件的链接;跑 G5-5 全仓版断链检查(范围 spec/ design/ progress/)。
- [ ] **Step 5:** Commit:`docs: remap all cross-references to new plan structure`

### Task 19: README.md 重写导航

- [ ] **Step 1:** plan 层定义改"纯产品 PRD(产品向)——产品设计、原则、红线、目标边界与核心能力";导航列新 10 篇(每篇一行,沿用各篇 H1 副标题)。
- [ ] **Step 2:** spec 导航补 `28-tech-stack`;"核心能力"清单改纯用户语言(删 callJsonAgent / SQL / transaction 等);"技术栈"表保留但注"详见 spec/28";"设计原则"节指向 plan/02、03;"当前实现方向"块中 plan/08 引用改 spec/28;"不在 POC 范围"与 plan/04 对齐并互链。
- [ ] **Step 3:** 跑 G5-5(范围 README.md);Commit:`docs(readme): update navigation for pure-product plan structure`

### Task 20: CHANGELOG + TODO

- [ ] **Step 1:** CHANGELOG.md 新增条目:重构动机与范围;旧 12 篇 → 新 10 篇 + spec/28 的对照表(即 G7);技术设计取舍的迁移去向(旧各篇 ADR → spec 对应篇清单);红线编号映射(G8)。
- [ ] **Step 2:** TODO.md:逐条检查指向旧 plan 章节的条目,改指新位置;迁移过程中发现的真实未决项(若有)登记于此,**不写进 plan**。
- [ ] **Step 3:** Commit:`docs: record plan restructure in changelog and update todo pointers`

### Task 21: 终验

- [ ] **Step 1:** 全量跑 G5 五条命令,逐条达到期望(第 3 条人工核对实现承载位置)。
- [ ] **Step 2:** 残留扫描:`rg -n "02-multi-agent|03-editor-layer|04-storage-model|05-modes-and-approval|06-cascade-and-reflection|07-ui-layout|08-tech-stack|09-narrative-engine|10-reader-simulator|11-knowledge-graph|12-memory-and-context" --glob '!CHANGELOG.md' --glob '!progress/**' .` 期望零命中。
- [ ] **Step 3:** 通读新 plan 10 篇一遍,核对 G3 权威归属无双写(红线 / 审批卡 / 可关矩阵 / 队列分界)。
- [ ] **Step 4:** `git log --oneline origin/main..HEAD` 复核本次全部 commit;推送由 owner 决定(分支上另有未推送的 design 主题提交)。
