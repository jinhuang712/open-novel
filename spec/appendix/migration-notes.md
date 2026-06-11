# Appendix · Migration Notes

本 appendix 索引版本审计、构建工具链、旧 spec 重组和迁移背景。它用于追溯,不替代核心 spec 的当前主权边界。

## 技术事实与构建

- [details/00-version-audit](./details/00-version-audit.md) 保存版本、模型能力和 native binding 审计旧细节。
- [details/09-build-and-tooling](./details/09-build-and-tooling.md) 保存构建配置、包管理和工具链旧细节。
- [details/28-tech-stack](./details/28-tech-stack.md) 保存技术栈锁定和集成关键点旧细节。

## 旧 spec 明细

`details/` 中的 29 篇旧 spec 是本次重组前的细节来源。它们保留用于字段、schema、参数、prompt 和测试迁移,但根层 spec 主权以新的 12 篇核心文档为准。

## 使用边界

历史迁移说明不得重新引入旧架构主权。任何当前实现路径都应先落到核心 spec,再引用本 appendix 中的细节。
