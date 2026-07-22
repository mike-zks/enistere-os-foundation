#!/usr/bin/env node
/**
 * fitness-functions.mjs — Factory Quality : gouvernance exécutable (Contrat 5 du socle).
 *
 * Architecture fitness functions: cross-registry invariants that keep the socle
 * honest for good. They run over the REAL registries (topologies, target
 * adapters, capability and starter manifests, profiles) and fail if any
 * structural promise is broken. Generalizes the checks previously scattered
 * across the test suite into one runnable gate.
 *
 * Usage: node factory/quality/scripts/fitness-functions.mjs
 * Exits non-zero with a JSON report when a fitness function fails.
 *
 * Aucune dépendance externe. Compatible Node 24.
 */

import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import process from 'node:process';
import { loadStarterManifests, validateManifestConsistency, STARTER_IDS } from '../../engine/starters.mjs';
import { loadCapabilityManifests, CAPABILITY_IDS } from '../../engine/capabilities.mjs';
import { getTargetAdapter } from '../../engine/target-adapters.mjs';
import { APPLICATION_KINDS, GENERATABLE_KINDS, MANDATORY_KIND, isGeneratableKind } from '../../engine/topologies.mjs';
import { validateProfileRegistry } from '../../engine/profiles.mjs';

export const REPO_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '../../..');

/**
 * Runs the fitness functions against the given registries. Returns
 * `{ passed, findings }`; each finding is `{ rule, detail }`.
 */
export function runFitnessFunctions({ starters, capabilities }) {
  const findings = [];
  const fail = (rule, detail) => findings.push({ rule, detail });

  // FF1 — the API invariant is enforceable: the mandatory kind is generatable.
  if (!isGeneratableKind(MANDATORY_KIND)) fail('api-invariant', `${MANDATORY_KIND} must be a generatable kind`);

  // FF2 — every generatable kind's runtimes are backed by a registered adapter,
  // and every adapter runtime is a known starter (no orphan target).
  for (const kind of GENERATABLE_KINDS) {
    for (const runtime of APPLICATION_KINDS[kind].runtimes) {
      if (!STARTER_IDS.includes(runtime)) fail('kind-runtime-coverage', `kind ${kind} runtime ${runtime} is not a registered starter`);
      if (!getTargetAdapter(runtime)) fail('kind-adapter-coverage', `kind ${kind} runtime ${runtime} has no target adapter`);
    }
  }

  // FF3 — the capability graph is closed and non-contradictory: every requirement
  // is a known capability, and nothing is both required and conflicting.
  const knownCapability = (id) => CAPABILITY_IDS.includes(id) || capabilities.some((cap) => cap.id === id);
  for (const cap of capabilities) {
    for (const req of cap.requires ?? []) if (!knownCapability(req)) fail('capability-closure', `${cap.id} requires unknown capability ${req}`);
    for (const conflict of cap.conflicts ?? []) {
      if ((cap.requires ?? []).includes(conflict)) fail('capability-contradiction', `${cap.id} both requires and conflicts ${conflict}`);
    }
  }

  // FF4 — starter and capability manifests agree on per-target support.
  for (const issue of validateManifestConsistency(starters, capabilities)) fail('manifest-consistency', issue);

  // FF5 — the profile registry is truthful: no `ready` without a golden and an
  // exact composition, no status the real matrix does not support.
  for (const issue of validateProfileRegistry(capabilities, starters)) fail('profile-truthfulness', issue);

  return { passed: findings.length === 0, findings };
}

async function main() {
  const starters = await loadStarterManifests(REPO_ROOT);
  const capabilities = await loadCapabilityManifests(REPO_ROOT);
  const report = runFitnessFunctions({ starters, capabilities });
  console.log(JSON.stringify(report, null, 2));
  if (!report.passed) process.exitCode = 1;
}

if (process.argv[1] && import.meta.url === `file://${process.argv[1]}`) {
  main().catch((error) => { console.error(error.message); process.exitCode = 1; });
}
