#!/usr/bin/env node
/**
 * Emits the computed capability product conformance reports.
 *
 * Usage: node factory/conformance/capability-report.mjs [capability ...]
 *
 * With no argument, every capability owning a product contract is evaluated.
 * Exits non-zero as soon as one capability is not conformant.
 */

import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import process from 'node:process';
import { writeCapabilityProductReports } from './capability-product.mjs';

const GAPS_PATH = join(
  dirname(fileURLToPath(import.meta.url)), '..', 'quality', 'parity-gaps.json',
);

/**
 * Family-parity gaps that are declared, justified and dated (ADR-074).
 *
 * A declared gap is reported loudly but does not fail the pipeline: it is known
 * architectural debt carried by an ADR and the roadmap, not a regression of this
 * build. Anything else fails — including a gap wider than declared, or one whose
 * deadline has passed. Debt that nobody re-reads is indistinguishable from a
 * defect nobody noticed.
 */
function loadDeclaredGaps(now = new Date()) {
  const { gaps } = JSON.parse(readFileSync(GAPS_PATH, 'utf8'));
  const byKey = new Map();
  const expired = [];
  for (const gap of gaps) {
    const deadline = new Date(`${gap.deadline}T23:59:59Z`);
    if (deadline < now) {
      expired.push(`${gap.capability}/${gap.runtime}: declared gap expired on ${gap.deadline}`);
    }
    byKey.set(`${gap.capability}/${gap.runtime}`, new Set(gap.missing));
  }
  return { byKey, expired };
}

const only = process.argv.slice(2);
const reports = await writeCapabilityProductReports(undefined, only.length > 0 ? only : undefined);

if (reports.length === 0) {
  console.error('no capability declares a product contract');
  process.exit(1);
}

for (const report of reports) {
  console.log(`\n${report.capability} — ${report.contract.id} ${report.contract.version}`);
  for (const [target, result] of Object.entries(report.targets)) {
    console.log(
      `  ${target.padEnd(13)} ${result.status.padEnd(15)}`
      + ` resp=${(result.coverage ?? '-').padEnd(5)}`
      + ` invariants=${result.invariants.length} proofs=${result.proofCount ?? 0}`,
    );
    for (const issue of result.issues) console.log(`    - ${issue}`);
  }
  console.log(`  → ${report.status}`);
}

const { byKey, expired } = loadDeclaredGaps();
const blocking = [...expired];

for (const report of reports) {
  for (const [runtime, result] of Object.entries(report.targets)) {
    if (result.familyParity?.status !== 'BREACH') continue;
    const declared = byKey.get(`${report.capability}/${runtime}`);
    if (!declared) {
      blocking.push(`${report.capability}/${runtime}: undeclared family-parity breach`);
      continue;
    }
    const undeclared = result.familyParity.missing.filter((item) => !declared.has(item));
    if (undeclared.length > 0) {
      blocking.push(
        `${report.capability}/${runtime}: breach wider than declared (${undeclared.join(', ')})`,
      );
    }
  }
  for (const [runtime, result] of Object.entries(report.targets)) {
    const proofIssues = result.issues.filter((issue) => !issue.startsWith('family parity:'));
    if (proofIssues.length > 0) {
      blocking.push(`${report.capability}/${runtime}: ${proofIssues.join('; ')}`);
    }
  }
}

const declaredCount = [...byKey.keys()].length;
console.log(`\n${declaredCount} écart(s) de parité déclaré(s) et daté(s) — voir factory/quality/parity-gaps.json`);

if (blocking.length > 0) {
  console.error('\n✗ Conformité produit :');
  for (const issue of blocking) console.error(`  - ${issue}`);
  process.exit(1);
}
console.log('✓ Aucune preuve manquante ; aucun écart de parité non déclaré.');
process.exit(0);
