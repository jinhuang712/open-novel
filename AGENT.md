# Open Novel Agent Guide

本文件是 Open Novel 仓库的通用 agent 工作规范。Claude、Codex 或其他 coding agent 进入本仓库时,都应把这里当作项目级约束。

## 核心原则

1. **不确定时给选项**
   - 遇到会影响产品范围、技术方向、提交方式或部署路径的不确定点,不要猜。
   - 给出 2-3 个清晰选项和各自影响,再等用户确认。
   - 如果用户明确说“不确定先放 TODO”,则把问题记录到 `site/todo.json` 并重新渲染 `todo.html`。

2. **节省 token 与本地上下文**
   - 禁止全局 grep / 宽泛 repo 扫描。
   - 禁止对超大文件直接 `cat`。
   - 优先用 `rg --files`、精准路径、`sed -n` 小范围读取、manifest 驱动的脚本检查。
   - 读取文档时以 `site/docs.json`、`README.md`、`site/todo.json`、`site/changelist.json`、相关 plan/spec 为入口。

3. **文档先行**
   - 新功能或架构变化先更新 plan/spec/TODO/changelist,再动代码。
   - 已知问题、开放问题和未验证假设归 `site/todo.json`。
   - 跨文档变更、范围调整、关闭历史风险归 `site/changelist.json`。
   - 修改 `site/*.json` 或发布 HTML 后,必须重新渲染并验证。

## Git 规则

本仓库位于 `~/dev/projects/open-novel`,不属于 `~/dev/repository/`。

- 使用原生 `git` 命令,优先 `git -C <absolute-path> ...`。
- 不使用 `yummy` / `ym`。
- commit 身份使用 GitHub 账号 `jinhuang712`:
  - `user.name=jinhuang712`
  - `user.email=36698563+jinhuang712@users.noreply.github.com`
- 提交前确认当前工作树基于最新 `origin/main`,不要在过期 worktree 上提交。
- 不要回滚用户或其他 agent 的无关改动。

## CAST Docs 工作流

本仓库的发布文档是静态 HTML 文档站。

- `site/docs.json` 是发布文档清单。
- `site/todo.json` 渲染为 `todo.html`。
- `site/changelist.json` 渲染为 `changelist.html`。
- `site/diagram-sources.json` 保存 Mermaid 作者源,用于重建 CAST-safe SVG 图表。
- `scripts/render_all_docs.py` 负责重渲染、链接检查和 Strict Profile 检查。
- `.cast-docs/project.json` 是 CAST Docs 项目 profile。

修改文档后至少运行:

```bash
python3 scripts/render_all_docs.py --validate --check
```

如果发生重渲染,先运行:

```bash
python3 scripts/render_all_docs.py --validate
python3 scripts/render_all_docs.py --validate --check
```

发布前还要用本地 cast-a-doc validator 逐页验证 HTML,并确认:

- 53 个 HTML artifact 全部通过。
- 图表不出现 Mermaid 源码块、`flowchart` / `graph` 等源码 caption。
- 图表使用 inline SVG figure,并包含 renderer-owned diagram viewer。
- 链接不丢失、不逃出仓库。

## 文档职责边界

- `README.md`: 项目定位、关键能力、技术栈、文档导航、开发约定。
- `plan/*.html`: 产品意图、用户工作流、架构取舍和 ADR。
- `spec/*.html`: 实现契约、接口、schema、验证方式和失败语义。
- `progress/*.html`: 历史档案,只用于追溯阶段目标、偏差和决策过程;不再承担 rolling plan。
- `todo.html`: 当前开放问题和实施前验证项。
- `changelist.html`: 跨文档变更流水线。

## 质量要求

- 不要把已关闭问题继续放在 TODO 活跃区。
- 不要让 progress、TODO、changelist 三者职责混用。
- 不要留下 raw Mermaid、文字版流程图、占位许可证、过期迁移脚本说明或旧架构误导。
- 如果只能记录未知项而不能关闭,写入 TODO 并说明关联文档与回头解决方式。
- 完成后提交、推送并在需要时重新部署 GitHub Pages。
