# 003 — UX 治理: Tab 切模式 + 快捷键 Registry + SettingsDialog 重设计

**日期**: 2026-04-30 **周次**: (跨期决策,影响 W2-W14 整套 UX 实现) **主要 Owner**: `jin.huang@klook.com` **状态**: docs 写完 / 等用户 approve / 实施分散到多个周

> **[info]** 本条目按 docs-before-code 三段式 (docs → approve → code) 在战略升级 (002) 之后追加。捕捉一类 UX 治理决策,不属于具体周里程碑,但影响 W2 起所有 UX 实现细节。

## 决策来源

用户在审 W2 + 战略升级 (002) docs 时提出两个观察:

1. **discuss/plan/write 三模式应该用 Tab 在 ChatBox 切换** (主流 LLM chat 工具的预期)
2. **快捷键散落、SettingsDialog 草草几行,需要认真治理**

两点正确,docs 立刻补:

- 新增 spec/12-shortcuts.md (完整快捷键 registry + 上下文化绑定 + 持久化 + 冲突检测)
- 新增 spec/13-settings.md (SettingsDialog 8 section 详细设计 + 全局/项目级分层)
- 顺手修正 plan/05 (Tab 切模式行为) / plan/07 (重指向新 spec) / spec/07 (Tab 触发的状态机 transition)

## 关键决策

### 1. Tab 在 ChatBox 切换模式

- ChatBox textarea 焦点内: **Tab → discuss / plan / write 循环;Shift+Tab 反向**
- 与 ChatGPT / Claude.ai / Cursor 一致 — 不在 chat input 内插入字面 tab
- 切换有视觉反馈 (toast + mode toggle 高亮飞过)
- await_approval 状态下被状态机阻止;阻止时显示 toast 而非静默

### 2. 快捷键 Registry

- 一份事实,UI 与代码共享;每条命令 id + description + defaultKeys + context + configurable
- 5 个上下文: global / editor / chatbox / approval / dialog
- 上下文优先级: more-specific 优先,fallback global
- 用户可重绑;冲突 (同 context + 同 key) 阻止保存
- 持久化在 `~/.open-novel/settings.json.keybindings`
- 不可改的硬约束: `Esc` 关浮层 / `Cmd+Q` 系统退出
- 命令面板 (`Cmd+Shift+P`) 用 fuzzy search 暴露所有命令

### 3. SettingsDialog 重设计

- 从 6 section 扩到 **8 section**: API Keys / 模型分配 / **快捷键 (新)** / 风格定制 / **读者仿真器 (新)** / 联网 / 数据管理 / 关于
- **全局 (🌐) vs 项目级 (📂) 分层**,每个 section 顶部明确徽标
- 全局存 `~/.open-novel/settings.json`;项目级存 `~/.open-novel/workspaces/{projectId}/project.json`
- 模型分配支持全局默认 + 项目覆盖 + 月度成本估算
- 读者仿真器 section 直接对应战略升级 (002) 引入的 ReaderPanel,管 5 default + 自定义 persona 的启用与 weight
- 数据管理含项目导出 zip / 删除项目 / 清空学习经验 / 出厂重置 (全部二次确认)
- 导入导出整体设置 json,跨设备迁移友好

## 影响的现有文档

approve 后实施:

| 文件 | 改动 |
|---|---|
| `spec/12-shortcuts.md` | 新建 |
| `spec/13-settings.md` | 新建 |
| `plan/05-modes-and-approval.md` | 加 Tab 切模式行为,await_approval 阻止规则 |
| `plan/07-ui-layout.md` | 把"快捷键"段改成"详见 spec/12";"Settings Dialog"段重写为"详见 spec/13" |
| `spec/07-mode-state-machine.md` | 状态机加 `SWITCH_MODE_VIA_TAB` event,与现有 `SWITCH_MODE` 区分 (Tab 来源 vs UI 点击) |
| `README.md` | 文档导航追加 spec/12 + spec/13 |
| `progress/README.md` | 索引追加 003 |

## 风险与缓解

- **Tab 拦截破坏可访问性**: Tab 是浏览器焦点遍历的标准键。在 ChatBox **内**拦没问题,但要确保 ChatBox **外** Tab 仍正常工作 — 通过上下文化解决
- **用户重绑产生孤立绑定**: 用户改了 `chat.send` 之后忘了,以后看不懂 — UI 显示"默认: ___" 一栏让用户随时知道改过什么
- **快捷键与浏览器原生冲突**: `Cmd+W` `Cmd+T` `Cmd+R` 不可拦,文档明示 + 提供备选绑定
- **8 section 太多,用户找不到**: 顶部加 🔍 搜索框过滤;每个 section 默认折叠;搜索词全文匹配 description

## 不在本次范围

- 命令面板的 fuzzy 算法 (沿用 fuse.js,不展开)
- 设置页的 i18n (POC 仅中文)
- 跨设备云同步 (POC 不做)

## 实施时机

- spec/12 spec/13 docs **当前 PR 落盘**
- 实际 keybinding listener 与 SettingsDialog 实现:
  - W2 commit 5 (settings dialog + api key persistence) 落地最小版 SettingsDialog (Section 1 API Keys)
  - **W3** 扩展到完整 8 section 与快捷键 registry — 在 progress/003 收尾时回填实施细节 + 偏差

---

## 实际完成 / 偏差 / 教训 (实施完成后追加)

> **[info]** 本节将在 W2 commit 5 (Section 1) + W3 (其他 sections + shortcut registry) 各自完成后追加。
