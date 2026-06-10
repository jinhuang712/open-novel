# CHANGELOG · 跨文档变更日志

## 2026-06-10 · design · 新增 design/ 界面设计体系(交互文档 + 双主题高保真原型)

| 变更 | 影响文档 | 关联 |
|---|---|---|
| 新增 `design/` 目录:`README.md`(设计原则与导航)、`00-design-tokens.md`(Claude Desktop 风格 token,light/dark 双主题色彩 / 字体 / 圆角 / 动效与对比度验收)、`01~06` 六篇界面交互设计文档(主界面五区 / ApprovalCard 与 cascade / ReaderPanel / Settings / Onboarding / 命令面板与快捷交互),内容基于 plan/03 05 07、spec/05 06 11 12 13 15 收束,只定交互与视觉,协议与 schema 仍以 spec 为准。 | `design/*.md` | 用户要求基于现有设计文档产出界面交互 / 原型图 / UI 样例,落在 `design/`;风格参考 Claude Desktop,必须支持 dark & light 双主题。 |
| 新增 `design/prototypes/`:`tokens.css`(唯一 token 源)+ `index.html` 原型索引 + 六个可交互高保真原型页,均支持深浅主题切换(跟随系统 + 手动记忆)。这是仓库唯一允许 `.html` 的目录(原型,非文档站)。 | `design/prototypes/*` | 同上。 |
| 文档规范同步:文档体系与职责边界新增 design 条目;spec 不再承载“原型图 / 样例 / 交互设计”,移交 design;链接规则细化为“Markdown 不得超链接 `.html`(以代码段写路径),`design/prototypes/` 内 HTML 互链允许”。README 增补 design 导航区、目录树与文档状态说明。 | `AGENTS.md` `CLAUDE.md` `README.md` | 为 HTML 原型在纯 Markdown 仓库中开出受控例外;两份 agent 规范保持一致。 |

## 2026-06-10 · markdown migration · 文档全面去 CAST 化

| 变更 | 影响文档 | 关联 |
|---|---|---|
| 53 个 CAST HTML 文档(plan 12 / spec 28 / progress 9 / index / TODO / changelist / CHANGELOG)迁移为纯 Markdown;63 张图表以 mermaid 代码块回填(源自 `site/diagram-sources.json` 的作者源);仓库内部链接全部 .md 化;逐篇经独立校验确认标题 / 表格 / 代码块 / 图表与 HTML 一致。 | 全部 `plan/*.md` `spec/*.md` `progress/*.md` `TODO.md` `CHANGELOG.md` `README.md` | 用户决定弃用 CAST skills,文档回归纯 Markdown。 |
| 删除 CAST 渲染基础设施:全部 `*.html`、`.cast-docs/`、`assets/`、`scripts/render_all_docs.py`、`site/`(docs.json / todo.json / changelist.json / diagram-sources.json)。 | 仓库根 | 内容已 1:1 进入 Markdown,渲染层不再需要。 |
| `AGENT.md` 重命名为 `AGENTS.md`,并与 `CLAUDE.md` 内容完全统一:去掉 CAST 工作流与 HTML validator 要求,改为 Markdown 文档体系 + mermaid-only 图表约定。 | `AGENTS.md` `CLAUDE.md` | 两份 agent 指南必须保持一致。 |
| changelist 与 CHANGELOG 合并:原 `changelist.html`(由 changelist.json 渲染)的内容成为本文件,`CHANGELOG.html` 兼容跳板移除;`index.html` 文档地图并入 `README.md`。 | `CHANGELOG.md` `README.md` | 用户确认 changelist 与 changelog 重复,保留 CHANGELOG。 |

## 2026-06-02 · docs audit · TODO 清零与图表修复

| 变更 | 影响文档 | 关联 |
|---|---|---|
| 按 `site/docs.json` 对发布文档集做逐篇审计,把文档重写 / CAST 化 / progress 角色混乱 / 已关闭事项挂 TODO 等文档类待办清零;TODO 活跃区只保留代码实施前必须实测或用户回头决策的问题。 | `site/todo.json` `todo.html` `README.md` `progress/README.html` | 用户要求“完成 todo 的清零,整个项目的检查;不确定项落入 todo 回头解决”。 |
| 恢复 63 段 Mermaid 作者源到 `site/diagram-sources.json`,并更新渲染器:图表重新渲染时使用语义 caption 与 CAST 安全 SVG,禁止 caption 或图表正文继续暴露 Mermaid 方向声明等源码首行。 | `scripts/render_all_docs.py` `site/diagram-sources.json` 全部含图表的 plan/spec HTML | 此前图表以文字源码呈现问题的后续彻底修复;避免重新渲染后再次退化。 |
| 将 `progress/README.html` 从 rolling plan 模板改为历史档案索引;README 同步去掉过期重构表述,并把未声明许可证改成明确风险说明。 | `README.md` `progress/README.html` | 文档角色主权收敛:当前待办归 TODO,跨文档变更归 Changelist,progress 只做追溯。 |
| 把已关闭的 P0/P2/OQ 历史项移出 TODO 活跃区,例如 cascade controller 主权、schema 主权拆分、Embedding provider、reindex 失败语义与 analyzeImpact Writer 边界;真实未知项保留为开放验证 / 后续架构决策。 | `site/todo.json` `todo.html` | 避免 TODO 同时承载历史回溯和当前风险,降低后续 agent 误判。 |

> **[info]** 本文件仅记录 **跨文档变更流水线**。每条 = 一次有意义的变更意图(可跨多文档)。设计决策(为什么这么改)见各 plan/spec 文档底部 ADR 表;待办与未关闭风险见 [TODO.md](./TODO.md)。本日志从 2026-05-21 文档体系重整开始;此前历史见 `progress/`。

## 2026-05-30 · renderer · Mermaid SVG 图表

| 变更 | 影响文档 | 关联 |
|---|---|---|
| 将 Mermaid 源码块从纯文本 `pre[data-language=mermaid]` 改为构建期编译的内联 SVG figure,并注入 `cast-a-doc` renderer-owned diagram viewer,支持点击放大、缩放拖拽和 SVG/PNG 下载;页面不再依赖 Mermaid CDN/runtime,也不再把图表源码作为正文展示。 | `scripts/render_all_docs.py` `assets/docs.css` 全部包含图表的 `*.html` | 图表渲染反馈:流程图不应是纯文本状态 |
| 同步 Strict Profile 校验:禁止生成 `Mermaid source` 和 `data-language="mermaid"` 残留,禁止静态 `data:image/svg+xml` 图像回退,并要求 diagram figure 包含内联 SVG 与 CAST diagram viewer hook。 | `scripts/render_all_docs.py` | 防止后续重渲染退回源码块 |

## 2026-05-30 · index · 首页文档地图

| 变更 | 影响文档 | 关联 |
|---|---|---|
| 扩充 `index.html` 顶部说明,明确 Open Novel 文档站的阅读顺序:先看 Plan 理解设计取舍,再看 Spec 对齐实现约束,最后用 Progress 追溯决策历史。 | `scripts/render_all_docs.py` `index.html` `README.md` | 首页 UX 反馈:入口缺少描述 |
| 新增三列文档地图,以 Plan / Spec / Progress 三张概览卡展示文档集结构;下方详细文档清单也改为三列并排,让主分组关系在首页一眼可见。 | `assets/docs.css` 全部 `*.html` | 首页 UX 反馈:三列更适合展示主文档分组 |

## 2026-05-30 · index · 首页读者入口收敛

| 变更 | 影响文档 | 关联 |
|---|---|---|
| 移除 `index.html` 的维护向 `Source` 分组,首页主体只保留关键入口、plan、spec 与 progress;CAST profile、样式源和 JSON 源不再作为用户主导航卡片出现。 | `site/docs.json` `index.html` `README.md` | 首页 UX 反馈:不要把维护源文件作为用户主导航 |
| 同步渲染器 Strict Profile:首页仍必须链接 README、plan、spec、TODO 和 Changelist,但禁止暴露 `.cast-docs/project.json`、`assets/docs.css` 与 `site/*.json` 维护链接。 | `scripts/render_all_docs.py` | 避免重新渲染后内部维护入口回流到首页 |

## 2026-05-30 · index · README 外跳 GitHub

| 变更 | 影响文档 | 关联 |
|---|---|---|
| 将 GitHub Pages 文档站的 README 导航统一改为 `https://github.com/jinhuang712/open-novel#readme`,不再让用户在 Pages 里打开本地 `README.md` 原文。 | `scripts/render_all_docs.py` 全部 `*.html` `README.md` | 首页 UX 反馈:README 应跳转 GitHub 而不是本地 Markdown |
| 同步 Strict Profile 校验:首页必须包含 GitHub README 链接,且不得继续链接本地 `README.md`。 | `scripts/render_all_docs.py` | 避免后续重渲染回退 |

## 2026-05-30 · cast-a-doc · HTML 视觉与 profile 收敛

| 变更 | 影响文档 | 关联 |
|---|---|---|
| 将全站 HTML 渲染壳收敛到 `cast-a-doc` 控制 profile:每页内联 `assets/docs.css`,统一 `article.doc` / `topbar` / `sidebar` / `doc-section` / `doc-footer`,移除外部 stylesheet、Mermaid CDN runtime 与兼容页脚本跳转。 | `scripts/render_all_docs.py` `assets/docs.css` 全部 `*.html` | 解决外部运行时依赖与页面壳不一致 |
| 重做 `index.html` 为静态 document-set 入口,由 `site/docs.json` 生成章节卡片和分组导航,不再靠浏览器端 JS 拼装索引。 | `index.html` `site/docs.json` | GitHub Pages 入口维护 |
| 新增仓库级 `.cast-docs/project.json`,把语言、输出策略和 CAST styleProfile 作为可审查项目 profile 固定下来。 | `.cast-docs/project.json` `README.md` | cast-a-start 项目记忆 |

## 2026-05-30 · full rerender · 架构审计与主权收敛

| 变更 | 影响文档 | 关联 |
|---|---|---|
| 新增本仓库轻量渲染入口:以 `site/docs.json` 为索引源,以 `site/todo.json` / `site/changelist.json` 为项目档案源,通过 `scripts/render_all_docs.py` 全量重包 HTML 并执行 Strict Profile / 链接校验。 | `scripts/render_all_docs.py` `site/docs.json` `site/todo.json` `site/changelist.json` `index.html` `todo.html` `changelist.html` | cast-a-start renderer-tool |
| 新增 `spec/26` 作为 cascade controller 主权文档,明确 Router 只输出 actions、状态机只管 UI 状态、审批 endpoint 只管 resolve/rollback、analyzeImpact 只管影响分析;补齐 turn cancel 与 reindex 失败语义。 | `spec/26` `spec/06` `spec/07` `spec/19` `todo.html` | 关闭 P0-4 / P0-5 / P2-1 |
| 新增 `spec/27` 作为 `session_history.db` schema 主权文档,将过程日志从 `plan/04` 的职责说明提升为可实施 schema,并明确它不参与产品事实恢复。 | `spec/27` `spec/01` `plan/04` `README.md` | 关闭 OQ-2 |
| 统一审批链路为 proposal-only + 独立 endpoint,清理 `addToolResult` 回灌 / 永不 resolve 的双轨描述。 | `spec/06` `spec/04` `spec/02` `spec/14` `plan/08` `spec/00` | 避免实现阶段误走短挂起 HITL cookbook |
| 将 `foreshadowings` 物理表误导收敛为 `dependencies(kind=foreshadowing)` 逻辑视图;spec/25 的字段升级目标改为 `dependencies`。 | `spec/01` `spec/19` `spec/23` `spec/25` `todo.html` | schema 主权清理 |

## 2026-05-30 · guided migration · Memory/History 文档收敛

| 变更 | 影响文档 | 关联 |
|---|---|---|
| `spec/22` 从过渡态 Mastra Memory 文档重写为应用层 memory 模块规格:定义 `runtime.db` threads/messages/compressed_messages/archived_threads、thread/resource guard、写入时机、历史压缩、卷级摘要和跨进程恢复。 | `spec/22` | `plan/12` L2 会话记忆 |
| `spec/23` 调整上下文装配边界: L2 历史由 `appMemory.fetchRecent` 显式读取;runner 不再隐式追加 lastMessages;文本 agent 经 `callTextAgent` / AI SDK `streamText` 衔接。 | `spec/23` | `spec/22` · `spec/24` |
| 清理实现误导项:状态机事件适配从 Mastra `streamVNext` 改为统一 Agent runner;测试策略中的 Mastra mock 改为 DeepSeek + 应用层 runner 边界;存储图修正 `runtime.db` / `session_history.db` 职责。 | `spec/07` `spec/14` `spec/01` | 避免实现阶段继续沿旧框架路径接线 |
| 同步顶层导航与项目记忆,记录本轮 guided migration 的范围和仍保留的后续清理项。 | `README.md` `index.html` `todo.html` `CHANGELOG.html` | cast-a-start preserve-first 改写 |

## 2026-05-22 · Turn 2 · plan/ 全篇升级

| 变更 | 影响文档 |
|---|---|
| `plan/04` 重写:LibSQL → better-sqlite3 + sqlite-vec + Drizzle;连接池策略改 LRU(3) by-project;产物 vs 过程分库语义明确 | `plan/04` |
| `plan/06` 重写:Reflector 简化版(只衰减 + 注入 + cardinal_rule 保护;砍 hit_count / archive / 学习面板 / 跨进程 hydrate / 命中加权);learnings 表 schema 同步精简 | `plan/06` |
| `plan/12` 重写:Mastra Memory → 应用层 memory 模块;四层记忆模型保留;L3 简化版只做按需 SQL 查不主动 hydrate | `plan/12` |
| `plan/03` 体例升级:删历史注(TipTap 2.x → 3.x 演进),加 ADR 表(编辑器框架 / 实体识别方式 / EditorAdapter 抽象) | `plan/03` |
| `plan/05` 体例升级:删 "W9 升级" 标签,Agent loop 终止改 stopWhen 表述,加 ADR 表(审批挂起 / cascade 粒度 / stopWhen / 无超时) | `plan/05` |
| `plan/07` 体例升级:删 "战略升级 002 引入" 注释,加 ADR 表(UI 范式 / Tab 键功能 / _ 前缀隐藏) | `plan/07` |
| `plan/09` 体例升级:删 "plan/02 历史变更" 段(指令"内容是最终结论"),加 ADR 表(BeatAnalyzer 归属 / ArcTracker 归属 / 模板强制度 / 触发时机) | `plan/09` |
| `plan/10` 体例升级:删 "plan/02 历史变更" 段,加 ADR 表(是否闸门 / persona 数量 / 持久化粒度 / 是否显总分) | `plan/10` |
| `plan/11` 体例升级 + 技术变更:LibSQL native vector → sqlite-vec(§不做什么 + L1 数据层图);删 "audit 分析见 progress/005" 历史引用;加 ADR 表(影响半径算法 / 向量索引 / 派生视图 / concepts 触发) | `plan/11` |

## 2026-05-21 · Turn 1.5 · Turn 1 修补

| 变更 | 影响文档 | 关联 |
|---|---|---|
| `spec/22` 改名落地:`22-mastra-memory.html` → `22-memory-and-history.html`(内容暂保留,顶部加过渡 blockquote;Turn 3 重写) | `spec/22` + 10 处下游引用 | 修复 Turn 1 留下的死链 |
| `README.md` 整篇按 P0-1 决策重写(Mastra/LibSQL/Gateway → AI SDK 6 + better-sqlite3 + sqlite-vec + Drizzle;7+6 Agent 二分;新增项目档案区) | `README.md` | 修复 index.html JS fetch README.md 覆盖描述的链路 |
| `index.html` 三处描述同步:plan/02 / plan/08 / spec/22 标题与 extraKeys 去 mastra | `index.html` | — |
| `plan/02` 残留清理:"Mastra-free memory" → "应用层 memory";"mastra_messages" → "messages 表";"Mastra AgentNetwork agents-as-tools" → "Agent-as-tool 多轮派发" | `plan/02` | — |
| `plan/01` Agent 拓扑图重画:同时展示 7 对外 + 6 Hidden Agent 三 subgraph;ADR-03 表述微调(从"是否点名 Mastra" → "是否点名具体框架") | `plan/01` | 与 plan/01 ADR-02 / plan/02 §Hidden Agent 对齐 |
| `todo.html` 加 §1.3 现存技术矛盾清单(spec/04 / spec/09 / spec/10 / spec/11 / spec/13 共 5 处 Mastra/LibSQL 残留,等后续触碰时修);删 OQ-2(已确认不该挂 Open Questions);OQ-4 编号修正为 OQ-3 + 表述更新 | `todo.html` | — |
| `CHANGELOG.html` 上一条 spec/22 改名描述修正(原写法 "spec/22→spec/22" 含义不明) | `CHANGELOG.html` | — |

## 2026-05-21 · P0-1 落地 + 文档体系重整

| 变更 | 影响文档 | 关联 |
|---|---|---|
| 新建 `todo.html`:TODO + Known Issues + Open Questions 三段 | `todo.html` | — |
| 新建 `CHANGELOG.html`:跨文档变更流水线 | `CHANGELOG.html` | — |
| P0-1 全栈切换:废弃 Mastra Agent / Memory / LibSQL,改用 AI SDK 6 `generateText`/`streamText` + `stopWhen` 显式终止 + better-sqlite3 + Drizzle ORM + sqlite-vec | `plan/01` `plan/02` `plan/04` `plan/08` `plan/12` `spec/00` `spec/01` `spec/02` `spec/06` `spec/07` `spec/16` `spec/17` `spec/18` `spec/19` `spec/20` `spec/21` `spec/22-mastra-memory.html`→`spec/22-memory-and-history.html` `spec/23` `spec/24` | plan/08 ADR-A · spec/06 ADR-A · spec/22 ADR-A |
| `spec/22-mastra-memory.html` 改名为 `spec/22-memory-and-history.html`;全项目 grep 替换引用 | `spec/22` + 所有引用方 | spec/22 ADR-A |
| Reflector 简化版:保留 per-turn LLM + scope + weight 衰减 + cardinal_rule top-1 保留;砍掉 hit_count / archive / 学习面板 / 跨进程 hydrate / 命中加权 | `plan/06` `spec/01`(learnings 表瘦身) `spec/22` `spec/23` | plan/06 ADR-A |
| Agent 拓扑显式二分:7 个对外 Agent + 6 个 Hidden Agent = 13 总数(修正 plan/01 / plan/02 原有的 "7 Agent" 单一说法与 progress/007 引入的 Hidden Agent 矛盾) | `plan/01` `plan/02` `spec/02` | plan/02 ADR-A |
| plan/01 不变性从 17 条合并到 ≤12 条(只合并语义重叠,不删减;具体条数见 plan/01) | `plan/01` | plan/01 ADR-A |
| 文档体系拆分明确:`plan/` = 半技术 PRD;`spec/` = 核心技术文档;每篇文档底部加 ADR 表;新建 todo.html / CHANGELOG.html 顶层文件 | 所有触碰的 plan/spec | — |
| `plan/` 12 篇全部按新模板升级体例(未受 P0-1 技术影响的 6 篇:plan/03 plan/05 plan/07 plan/09 plan/10 plan/11 仅做体例升级,技术结论不变) | 所有 `plan/` | — |
| `spec/` P0-1 触碰范围按新模板升级体例 + 技术变更(其余 12 篇未触碰,待后续 P0 主题处理,详见 todo.html) | spec/ 触碰范围 14 处 | — |
| 删除全部历史包袱描述:"W7 升级"、"v1→v2 字段"、"已撤"、"~~已弃用~~"、"借鉴 opencode X.ts:Y-Z" 等 | 所有触碰的 plan/spec | — |
