(function () {
  const diagramMatchers = [
    {
      test: (text) =>
        text.includes("User (ChatBox)") &&
        text.includes("Router (Flash)") &&
        text.includes("ReaderPanel"),
      render: renderAgentTopology,
    },
    {
      test: (text) =>
        text.includes("ChatBox 输入") &&
        text.includes("discuss") &&
        text.includes("plan") &&
        text.includes("write"),
      render: renderModeFlow,
    },
    {
      test: (text) =>
        text.includes("Tabs") &&
        text.includes("FileTree") &&
        text.includes("Editor (TipTap)") &&
        text.includes("ThinkingPanel"),
      render: renderWorkspaceLayout,
    },
    {
      test: (text) =>
        text.includes("L4 治理层") &&
        text.includes("L3 工具层") &&
        text.includes("L2 算法层") &&
        text.includes("L1 数据层"),
      render: renderKnowledgeStack,
    },
    {
      test: (text) =>
        text.includes("L4. 知识图谱") &&
        text.includes("L3. 项目记忆") &&
        text.includes("L2. 会话记忆") &&
        text.includes("L1. 工作记忆"),
      render: renderMemoryLayers,
    },
    {
      test: (text) =>
        text.includes("[Agent]") &&
        text.includes("[Server]") &&
        text.includes("[Client]") &&
        text.includes("tool-call-needs"),
      render: renderApprovalSequence,
    },
    {
      test: (text) =>
        text.includes("idle") &&
        text.includes("classifying") &&
        text.includes("await_approval") &&
        text.includes("applying"),
      render: renderModeState,
    },
    {
      test: (text) =>
        text.includes("输入故事种子") &&
        text.includes("一键生成章节概要") &&
        text.includes("同时维护多个项目"),
      render: renderScenarioFlow,
    },
    {
      test: (text) =>
        text.includes("Router 输出 intent") &&
        text.includes("discuss") &&
        text.includes("generate") &&
        text.includes("diff"),
      render: renderRouterModeSplit,
    },
    {
      test: (text) =>
        text.includes("用户发起修改意图") &&
        text.includes("内部递归循环") &&
        text.includes("analyzeImpact"),
      render: renderCascadeFlow,
    },
    {
      test: (text) =>
        text.includes("[📋] 大纲") &&
        text.includes("settings/outline") &&
        text.includes("foreshadowing"),
      render: renderFileCategoryMap,
    },
    {
      test: (text) =>
        text.includes("旧:") &&
        text.includes("writeSetting → Validator") &&
        text.includes("analyzeImpact"),
      render: () => renderOldNewComparison(
        "Cascade 检测升级",
        "从引用扫描 + LLM 心证，升级为 SQL 影响半径 + LLM 二次过滤",
        [
          "Validator 取 entity_refs",
          "全段送 LLM 心证",
          "输出 ChangeProposal",
        ],
        [
          "analyzeImpact 抽 semantic delta",
          "SQL 计算影响半径",
          "LLM 批量过滤",
          "递归生成整批 ChangeSet",
        ]
      ),
    },
    {
      test: (text) =>
        text.includes("旧:") &&
        text.includes("entity highlight") &&
        text.includes("queryFacts"),
      render: () => renderOldNewComparison(
        "事实查询升级",
        "从只能跳全文，升级为可按时间、关系、提及和语义查询",
        [
          "实体 hover 卡",
          "backlinks 仅显示引用数量",
          "无法回答状态演变问题",
        ],
        [
          "queryFacts 结构化查询",
          "entity-at 查询时间线",
          "relations-of 输出关系演变",
          "mentions / semantic-search 补充证据",
        ]
      ),
    },
    {
      test: (text) =>
        text.includes("anchor unchanged") &&
        text.includes("embedding 不动") &&
        text.includes("anchor added"),
      render: renderEmbeddingLifecycle,
    },
    {
      test: (text) =>
        text.includes("Writer 接到任务") &&
        text.includes("assembleContext") &&
        text.includes("tokenBudget"),
      render: renderContextAssembly,
    },
    {
      test: (text) =>
        text.includes("system message[0]") &&
        text.includes("stable header") &&
        text.includes("dynamic body"),
      render: renderPromptAssembly,
    },
    {
      test: (text) =>
        text.includes("E2E (Playwright)") &&
        text.includes("集成 (vitest + msw)") &&
        text.includes("单元 (vitest)"),
      render: renderTestPyramid,
    },
    {
      test: (text) =>
        text.startsWith("你是「Open Novel」系统") &&
        text.includes("# 角色"),
      render: renderPromptCard,
    },
    {
      test: (text) =>
        text.startsWith("本章涉及角色:") &&
        text.includes("**绝对守则**") &&
        text.includes("反例"),
      render: renderRuleContextCard,
    },
  ];

  function escapeHtml(value) {
    return String(value)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function el(tag, className, content) {
    const node = document.createElement(tag);
    if (className) node.className = className;
    if (content !== undefined) node.innerHTML = content;
    return node;
  }

  function badge(text, tone) {
    return `<span class="diagram-badge ${tone || ""}">${escapeHtml(text)}</span>`;
  }

  function node(title, note, tone) {
    return `
      <div class="diagram-node ${tone || ""}">
        <strong>${escapeHtml(title)}</strong>
        ${note ? `<span>${escapeHtml(note)}</span>` : ""}
      </div>
    `;
  }

  function arrow(label) {
    return `<div class="diagram-arrow">${label ? `<span>${escapeHtml(label)}</span>` : ""}</div>`;
  }

  function figure(title, caption, body) {
    const wrapper = el("figure", "visual-diagram");
    wrapper.innerHTML = `
      <figcaption>
        <strong>${escapeHtml(title)}</strong>
        ${caption ? `<span>${escapeHtml(caption)}</span>` : ""}
      </figcaption>
      ${body}
    `;
    return wrapper;
  }

  function renderAgentTopology() {
    return figure(
      "7 Agent 拓扑",
      "Router 分流后，创作、检查、一致性、读者仿真与反馈学习协同工作",
      `
        <div class="agent-topology">
          ${node("User", "ChatBox 输入", "primary")}
          ${arrow("prompt + mode")}
          ${node("Router", "Flash · 模式分流 + 意图识别", "router")}
          <div class="diagram-branch three">
            ${node("Writer", "Pro · 设定 / 正文生成", "writer")}
            ${node("Checker", "Flash · 章内审阅 + BeatAnalyzer", "checker")}
            ${node("Validator", "Pro · 一致性 + ArcTracker", "validator")}
          </div>
          <div class="diagram-branch three support">
            ${node("ReaderPanel", "Flash x5 · 读者仿真", "reader")}
            ${node("Reflector", "Flash · 反馈学习", "reflector")}
            ${node("Humanizer", "Pro · 去 AI 化", "humanizer")}
          </div>
        </div>
      `
    );
  }

  function renderModeFlow() {
    const mode = (title, tags, steps) => `
      <section class="mode-lane">
        <h4>${escapeHtml(title)}</h4>
        <div class="mode-tags">${tags.map((item) => badge(item)).join("")}</div>
        <ol>
          ${steps.map((item) => `<li>${escapeHtml(item)}</li>`).join("")}
        </ol>
      </section>
    `;
    return figure(
      "核心数据流",
      "同一入口按模式进入不同执行链路，写入始终先生成 proposal 再审批",
      `
        <div class="mode-flow">
          <div class="mode-entry">${node("ChatBox 输入", "prompt + mode", "primary")}</div>
          <div class="mode-lanes">
            ${mode("discuss", ["只读", "queryFacts"], [
              "优先 SQL 事实查询",
              "未命中再自由回答 / RAG",
              "不落盘",
            ])}
            ${mode("plan", ["设定编辑", "cascade"], [
              "Writer 生成主修改",
              "Validator 分析影响半径",
              "一次 ApprovalCard 审批整批 ChangeSet",
              "通过后事务写入 + reindex + Reflector",
            ])}
            ${mode("write", ["正文编辑", "风险审"], [
              "装配章节上下文",
              "Writer 生成章节 proposal",
              "Checker / Validator / ReaderPanel 并行检测",
              "守则风险进入审批卡",
            ])}
          </div>
        </div>
      `
    );
  }

  function renderWorkspaceLayout() {
    return figure(
      "工作台布局",
      "五区布局保留写作上下文，右侧承载推理流、工具日志和输入",
      `
        <div class="workspace-layout">
          <div class="tabs">Tabs</div>
          <div class="activity">Activity</div>
          <div class="file-tree">FileTree</div>
          <div class="editor">Editor<br><span>TipTap / 正文 / 设定</span></div>
          <div class="thinking">ThinkingPanel<br><span>推理流 · 工具调用 · 子 Agent</span></div>
          <div class="debug">DebugConsole / 其他面板</div>
          <div class="chat">ChatBox<br><span>mode 切换 · 输入区 · 发送</span></div>
        </div>
      `
    );
  }

  function renderKnowledgeStack() {
    const layers = [
      ["L4 治理层", "Workflow", "write / reindex / cascade / approval / snapshot"],
      ["L3 工具层", "Agent Tools", "analyzeImpact · assembleContext · queryFacts"],
      ["L2 算法层", "Retrieval + Reasoning", "段锚点 · embedding · SQL 影响半径 · LLM 过滤"],
      ["L1 数据层", "Structured Facts", "entity_relations · entity_timeline · concepts · dependencies"],
    ];
    return renderLayerStack("知识图谱分层", "从结构化事实到审批工作流，cascade 不再只靠 LLM 心证", layers);
  }

  function renderMemoryLayers() {
    const layers = [
      ["L4 知识图谱", "一致性的事实源", "实体 / 关系 / 时间线 / 伏笔 / 段锚点"],
      ["L3 项目记忆", "长期学习", "写作偏好 · 项目经验 · cardinal-rule lessons"],
      ["L2 会话记忆", "Mastra Memory", "thread / message / tool-result / summary"],
      ["L1 工作记忆", "单次调用上下文", "system · learnings · retrieved context · recent messages"],
    ];
    return renderLayerStack("Agent 记忆四层", "越往上越稳定，越往下越贴近本次调用", layers);
  }

  function renderLayerStack(title, caption, layers) {
    return figure(
      title,
      caption,
      `
        <div class="layer-stack">
          ${layers
            .map(
              ([label, titleText, desc]) => `
                <section class="layer-row">
                  <div class="layer-label">${escapeHtml(label)}</div>
                  <div>
                    <strong>${escapeHtml(titleText)}</strong>
                    <p>${escapeHtml(desc)}</p>
                  </div>
                </section>
              `
            )
            .join("")}
        </div>
      `
    );
  }

  function renderApprovalSequence() {
    const steps = [
      ["Agent", "emit tool-call", "needsApproval=true"],
      ["Server", "SSE 推送", "tool-call-needs-approval"],
      ["Client", "渲染 ApprovalCard", "onToolCall 拦截"],
      ["Client", "用户决议", "同意 / 修改 / 拒绝"],
      ["Server", "接收 tool result", "POST /api/tool-result"],
      ["Agent", "resume execute", "继续 agent loop"],
    ];
    return figure(
      "审批时序",
      "工具调用先悬挂到前端审批，决议再回灌给 Agent",
      `
        <div class="sequence-diagram">
          ${steps
            .map(
              ([actor, title, detail], index) => `
                <div class="sequence-step">
                  <span class="sequence-index">${index + 1}</span>
                  <strong>${escapeHtml(actor)}</strong>
                  <p>${escapeHtml(title)}</p>
                  <small>${escapeHtml(detail)}</small>
                </div>
              `
            )
            .join("")}
        </div>
      `
    );
  }

  function renderModeState() {
    const states = [
      ["idle", "等待输入"],
      ["classifying", "Router 分类"],
      ["running", "Agent 执行"],
      ["await_approval", "等待用户审批"],
      ["applying", "事务写入"],
      ["done", "完成"],
    ];
    return figure(
      "三模式状态机",
      "所有写入路径都经过 await_approval，审批期间阻止继续输入",
      `
        <div class="state-machine">
          ${states
            .map(([name, desc]) => `${node(name, desc, name === "await_approval" ? "warning" : "")}`)
            .join("")}
        </div>
      `
    );
  }

  function renderScenarioFlow(text) {
    const steps = text
      .split("\n")
      .map((line) => line.replace(/^\d+\.\s*/, "").trim())
      .filter(Boolean);
    return renderStepFlow(
      "核心用户场景",
      "把长篇写作从设定、正文、修改到多项目管理串成连续工作流",
      steps
    );
  }

  function renderRouterModeSplit() {
    return figure(
      "Router 模式分流",
      "Router 先校验意图与当前模式，再进入对应的读写权限边界",
      `
        <div class="mode-split">
          ${node("Router", "输出 intent + 校验 mode", "router")}
          <div class="mode-lanes">
            <section class="mode-lane">
              <h4>discuss</h4>
              <div class="mode-tags">${badge("read-only")}</div>
              <ol><li>只读检索</li><li>校验事实</li><li>不生成 diff</li></ol>
            </section>
            <section class="mode-lane">
              <h4>plan</h4>
              <div class="mode-tags">${badge("settings")}${badge("approval")}</div>
              <ol><li>生成设定修改</li><li>校验 cascade</li><li>输出 diff</li></ol>
            </section>
            <section class="mode-lane">
              <h4>write</h4>
              <div class="mode-tags">${badge("chapter")}${badge("risk report")}</div>
              <ol><li>生成章节 proposal</li><li>并行检测</li><li>输出 diff + 风险</li></ol>
            </section>
          </div>
        </div>
      `
    );
  }

  function renderCascadeFlow() {
    return figure(
      "内部递归 Cascade",
      "用户只看到最终 ChangeSet，递归影响分析在审批前完成",
      `
        <div class="cascade-flow">
          ${node("用户修改意图", "例如修改角色性别", "primary")}
          ${node("Writer 主修改", "in-memory · 未落盘", "writer")}
          <section class="cascade-loop">
            <h4>内部递归循环</h4>
            <ol>
              <li><strong>第 1 轮</strong><span>extractSemanticDelta → SQL 影响半径 → LLM filter → ChangeProposal[1]</span></li>
              <li><strong>Writer 短调用</strong><span>为 needsChange 项生成 afterText，仍在内存中</span></li>
              <li><strong>第 2 轮</strong><span>基于 afterText 再算影响半径，阈值收紧</span></li>
              <li><strong>第 3 轮</strong><span>仍有候选时继续，直到深度上限</span></li>
            </ol>
            <p>终止条件: 候选空 / 半径不严格收缩 / 深度 = 3</p>
          </section>
          ${node("汇总 ChangeSet", "主修改 + cascade proposals", "validator")}
          ${node("一次 ApprovalCard", "用户勾选 / 编辑 / 拒绝", "warning")}
        </div>
      `
    );
  }

  function renderFileCategoryMap() {
    const groups = [
      ["📋", "大纲", "settings/outline/*, beats.md"],
      ["👥", "角色设定", "settings/characters/*.md"],
      ["🌍", "世界观", "settings/worldview/*"],
      ["🏛", "阵营 / 组织", "settings/factions/*, organizations/*"],
      ["📍", "地点", "settings/locations/{regions,cities,buildings,landmarks}/*"],
      ["📦", "道具 / 事件", "settings/items/*, events/*"],
      ["🕒", "时间线 / 弧线", "settings/timeline/*, chapter-arcs/*"],
      ["🔗", "关系 / 伏笔", "settings/relationships/*, foreshadowing/*, story-lines/*"],
    ];
    return figure(
      "设定文件分类",
      "FileTree 按创作心智分组，而不是暴露底层目录细节",
      `
        <div class="category-grid">
          ${groups
            .map(
              ([icon, title, path]) => `
                <section class="category-card">
                  <span>${escapeHtml(icon)}</span>
                  <strong>${escapeHtml(title)}</strong>
                  <code>${escapeHtml(path)}</code>
                </section>
              `
            )
            .join("")}
        </div>
      `
    );
  }

  function renderOldNewComparison(title, caption, oldItems, newItems) {
    const list = (heading, items, tone) => `
      <section class="compare-panel ${tone}">
        <h4>${escapeHtml(heading)}</h4>
        <ol>${items.map((item) => `<li>${escapeHtml(item)}</li>`).join("")}</ol>
      </section>
    `;
    return figure(
      title,
      caption,
      `
        <div class="compare-grid">
          ${list("旧链路", oldItems, "old")}
          ${list("新链路", newItems, "new")}
        </div>
      `
    );
  }

  function renderEmbeddingLifecycle() {
    return figure(
      "Embedding 生命周期",
      "段锚点变化决定向量是否复用、重算或级联删除",
      `
        <div class="lifecycle-grid">
          ${[
            ["unchanged", "embedding 不动", "复用已有向量"],
            ["modified", "enqueueParagraphRescan", "内容变化后重算"],
            ["rewritten", "软删旧 anchor", "FK cascade 删除旧 embedding，再生成新向量"],
            ["deleted", "软删 anchor", "embedding 一并删除"],
            ["added", "reembedAnchor", "新增段落生成向量"],
          ]
            .map(
              ([state, action, detail]) => `
                <section class="lifecycle-card">
                  <strong>${escapeHtml(state)}</strong>
                  <span>${escapeHtml(action)}</span>
                  <p>${escapeHtml(detail)}</p>
                </section>
              `
            )
            .join("")}
        </div>
      `
    );
  }

  function renderContextAssembly() {
    return renderStepFlow(
      "assembleContext 装配流程",
      "写章节前先把涉及实体、时间线、伏笔、关系和语义相关段落装进上下文",
      [
        "Writer 接到任务",
        "调用 assembleContext({ chapterId, outline, includeKinds, tokenBudget })",
        "从 outline 抽取涉及 entity",
        "读取每个 entity 在当前章节的最新状态",
        "装配关系、伏笔、世界观、语义相关段落",
        "按 token budget 排序裁剪",
        "返回给 Writer 生成章节",
      ]
    );
  }

  function renderPromptAssembly() {
    const stableItems = [
      "Agent 角色与目标",
      "五大网文绝对守则",
      "不可信内容围栏",
      "输出形态声明 + JSON 示例",
    ];
    const dynamicItems = [
      "项目上下文",
      "当前模式约束",
      "用户偏好经验注入",
      "Agent 专用指令",
      "工具调用约束",
      "本轮用户消息 / 检索上下文",
    ];
    const panel = (title, note, items, tone) => `
      <section class="prompt-assembly-panel ${tone}">
        <h4>${escapeHtml(title)}</h4>
        <p>${escapeHtml(note)}</p>
        <ul>${items.map((item) => `<li>${escapeHtml(item)}</li>`).join("")}</ul>
      </section>
    `;
    return figure(
      "Prompt 装配结构",
      "稳定头部用于缓存，动态正文按本次调用装配",
      `
        <div class="prompt-assembly">
          ${panel("system message[0]", "stable header · 标 cache_control", stableItems, "stable")}
          ${panel("system message[1]", "dynamic body · 本次调用拼装", dynamicItems, "dynamic")}
        </div>
      `
    );
  }

  function renderPromptCard(text) {
    const firstLine = text.split("\n").find(Boolean) || "Prompt 模板";
    const match = firstLine.match(/代号\s*([^。(]+)/);
    const title = match ? `${match[1].trim()} Prompt` : "Agent Prompt";
    return figure(
      title,
      "模板内容保持原文，使用卡片样式方便扫读",
      `<pre class="prompt-card"><code>${escapeHtml(text)}</code></pre>`
    );
  }

  function renderRuleContextCard(text) {
    return figure(
      "守则上下文注入",
      "角色承诺、禁忌和反例作为 Writer 的硬约束进入 prompt",
      `<pre class="prompt-card rule-context"><code>${escapeHtml(text)}</code></pre>`
    );
  }

  function renderTestPyramid() {
    const layers = [
      ["E2E", "Playwright", "少量核心 user flow"],
      ["集成", "vitest + msw", "Route Handlers + Mastra agent + 工具流"],
      ["单元", "vitest", "lib/* 纯函数 + state machine + reducer"],
    ];
    return figure(
      "测试金字塔",
      "越靠下数量越多、反馈越快；越靠上越贴近真实用户流程",
      `
        <div class="test-pyramid">
          ${layers
            .map(
              ([name, tech, scope]) => `
                <section>
                  <strong>${escapeHtml(name)}</strong>
                  <span>${escapeHtml(tech)}</span>
                  <p>${escapeHtml(scope)}</p>
                </section>
              `
            )
            .join("")}
        </div>
      `
    );
  }

  function renderStepFlow(title, caption, steps) {
    return figure(
      title,
      caption,
      `
        <ol class="compact-flow">
          ${steps.map((line) => `<li>${escapeHtml(line.replace(/^[-•]\s*/, ""))}</li>`).join("")}
        </ol>
      `
    );
  }

  function normalizeBoxLine(line) {
    return line
      .replace(/^[┌├└│\s─]+/, "")
      .replace(/[┐┤┘│\s─]+$/, "")
      .trim();
  }

  function enhanceBoxMock(pre, text) {
    const lines = text.split("\n");
    const first = normalizeBoxLine(lines[0] || "");
    const title = first || "界面示意";
    const body = lines
      .slice(1, -1)
      .map(normalizeBoxLine)
      .filter(Boolean)
      .join("\n");
    const card = figure(
      title,
      "UI mockup",
      `<pre class="mock-body"><code>${escapeHtml(body)}</code></pre>`
    );
    pre.replaceWith(card);
  }

  function enhanceFlowText(pre, text) {
    const rawSteps = text
      .split(/\n+/)
      .map((line) => line.trim())
      .filter(Boolean)
      .filter((line) => !/^[│↓]+$/.test(line));
    if (rawSteps.length < 3 || rawSteps.some((line) => line.length > 96)) return false;
    const flow = renderStepFlow("流程", "", rawSteps);
    pre.replaceWith(flow);
    return true;
  }

  function isLikelyCodeBlock(text) {
    const first = text.trimStart().split("\n")[0] || "";
    if (/^(\/\/|import |export |const |let |type |interface |function |async function |class |describe\(|it\(|CREATE TABLE|ALTER TABLE|SELECT |INSERT |UPDATE |DELETE |---$)/.test(first)) {
      return true;
    }
    const codeSignals = [
      /;\s*$/,
      /\{|\}/,
      /\breturn\b/,
      /\bz\.object\b/,
      /\bawait\b/,
      /\bPromise</,
      /\bTEXT\b|\bINTEGER\b|\bPRIMARY KEY\b/,
    ].filter((pattern) => pattern.test(text)).length;
    return codeSignals >= 2;
  }

  function classifyFallback(pre, text) {
    if (isLikelyCodeBlock(text)) {
      pre.classList.add("code-sample");
      return;
    }
    if (/^[\s\S]*┌/.test(text) && /└/.test(text)) {
      if (/┌─/.test(text.split("\n")[0] || "") || text.length < 1200) {
        enhanceBoxMock(pre, text);
        return;
      }
      pre.classList.add("diagram-ascii");
      return;
    }
    if (/├──|└──/.test(text)) {
      pre.classList.add("doc-tree");
      return;
    }
    if (text.includes("↓") && enhanceFlowText(pre, text)) return;
    if (/ → |-&gt;|--&gt;/.test(pre.innerHTML)) pre.classList.add("diagram-ascii");
  }

  function enhance() {
    document.querySelectorAll("pre > code").forEach((code) => {
      const pre = code.parentElement;
      if (!pre || pre.dataset.enhanced === "true") return;
      const text = code.textContent.trim();
      for (const matcher of diagramMatchers) {
        if (!matcher.test(text)) continue;
        const rendered = matcher.render(text);
        pre.replaceWith(rendered);
        pre.dataset.enhanced = "true";
        return;
      }
      classifyFallback(pre, text);
      pre.dataset.enhanced = "true";
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", enhance);
  } else {
    enhance();
  }
})();
