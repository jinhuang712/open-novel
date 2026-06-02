# Claude Guide for Open Novel

Claude 在本仓库工作时必须遵守 [AGENT.md](./AGENT.md)。`AGENT.md` 是唯一规范主文件;本文件只是 Claude 入口摘要,避免 Claude 与其他 agent 使用不同规则。

## 必读约束

- 不确定时不要猜:给选项,等用户确认;用户要求先搁置时,写入 `site/todo.json` 并重渲染 `todo.html`。
- 节省上下文:禁止全局 grep,禁止对超大文件直接 `cat`;用精准文件读取和 manifest 驱动检查。
- 本仓库在 `~/dev/projects/open-novel`:使用原生 `git`,不要用 `yummy` / `ym`。
- commit 身份使用 GitHub `jinhuang712`。
- 文档先行:产品或架构变化先更新 plan/spec/TODO/changelist。
- 修改发布文档后运行 `python3 scripts/render_all_docs.py --validate --check`。
- 发布前确认 CAST HTML validator 全部通过,且没有 raw Mermaid / 文字版流程图残留。

## Claude 执行顺序

1. 先读 `AGENT.md`,再读与任务直接相关的 README、TODO、changelist、plan/spec。
2. 判断任务属于文档、代码、发布还是 Git 操作,按 `AGENT.md` 的职责边界处理。
3. 有不确定项时给用户选项;若用户要求先落 TODO,记录到 `site/todo.json`。
4. 完成修改后重新渲染并验证。
5. 需要提交时用 GitHub `jinhuang712` 身份 commit/push。

## 与 AGENT.md 的一致性

如果本文件与 `AGENT.md` 出现冲突,以 `AGENT.md` 为准,并同步修正本文件。不要让两份 agent 指南描述不同的 Git 规则、文档职责或验证流程。
