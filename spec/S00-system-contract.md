# S00 · System Contract

这是一张系统总图,不是目录。读完本篇,实现者应该能回答三个问题:一次创作请求会穿过哪些层,每层最多能做什么,哪类失败必须停下来让用户或文档重新裁决。

本篇的写法刻意不像其他 spec:它是全局契约地图。细节进入后面的专题文档;这里保留系统的不可让渡规则、读文档的顺序和跨层事故处理方式。

## 十分钟读法

先看这张图。Open Novel 的主路径只有一条:作者提出意图,系统装配事实,Agent 产生回答或提议,作者审批,项目存储落盘,知识图谱更新,UI 把过程透明展示出来。

```mermaid
flowchart LR
  Author[作者] --> Turn[Turn Orchestration]
  Turn --> Context[Context And Query]
  Context --> Agent[Agent Runtime]
  Agent --> Draft[回答 / 报告 / Proposal]
  Draft --> Approval{是否写入作品?}
  Approval -->|否| Stream[Streaming UI]
  Approval -->|是,需审定| Decision[作者审批]
  Decision --> Storage[Project Storage]
  Storage --> KG[Knowledge Graph]
  KG --> Context
  Turn --> Stream
  Stream --> Editor[Editor And Interaction]
  Settings[Settings And Onboarding] --> Turn
  Runtime[Runtime State] --> Context
  Runtime --> Stream
```

如果只能记住一件事,就是:系统可以自动分析、自动提议、自动解释,但不能静默改变作品事实。任何看起来“方便”的捷径,只要绕过审批、主权边界或可恢复状态,都是架构错误。

## 三条系统律

| 系统律 | 具体含义 | 一旦违反会发生什么 |
|---|---|---|
| 作者文件优先 | 章节、设定、大纲、角色卡等可读文件和审批后事实是作品主权来源 | 派生索引、会话历史、Trace 都不能覆盖作品事实 |
| 提议先于写入 | Agent 输出只能是回答、报告或可审批 proposal | 直接写盘、隐式落盘、模型自批自改都视为阻断级错误 |
| 可解释失败优先于猜测继续 | 关键事实、上下文、索引、结构化输出缺失时必须显式失败或降级 | 不允许用默认值、自然语言猜测或静默裁剪伪装成功 |

这三条系统律高于单篇 spec 的局部便利。后续文档只是在各自领域解释它们如何落地。

## 一次“改角色设定”的完整旅程

用一个具体场景理解系统:作者把主角的能力代价从“失眠”改成“短暂失明”,并要求全书同步。

```mermaid
sequenceDiagram
  participant U as 作者
  participant E as Editor
  participant O as Turn Orchestration
  participant Q as Context/Query
  participant R as Agent Runtime
  participant S as Storage
  participant K as Knowledge Graph
  participant V as Streaming UI

  U->>E: 输入设定修改
  E->>O: 提交 user turn
  O->>Q: 计算影响范围
  Q->>K: 查实体、伏笔、章节锚点
  K-->>Q: 候选章节和来源
  Q->>R: 请求复核和生成候选改写
  R-->>O: ChangeSet proposal
  O->>V: 展示待审批状态
  U->>O: 接受 / 修改后接受 / 拒绝
  O->>S: 审批后落盘
  S->>K: 局部 reindex
  K-->>V: 索引健康度和可见结果
```

这个旅程里没有任何一步允许 Agent “顺手改文件”。影响范围由索引和规则先找出,模型只复核和生成候选;用户一次看全再决定;落盘后再刷新派生索引。

## 层与层之间的主权线

```mermaid
flowchart TB
  subgraph Sovereign[主权层]
    Files[作者文件]
    Approved[审批后项目事实]
    TurnState[持久 turn 状态]
  end

  subgraph Derived[派生层]
    KG[实体 / 概念 / 锚点 / embedding]
    Context[Context package]
    Reports[诊断和读者报告]
  end

  subgraph Runtime[运行层]
    Threads[会话和摘要]
    Trace[工具调用 / 模型调用 / 成本]
    UIEvents[流式事件]
  end

  Files --> KG
  Approved --> KG
  KG --> Context
  Threads --> Context
  Context --> Reports
  TurnState --> UIEvents
  Trace --> UIEvents
  Derived -.不能反写主权.-> Sovereign
  Runtime -.不能恢复作品事实.-> Sovereign
```

主权层决定业务结果。派生层提高查询和写作能力。运行层解释过程。三者可以互相引用,但不能互相伪装。

## 技术路线的边界

| 决策 | 当前路线 | 根层关心的理由 |
|---|---|---|
| 应用形态 | 本地单机工作台,一个应用承载前端、后端接口、Agent runner 和本地存储 | 用户数据在本机;路径、权限、导入导出必须可解释 |
| Agent loop | 自定义 runner 显式控制模型调用、工具、结构化输出、retry、stream | 不把审批、memory、workflow 交给黑盒框架 |
| 存储 | 作者可读文件 + 本地数据库 + 派生索引 | 兼顾可迁移、可查询和可恢复 |
| UI | 写作纸面为主体,过程通过状态点、Trace、审批卡、Universal Search 和查询浮层暴露 | 过程透明,但不让日志淹没写作 |
| 明细归口 | 表结构、schema、prompt、工具参数、测试矩阵进 appendix | 核心 spec 读完必须懂设计,不被字段表打断 |

具体包版本、字段定义、JSON schema 和命令参数不是本篇职责。它们只有在会改变系统律或失败语义时才回到根层。

## 外部事实审计闸门

有些事实不能靠文档想象,必须在代码前实查。它们不是“实现细节”,因为一旦不成立,主路径会变。

| 审计对象 | 必须证明什么 | 失败后的处理 |
|---|---|---|
| 模型能力 | 上下文长度、结构化输出、流式行为满足核心路径 | 不伪装支持;回写 TODO 或换路线 |
| Runner 能力 | stop、tool result、stream callback 能端到端工作 | 不能让 Agent loop 处在半隐式状态 |
| 本地数据库和向量扩展 | native binding、WAL、JOIN、热重载连接稳定 | 写入和索引能力未验证前不进入实现主路径 |
| 文件系统 | workspace 权限、外部编辑监听、原子写/回滚可行 | 不允许出现“UI 成功、文件失败”的假状态 |
| 前端交互 | 编辑器、IME、快捷键、断线恢复符合 design/spec 契约 | 不能让交互层绕过 turn 状态 |

审计结果归 appendix 或 TODO;路线变化必须同步根层 spec 和 CHANGELOG。

## 读者导航

`S` 读系统主权,`M` 读用户能力,`I` 读跨边界接入,`R` 读运行可靠性。不要用旧的连续数字理解 spec;编号字母就是文档的阅读姿态。

| 想理解的问题 | 先读 |
|---|---|
| 作品事实怎么保存、外部编辑怎么处理 | [S01 · Project Storage](./S01-project-storage.md) |
| 系统记住什么、Reflector 关闭是什么意思 | [S02 · Runtime State](./S02-runtime-state.md) |
| Agent 怎么运行、工具和 JSON 失败怎么办 | [S03 · Agent Runtime](./S03-agent-runtime.md) |
| 一次 turn 怎么审批、取消、回滚 | [S04 · Turn Orchestration](./S04-turn-orchestration.md) |
| UI 怎么看见过程、断线怎么恢复 | [S05 · Streaming UI Protocol](./S05-streaming-ui-protocol.md) |
| 实体、锚点、embedding 怎么维护 | [S06 · Knowledge Graph](./S06-knowledge-graph.md) |
| 上下文和影响分析怎么装配 | [S07 · Context And Query](./S07-context-and-query.md) |
| 五大守则和读者预演怎么进入审批 | [S08 · Creative Engine](./S08-creative-engine.md) |
| 去 AI 味如何不改剧情 | [S09 · Style And Humanizer](./S09-style-and-humanizer.md) |
| 编辑器、命令、焦点、查询怎么协作 | [S10 · Editor And Interaction](./S10-editor-and-interaction.md) |
| 首启、设置、经验管理、危险操作归哪 | [S11 · Settings And Onboarding](./S11-settings-and-onboarding.md) |
| 全局搜索如何查角色、阵营、概念、章节和来源 | [M01 · Universal Search](./M01-universal-search.md) |
| 命令面板和快速打开如何分工 | [M02 · Command Palette / Quick Open](./M02-command-palette-and-quick-open.md) |
| 查询浮层如何只解释事实、不写作品 | [M03 · Fact Query](./M03-fact-query.md) |
| 讨论模式如何保证只聊不写 | [M04 · Discuss Mode](./M04-discuss-mode.md) |
| 规划模式如何只动设定和结构 | [M05 · Planning Mode](./M05-planning-mode.md) |
| 写作模式如何进入审批链 | [M06 · Writing Mode](./M06-writing-mode.md) |
| 选区改写和去 AI 味如何不越权 | [M07 · Inline Rewrite / Humanizer](./M07-inline-rewrite-and-humanizer.md) |
| 整批审批如何作为可审定模块落地 | [M08 · Approval Cascade](./M08-approval-cascade.md) |
| Trace 如何成为用户可读的过程证据 | [M09 · Trace Observability](./M09-trace-observability.md) |
| 角色、阵营、概念和世界观如何可见 | [M10 · Knowledge Surface](./M10-knowledge-surface.md) |
| ReaderPanel 如何生成和展示读者预演 | [M11 · ReaderPanel](./M11-reader-panel.md) |
| 经验如何可见、可调、可删 | [M12 · Memory / Learning Management](./M12-memory-learning-management.md) |
| 七个 AI 角色如何开关和限权 | [M13 · Agent Team Controls](./M13-agent-team-controls.md) |
| Settings 和 Developer Mode 如何分层 | [M14 · Settings / Developer Mode](./M14-settings-and-developer-mode.md) |
| 首启和开书向导如何落地 | [M15 · Onboarding / New Book](./M15-onboarding-and-new-book.md) |
| 项目库和章节轨如何导航 | [M16 · Project Library / Navigation](./M16-project-library-and-navigation.md) |
| 模型 provider 如何接入和审计 | [I01 · LLM Provider Contract](./I01-llm-provider-contract.md) |
| 编辑器适配层如何隔离实现 | [I02 · Editor Adapter Contract](./I02-editor-adapter-contract.md) |
| 文件监听、原子写和冲突如何收场 | [I03 · Filesystem / Watcher](./I03-filesystem-and-watcher.md) |
| 导入导出如何保持可迁移 | [I04 · Import / Export](./I04-import-export-contract.md) |
| 桌面壳和本地权限如何约束 | [I05 · Desktop Shell](./I05-desktop-shell-contract.md) |
| 项目打开、关闭、归档如何定义 | [R01 · Project Lifecycle](./R01-project-lifecycle.md) |
| 备份恢复如何避免假成功 | [R02 · Backup / Restore](./R02-backup-restore.md) |
| 迁移升级如何可回滚 | [R03 · Migration / Upgrade](./R03-migration-and-upgrade.md) |
| 索引坏了如何降级和修复 | [R04 · Index Health / Repair](./R04-index-health-and-repair.md) |
| 诊断包和 Debug Mode 如何保护隐私 | [R05 · Diagnostics / Debug Mode](./R05-diagnostics-and-debug-mode.md) |

## 失败不是错误码

本项目里的“失败语义”不是列错误码,而是回答五个问题:谁还拥有真相,哪些结果已经生效,用户能看到什么,系统能否重试,哪些动作绝对不能自动做。

| 事故类型 | 真相归谁 | 系统能做 | 系统不能做 |
|---|---|---|---|
| Agent 输出坏了 | turn 状态和上下文包 | 重试、解释失败、要求用户调整输入 | 把坏 JSON 当自然语言猜出来 |
| 文件写入坏了 | 审批前快照和文件系统 | 停止落盘、保留 pending/failed 状态 | 标记审批已生效 |
| 索引刷新坏了 | 作者文件和审批后事实 | 标记索引过期、降级查询 | 用旧索引继续高风险生成 |
| stream 断了 | 持久 turn 状态 | 重连后恢复状态和 Trace | 用浏览器内存判断业务结果 |
| 经验学习坏了 | 本次审批结果 | 本次写入照常收尾、标记未学习 | 生成一条模糊经验继续注入 |

## FAQ

**Q: 为什么不把完整表结构直接放在每篇 spec 里?**

A: 因为读者首先需要理解系统行为。字段表会变化,主权边界和失败收场不能散落在字段里。

**Q: appendix 会不会又变成垃圾桶?**

A: 不允许。appendix 只放服务某篇根层契约的机器级明细;如果明细改变行为,必须回到根层 spec。

**Q: 为什么不用通用 Agent 框架接管 workflow?**

A: 这里最关键的是审批、回滚、上下文、流式可观测性和文件主权。它们需要显式控制,不能藏在框架记忆或隐式 workflow 里。

**Q: Agent 能不能在用户授权后自动批量改?**

A: 可以批量生成 proposal,也可以在用户审批后批量落盘;不能跳过“用户看到并审定这一批具体变更”的动作。

**Q: 技术路线之后变了怎么办?**

A: 能力实查失败或实现证据推翻路线时,更新本篇的路线/审计闸门,同步相关 spec、TODO 和 CHANGELOG。

## Appendix

- [appendix/README](./appendix/README.md) 定义 active appendix 的范围。
- [appendix/A06-migration-notes](./appendix/A06-migration-notes.md) 记录外部事实审计、版本能力和迁移说明。
- [appendix/V01-test-matrix](./appendix/V01-test-matrix.md) 记录实施前验证矩阵。
