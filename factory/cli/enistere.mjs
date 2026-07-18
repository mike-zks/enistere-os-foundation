#!/usr/bin/env node
import { spawnSync } from 'node:child_process';
import { mkdir, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import process from 'node:process';
import { assertBlueprint, createDefaultBlueprint, readBlueprint } from '../engine/blueprint.mjs';
import { buildGenerationPlan } from '../engine/plan.mjs';
import { generateProject } from '../engine/generator.mjs';
import { assessCapabilitySupport, buildCapabilityMatrix, loadCapabilityManifests } from '../engine/capabilities.mjs';
import { loadStarterManifests, modularStarterIds, selectedStarterIds, validateManifestConsistency } from '../engine/starters.mjs';

const FOUNDATION_ROOT = resolve(import.meta.dirname, '../..');

function help() {
  console.log('Usage: enistere <doctor|init|plan|generate|verify> [arguments]');
}

function probe(command) {
  const result = spawnSync(command, ['--version'], { encoding: 'utf8', shell: false, timeout: 5000 });
  return { available: result.status === 0, version: result.status === 0 ? (result.stdout || result.stderr).trim().split('\n')[0] : null };
}

async function main() {
  const [command, first, second] = process.argv.slice(2);
  if (command === 'doctor') {
    const starters = await loadStarterManifests(FOUNDATION_ROOT);
    const capabilities = await loadCapabilityManifests(FOUNDATION_ROOT);
    const consistencyIssues = validateManifestConsistency(starters, capabilities);
    console.log(JSON.stringify({
      node: process.version,
      git: probe('git'),
      agents: { codex: probe('codex'), claude: probe('claude'), gemini: probe('gemini') },
      capabilityMatrix: buildCapabilityMatrix(capabilities),
      manifestsConsistent: consistencyIssues.length === 0,
      consistencyIssues,
    }, null, 2));
    return;
  }
  if (command === 'init') {
    const target = resolve(first ?? 'enistere.yaml');
    await mkdir(resolve(target, '..'), { recursive: true });
    await writeFile(target, `${JSON.stringify(createDefaultBlueprint(second ?? 'enistere-app'), null, 2)}\n`, { flag: 'wx' });
    console.log(target);
    return;
  }
  if (['plan', 'generate', 'verify'].includes(command)) {
    if (!first) throw new Error(`${command} requires a blueprint path`);
    const blueprint = assertBlueprint(await readBlueprint(resolve(first)));
    const starters = await loadStarterManifests(FOUNDATION_ROOT);
    const plan = buildGenerationPlan(blueprint, { modularStarters: modularStarterIds(starters) });
    const capabilities = await loadCapabilityManifests(FOUNDATION_ROOT, blueprint.capabilities);
    const support = assessCapabilitySupport(selectedStarterIds(blueprint), capabilities);
    if (command === 'verify') {
      console.log(JSON.stringify({ valid: support.ready, project: blueprint.project.slug, capabilitySupport: support }, null, 2));
      if (!support.ready) process.exitCode = 1;
      return;
    }
    if (command === 'plan') { console.log(JSON.stringify({ ...plan, capabilitySupport: support }, null, 2)); return; }
    if (!second) throw new Error('generate requires an output directory');
    await generateProject(blueprint, resolve(second));
    console.log(JSON.stringify(plan, null, 2));
    return;
  }
  help();
  if (command) process.exitCode = 1;
}

main().catch((error) => { console.error(error.message); process.exitCode = 1; });
