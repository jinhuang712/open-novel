# 004 — 文档审计加固

**日期**: 2026-04-30
**周次**: 跨期 (W2 末尾,W3 启动前必清)
**主要 Owner**: jin.huang@klook.com
**触发**: 用户主动要求"认真分析 spec/plan/progress 确保没有更多遗漏的场景"

## 背景

W2 docs 推进到 cfb600d / 066037e / 5a35431 三个 docs commit (技术栈、战略升级、UX 治理) 后,用户在 W2 commit 1 (代码) 启动前,主动要求做一次穿透式文档 audit,**专门寻找因疏忽 / 想得不够深 / 偷懒漏掉的场景**。这次 audit 分析了全部 22 个文档,共发现 9 个 🔴 严重 + 23 个 🟡 中等 + 13 个 🟢 轻微问题,跨 12 个主题。

## 本期目标

把 audit 发现的所有问题落到 plan/spec 中,**让 W3 接线日不被 day-1 blocker 击穿**。重点修补:

1. 🔴 W3 day-1 blockers (5 条)
2. 🟡 W3-W14 实施前必须补 (8 类共 23 条)
3. 🟢 上线后慢慢补 (13 条)
4. 新建 3 个 spec 文档 + 修补 30+ 处 plan/spec drift

## 实际完成

### 🔴 day-1 blocker (5 条全部落)

| 问题 | 修补 |
|---|---|
| 版本号 (Mastra 1.x / AI SDK 6 / DeepSeek V4 model id) 是训练数据假设,未实查 | 新建 `spec/00-version-audit.md` 把"实查 npm + 实查 DeepSeek model id + 决定 Gateway 与否"作为 W3 启动前必跑闸门;`plan/08` 顶部加警示 |
| `needsApproval` 不是 AI SDK 6 一等字段 | `spec/06` 重写为 cookbook 模式 (proposal + 独立 endpoint),`spec/02` `plan/05` `plan/01` 同步更新表述 |
| `references` 是 SQL 保留字 | `spec/01` 重命名为 `entity_refs`,`plan/04` 同步;backlinks 加唯一约束;history 改 BLOB |
| 流式挂起 + 函数超时未建模 | `spec/06` 改为 stream 立刻结束 + 独立 endpoint resolve 模式;`spec/04` 加取消/刷新/重连协议 + tool_call_id 幂等性;审批超时 24h 配置化 |
| 路径越权防御只在 paths.ts 一处 | `spec/02` 顶部加 `safeFromProjectRoot()` 强制约束;所有读写工具 execute 第一行必须调 |

### 🟡 中等 (23 条全部落)

按主题:

#### 数据完整性 (4 条)
- `spec/01` 加 BOM/CRLF/编码归一化 (`lib/storage/text.ts`)
- `spec/01` 加 frontmatter zod schema 强校验
- `spec/01` BLOB 存 gzip + size 阈值切换 plain-utf8
- `spec/01` backlinks 唯一约束 + group by source_file

#### 并发 / 状态机 (5 条)
- `spec/07` 加 USER_INPUT 在 awaitingApproval 处理 (reject + toast)
- `spec/07` 加 cascade queue 显式建模
- `spec/07` 明确 approvals 表为 source of truth
- `plan/04` 加 multi-tab Web Locks API + 后到 tab 只读
- `plan/04` 加外部编辑器 chokidar watcher + SSE push
- `spec/01` LibSQL 连接池 LRU(3) + 项目切换 close

#### Prompt Injection 防御 (3 条)
- `spec/02` 加 `wrapUntrusted()` + `<<<UNTRUSTED:source>>>` 围栏
- `spec/03` 强制 system prompt 第 7 段引入围栏声明
- `spec/11` 自定义 persona 长度 + 黑名单 + 围栏 + UI 提示

#### 中文场景 (3 条)
- `spec/12` listener 头部 IME 闸门 (isComposing / keyCode 229)
- `spec/05` Decoration 重算跳过 IME composition
- `spec/05` Aho-Corasick 边界白名单 + 黑名单 + W6 标注反馈

#### 成本 / 性能 (4 条)
- `spec/02` 加输出长度 50K 上限 + `[NEEDS_CONTINUATION]` 续写协议
- `spec/13` 加月度预算 (硬上限) + 触顶 BUDGET_CAP_HIT 错误
- `spec/02` 加结构化输出 `callStructured()` 含 jsonrepair + defaults
- `plan/06` Reflector 频率上限 (cascade 合 1 次 + ≤5/会话 + 30s 间隔)
- `spec/05` AC trie 增量重建策略 + W2 末尾必跑 bench

#### 项目生命周期 (1 大类,合并补完)
- `spec/13` 加完整项目 lifecycle UI flow (改名/归档/删除/导出/导入/恢复/迁移)
- `plan/04` 修正"导出 zip 含 index.db" (审计前丢的 narrative_metrics 等花钱数据)

#### 错误 UX + 长任务进度 (3 条)
- `spec/04` 加错误码完整 UX 表 (重试 / disabled / 弹 dialog / 保留 prompt)
- `spec/04` 加 progress 事件类型 + ChatBox 进度条
- `plan/07` ChatBox 顶部进度条设计

#### 其他 (合并)
- `spec/14` 测试策略 (新建)
- `spec/15` Onboarding 首启 (新建)
- `spec/12` 命令面板升级为 CommandRegistry (含 when 谓词 + 80% 命令进 palette)
- `spec/12` @文件名引用完整设计
- `spec/12` 浏览器原生快捷键冲突清单
- `spec/12` Modal Focus Trap (Tab 在 dialog 内不切模式)
- `spec/12` Cmd+Z 跨 AI 改写撤销栈语义 (新增 Cmd+Shift+Z 仅回退 AI rewrite)
- `spec/13` 学习偏好面板 (项目↔全局 promote)
- `spec/10` BeatAnalyzer / ArcTracker 触发时机由 SettingsDialog 控制
- `spec/11` ReaderPanel 失败聚合 (placeholder weight=0 + ≥3/5 才出 recommendation)
- `spec/11` Persona 伦理 disclaimer

### 🟢 轻微 (drift 修正 + 新增,部分落)

- `README` TipTap 2.x → 3.x
- `README` 删 "Yjs 接口已留" 空话,改为"二期专项设计"
- `README` 添加 spec/00, 14, 15, progress/004 引用
- `README` 明确 Windows 不在 POC 范围
- `plan/01` 不变性扩到 8 条 (含 docs-before-code workflow)
- `plan/04` references → entity_refs

### 新增 spec 文件 (3 个)

- **`spec/00-version-audit.md`** — W3 day-1 闸门,实查 npm + DeepSeek model id + AI SDK API + LibSQL #4507 + Gateway 决策。审计后 plan/08 整体重写
- **`spec/14-testing.md`** — vitest + playwright + msw + xstate/test + LLM golden 策略 + CI 配置 + 成本封顶 + W2-W12 滚动落地表
- **`spec/15-onboarding.md`** — 4 步 OnboardingWizard + 主界面渐进 tooltip + 样例项目 zip + GuidancePanel + 错误兜底

## 关键决策

1. **新建 spec/00 而非合并到 plan/08**: 版本审计是一次性闸门,需要独立 PR 把 plan/08 整体重写;放新文件让闸门一目了然
2. **审批改 proposal + 独立 endpoint**: 不依赖"SDK 是否真有 needsApproval 一等字段"。即使 audit 后发现真有,我们的 proposal 模式也兼容 — 唯一差异是工具定义处加不加 `needsApproval: true` 字段。这样 W3 启动不会因 SDK API 形态而 block
3. **persona 性别/年龄不去除,只加 disclaimer**: 删掉会让 5 个 persona 趋同,失去差异化输出价值。POC 阶段加 disclaimer 是平衡;二期可改"中性维度命名" + metadata 标签
4. **Cmd+Z 跨 AI 改写不改默认行为**: TipTap 默认 history 习惯被作者熟知,改默认会破坏 muscle memory;新增 `Cmd+Shift+Z` 作为"仅回退 AI 改写"备路径
5. **Reflector 频率上限放在 plan/06 而非 SettingsDialog 隐藏**: 这是不变性,UI 仅 expose 默认值,改动需进 advanced section

## 下期计划

W3 启动第一日:

1. **跑 spec/00 版本审计** (~2-4 小时):`npm view` 全套 + 看 AI SDK cookbook + 看 DeepSeek API 文档,产出 `progress/005-version-audit.md`
2. **审计产物对齐 plan/08 + 受影响章节** (一个 docs commit `docs(plan/spec): post-audit version lock + hitl realignment`)
3. **W3 commit 1**: Mastra agent 实例化 + globalThis 缓存 (按 audit 后真实 API)

W3 期内还需穿插:

- W2 commit 1-5 仍要跑完 (Next.js scaffold / shadcn / shell / editor / settings)
- W2 retro 在 progress/001 末尾追加

## 已知风险

- **plan/08 在 audit 之前是占位**: 期间任何 W2 代码 commit 跑 `pnpm install` 可能挂 — 缓解: W2 安装时如果发现 mastra 1.x 没有,临时不装 (W2 反正是"装但不接线"),把 mastra 加装推迟到 W3 audit 后
- **proposal 模式可能与 Mastra Agent loop 冲突**: Mastra 假设工具 execute 同步返回 result 后继续 loop;但我们 proposal 后希望 loop 立刻 stop。如果 stream 不能干净 stop,需要 client 强制 stop()。W3 试出来再调整 spec/06
- **音频 / 视频教程在 v1 推迟,但 onboarding 文字+渐进 tooltip 可能不够直观**: 缓解 — 样例项目让用户跑一遍,看完整流程

## 关联 commit

- `<待生成>` `docs: comprehensive audit hardening pass — 9 severe + 23 medium + 3 new specs (00 / 14 / 15) + drift fixes`
