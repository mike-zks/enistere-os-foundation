#!/usr/bin/env node
/**
 * Emits the computed capability product conformance reports.
 *
 * Usage: node factory/conformance/capability-report.mjs [capability ...]
 *
 * With no argument, every capability owning a product contract is evaluated.
 * Exits non-zero as soon as one capability is not conformant.
 */

import process from 'node:process';
import { writeCapabilityProductReports } from './capability-product.mjs';

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
      + ` invariants=${result.invariants.length} proofs=${result.proofCount ?? 0}`,
    );
    for (const issue of result.issues) console.log(`    - ${issue}`);
  }
  console.log(`  → ${report.status}`);
}

const failed = reports.filter((report) => report.status !== 'CONFORMANT');
console.log(`\n${reports.length - failed.length}/${reports.length} capabilities CONFORMANT`);
process.exit(failed.length === 0 ? 0 : 1);
