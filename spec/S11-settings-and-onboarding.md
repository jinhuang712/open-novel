# S11 · Settings And Onboarding

这篇把 Settings 写成控制面板,不是内部参数仓库。它只放用户能理解、能控制、且会改变产品行为的东西。Onboarding 则只负责把用户带到第一个可写项目,不把所有高级开关塞进首启。

## 首启路径

```mermaid
flowchart TD
  Start[首次打开] --> Workspace[选择 workspace]
  Workspace --> Credential[配置模型凭据]
  Credential --> Verify[验证核心能力]
  Verify --> Project{创建还是导入?}
  Project -->|创建| Seed[故事种子/样例结构]
  Project -->|导入| Import[选择项目文件]
  Seed --> Ready[进入写作界面]
  Import --> Ready
```

首启只验证核心路径:能保存项目、能调用模型、能进入写作界面。高级 Agent 档位、风格细节、Developer Mode 留给 Settings。

## Settings 分区

| 分区 | 用户问题 | 放什么 |
|---|---|---|
| Workspace | 我的项目放在哪里 | 路径、项目列表、导入导出 |
| Model | AI 能不能用 | 凭据、连通性、可用模型 |
| Agents | 哪些角色参与、强度如何 | 角色开关、档位、Reflector 学习 |
| Style | 文字像不像我 | 风格偏好、范文、Humanizer 相关经验 |
| Rules | 风险提示多严格 | 五大守则阈值、提示偏好 |
| Memory | 系统学到了什么 | 经验查看、权重、关闭、删除 |
| Usage | 花了多少 | 用量、预算、成本提示 |
| Developer | 出问题怎么查 | Trace、过程日志、索引健康度、审计结果 |

内部 retry 常数、SQL 字段、prompt 片段、包版本和 native binding 细节不作为普通设置暴露。

## 控制面板边界图

```mermaid
flowchart LR
  Settings[Settings UI] --> Runtime[Runtime State]
  Settings --> Storage[Project Storage]
  Settings --> Creative[Creative Engine]
  Settings --> Agent[Agent Runtime]
  Settings --> Editor[Editor Interaction]
  Dev[Developer Mode] -.read only.-> Runtime
  Dev -.read only.-> Storage
  Dev -.read only.-> Agent
```

Developer Mode 是只读诊断入口。它不能绕过审批,不能从过程日志恢复作品事实。

## 经验管理的用户语义

| 用户动作 | 系统含义 |
|---|---|
| 开启 Reflector | turn 完成后可学习新经验 |
| 关闭 Reflector | 不再学习新经验 |
| 关闭某条经验 | 后续不注入该经验 |
| 调高/调低经验 | 改变 context builder 选用权重 |
| 删除经验 | 从长期经验中移除 |
| 清空经验 | 危险操作,需要确认范围 |

“关闭学习”不等于“忘掉已经学会的东西”。这点必须在 UI 文案和实现上都清楚。

## 危险操作工作流

```mermaid
sequenceDiagram
  participant U as 用户
  participant UI as Settings
  participant S as Storage/Runtime
  participant T as Turn Orchestration

  U->>UI: 点击删除项目/清空经验/重置设置
  UI->>UI: 展示影响范围和不可逆说明
  U->>UI: 二次确认
  UI->>T: 检查 active turn / pending approval
  T-->>UI: 可执行或需先处理
  UI->>S: 执行危险操作
  S-->>UI: 成功/失败和恢复建议
```

危险操作不能和 active writable turn 抢主权。存在 pending approval 时,用户应先处理审批或明确放弃。

## 守则设置的边界

| 设置 | 可以 | 不可以 |
|---|---|---|
| 提示强度 | 调整提示频率和展示方式 | 让阻断级风险静默落盘 |
| 阈值 | 影响后续检测 | 自动改历史报告 |
| 自定义偏好 | 改变诊断解释口径 | 覆盖项目事实 |
| Agent 档位 | 调整分析深度 | 绕过审批主路径 |

守则是产品契约,不是纯偏好。Settings 可以调节体验,不能让系统变成无提示的静默改稿器。

## 设置失败收场

| 失败 | 用户可见 | 系统状态 |
|---|---|---|
| workspace 不可写 | 首启无法完成 | 不创建假项目 |
| 凭据不可用 | 模型未配置 | 不标记 ready |
| 设置保存失败 | 保存失败并保留原值 | 不显示为已生效 |
| 经验更新失败 | 经验未改变 | context 继续用旧状态 |
| 导入冲突 | 要求选择处理方式 | 不 silent overwrite |
| 删除失败 | 显示残留范围 | 不从列表假删除 |
| Debug 数据缺失 | 诊断不完整 | 不影响作品事实 |

## FAQ

**Q: 为什么首启不让用户配置所有 Agent?**

A: 首启目标是进入可用项目。高级控制放在 Settings,避免首启变成参数考试。

**Q: 用户能不能完全不用经验?**

A: 可以关闭或删除经验注入;但关闭 Reflector 只是不学新经验,不是自动停用旧经验。

**Q: Developer Mode 能不能修数据库?**

A: 根层契约里它是只读诊断入口。修复工具若存在,必须有独立危险操作和确认。

**Q: 删除项目是否也删除运行时历史?**

A: UI 必须说明删除范围。项目文件、派生索引、运行时历史和经验是否删除要分别确认或按明确规则执行。

**Q: 模型凭据验证失败时能否进入离线模式?**

A: 可以进入不依赖模型的只读/编辑能力,但不能把 Agent 能力显示为可用。

## Appendix

- [appendix/schema-tables](./appendix/A01-schema-tables.md) 保存设置、经验和项目生命周期存储明细。
- [appendix/testing-matrix](./appendix/V01-test-matrix.md) 保存 onboarding、settings、danger action 和 debug 面板验证项。
