# TODO · 活跃验证、裁决与文档修复项

截至 2026-06-13,本文件只保留仍需用户裁决、跨文档修复或设计补齐才能关闭的活跃项。P009 全量审计的完整证据与改法见 [P009](./progress/P009-pre-implementation-audit.md);已关闭条目从本表移除并记入 [CHANGELOG](./CHANGELOG.md)。真实工程验证已归入 [V01](./spec/appendix/V01-test-matrix.md) 与 [V03](./spec/appendix/V03-external-spikes.md),不再作为游离 TODO 漂浮。

## P0 · 设计原型覆盖

| ID | 问题 | 关联文档 | 为什么不能直接关闭 | 关闭条件 |
|---|---|---|---|---|
| TODO-P0-01 | 界面原型需要覆盖所有关键交互分支,且作者界面不得暴露 `.md`、相对路径、文件夹结构或任何存储实现细节:当前 design/prototypes 只覆盖主路径和部分状态,不足以让用户逐页检查 pending、错误、空态、降级、确认、取消、恢复、只读锁定、焦点返回、移动端等分支;截图中的“打开 items/luopan.md”这类路径文案必须改为作品对象动作。 | [design/README](./design/README.md) · [design/01](./design/01-main-layout.md) · [design/02](./design/02-approval-cascade.md) · [design/03](./design/03-reader-panel.md) · [design/04](./design/04-settings.md) · [design/05](./design/05-onboarding.md) · [design/06](./design/06-command-palette.md) · `design/prototypes/index.html` | 这是 P0 设计可靠性问题,不能靠文字承诺关闭;需要把交互状态矩阵和真实 HTML 原型逐一补齐,否则用户无法系统性找 UI/交互问题,也会让存储实现泄漏到作者心智里。 | 先建立 design interaction branch matrix,列出每个页面/能力的主态、空态、loading、pending、error、degraded、readonly、confirm、cancel、recovery、focus/mobile 分支;再为每个分支补可打开的 HTML 原型或同页状态切换,更新原型索引;所有作者可见文案必须只显示作品对象名、章节名、设定名、动作名,不得出现 `.md`、相对路径或存储目录;最后用静态检查和浏览器抽查确认所有分支可访问、无明显重叠/英文残留/断链/存储泄漏。 |

## 验证入口

需要真实代码、依赖或运行数据证明的事项不作为游离 TODO 漂浮:

- 测试矩阵和未来工程化测试归 [V01 · Test Matrix](./spec/appendix/V01-test-matrix.md)。
- golden cases 和 LLM 回归样例归 [V02 · Golden Cases](./spec/appendix/V02-golden-cases.md)。
- DeepSeek cache、1M context token 成本、AI SDK loop、SQLite/native binding、watcher、desktop shell、Tailwind/shadcn 映射等外部实查归 [V03 · External Spikes](./spec/appendix/V03-external-spikes.md)。

## 新增规则

只有满足以下任一条件的新问题才允许写入本文件:

- 没有明确 plan/spec/platform/appendix 主权文档。
- 需要用户在多个方向中重新裁决。
- 当前文档无法安全给出契约,只能先保留未知。

写入 TODO 时必须同时说明关联文档、为什么不能直接归口、以及回头关闭条件。
