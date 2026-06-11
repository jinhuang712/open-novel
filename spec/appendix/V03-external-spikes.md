# V03 · External Spikes

External Spikes 是外部能力原始实查证据的唯一归口:模型 provider、AI SDK、SQLite/native binding、浏览器原型、文件系统行为等。A06 只保存迁移/版本影响摘要,V01 只保存验证矩阵。

## 归口内容

- 最小复现命令。
- 真实版本和环境。
- 通过/失败证据。
- 对路线的影响。
- 需要回写的 TODO、根层 spec 或 platform 文档。

## 边界

spike 结果会过期。任何高漂移事实在实现前需要重新验证,不能把旧 spike 当永久真相。若 spike 改变行为语义或失败收场,原始证据留在 V03,行为契约回写对应根层 spec 或 platform 文档。
