# 11 · Settings And Onboarding

本文档定义设置、首次启动、项目生命周期、模型配置、预算、经验管理和危险操作的实现契约。

## 职责边界

本篇负责:

- 首次启动需要收集和验证什么。
- Settings 中哪些能力可配置。
- 经验管理和 Reflector 开关的用户可见语义。
- 项目导入、导出、删除和危险操作确认。

本篇不负责:

- 具体设置 UI 视觉。
- 底层表结构。
- Agent prompt 或模型调用细节。
- 测试矩阵。

## 主权对象

Settings and onboarding 拥有:

- workspace 选择。
- API key 与模型配置入口。
- Agent 开关与档位。
- 预算和用量展示。
- 经验查看、调整和删除。
- Reflector 是否继续学习新经验。
- 项目生命周期操作。
- 首启引导和渐进提示。

设置不是实现细节的倾倒处。只有用户能理解、能控制、且影响产品行为的开关才进入 Settings。

## 输入、输出与依赖

输入是首次启动状态、workspace 选择、凭据、用户偏好、Agent 开关、经验管理动作和项目生命周期操作。输出是可用项目环境、已保存设置、危险操作确认结果和经验管理状态。本篇依赖 system contract 的外部事实审计、runtime state 的经验语义和 project storage 的项目生命周期边界。

## 技术路径

Onboarding 让用户完成最小可用配置:选择 workspace、配置模型凭据、创建或导入项目。完成后,Settings 成为所有长期偏好和危险操作的唯一入口。

经验管理在 Settings 中展示。Reflector 关闭后不再产生新经验;已有经验继续生效,直到用户调整或删除。

危险操作必须显式确认。删除项目、清空历史、重置设置、导出导入冲突等操作不能只靠普通按钮触发。

## 失败语义

- workspace 不可写:不能完成首启。
- 凭据不可用:不能把模型能力标记为已配置。
- 设置保存失败:UI 不显示为已生效。
- 导入冲突:用户选择处理方式,系统不 silent overwrite。
- 经验更新失败:保留原经验状态并提示。

## 用户可见结果

用户看到的是清晰的初始配置流程、可理解的设置项、可管理的经验和明确的危险操作确认。系统不把内部实现参数直接暴露成难以判断的开关。

## Appendix 引用

- [appendix/schema-tables](./appendix/schema-tables.md) 维护设置和经验相关存储细节。
- [appendix/testing-matrix](./appendix/testing-matrix.md) 维护 onboarding 和 settings 验证清单。
- [appendix/details/13-settings](./appendix/details/13-settings.md) 保留旧 Settings 细节。
- [appendix/details/15-onboarding](./appendix/details/15-onboarding.md) 保留旧 Onboarding 细节。
