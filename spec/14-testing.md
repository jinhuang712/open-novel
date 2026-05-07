# Spec 14 — 测试策略

## 测试金字塔

```
    ▲ E2E (Playwright)            少量 (核心 user flow,可选)
    ─────────────────
    ▲ 集成 (vitest + msw)         中量 (Route Handlers + Mastra agent + 工具流)
    ─────────────────────
    ▲ 单元 (vitest)              大量 (lib/* 纯函数 + state machine + reducer)
    ─────────────────────────
```

## Framework 选型

| 层 | Framework | 锁定版本 (W3 audit 后填) | 理由 |
|---|---|---|---|
| 单元 + 集成 | **vitest** + `@vitest/ui` + `vitest/browser` (TipTap 测试用) | (实查) | 与 Vite/Bun 生态对齐;比 jest 启动快 10x;原生 ESM/TS |
| Route Handler 集成 | vitest + `next/test` (Next.js 15 内置) | 同 next | App Router 直测 |
| LLM 拦截 | **msw** (Mock Service Worker) | (实查) | 拦截 fetch,模拟 DeepSeek/Mastra responses |
| 状态机 | `@xstate/test` | (实查) | XState v5 官方 |
| E2E | **playwright** | (实查) | 与 shadcn 模板兼容;支持中文 IME 测试 |
| 性能基准 | `vitest bench` | (内置) | Aho-Corasick 性能数据落地 |

## 文件分布

```
.
├── vitest.config.ts                  # 单测/集成测配置
├── playwright.config.ts              # E2E 配置 (W11+)
├── tests/
│   ├── unit/
│   │   ├── shortcuts.test.ts
│   │   ├── modes.test.ts
│   │   ├── modeMachine.test.ts
│   │   ├── ahocorasick.test.ts
│   │   ├── ahocorasick.bench.ts
│   │   ├── frontmatter-schema.test.ts
│   │   └── path-traversal.test.ts
│   ├── integration/
│   │   ├── api-keys.test.ts
│   │   ├── api-files.test.ts
│   │   ├── api-chat.test.ts
│   │   ├── approval-flow.test.ts
│   │   └── cascade-resume.test.ts
│   ├── e2e/                          # W11+ 才补
│   │   ├── boot-and-settings.spec.ts
│   │   ├── plan-mode.spec.ts
│   │   └── write-mode.spec.ts
│   ├── fixtures/                     # 共用 mock 数据
│   │   ├── projects/
│   │   ├── chapters/
│   │   └── llm-responses/
│   └── golden/                       # LLM 输出 snapshot
│       ├── beat-analyzer/
│       ├── reader-panel/
│       └── writer/
└── .github/workflows/
    ├── ci.yml                         # PR 时跑 typecheck/lint/build/test
    └── nightly-llm.yml                # nightly 跑真实 LLM golden (有成本)
```

## 单测 must-have 清单 (按 W 落地)

### W2 末尾
- `frontmatter-schema.test.ts`: zod schema 校验所有 7 类 frontmatter
- `path-traversal.test.ts`: `assertUnderHome`、`writeSetting` 拒绝 `../`
- `modes.test.ts`: cycleMode / 反向 cycleMode

### W3
- `modeMachine.test.ts` (基于 spec/07 § 测试):
  - discuss 不会进入 awaitingApproval
  - awaitingApproval 中切 mode 被拒绝
  - cascade 链路连续多个 awaitingApproval 串行
  - **新增** USER_INPUT 在 awaitingApproval 被 reject + toast (audit 补)
  - **新增** 浏览器刷新 → session.json reload → state 恢复正确

### W4-W5
- `shortcuts.test.ts` (基于 spec/12 §测试约束):
  - 每条快捷键 trigger key → handler called
  - 上下文区分: 同键在 chatbox vs editor 走不同 handler
  - 冲突检测: 重绑产生冲突时禁止保存
  - **新增** IME 候选活跃 (composing=true) 时 Tab 不切模式 (audit 补)
- `frontmatter.test.ts`: BOM / CRLF / 编码归一化
- `aho-corasick.test.ts` + bench: 边界裁剪 / 中文子串 (李白 vs 李白菜) / 50K 字 + 500 patterns 性能

### W6-W7
- `entity-highlight.test.ts`: TipTap Decoration 增量 + IME composition 跳过
- `cascade-resume.test.ts`: 5 项审到第 3 项 simulate 关闭 → reload → 后两项重新出现
- `approval-flow.test.ts`: `addToolResult` 协议端到端

### W8+
- `cost-cap.test.ts`: 触顶后 ChatBox disabled
- `reader-panel.test.ts`: 1/5 失败的 aggregateRetention 公式 / 全失败的 inconclusive

## 集成测策略

### Route Handler 测试范式

```ts
// tests/integration/api-keys.test.ts
import { POST } from '@/app/api/keys/route'

it('rejects path traversal in body', async () => {
  const req = new Request('http://localhost/api/keys', {
    method: 'POST',
    body: JSON.stringify({ deepseekApiKey: '../../etc/passwd' }),
  })
  const res = await POST(req)
  expect(res.status).toBe(400)
})
```

### LLM mock 范式 (msw)

```ts
// tests/setup-msw.ts
import { setupServer } from 'msw/node'
import { http, HttpResponse } from 'msw'

export const server = setupServer(
  http.post('https://api.deepseek.com/*', async ({ request }) => {
    const body = await request.json()
    // 根据 body 决定返回哪个 fixture
    return HttpResponse.json(loadFixture(body.messages))
  }),
)
```

所有集成测**默认走 msw mock**,真实 LLM 只在 `nightly-llm.yml` 跑。

## LLM Golden Test 策略

### 问题
LLM 输出非确定性,直接 snapshot 会脆弱。

### 方案

1. **结构化输出走 schema 校验 + 关键字段断言**:
   ```ts
   it('beat analyzer outputs valid BeatReport', async () => {
     const out = await analyzeNarrative({ chapterId: 'fixture_chapter_001' })
     expect(out).toMatchSchema(beatReportSchema)
     expect(out.rhythmScore).toBeGreaterThanOrEqual(0)
     expect(out.rhythmScore).toBeLessThanOrEqual(100)
     expect(out.flagsForAuthor.length).toBeGreaterThan(0)
   })
   ```
2. **自由文本 (Writer 输出) 走"特征断言"** 而非全文 snapshot:
   - 字数在 ±20% 期望范围
   - 不出现 AI 标记句 ("无论是...还是..." 等黑名单)
   - frontmatter 完备
3. **完整 snapshot 仅用于 prompt 模板本身的回归** (prompt 改了 → 提示重跑)

### 成本封顶

`nightly-llm.yml` 头部:

```yaml
env:
  LLM_BUDGET_USD_DAILY: "5"           # 单日预算
  LLM_BUDGET_USD_PER_RUN: "0.5"       # 单次 run 预算
```

测试 runner 每发一个请求记账,触顶 fail-fast。

## XState 测试 (`@xstate/test`)

```ts
import { createTestModel } from '@xstate/test'

const testModel = createTestModel(modeMachine)

it('await_approval 中切 mode 被拒', async () => {
  const path = testModel.getShortestPathsTo({ planning: 'awaitingApproval' })[0]
  await path.test({})
  // 在该状态下 send SWITCH_MODE
  expect(/* 状态没变 */).toBe(true)
})
```

## CI 配置

`.github/workflows/ci.yml`:

```yaml
name: CI
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v5
      - uses: pnpm/action-setup@v5
        with: { version: 9 }
      - uses: actions/setup-node@v5
        with: { node-version: 22, cache: pnpm }
      - run: pnpm install --frozen-lockfile
      - run: pnpm typecheck
      - run: pnpm lint
      - run: pnpm test:unit
      - run: pnpm test:int
      - run: pnpm build
```

`nightly-llm.yml` (cron 凌晨跑,只在 main 分支):

```yaml
on:
  schedule: [{ cron: '0 18 * * *' }]   # UTC 18:00 = CST 02:00
  workflow_dispatch:
jobs:
  golden:
    runs-on: ubuntu-latest
    env:
      DEEPSEEK_API_KEY: ${{ secrets.DEEPSEEK_API_KEY }}
      LLM_BUDGET_USD_DAILY: "5"
    steps:
      - ... (同上,但跑 pnpm test:golden)
```

## package.json scripts

```json
{
  "scripts": {
    "test": "vitest",
    "test:unit": "vitest run tests/unit",
    "test:int": "vitest run tests/integration",
    "test:bench": "vitest bench",
    "test:e2e": "playwright test",
    "test:golden": "vitest run tests/golden --reporter verbose"
  }
}
```

## 不做什么

- **不做 100% 覆盖率追求**: 重点在状态机 / 路径越权 / 模式约束 / 数据完整性,UI 细节不强求覆盖
- **不做"快照即测试"**: snapshot 文件不入库 git (`.gitignore` 忽略 `__snapshots__/`),用结构化断言替代
- **不做 mutation testing / fuzzing**: 二期再考虑
- **不做 visual regression**: shadcn 组件已足够稳定,UI 视觉回归靠手测

## 落地里程碑

| 周 | 测试动作 |
|---|---|
| W2 retro | vitest.config.ts + 3 个 must-have 单测 (frontmatter / path-traversal / modes) |
| W3 | XState 状态机 8 个测试 + Route Handler 3 个集成测 |
| W4-W7 | 滚动覆盖 (entity-highlight / approval-flow / cascade-resume) |
| W8 | Cost cap / Reader Panel 失败聚合 |
| W11 | E2E playwright 起步 (boot + plan + write 三个 happy path) |
| W12 | Nightly golden + budget cap |
