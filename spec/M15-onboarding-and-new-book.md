# M15 · Onboarding And New Book

Onboarding 把新作者带到第一个可写项目。New Book Journey 只创建作品壳并进入可讨论的工作台,不在首启阶段要求作者先确定流派、风格或故事种子。

## 旅程

```mermaid
flowchart TD
  Start[启动应用] --> ProjectChoice[选择或创建作品]
  ProjectChoice --> Project{空白新建或样例}
  Project -->|新建| Empty[只创建空白作品]
  Project -->|样例| Sample[加载样例项目]
  Empty --> Connect[连接创作服务]
  Sample --> Connect
  Connect --> Verify[验证核心能力]
  Verify --> Ready[进入写作]
```

每次启动都先选择或创建作品;没有项目上下文时不进入写作主界面。连接创作服务是进入正式工作台前的最后强卡:可以先创建空白作品或加载样例,但验证通过前不能进入工作台,也不能用演示模式绕过。首启只验证核心路径:能创建/打开项目、能调用模型、能进入写作界面。高级 Agent 档位、外观、风格细节和 dev build 才可见的 Developer Mode 全部留给 Settings([M14](./M14-settings.md)),首启不做参数考试。

首启之后的一次性引导提示(气泡)逐个出现、看过即记录,不重复打扰。Settings 不提供数据管理区;引导状态若需重置,必须由专门的引导入口或项目级流程承载,不能藏在 Settings。

项目选择页承接 [M16](./M16-project-library-and-navigation.md) 的单窗口切换契约。首启、重启和左上项目入口都必须先完成当前项目的 active turn、pending approval、未保存编辑和外部冲突 preflight,再进入目标项目。没有 active project context 时,首启可以展示 recent projects,但不能展示任何项目内 recent objects、query history 或 pending approval 详情。

## 开书产物

| 产物 | 说明 |
|---|---|
| 空白作品 | 只有作品名、存放位置和项目壳;不要求流派、风格或故事种子 |
| 讨论入口 | 进入工作台后由 Discuss 与作者聊出流派、风格、故事种子、世界/角色/大纲方向 |
| 世界/角色/大纲 proposal | 只在工作台内生成,可逐项审阅 |
| 样例项目 | 用于快速体验,不污染真实项目 |

## 样例与真实项目

样例项目用于体验产品能力,不是模板项目的隐式数据源。样例进入主界面后也拥有自己的 project id、runtime bucket、session history、pending approval 和 recent objects;所有写入、审批、Search 历史和经验候选都留在样例项目内。

用户选择用样例开始真实创作时,系统必须创建一个新的真实项目,只复制作者明确选择的世界观、角色、大纲或章节内容。以下内容不得从样例复制到真实项目:active turn、pending approval、未保存编辑、query history、preview cache、recent objects、session history、诊断历史和经验候选。

## 失败收场

| 失败 | 用户看到 | 系统不能做 |
|---|---|---|
| 项目不可创建或不可打开 | 停在项目选择/创建页并说明原因 | 创建假项目 |
| 创作服务不可用 | 停在进入工作台前的连接步骤,说明原因并允许重试或更换凭据 | 进入正式工作台或标记 AI ready |
| 没有故事种子 | 进入工作台后用 Discuss 继续聊 | 在启动向导里逼用户填写或编造不可追溯设定 |
| 切换前当前项目未收口 | 回到当前项目处理 turn、审批或未保存编辑 | 直接挂载目标项目 |
| 样例复制失败 | 真实项目创建回滚或停在可解释错误 | 生成半样例半真实的混合项目 |

## Design

首启视觉见 [design/05](../design/05-onboarding.md)。产品承诺应同步到 plan 能力章。

## 测试清单

| 类型 | 场景 |
|---|---|
| 首启 | project/new book/connect 三步可恢复 |
| 新书 | 产物进入审批而非直接落盘 |
| 样例 | 样例与用户项目隔离;复制成真实项目时不带 runtime/history/pending |
| 切换 | 首启和左上项目入口遵守 M16 preflight,未收口状态不能切走 |
| 连接强卡 | 凭据缺失、失效或测试失败时,不能进入正式工作台 |

## FAQ

**Q: 为什么首启不让用户配置所有 Agent?**

A: 首启目标是进入可用项目。高级控制放在 Settings,避免首启变成参数考试。

**Q: 首启时能不能跳过连接创作服务?**

A: 不能。连接创作服务是进入正式工作台前的最后强卡;失败时只能重试、更换凭据或回到项目选择/创建,不能进入一个看似可用但 AI 不可用的工作台。

**Q: 为什么空白作品不问流派和故事种子?**

A: 启动页只负责创建项目壳。流派、风格、故事种子和世界方向是创作讨论的一部分,进入工作台后由 Discuss 模式承接。

**Q: 样例项目会不会污染真实项目的记忆或经验?**

A: 不能。样例项目必须隔离存储和经验学习,除非用户明确复制内容到自己的项目。
