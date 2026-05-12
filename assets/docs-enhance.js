// docs-enhance.js — Mermaid runtime
// 文档里的图全部以 <pre class="mermaid">...</pre> 或 <div class="mermaid">...</div> 形式书写,
// 此脚本动态加载 mermaid@10 并按 docs.css 的米色 paper 调初始化主题,
// 然后扫描所有 .mermaid 元素渲染为 SVG。

(function () {
  const themeVars = {
    fontFamily:
      'ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
    fontSize: '14px',

    // 主色 — 绿 (accent)
    primaryColor: '#eef8f5',
    primaryTextColor: '#241f1a',
    primaryBorderColor: '#1d6f68',

    // 次色 — 蓝
    secondaryColor: '#eef4fb',
    secondaryBorderColor: '#245a96',
    secondaryTextColor: '#241f1a',

    // 第三色 — 金
    tertiaryColor: '#fff7e5',
    tertiaryBorderColor: '#9a6a17',
    tertiaryTextColor: '#241f1a',

    // 连线
    lineColor: '#70685e',

    // 背景
    background: '#fffdf8',
    mainBkg: '#fffdf8',
    labelBackground: '#fbf8f0',
    edgeLabelBackground: '#fbf8f0',

    // 集群 (subgraph)
    clusterBkg: '#f5f1e8',
    clusterBorder: '#ddd4c8',

    // 时序
    actorBkg: '#eef4fb',
    actorBorder: '#245a96',
    actorTextColor: '#241f1a',
    signalColor: '#70685e',
    signalTextColor: '#241f1a',
    noteBkgColor: '#fff7e5',
    noteBorderColor: '#9a6a17',
    noteTextColor: '#241f1a',
  };

  async function run() {
    try {
      const m = await import(
        'https://cdn.jsdelivr.net/npm/mermaid@10/dist/mermaid.esm.min.mjs'
      );
      const mermaid = m.default;
      mermaid.initialize({
        startOnLoad: false,
        securityLevel: 'loose',
        theme: 'base',
        themeVariables: themeVars,
        flowchart: {
          curve: 'basis',
          htmlLabels: true,
          useMaxWidth: true,
          padding: 16,
        },
        sequence: {
          useMaxWidth: true,
          boxMargin: 8,
          actorMargin: 60,
          messageFontSize: 13,
        },
        state: { useMaxWidth: true },
        gantt: { useMaxWidth: true },
      });
      await mermaid.run({ querySelector: '.mermaid' });
    } catch (err) {
      console.error('[docs-enhance] mermaid load/render failed:', err);
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', run);
  } else {
    run();
  }
})();
