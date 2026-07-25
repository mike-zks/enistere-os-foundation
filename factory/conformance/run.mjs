#!/usr/bin/env node
/**
 * Emits the computed Platform Baseline v2 conformance record (ADR-057).
 *
 * Usage: node factory/conformance/run.mjs <projectDir>
 *
 * Reads the GenerationPlan from the project's `enistere.lock`, evaluates every
 * supported family (API, Web, Mobile) against Common + family v2 and writes
 * `enistere.conformance.json`. The record is informational (measurement): it never
 * mutates the project's code and exits 0 — the golden gates and fitness functions
 * enforce; this records.
 */

import { readFileSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import process from 'node:process';
import { buildConformance, STATUS } from './platform-contract.mjs';

/** Builds and writes `enistere.conformance.json`; returns the report. */
export function writeConformance(projectDir) {
  const lock = JSON.parse(readFileSync(join(projectDir, 'enistere.lock'), 'utf8'));
  if (!lock.plan) throw new Error('enistere.lock has no plan — not a generated Enistere project');
  const report = buildConformance({ plan: lock.plan, projectDir });
  writeFileSync(join(projectDir, 'enistere.conformance.json'), `${JSON.stringify(report, null, 2)}\n`);
  return report;
}

/** One-line-per-invariant summary for the terminal. */
export function formatSummary(report) {
  const lines = [`Platform Baseline ${report.contract.version} (${report.families.join(', ')}) — evaluation: ${report.evaluation}`];
  for (const app of report.apps) {
    lines.push(`\n  ${app.id} [${app.family}/${app.runtime}] — level: ${app.level}`);
    for (const [scope, contract] of [['baseline', app.baseline], [app.family, app.familyContract]]) {
      lines.push(`    ${scope} (${contract.contractVersion})`);
      for (const [invariant, r] of Object.entries(contract.invariants)) {
        const mark = r.status === STATUS.COMPLIANT ? '✓' : r.status === STATUS.NON_CONFORMANT ? '✗' : r.status === STATUS.MISSING ? '·' : '~';
        lines.push(`      ${mark} ${invariant.padEnd(28)} ${r.status.padEnd(15)} ${r.evidence}`);
      }
    }
  }
  return lines.join('\n');
}

if (process.argv[1] && import.meta.url === `file://${process.argv[1]}`) {
  const projectDir = resolve(process.argv[2] ?? '');
  if (!process.argv[2]) { console.error('Usage: node factory/conformance/run.mjs <projectDir>'); process.exit(1); }
  const report = writeConformance(projectDir);
  console.log(formatSummary(report));
  console.log(`\nWrote ${join(projectDir, 'enistere.conformance.json')}`);
}
