# Appendix · Testing Matrix

本 appendix 索引测试策略、验证矩阵和实施前验证项。核心 spec 只定义哪些失败会阻断路径,测试明细放在这里。

## 测试策略

- [details/14-testing](./details/14-testing.md) 保存旧测试策略、单测、端到端、LLM golden 和 CI 细节。

## 相关验证细节

- [details/00-version-audit](./details/00-version-audit.md) 保存版本与外部能力审计细节。
- [details/09-build-and-tooling](./details/09-build-and-tooling.md) 保存构建和工具链验证细节。

## 使用边界

测试矩阵变化不应改动核心 spec,除非它暴露出系统契约不成立。契约不成立时,先修核心 spec 或 TODO,再继续实现。
