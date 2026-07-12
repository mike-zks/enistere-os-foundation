import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';

import { checkDocLinks, extractMarkdownLinks, isExternalLink } from './check-doc-links.mjs';

function makeTempRepo() {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'enistere-doc-links-'));
}

test('extractMarkdownLinks ignores fenced code blocks', () => {
  const links = extractMarkdownLinks([
    '[valid](./target.md)',
    '```md',
    '[ignored](./missing.md)',
    '```',
  ].join('\n'));

  assert.deepEqual(links, ['./target.md']);
});

test('isExternalLink detects links that should not be checked locally', () => {
  assert.equal(isExternalLink('https://example.com'), true);
  assert.equal(isExternalLink('mailto:hello@example.com'), true);
  assert.equal(isExternalLink('./local.md'), false);
});

test('checkDocLinks reports missing relative markdown targets', () => {
  const root = makeTempRepo();
  fs.mkdirSync(path.join(root, 'docs'), { recursive: true });
  fs.writeFileSync(path.join(root, 'docs', 'README.md'), [
    '[ok](./existing.md)',
    '[missing](./missing.md)',
    '[external](https://example.com)',
    '[anchor](#section)',
  ].join('\n'));
  fs.writeFileSync(path.join(root, 'docs', 'existing.md'), '# Existing\n');

  const result = checkDocLinks(root, ['docs']);

  assert.equal(result.checkedFiles.length, 2);
  assert.deepEqual(result.brokenLinks, [{
    source: 'docs/README.md',
    href: './missing.md',
    target: 'docs/missing.md',
  }]);
});

test('checkDocLinks accepts directory targets', () => {
  const root = makeTempRepo();
  fs.mkdirSync(path.join(root, 'docs', 'adr'), { recursive: true });
  fs.writeFileSync(path.join(root, 'docs', 'README.md'), '[ADR](./adr/)\n');

  const result = checkDocLinks(root, ['docs']);

  assert.equal(result.brokenLinks.length, 0);
});
