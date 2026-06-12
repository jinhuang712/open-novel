#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const ignoredDirs = new Set(['.git', '.next', 'node_modules', 'dist', 'build', 'coverage', 'vendor']);
const errors = [];

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
  const withoutHash = hashIndex >= 0 ? cleaned.slice(0, hashIndex) : cleaned;
  const queryIndex = withoutHash.indexOf('?');
  return queryIndex >= 0 ? withoutHash.slice(0, queryIndex) : withoutHash;
}

function checkLinks(filePath, text) {
  const content = stripCodeBlocks(text);
  const linkPattern = /!?\[[^\]\n]*\]\(([^)\n]+)\)/g;
  let match;

  while ((match = linkPattern.exec(content)) !== null) {
    const rawTarget = match[1];
    const target = normalizeMarkdownTarget(rawTarget);
    if (!target || isExternalTarget(target)) continue;

    const source = repoPath(filePath);
    const line = lineNumberAt(content, match.index);

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
    checkLinks(filePath, fs.readFileSync(filePath, 'utf8'));
  }
  checkUniqueIds(markdownFiles);

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
