#!/usr/bin/env node

import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import process from 'node:process';
import { buildConformance, STATUS } from './platform-contract.mjs';

const MODULE_DIR = dirname(fileURLToPath(import.meta.url));
const DEFAULT_ROOT = resolve(MODULE_DIR, '../..');
const DEFAULT_OUTPUT = join(MODULE_DIR, 'reports', 'platform-baseline-v2-gap.json');
const RUNTIMES = Object.freeze(['nestjs', 'spring', 'fastapi', 'nextjs', 'angular', 'react-native', 'flutter']);

function starterSource(repoRoot, manifest) {
  return resolve(repoRoot, `starters/${manifest.id}`);
}

export function buildRepositoryGap(repoRoot = DEFAULT_ROOT) {
  const manifests = RUNTIMES.map((runtime) =>
    JSON.parse(readFileSync(join(repoRoot, 'starters', runtime, 'starter.manifest.json'), 'utf8')));
  const projectDir = repoRoot;
  const applications = manifests.map((manifest) => ({
    id: manifest.id,
    kind: manifest.kind,
    runtime: manifest.id,
    baseline: { ...manifest.baseline },
    appDir: starterSource(repoRoot, manifest).slice(repoRoot.length + 1),
  }));
  const report = buildConformance({
    plan: {
      applications,
      systemDigest: 'repository-scan',
      resolutionDigest: 'repository-scan',
      planDigest: 'repository-scan',
    },
    projectDir,
  });
  const summary = Object.fromEntries(report.apps.map((app) => {
    const results = [
      ...Object.values(app.baseline.invariants),
      ...Object.values(app.familyContract.invariants),
    ];
    return [app.runtime, {
      compliant: results.filter((entry) => entry.status === STATUS.COMPLIANT).length,
      partial: results.filter((entry) => entry.status === STATUS.PARTIAL).length,
      missing: results.filter((entry) => entry.status === STATUS.MISSING || entry.status === STATUS.NON_CONFORMANT).length,
      conformant: results.every((entry) => entry.status === STATUS.COMPLIANT),
    }];
  }));
  return { ...report, scan: { kind: 'repository-runtime-baseline', runtimes: RUNTIMES }, summary };
}

export function writeRepositoryGap(output = DEFAULT_OUTPUT, repoRoot = DEFAULT_ROOT) {
  const report = buildRepositoryGap(repoRoot);
  mkdirSync(dirname(output), { recursive: true });
  writeFileSync(output, `${JSON.stringify(report, null, 2)}\n`);
  return report;
}

if (process.argv[1] && import.meta.url === `file://${process.argv[1]}`) {
  const output = resolve(process.argv[2] ?? DEFAULT_OUTPUT);
  const report = writeRepositoryGap(output);
  for (const [runtime, summary] of Object.entries(report.summary)) {
    console.log(`${runtime.padEnd(13)} compliant=${summary.compliant} partial=${summary.partial} missing=${summary.missing} conformant=${summary.conformant}`);
  }
  console.log(`Wrote ${output}`);
}
