#!/usr/bin/env node
/**
 * Enforces the discipline of the secret-scanning allowlist (ADR-073).
 *
 * gitleaks happily accepts an allowlist entry with no explanation, which is how
 * a scanner quietly becomes decorative: someone silences a finding, nobody ever
 * revisits it. This gate refuses that — every entry must say why it exists, and
 * a temporary exception must carry an unexpired deadline.
 *
 * `permanent` is deliberately available: forcing a yearly review on a redaction
 * test fixture would be busywork that proves nothing. It just has to be claimed
 * explicitly, with a reason.
 *
 * Usage: node factory/quality/scripts/secret-allowlist-check.mjs [config]
 */

import { readFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import process from 'node:process';

const DEFAULT_CONFIG = join(
  dirname(fileURLToPath(import.meta.url)), '..', '..', '..', '.gitleaks.toml',
);

const DESCRIPTION = /^\s*description\s*=\s*"((?:[^"\\]|\\.)*)"/;
const PERMANENT = /\|\s*permanent\s*:\s*(\S.*)$/;
const EXPIRES = /\|\s*expires\s*:\s*(\d{4}-\d{2}-\d{2})\s*$/;

/**
 * Reads allowlist descriptions without a TOML parser: the engine takes no
 * runtime dependency (ADR-072), and the shape checked here is one line.
 */
export function readAllowlistDescriptions(toml) {
  const entries = [];
  let inAllowlist = false;
  for (const [index, line] of toml.split('\n').entries()) {
    const trimmed = line.trim();
    if (trimmed.startsWith('#')) continue;
    if (trimmed.startsWith('[[allowlists]]') || trimmed === '[allowlist]') {
      inAllowlist = true;
      entries.push({ line: index + 1, description: null });
      continue;
    }
    if (trimmed.startsWith('[') && !trimmed.startsWith('[[allowlists]]') && trimmed !== '[allowlist]') {
      inAllowlist = false;
      continue;
    }
    if (!inAllowlist) continue;
    const match = DESCRIPTION.exec(line);
    if (match && entries.length > 0 && entries.at(-1).description === null) {
      entries.at(-1).description = match[1];
    }
  }
  return entries;
}

export function evaluateAllowlist(toml, { now = new Date() } = {}) {
  const entries = readAllowlistDescriptions(toml);
  const violations = [];

  if (entries.length === 0) {
    return { entries: [], violations: [] };
  }

  for (const entry of entries) {
    const where = `allowlist at line ${entry.line}`;
    if (!entry.description) {
      violations.push(`${where}: no description — an unexplained exception is a silent disable`);
      continue;
    }
    const permanent = PERMANENT.exec(entry.description);
    const expires = EXPIRES.exec(entry.description);
    if (!permanent && !expires) {
      violations.push(
        `${where}: description must end with "| permanent: <reason>" or "| expires: YYYY-MM-DD"`,
      );
      continue;
    }
    const justification = entry.description.split('|')[0].trim();
    if (justification.length < 20) {
      violations.push(`${where}: justification is too short to be reviewable`);
    }
    if (expires) {
      const deadline = new Date(`${expires[1]}T23:59:59Z`);
      if (Number.isNaN(deadline.getTime())) {
        violations.push(`${where}: invalid expiry date ${expires[1]}`);
      } else if (deadline < now) {
        violations.push(`${where}: exception expired on ${expires[1]} — rotate the secret or renew deliberately`);
      }
    }
  }
  return { entries, violations };
}

if (process.argv[1] && import.meta.url === `file://${process.argv[1]}`) {
  const configPath = resolve(process.argv[2] ?? DEFAULT_CONFIG);
  const { entries, violations } = evaluateAllowlist(readFileSync(configPath, 'utf8'));

  for (const entry of entries) {
    const label = entry.description?.slice(0, 88) ?? '(sans description)';
    console.log(`  line ${String(entry.line).padStart(3)}  ${label}`);
  }
  if (violations.length > 0) {
    console.error('\n✗ Allowlist de secrets non conforme :');
    for (const violation of violations) console.error(`  - ${violation}`);
    process.exit(1);
  }
  console.log(`\n✓ ${entries.length} exception(s) justifiée(s) et non expirée(s).`);
}
