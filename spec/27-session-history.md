# Spec 27 — session_history.db

> **[info]** 本文档补齐第三个 SQLite 文件的 schema 主权。结论: `session_history.db` 是每项目过程数据与调试数据仓库,异步 best-effort 写入,不参与产品事实恢复。

## 三库边界

| 数据库 | 路径 | 事实等级 | 主权文档 |
|---|---|---|---|
| `runtime.db` | `~/.open-novel/runtime.db` | 跨项目会话事实: threads / messages / compressed_messages / archived_threads | [spec/22](./22-memory-and-history.md) |
| `index.db` | `{projectId}/index.db` | 项目事实与派生索引: entities / approvals / history / graph / embeddings | [spec/01](./01-storage-schema.md) |
| `session_history.db` | `{projectId}/session_history.db` | 过程日志: LLM 调用、JSON retry、cascade events、prompt cache stats | **spec/27** |

## 不变性

1. `session_history.db` 写入失败不得阻塞用户主流程。
2. 任何恢复、审批、回滚、知识图谱查询都不得以 `session_history.db` 为事实来源。
3. 不得跨库 JOIN。需要关联时用 `projectId` / `turnId` / `approvalId` 在应用层分两次查。
4. 默认保留 30 天或 500MB,先到为准;用户可在 Settings 调大,但导出项目时默认不包含本库。
5. 大型 tool output 原文只存散文件路径与 hash;表内只存摘要、截断片段和元数据。

## Schema

### `llm_calls`

```sql
CREATE TABLE llm_calls (
  id TEXT PRIMARY KEY,
  project_id TEXT NOT NULL,
  turn_id TEXT,
  session_id TEXT,
  agent TEXT NOT NULL,
  model TEXT NOT NULL,
  mode TEXT NOT NULL,                         -- json | text | embedding
  prompt_tokens INTEGER,
  completion_tokens INTEGER,
  total_tokens INTEGER,
  latency_ms INTEGER,
  finish_reason TEXT,
  request_hash TEXT NOT NULL,
  response_hash TEXT,
  prompt_preview TEXT,                         -- truncated, never full manuscript by default
  response_preview TEXT,
  error_code TEXT,
  error_message TEXT,
  created_at TEXT NOT NULL
);
CREATE INDEX idx_llm_calls_turn ON llm_calls(turn_id);
CREATE INDEX idx_llm_calls_agent_created ON llm_calls(agent, created_at);
```

### `json_retries`

```sql
CREATE TABLE json_retries (
  id TEXT PRIMARY KEY,
  llm_call_id TEXT NOT NULL,
  project_id TEXT NOT NULL,
  agent TEXT NOT NULL,
  schema_name TEXT NOT NULL,
  attempt INTEGER NOT NULL,
  validation_error TEXT NOT NULL,
  repaired_by_retry INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL
);
CREATE INDEX idx_json_retries_call ON json_retries(llm_call_id);
```

### `cascade_events`

```sql
CREATE TABLE cascade_events (
  id TEXT PRIMARY KEY,
  project_id TEXT NOT NULL,
  turn_id TEXT NOT NULL,
  approval_id TEXT,
  action_index INTEGER,
  event_type TEXT NOT NULL,
  payload_json TEXT,
  duration_ms INTEGER,
  created_at TEXT NOT NULL
);
CREATE INDEX idx_cascade_events_turn ON cascade_events(turn_id, created_at);
```

### `chapter_tool_runs`

```sql
CREATE TABLE chapter_tool_runs (
  id TEXT PRIMARY KEY,
  project_id TEXT NOT NULL,
  turn_id TEXT,
  chapter_id TEXT NOT NULL,
  tool_name TEXT NOT NULL,
  input_hash TEXT NOT NULL,
  output_hash TEXT,
  output_artifact_path TEXT,
  status TEXT NOT NULL,                        -- ok | failed | cancelled
  latency_ms INTEGER,
  created_at TEXT NOT NULL
);
CREATE INDEX idx_chapter_tool_runs_chapter ON chapter_tool_runs(chapter_id, created_at);
```

### `doom_loop_events`

```sql
CREATE TABLE doom_loop_events (
  id TEXT PRIMARY KEY,
  project_id TEXT NOT NULL,
  turn_id TEXT,
  chapter_id TEXT,
  similarity REAL NOT NULL,
  threshold REAL NOT NULL,
  retry_count INTEGER NOT NULL,
  verdict TEXT NOT NULL,                       -- continue | escalate
  reject_reasons_json TEXT NOT NULL,
  created_at TEXT NOT NULL
);
```

### `prompt_cache_stats`

```sql
CREATE TABLE prompt_cache_stats (
  id TEXT PRIMARY KEY,
  project_id TEXT NOT NULL,
  llm_call_id TEXT,
  cache_key TEXT NOT NULL,
  hit INTEGER NOT NULL,
  stable_prefix_tokens INTEGER,
  saved_tokens INTEGER,
  provider_payload_json TEXT,
  created_at TEXT NOT NULL
);
CREATE INDEX idx_prompt_cache_stats_key ON prompt_cache_stats(cache_key, created_at);
```

## 写入策略

- 写入走 `SessionHistoryWriter` 内存队列,默认 1 秒 flush 或 100 条 flush。
- 队列满时丢弃低优先级 preview,保留 error / retry / cascade failure。
- 应用退出前 best-effort flush;失败只打 stderr,不影响用户产物。
- PII 与正文保护:默认只存 hash + 2KB preview。用户开启 debug full trace 后才写 artifact 文件。

## 保留与清理

```ts
export async function pruneSessionHistory(projectId: string) {
  await db.execute("DELETE FROM llm_calls WHERE created_at < datetime('now', '-30 days')")
  await db.execute("DELETE FROM json_retries WHERE created_at < datetime('now', '-30 days')")
  await db.execute("DELETE FROM cascade_events WHERE created_at < datetime('now', '-30 days')")
  await db.execute("DELETE FROM chapter_tool_runs WHERE created_at < datetime('now', '-30 days')")
  await db.execute("DELETE FROM doom_loop_events WHERE created_at < datetime('now', '-90 days')")
  await db.execute("DELETE FROM prompt_cache_stats WHERE created_at < datetime('now', '-30 days')")
  await vacuumIfLargerThan(projectId, 'session_history.db', 500 * MB)
}
```

`doom_loop_events` 保留 90 天,因为阈值调参需要更长窗口。其他过程数据默认 30 天足够。

## Settings Debug 面板

SettingsDialog 的调试面板只读本库:

- 最近 LLM 调用、token、latency、错误率
- JSON retry 失败样本
- cascade event 时间线
- doom-loop escalate 样本
- prompt cache hit / saved_tokens

调试面板不得提供“从过程日志恢复项目”的按钮。恢复必须走 `runtime.db` 与 `index.db`。

## 关联文档

- [spec/01](./01-storage-schema.md) index.db schema 主权
- [spec/22](./22-memory-and-history.md) runtime.db schema 主权与三库分工(§数据库分工)
- [plan/02 — 产品原则](../plan/02-principles.md) 数据归你 / 产物与过程分离的产品立场
- [spec/24](./24-json-output.md) JSON retry 与结构化输出
- [spec/26](./26-cascade-controller.md) cascade event 来源

## ADR · 设计决策

| 编号 | 决策 | 选项 | 选择 | 理由 |
|---|---|---|---|---|
| ADR-01 | 过程数据位置 | 写入 index.db / 写散 JSONL / **独立 session_history.db** | **独立库** | 过程数据高频、可丢弃、体积大;放进 index.db 会污染项目事实库和导出体积。 |
| ADR-02 | 写入强度 | 同步强一致 / **异步 best-effort** | **best-effort** | 调试日志不能拖慢审批与写作主链路。 |
| ADR-03 | 正文保存 | 默认存全文 / **默认 hash + preview** | **hash + preview** | 小说正文是用户核心资产,过程库默认不复制全文,避免隐私和体积风险。 |
