# M15 · Onboarding And New Book

Onboarding 把新作者带到第一个可写项目。New Book Journey 把故事种子变成可审阅的初始世界,但不把所有高级设置塞进首启。

## 旅程

```mermaid
flowchart TD
  Start[启动应用] --> ProjectChoice[选择或创建项目]
  ProjectChoice --> Model[配置模型]
  Model --> Verify[验证核心能力]
  Verify --> Project{空白新建或样例}
  Project -->|新建| Seed[故事种子]
  Seed --> World[生成世界/角色/大纲 proposal]
  Project -->|样例| Sample[加载样例项目]
  World --> Approval[M08 审批]
  Sample --> Ready[进入写作]
  Approval --> Ready
```

每次启动都先选择或创建项目;没有项目上下文时不进入写作主界面。首启只验证核心路径:能创建/打开项目、能调用模型、能进入写作界面。高级 Agent 档位、外观、风格细节和 dev build 才可见的 Developer Mode 全部留给 Settings([M14](./M14-settings.md)),首启不做参数考试。

首启之后的一次性引导提示(气泡)逐个出现、看过即记录,不重复打扰。Settings 不提供数据管理区;引导状态若需重置,必须由专门的引导入口或项目级流程承载,不能藏在 Settings。

## 开书产物

| 产物 | 说明 |
|---|---|
| 世界观草案 | 只作为 proposal |
| 主角/关键角色 | 可逐项审阅 |
| 卷纲/章节方向 | 可编辑后接受 |
| 样例项目 | 用于快速体验,不污染真实项目 |

## 失败收场

| 失败 | 用户看到 | 系统不能做 |
|---|---|---|
| 项目不可创建或不可打开 | 停在项目选择/创建页并说明原因 | 创建假项目 |
| 模型不可用 | 允许稍后配置或重试 | 标记 AI ready |
| 种子不足 | 追问或提供样例 | 编造不可追溯设定 |

## Design

首启视觉见 [design/05](../design/05-onboarding.md)。产品承诺应同步到 plan 能力章。

## 测试清单

| 类型 | 场景 |
|---|---|
| 首启 | project/model/new book 三步可恢复 |
| 新书 | 产物进入审批而非直接落盘 |
| 样例 | 样例与用户项目隔离 |

## FAQ

**Q: 为什么首启不让用户配置所有 Agent?**

A: 首启目标是进入可用项目。高级控制放在 Settings,避免首启变成参数考试。

**Q: 首启时能不能跳过模型配置?**

A: 可以进入有限模式,但 AI 能力必须显示为 unavailable,不能让用户误以为模型已经可用。

**Q: 样例项目会不会污染真实项目的记忆或经验?**

A: 不能。样例项目必须隔离存储和经验学习,除非用户明确复制内容到自己的项目。
