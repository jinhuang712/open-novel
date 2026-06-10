# design/00 — Design Tokens(Claude Desktop 风格 · 双主题)

> 本文是全部界面设计的视觉地基。原型实现见 `design/prototypes/tokens.css`(唯一 token 源,所有原型页共享)。

## 风格基调

参考 Claude Desktop 的视觉语言,落到 Open Novel 的 IDE 形态上:

- **暖纸色而非纯白/纯黑**:浅色底是米白 `#FAF9F5`,深色底是暖炭 `#262624`,避免冷蓝灰
- **低饱和 + 单一品牌 accent**:界面大面积中性暖灰,唯一高饱和色是陶土橙 `#D97757`,只用于主操作、品牌时刻与选中态
- **大圆角 + 极轻阴影**:卡片 14px、弹窗 20px;阴影只为分层,不做装饰
- **衬线标题点缀**:品牌性标题(Onboarding 欢迎页、空态)用衬线字体,正文与 UI 全部无衬线
- **克制的动效**:120/200/320ms 三档,均为 ease-out;尊重 `prefers-reduced-motion`

## 主题机制

双主题是硬性要求,实现约定:

- 所有颜色一律经 CSS 变量引用,**禁止在组件样式中硬编码 hex**
- `html[data-theme="light" | "dark"]` 切换整套变量;首次进入跟随系统 `prefers-color-scheme`,用户手动切换后写入本地配置(原型中为 `localStorage.onovel-theme`,产品中为 `settings.json.theme: 'auto' | 'light' | 'dark'`)
- 命令面板提供 `view.toggleDarkMode`(见 [spec/12 §命令清单](../spec/12-shortcuts.md#命令清单))
- 验收标准:任一界面在两套主题下,正文对比度 ≥ 7:1,次要文字 ≥ 4.5:1,disabled 态 ≥ 3:1

```mermaid
flowchart LR
  BOOT([应用启动]) --> CFG{settings.json.theme}
  CFG -->|auto| SYS[跟随系统 prefers-color-scheme]
  CFG -->|light / dark| FIX[固定主题]
  SYS --> APPLY["html[data-theme=...] 应用变量"]
  FIX --> APPLY
  TOGGLE[用户切换: Settings 或命令面板] --> CFG
```

## 色彩 Token

### 背景与文字

| Token | Light | Dark | 用途 |
|---|---|---|---|
| `--bg-app` | `#FAF9F5` | `#262624` | 应用底色 |
| `--bg-surface` | `#FFFFFF` | `#30302E` | 卡片 / 编辑器纸面 |
| `--bg-sunken` | `#F0EEE6` | `#1F1E1D` | 侧栏 / 输入底 / 下沉区 |
| `--bg-raised` | `#FFFFFF` | `#393937` | 浮层 / 弹窗 |
| `--bg-hover` | `rgba(61,57,41,.06)` | `rgba(236,236,234,.06)` | hover 态 |
| `--bg-active` | `rgba(61,57,41,.11)` | `rgba(236,236,234,.12)` | active / 选中底 |
| `--bg-overlay` | `rgba(40,38,34,.45)` | `rgba(10,10,9,.60)` | 模态遮罩 |
| `--text-primary` | `#2D2A24` | `#ECECEA` | 正文 |
| `--text-secondary` | `#6E6A60` | `#A6A39A` | 次要说明 |
| `--text-tertiary` | `#9C978A` | `#75726A` | 占位 / 弱提示 |
| `--border` | `#E8E5DB` | `#3E3D3A` | 默认描边 |
| `--border-strong` | `#D5D1C4` | `#52504B` | 分隔强描边 / 控件描边 |

### 品牌与语义

| Token | Light | Dark | 用途 |
|---|---|---|---|
| `--accent` | `#D97757` | `#D97757` | 主按钮 / 选中 / 品牌 |
| `--accent-hover` | `#C96442` | `#E08B6F` | accent hover |
| `--accent-subtle` | `#F7EAE3` | `#423630` | accent 浅底 |
| `--accent-text` | `#B0563B` | `#E5957B` | accent 文字(在浅底上) |
| `--info` | `#4F7DAF` | `#7FA7D1` | 信息(各配 `-subtle` 浅底) |
| `--success` | `#5E8C61` | `#82A886` | 成功 / 已验证 / 新增 diff |
| `--warning` | `#B8862C` | `#D9A645` | 警示 / major 风险 |
| `--danger` | `#BF4D43` | `#D97066` | 危险 / critical / 删除 diff |

### 领域色(Open Novel 特有)

| 组 | Token | Light | Dark | 用途 |
|---|---|---|---|---|
| 实体 | `--entity-character` | `#4F7DAF` | `#7FA7D1` | 角色(下划线/hover 卡,见 [spec/05](../spec/05-entity-highlight.md)) |
| 实体 | `--entity-place` | `#5E8C61` | `#82A886` | 地点 |
| 实体 | `--entity-item` | `#C2762D` | `#D99A55` | 物品 |
| 实体 | `--entity-org` | `#8A6FB8` | `#AC93D9` | 阵营 / 组织 |
| 实体 | `--entity-violation` | `#BF4D43` | `#D97066` | concept violation 红色虚线 |
| Agent | `--agent-router` | `#8A8578` | `#8F8C82` | Router(ThinkingPanel 主题色) |
| Agent | `--agent-writer` | `#D97757` | `#D97757` | Writer |
| Agent | `--agent-validator` | `#4F7DAF` | `#7FA7D1` | Validator |
| Agent | `--agent-checker` | `#B8862C` | `#D9A645` | Checker |
| Agent | `--agent-reflector` | `#8A6FB8` | `#AC93D9` | Reflector |
| Agent | `--agent-humanizer` | `#4E9B8F` | `#6FB8AC` | Humanizer |
| Agent | `--agent-reader` | `#C95F8E` | `#D9849E` | ReaderPanel |
| 置信度 | `--confidence-high/-mid/-low` | 复用 success / warning / tertiary | 同左 | cascade 勾选默认值的视觉对应 |
| Diff | `--diff-del-bg/-text` | `#FBEAE8` / `#A33D34` | `#46302E` / `#E5938A` | 删除行 |
| Diff | `--diff-add-bg/-text` | `#E8F2E8` / `#44693F` | `#2E3A2F` / `#A4C9A0` | 新增行 |

## 字体

| Token | 值 | 用途 |
|---|---|---|
| `--font-ui` | system + `PingFang SC` 栈 | 全部 UI 与编辑器正文(编辑器 16px / 行距 1.8,可调,见 [plan/07 §主题](../plan/07-ui-layout.md#主题)) |
| `--font-serif` | `New York` / `Songti SC` / `Noto Serif SC` | 品牌标题点缀(Onboarding、空态);Claude 的 Copernicus 为私有字体,用衬线栈替身 |
| `--font-mono` | `JetBrains Mono` / ui-monospace | diff、路径、kbd、token 用量 |

字号阶梯:11(角标)/ 12(辅助)/ 13(UI 默认)/ 14(正文)/ 16(编辑器)/ 18(区块标题)/ 24(衬线品牌标题)。字重只用 400 / 500 / 600。

## 圆角 · 阴影 · 间距 · 动效

| 类 | Token | 值 |
|---|---|---|
| 圆角 | `--radius-sm/md/lg/xl` | 6 / 10 / 14 / 20px(控件 / 按钮 / 卡片 / 弹窗) |
| 阴影 | `--shadow-sm/md/lg` | 卡片 / 浮层 / 模态,深色主题加深不透明度 |
| 间距 | 4 的倍数 | 4 / 8 / 12 / 16 / 20 / 24 / 32(组件内 padding 默认 12-16,卡片 16-20) |
| 动效 | `--dur-fast/base/slow` | 120 / 200 / 320ms,`--ease` 标准缓动;主题切换用 `--dur-base` |

## 焦点与可达性

- 键盘焦点一律 `box-shadow: 0 0 0 3px var(--focus-ring)`(accent 半透明),不裸用浏览器默认 outline
- 颜色不是唯一信号:置信度同时有文字(高/中/低),violation 同时有 ⚠ 图标,diff 同时有 +/- 前缀
- 全部浮层可被 `Esc` 关闭(硬约束,[spec/12](../spec/12-shortcuts.md));模态实现 Focus Trap

## 关联文档

- 上游:[plan/07 UI 布局](../plan/07-ui-layout.md) · [plan/08 技术栈](../plan/08-tech-stack.md)
- 应用:design/01~06 全部界面文档,`design/prototypes/*.html` 全部原型
