#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const ignoredDirs = new Set(['.git', '.next', 'node_modules', 'dist', 'build', 'coverage', 'vendor']);
const errors = [];
const warnings = [];
const strictAnchors = process.argv.includes('--strict-anchors');

function toPosix(value) {
  return value.split(path.sep).join('/');
}

function repoPath(filePath) {
  return toPosix(path.relative(root, filePath));
}

function walk(dir, results = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.isDirectory()) {
      if (!ignoredDirs.has(entry.name)) {
        walk(path.join(dir, entry.name), results);
      }
      continue;
    }
    if (entry.isFile() && entry.name.endsWith('.md')) {
      results.push(path.join(dir, entry.name));
    }
  }
  return results;
}

function stripCodeBlocks(text) {
  return text
    .split(/\r?\n/)
    .map((line) => (/^\s*```/.test(line) ? { line, toggle: true } : { line, toggle: false }))
    .reduce(
      (state, item) => {
        if (item.toggle) {
          state.inFence = !state.inFence;
          state.lines.push('');
        } else {
          state.lines.push(state.inFence ? '' : item.line);
        }
        return state;
      },
      { inFence: false, lines: [] }
    )
    .lines.join('\n');
}

function lineNumberAt(text, index) {
  let line = 1;
  for (let i = 0; i < index; i += 1) {
    if (text.charCodeAt(i) === 10) line += 1;
  }
  return line;
}

function isExternalTarget(target) {
  return /^[a-z][a-z0-9+.-]*:/i.test(target) || target.startsWith('#') || target.startsWith('mailto:');
}

function normalizeMarkdownTarget(rawTarget) {
  const cleaned = rawTarget.trim().replace(/^<|>$/g, '');
  const hashIndex = cleaned.indexOf('#');
  const fragment = hashIndex >= 0 ? cleaned.slice(hashIndex + 1) : null;
  const withoutHash = hashIndex >= 0 ? cleaned.slice(0, hashIndex) : cleaned;
  const queryIndex = withoutHash.indexOf('?');
  const file = queryIndex >= 0 ? withoutHash.slice(0, queryIndex) : withoutHash;
  return { file, fragment };
}

// GitHub-style heading slug: strip inline markdown formatting, lowercase,
// remove everything except letters / numbers / spaces / hyphens, spaces -> '-'.
// Duplicate headings get '-1', '-2', ... suffixes.
function githubSlug(headingText) {
  const stripped = headingText
    .replace(/!?\[([^\]]*)\]\([^)]*\)/g, '$1') // links/images -> text
    .replace(/`+([^`]*)`+/g, '$1') // inline code
    .replace(/(\*\*|__)(.*?)\1/g, '$2') // bold
    .replace(/(\*|_)(.*?)\1/g, '$2') // italic
    .replace(/~~(.*?)~~/g, '$1'); // strikethrough
  return stripped
    .toLowerCase()
    .trim()
    .replace(/[^\p{L}\p{N}\s-]/gu, '')
    .replace(/\s+/g, '-');
}

const headingSlugCache = new Map();

function headingSlugsFor(filePath) {
  if (headingSlugCache.has(filePath)) return headingSlugCache.get(filePath);
  const slugs = new Set();
  if (fs.existsSync(filePath) && fs.statSync(filePath).isFile()) {
    const text = stripCodeBlocks(fs.readFileSync(filePath, 'utf8'));
    const counts = new Map();
    const headingPattern = /^#{1,6}\s+(.+?)\s*#*\s*$/gm;
    let match;
    while ((match = headingPattern.exec(text)) !== null) {
      const base = githubSlug(match[1]);
      const count = counts.get(base) || 0;
      counts.set(base, count + 1);
      slugs.add(count === 0 ? base : `${base}-${count}`);
    }
  }
  headingSlugCache.set(filePath, slugs);
  return slugs;
}

function checkAnchor(sourcePath, line, rawTarget, targetFile, fragment) {
  if (!fragment) return;
  const decoded = decodeURIComponent(fragment).toLowerCase();
  if (!headingSlugsFor(targetFile).has(decoded)) {
    const message = `${repoPath(sourcePath)}:${line} anchor not found in ${repoPath(targetFile)}: ${rawTarget}`;
    (strictAnchors ? errors : warnings).push(message);
  }
}

function checkLinks(filePath, text) {
  const content = stripCodeBlocks(text);
  const linkPattern = /!?\[[^\]\n]*\]\(([^)\n]+)\)/g;
  let match;

  while ((match = linkPattern.exec(content)) !== null) {
    const rawTarget = match[1];
    const { file: target, fragment } = normalizeMarkdownTarget(rawTarget);
    const line = lineNumberAt(content, match.index);

    if (!target && fragment !== null) {
      checkAnchor(filePath, line, rawTarget, filePath, fragment);
      continue;
    }
    if (!target || isExternalTarget(target)) continue;

    const source = repoPath(filePath);

    if (target.toLowerCase().endsWith('.html')) {
      const resolved = path.resolve(path.dirname(filePath), target);
      if (resolved.startsWith(root + path.sep)) {
        errors.push(`${source}:${line} links to repository HTML file: ${rawTarget}`);
      }
    }

    const resolvedTarget = path.resolve(path.dirname(filePath), target);
    if (!resolvedTarget.startsWith(root + path.sep) && resolvedTarget !== root) {
      continue;
    }

    if (!fs.existsSync(resolvedTarget)) {
      errors.push(`${source}:${line} broken Markdown link: ${rawTarget}`);
    } else if (fragment !== null && target.toLowerCase().endsWith('.md')) {
      checkAnchor(filePath, line, rawTarget, resolvedTarget, fragment);
    }
  }
}

// plan/ 写作红线扫描(G1 技术词 + G2 阶段词)。命中即报错。
// knownAllowed: 现有 plan 正文已存在、经人工甄别豁免的词;新增豁免需主会话裁决。
const planTechPattern = /\b(?:Tauri|Next\.js|React|SQLite|sqlite|Drizzle|TipTap|ProseMirror|XState|DeepSeek|pnpm|API|JSON|SQL|Markdown|embedding|frontmatter|LLM|token)\b/g;
const planStagePattern = /(?:\bMVP\b|一期|二期|三期|\bphase\b|\broadmap\b|\bW\d+\b|暂不|后续补|简化版)/g;
const knownAllowed = [
  // 暂无豁免;若 plan 正文出现需保留的产品词,经主会话裁决后加 'word' 到这里。
];

function checkPlanForbiddenWords(filePath, text) {
  const source = repoPath(filePath);
  if (!source.startsWith('plan/')) return;
  const content = stripCodeBlocks(text);
  for (const pattern of [planTechPattern, planStagePattern]) {
    pattern.lastIndex = 0;
    let match;
    while ((match = pattern.exec(content)) !== null) {
      if (knownAllowed.includes(match[0])) continue;
      errors.push(`${source}:${lineNumberAt(content, match.index)} plan forbidden word: ${match[0]}`);
    }
  }
}

// 章程一致性:AGENTS.md 与 CLAUDE.md 必须逐字节一致。
function checkCharterConsistency() {
  const agents = path.join(root, 'AGENTS.md');
  const claude = path.join(root, 'CLAUDE.md');
  if (!fs.existsSync(agents) || !fs.existsSync(claude)) {
    errors.push('AGENTS.md / CLAUDE.md missing: both charter files must exist');
    return;
  }
  if (!fs.readFileSync(agents).equals(fs.readFileSync(claude))) {
    errors.push('AGENTS.md and CLAUDE.md differ: charter files must be byte-identical');
  }
}

// 原型硬编码色:design/prototypes/*.html 中出现 6 位 hex 颜色记 warning(tokens.css 除外)。
function checkPrototypeHardcodedColors() {
  const dir = path.join(root, 'design', 'prototypes');
  if (!fs.existsSync(dir)) return;
  for (const name of fs.readdirSync(dir).sort()) {
    if (!name.endsWith('.html')) continue;
    const filePath = path.join(dir, name);
    const text = fs.readFileSync(filePath, 'utf8');
    const hexPattern = /#[0-9A-Fa-f]{6}\b/g;
    let match;
    const lines = [];
    while ((match = hexPattern.exec(text)) !== null) {
      lines.push(`${lineNumberAt(text, match.index)} (${match[0]})`);
    }
    if (lines.length > 0) {
      warnings.push(`${repoPath(filePath)}: ${lines.length} hardcoded hex color(s) at line(s) ${lines.join(', ')}`);
    }
  }
}

function recordUnique(idMap, id, filePath, text, index) {
  const location = `${repoPath(filePath)}:${lineNumberAt(text, index)}`;
  if (!idMap.has(id)) {
    idMap.set(id, []);
  }
  idMap.get(id).push(location);
}

function checkUniqueIds(markdownFiles) {
  const todoIds = new Map();
  const guardrailIds = new Map();

  for (const filePath of markdownFiles) {
    const text = fs.readFileSync(filePath, 'utf8');
    let match;

    const source = repoPath(filePath);
    const todoPattern = source === 'TODO.md'
      ? /^\|\s*(TODO-P\d+-\d+)\s*\|/gm
      : /^#+\s*(TODO-P\d+-\d+)\b/gm;
    while ((match = todoPattern.exec(text)) !== null) {
      recordUnique(todoIds, match[1], filePath, text, match.index, 'TODO');
    }

    if (source === 'plan/03-guardrails.md') {
      const guardrailPattern = /^\*\*(R\d+)\s*·/gm;
      while ((match = guardrailPattern.exec(text)) !== null) {
        recordUnique(guardrailIds, match[1], filePath, text, match.index, 'guardrail');
      }
    }
  }

  for (const [id, locations] of todoIds.entries()) {
    if (locations.length > 1) {
      errors.push(`${id} is declared more than once: ${locations.join(', ')}`);
    }
  }

  for (const [id, locations] of guardrailIds.entries()) {
    if (locations.length > 1) {
      errors.push(`${id} guardrail is declared more than once: ${locations.join(', ')}`);
    }
  }
}

function main() {
  const markdownFiles = walk(root).sort();

  for (const filePath of markdownFiles) {
    const text = fs.readFileSync(filePath, 'utf8');
    checkLinks(filePath, text);
    checkPlanForbiddenWords(filePath, text);
  }
  checkUniqueIds(markdownFiles);
  checkCharterConsistency();
  checkPrototypeHardcodedColors();

  if (warnings.length > 0) {
    console.log(`docs lint warnings (${warnings.length}):`);
    for (const warning of warnings) {
      console.log(`- ${warning}`);
    }
  }

  if (errors.length > 0) {
    console.error('docs lint failed:');
    for (const error of errors) {
      console.error(`- ${error}`);
    }
    process.exit(1);
  }

  console.log(`docs lint passed: ${markdownFiles.length} Markdown files checked`);
}

main();
