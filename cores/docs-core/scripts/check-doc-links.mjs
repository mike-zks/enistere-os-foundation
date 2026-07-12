#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';

const DEFAULT_TARGETS = ['README.md', 'docs', 'cores/docs-core', 'prompts/README.md'];
const MARKDOWN_EXTENSIONS = new Set(['.md', '.mdx']);

export function isExternalLink(href) {
  return /^(https?:|mailto:|tel:|ftp:|data:)/i.test(href);
}

export function stripCodeFences(markdown) {
  return markdown
    .split('\n')
    .map((line) => {
      if (/^\s*(```|~~~)/.test(line)) {
        stripCodeFences.inFence = !stripCodeFences.inFence;
        return '';
      }

      return stripCodeFences.inFence ? '' : line;
    })
    .join('\n');
}

export function extractMarkdownLinks(markdown) {
  stripCodeFences.inFence = false;
  const body = stripCodeFences(markdown);
  const links = [];
  const inlineLinkPattern = /!?\[[^\]\n]*\]\(([^)\s]+)(?:\s+"[^"]*")?\)/g;
  let match;

  while ((match = inlineLinkPattern.exec(body)) !== null) {
    const href = match[1]?.trim();
    if (href) {
      links.push(href.replace(/^<|>$/g, ''));
    }
  }

  return links;
}

export function listMarkdownFiles(root, targets = DEFAULT_TARGETS) {
  const files = [];

  for (const target of targets) {
    const absolute = path.resolve(root, target);
    if (!fs.existsSync(absolute)) {
      continue;
    }

    const stat = fs.statSync(absolute);
    if (stat.isFile() && MARKDOWN_EXTENSIONS.has(path.extname(absolute))) {
      files.push(absolute);
      continue;
    }

    if (!stat.isDirectory()) {
      continue;
    }

    const stack = [absolute];
    while (stack.length > 0) {
      const current = stack.pop();
      const entries = fs.readdirSync(current, { withFileTypes: true });

      for (const entry of entries) {
        const entryPath = path.join(current, entry.name);
        if (entry.isDirectory()) {
          if (entry.name === 'node_modules' || entry.name === '.git') {
            continue;
          }
          stack.push(entryPath);
        } else if (entry.isFile() && MARKDOWN_EXTENSIONS.has(path.extname(entry.name))) {
          files.push(entryPath);
        }
      }
    }
  }

  return [...new Set(files)].sort();
}

export function resolveInternalLink(sourceFile, href) {
  const [rawPath] = href.split('#');

  if (!rawPath || rawPath.startsWith('#') || isExternalLink(rawPath)) {
    return null;
  }

  try {
    return decodeURIComponent(rawPath);
  } catch {
    return rawPath;
  }
}

export function checkDocLinks(root = process.cwd(), targets = DEFAULT_TARGETS) {
  const files = listMarkdownFiles(root, targets);
  const brokenLinks = [];

  for (const file of files) {
    const markdown = fs.readFileSync(file, 'utf8');
    const links = extractMarkdownLinks(markdown);

    for (const href of links) {
      if (isExternalLink(href) || href.startsWith('#')) {
        continue;
      }

      const internalPath = resolveInternalLink(file, href);
      if (!internalPath) {
        continue;
      }

      const absoluteTarget = path.resolve(path.dirname(file), internalPath);
      if (!fs.existsSync(absoluteTarget)) {
        brokenLinks.push({
          source: path.relative(root, file),
          href,
          target: path.relative(root, absoluteTarget),
        });
      }
    }
  }

  return { checkedFiles: files.map((file) => path.relative(root, file)), brokenLinks };
}

function runCli() {
  const root = process.cwd();
  const targets = process.argv.slice(2);
  const result = checkDocLinks(root, targets.length > 0 ? targets : DEFAULT_TARGETS);

  if (result.brokenLinks.length === 0) {
    console.log(`Docs Core link check passed (${result.checkedFiles.length} files).`);
    return 0;
  }

  console.error(`Docs Core link check failed (${result.brokenLinks.length} broken links).`);
  for (const link of result.brokenLinks) {
    console.error(`- ${link.source}: ${link.href} -> ${link.target}`);
  }
  return 1;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  process.exitCode = runCli();
}
