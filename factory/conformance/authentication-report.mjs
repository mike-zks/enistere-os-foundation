#!/usr/bin/env node

import { resolve } from 'node:path';
import process from 'node:process';
import { writeAuthenticationProductReport } from './capability-product.mjs';

const output = process.argv[2] ? resolve(process.argv[2]) : undefined;
const report = await writeAuthenticationProductReport(output);

for (const [target, result] of Object.entries(report.targets)) {
  console.log(`${target.padEnd(13)} ${result.status.padEnd(15)} invariants=${result.invariants.length} proofs=${result.proofCount ?? 0}`);
  for (const issue of result.issues) console.log(`  - ${issue}`);
}
console.log(`Authentication ${report.contract.version}: ${report.status}`);
process.exit(report.status === 'CONFORMANT' ? 0 : 1);
