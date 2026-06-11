# Open Novel Agent 工作规范

本文件是 Open Novel 仓库的通用 agent 工作规范。Claude、Codex 或其他 coding agent 进入本仓库时,都应把这里当作项目级约束。

> 本规范同时维护在 `AGENTS.md` 与 `CLAUDE.md`,两份内容完全一致。修改任意一份时必须同步另一份,不要让两份指南出现不同的 Git 规则、文档职责或验证流程。

## 核心原则

1. **不确定时给选项**
   - 遇到会影响产品范围、技术方向、提交方式或部署路径的不确定点,不要猜。
   - 给出 2-3 个清晰选项和各自影响,再等用户确认。
   - 如果用户明确说"不确定先放 TODO",则把问题记录到 `TODO.md`。

2. **节省 token 与本地上下文**
   - 禁止全局 grep / 宽泛 repo 扫描。
   - 禁止对超大文件直接 `cat`。
   - 优先用 `rg --files`、精准路径、`sed -n` 小范围读取。
   - 读取文档时以 `README.md`(文档导航)、`TODO.md`、`CHANGELOG.md`、相关 plan/spec 为入口。

3. **文档先行**
   - 新功能或架构变化先更新 plan/spec/TODO/CHANGELOG,再动代码。
   - 对应的 plan/spec 必须先存在并经用户认可,才能动代码;没有对应文档的代码改动一律不提交。
   - 已知问题、开放问题和未验证假设归 `TODO.md`。
   - 跨文档变更、范围调整、关闭历史风险归 `CHANGELOG.md`。

## 文档体系

本仓库的全部文档是纯 Markdown,不存在 HTML 文档站,也不使用 CAST 相关 skills(`cast-a-doc` / `cast-a-start`)或任何渲染脚本。唯一例外:`design/prototypes/*.html` 是浏览器直接打开的高保真界面原型(非文档站,无构建/渲染脚本)。

- `README.md` 是文档导航唯一入口。
- `plan/*.md`: 纯产品 PRD——产品设计、原则、红线、目标与边界、核心能力;零技术细节。
- `spec/*.md`: 核心技术文档(实施向);根层 `spec/00-11` 必须写可直接阅读的技术设计,讲清主路径、职责边界、设计取舍、失败语义和用户可见结果,实现明细归 `spec/appendix/`。
- `design/*.md` + `design/prototypes/*.html`: 界面交互设计与高保真原型;UI 原型图 / 交互设计 / UI 样例归 design。
- `progress/*.md`: 历史进度档案。
- `TODO.md`: 当前开放问题和实施前验证项。
- `CHANGELOG.md`: 跨文档变更流水线。

文档规则:

- **图表一律使用 mermaid 代码块**(```mermaid fence)。整个仓库不允许 ASCII 框图 / 文字版流程图;目录树文件列举(`├──` 风格)按文件列表对待,可保留在普通代码块中。
- Markdown 文档的仓库内部链接一律指向 `.md` 文件,不得出现指向仓库内 `.html` 的超链接;引用原型时以代码段写路径(如 `design/prototypes/01-main-layout.html`)。`design/prototypes/` 内 HTML 页面之间允许互链。
- 真实代码示例(ts/sql/bash/json/yaml 等)用带语言标注的代码块(plan 正文除外,见「plan 写作纪律」G1)。

## spec 写作纪律

spec/ 是技术设计契约,不是实现明细堆放处。核心 spec 必须先讲清系统怎么分层、能力如何协作、职责边界在哪里,重点是技术路径、设计取舍、状态流转、失败语义和用户可见结果。读者不应为了理解系统主路径而被迫打开 appendix。

### S1 · 核心 spec 正文要求

每篇核心 spec 至少讲清:

- 它解决什么问题。
- 它负责什么、不负责什么。
- 它拥有哪些主权对象。
- 输入、输出、依赖和下游影响。
- 关键流程怎么走。
- 失败时怎么处理。
- 用户看见什么结果。
- 哪些实现明细被后置到 appendix。

### S2 · 技术细节后置

核心 spec 正文不堆:

- 完整表结构。
- 完整 JSON Schema。
- 大段 code snippets。
- 具体 SQL / migration。
- 工具参数全量枚举。
- prompt 模板全文。
- 长测试矩阵。
- 版本审计表和包版本细节。

这些内容归 `spec/appendix/` 或专门明细文档。核心 spec 只保留理解系统必需的最小明细,并引用对应明细来源。

旧 spec 原文、阶段叙事、迁移前快照和已关闭问题归 `progress/spec-archive/` 等历史档案,不得作为 active appendix 继续暴露给读者。

### S3 · 主权唯一

同一个生命周期、状态机、失败语义、数据主权或上下文规则,只能有一个权威定义位置。其他文档引用它,不要重新解释一遍。

如果一个字段、状态、事件或规则会直接影响系统行为,核心 spec 必须点名说明;完整定义、字段展开和样例可以放到 appendix。appendix 不能变成垃圾桶,每个明细文档都应服务于某个核心契约。

## plan 写作纪律

plan/ 是纯产品 PRD,写作必须遵守以下三条纪律:

### G1 · plan 写作红线

plan 正文禁止出现:

- 库名 / 框架名 / 版本号。
- 代码块(ts/sql/json/bash/yaml 等)、类型定义、函数名、工具签名。
- 数据库表名 / 字段名 / SQL / 向量。
- API 路径 / 协议细节。
- 模型 ID 与调用参数。
- 毫秒级 / token 级性能数字。
- "Hidden Agent"等内部实现概念。

plan 正文允许出现:

- 用户场景、产品行为与承诺。
- 领域知识数字(如"爽点密度 1500-2500 字一个")。
- 产品级 mermaid 图(节点不嵌 spec 编号 / 接口名)。
- plan 内部互链。

### G2 · 无历史包袱纪律

plan 禁止出现:

- TODO、开放问题、历史决策表(ADR)。
- 阶段词(MVP / 一期 / 二期 / W3 / phase / roadmap)。
- "简化版 / 砍掉 / 暂不 / 后续补"。

写法要求:

- 全部用现在时陈述(写"系统做 X",不出现"原来 / 现有 / 我们曾考虑")。
- 设计理由内联到叙述。
- 未决事项写 `TODO.md`,变更历史写 `CHANGELOG.md`。

### G3 · 结构约定

- 能力章(plan/05-10)开篇在 H1 后第一段用两行:**你此刻的问题**:…。**产品的回答**:…。
- plan 全篇不出现 spec/design 链接(plan 内部互链与红线编号引用除外);spec/design 的文档导航集中在 `README.md`。
- 产品红线(编号 R1-R10)全文只在 `plan/03-guardrails.md`,其他篇只引用编号(如 R4);红线编号只追加、不复用,增删改红线须同步修订对应 spec 并记入 CHANGELOG。
- 审批卡结构只在 `plan/08-approval-and-cascade.md`。
- 可关矩阵只在 `plan/06-agent-team.md`。

## Git 规则

本仓库位于 `~/dev/projects/open-novel`,不属于 `~/dev/repository/`。

- 使用原生 `git` 命令,优先 `git -C <absolute-path> ...`。
- 不使用 `yummy` / `ym`。
- commit 身份使用 GitHub 账号 `jinhuang712`:
  - `user.name=jinhuang712`
  - `user.email=36698563+jinhuang712@users.noreply.github.com`
- 提交前确认当前工作树基于最新 `origin/main`,不要在过期 worktree 上提交。
- 不要回滚用户或其他 agent 的无关改动。

## 文档职责边界

- `README.md`: 项目定位、关键能力、技术栈、文档导航、开发约定。
- `plan/*.md`: 纯产品 PRD——产品设计、原则、红线、目标与边界、核心能力;零技术细节。
- `spec/*.md`: 实现契约、技术路径、职责边界、失败语义、用户可见结果和必要接口;表结构、完整 schema、代码片段、枚举、prompt 与测试矩阵归 `spec/appendix/`;旧原文和阶段历史归 `progress/`。
- `design/*.md` + `design/prototypes/*.html`: 界面交互设计、原型图与 UI 样例;视觉 token 与双主题规范见 `design/00-design-tokens.md`。
- `progress/*.md`: 历史档案,只用于追溯阶段目标、偏差和决策过程;不再承担 rolling plan。
- `TODO.md`: 当前开放问题和实施前验证项。
- `CHANGELOG.md`: 跨文档变更流水线。

## 质量要求

- 不要把已关闭问题继续放在 TODO 活跃区。
- 不要让 progress、TODO、CHANGELOG 三者职责混用。
- 不要留下 ASCII 框图、文字版流程图、占位许可证、过期迁移脚本说明或旧架构误导。
- 修改文档后检查仓库内部链接没有断链、没有指向 `.html` 的残留。
- 如果只能记录未知项而不能关闭,写入 `TODO.md` 并说明关联文档与回头解决方式。
- 完成后用原生 `git` 提交并推送。
