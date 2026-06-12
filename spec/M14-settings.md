# M14 · Settings

> Developer Mode 已拆分为独立能力,见 [M18 · Developer Mode](./M18-developer-mode.md)。本篇只承载 Settings 控制面板的主权。

Settings 是用户控制产品偏好的地方,不是项目库、Workspace 管理页、数据管理页或内部参数仓库。它只放用户能理解、能控制、且会改变当前应用体验的东西;内部 retry 常数、SQL 字段、prompt 片段、包版本和 native binding 细节不作为普通设置暴露。本篇用「控制面板分区 → 各区主权边界 → 受限操作 → 失败收场」组织:先回答每个分区归谁管,再回答设置能改什么、绝对不能改什么。

## 分区地图

| 分区 | 用户问题 | 放什么 |
|---|---|---|
| 模型 | AI 能不能用 | 凭据、连通性、可用模型 |
| AI 角色 | 角色强度如何 | 档位、频率、权重、按需触发配置 |
| 外观 | 界面看起来是否舒服 | 主题、字号密度、编辑器显示偏好 |
| 助手表达 | 助手怎么说话和协作 | 语气、详略、主动性、提醒强度 |
| 文风 | 文字像不像我 | 风格偏好、范文、Humanizer 相关经验 |
| 守则 | 系统遵守哪些创作守则 | 只读规则说明和检测含义 |
| 经验 | 系统学到了什么 | 经验查看、0-5 权重、删除、学习频率 |
| 用量 | 用了多少 | token 消耗、prompt cache 命中、context 用量等技术指标 |
| 开发者诊断 | 出问题怎么查 | 仅 dev build 可见;真实用户包不显示也不可开启 |

Settings 的修改作用于 Runtime State、Creative Engine、Agent Runner 和编辑器交互;每个分区只调节体验和参与度,不改变审批主路径和事实主权。项目选择、项目创建、项目打开、归档和删除由 [M15](./M15-onboarding-and-new-book.md)、[M16](./M16-project-library-and-navigation.md) 与项目生命周期契约负责,不进入 Settings。

每次启动先进入项目选择/创建界面。进入主界面后,左上角项目入口可以返回项目选择;这不是 Settings 页面。

## Assistant Persona 边界

Assistant Persona 只改变助手表达和协作方式,不改变系统规则、项目事实、审批边界或守则阈值。它可以影响回答是简短还是展开、是否主动列选项、提醒频率和称呼风格;不能让 Discuss 写盘、让 Humanizer 改剧情、让 Validator 降低阻断级风险,也不能覆盖用户当前显式指令。

助手表达(Assistant Persona)与 ReaderPanel persona 是两套对象。助手表达管“助手如何和作者说话”;ReaderPanel persona 管“模拟读者如何评审章节”。Settings 不能把 ReaderPanel persona 混进助手表达设置。

## 模型凭据的用户语义

Settings 只展示和管理 provider 可用性,不拥有 secret。API key、token 和 provider secret 的主权在桌面壳安全凭据库,完整契约见 [I05 · Desktop Shell Contract](./platform/I05-desktop-shell-contract.md);本篇只定义用户在 Settings 里能做什么、看到什么。

| 用户动作 | Settings 承诺 |
|---|---|
| 新增 / 更新 provider 凭据 | 写入成功后显示 provider 可用或待验证;写入失败时不保存假配置 |
| 验证 provider | 展示连通性、模型可用性和最近失败原因 |
| 删除凭据 | provider 立即变为未配置,相关 Agent 能力禁用;历史项目事实、recap、审批记录不被删除 |
| provider 失效 | 显示「需要重新配置 / 重新授权」;不把失败解释成模型输出为空,不自动切换到另一个 secret |

provider 失效只影响后续需要该 provider 的能力:已有正文、项目事实、审批历史和 Recap 不回滚;运行中尚未产生 durable change 的 turn 失败并生成 recap;已经进入 pending approval 的 ChangeSet 继续可查看,但不能用失效 provider 继续扩写或重做。

## 经验管理的用户语义

经验的完整生命周期主权在 [M12 · Memory Learning Management](./M12-memory-learning-management.md);Settings Memory 区是其管理入口,用户动作语义如下:

| 用户动作 | 系统含义 |
|---|---|
| 调整学习频率 | 改变后续生成新经验候选的频率 |
| 调整确认策略 | 冲突发生时即时询问或按预设策略处理 |
| 调高 / 调低经验 | 在 0-5 五档内改变 context builder 选用权重 |
| 删除经验 | 从长期经验中移除 |
| 删除全部经验 | 受限操作,需要确认范围 |

已确认经验默认参与后续上下文选择;没有逐条“是否注入”开关。权重 0 表示仅留档,权重 3 是默认普通经验,权重 5 是强偏好。删除才表示不再保留该经验。

## 受限操作工作流

```mermaid
sequenceDiagram
  participant U as 用户
  participant UI as Settings
  participant S as Storage/Runtime
  participant T as Turn Orchestration

  U->>UI: 点击删除凭据/删除经验/删除全部经验
  UI->>UI: 展示影响范围和不可逆说明
  U->>UI: 二次确认
  UI->>T: 检查 active turn / pending approval
  T-->>UI: 可执行或需先处理
  UI->>S: 执行危险操作
  S-->>UI: 成功/失败和恢复建议
```

Settings 不提供数据管理页面,也不提供项目删除、项目迁移、导入导出、清理缓存、重置全部数据等背后功能。需要影响项目生命周期或项目文件的动作必须去项目选择/项目库或对应 platform/R 契约,不能藏在 Settings。

受限操作不能和 active turn 抢主权。存在 pending approval 时,用户应先处理审批或明确放弃。

## 守则只读边界

| 页面内容 | 可以 | 不可以 |
|---|---|---|
| 五大守则 | 展示规则、检测含义和审批关系 | 修改阈值、关闭规则或恢复默认 |
| 风险说明 | 解释确认级/阻断级如何进入审批 | 调整提示方式或绕过审批 |
| 关联入口 | 跳到相关报告、Trace 或审批说明 | 在 Rules 页面调参 |

守则是产品契约,不是纯偏好。守则页面只读展示规则和必要说明;守则检测语义由守则链路和审批承担。

## 设置失败收场

| 失败 | 用户可见 | 系统状态 |
|---|---|---|
| 凭据不可用 | 模型未配置 | 不标记 ready |
| 凭据写入失败 | provider 保持未配置 | 不保存 secret 到项目或 settings 文件 |
| 凭据删除失败 | provider 标记需要处理 | 不继续使用残留 secret |
| provider 认证失效 | 需要重新配置 / 重新授权 | 不自动换 provider 写盘 |
| 设置保存失败 | 保存失败并保留原值 | 不显示为已生效 |
| 经验更新失败 | 经验未改变 | context 继续用旧状态 |
| 删除失败 | 显示残留范围 | 不从列表假删除 |
| dev build 标记缺失 | 开发者诊断分区不显示 | 不让真实用户包开启 Developer Mode |

## Design 与明细

- Settings UI 交互见 [design/04](../design/04-settings.md)。
- 凭据存储与桌面壳权限契约见 [I05](./platform/I05-desktop-shell-contract.md)。
- 设置与经验存储明细见 [appendix/A01](./appendix/A01-schema-tables.md)。
- 验证项见 [appendix/V01](./appendix/V01-test-matrix.md)。

## 测试清单

| 类型 | 场景 |
|---|---|
| 保存 | dirty、失败、回滚展示 |
| 凭据 | 验证失败不进入 ready;删除后能力禁用但历史不回滚 |
| 受限操作 | pending approval 时被阻止;二次确认范围正确 |
| 项目边界 | Settings 不出现项目/Workspace 管理或数据管理页 |
| 守则 | 守则只读,不提供阈值、提示方式、关闭或恢复默认 |
| 外观 | 外观独立成区,不混入文风 |
| 助手表达 | 不改变写盘权限和守则阈值 |
| 开发者诊断 | 真实用户包不显示开发者诊断分区 |

## FAQ

**Q: 用户能不能完全不用经验?**

A: 可以把某条经验权重调到 0 或删除经验。系统不提供逐条注入开关;已确认经验默认按权重参与上下文选择。

**Q: 删除项目是否也删除运行时历史?**

A: 这不是 Settings 职责。项目删除、归档和运行时历史处理归项目选择/项目库和生命周期契约。

**Q: 模型凭据验证失败时能否进入离线模式?**

A: 可以进入不依赖模型的只读/编辑能力,但不能把 Agent 能力显示为可用。

**Q: Settings 里的值输入后是否立刻生效?**

A: 只有通过验证并持久化后才算生效。失败时 UI 必须保留原值或明确显示未保存状态。
