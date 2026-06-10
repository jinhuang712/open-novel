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
   - 已知问题、开放问题和未验证假设归 `TODO.md`。
   - 跨文档变更、范围调整、关闭历史风险归 `CHANGELOG.md`。

## 文档体系

本仓库的全部文档是纯 Markdown,不存在 HTML 文档站,也不使用 CAST 相关 skills(`cast-a-doc` / `cast-a-start`)或任何渲染脚本。唯一例外:`design/prototypes/*.html` 是浏览器直接打开的高保真界面原型(非文档站,无构建/渲染脚本)。

- `README.md` 是文档导航唯一入口。
- `plan/*.md`: 半技术 PRD(产品向)。
- `spec/*.md`: 核心技术文档(实施向);协议、schema 与失败语义归 spec。
- `design/*.md` + `design/prototypes/*.html`: 界面交互设计与高保真原型;UI 原型图 / 交互设计 / UI 样例归 design。
- `progress/*.md`: 历史进度档案。
- `TODO.md`: 当前开放问题和实施前验证项。
- `CHANGELOG.md`: 跨文档变更流水线。

文档规则:

- **图表一律使用 mermaid 代码块**(```mermaid fence)。整个仓库不允许 ASCII 框图 / 文字版流程图;目录树文件列举(`├──` 风格)按文件列表对待,可保留在普通代码块中。
- Markdown 文档的仓库内部链接一律指向 `.md` 文件,不得出现指向仓库内 `.html` 的超链接;引用原型时以代码段写路径(如 `design/prototypes/01-main-layout.html`)。`design/prototypes/` 内 HTML 页面之间允许互链。
- 真实代码示例(ts/sql/bash/json/yaml 等)用带语言标注的代码块。

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
- `plan/*.md`: 产品意图、用户工作流、架构取舍和 ADR。
- `spec/*.md`: 实现契约、接口、schema、验证方式和失败语义。
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
