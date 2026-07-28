import { readdir, readFile, writeFile } from 'node:fs/promises';
import { dirname, join, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

import { APPLICATION_KINDS } from '../engine/topologies.mjs';

const MODULE_DIR = dirname(fileURLToPath(import.meta.url));
const DEFAULT_ROOT = resolve(MODULE_DIR, '../..');
const CAPABILITIES_DIR = 'capabilities';
const REPORTS_DIR = 'factory/conformance/reports';

const TARGET_STATES = Object.freeze({
  ready: 'CONFORMANT',
  planned: 'PLANNED',
  unsupported: 'UNSUPPORTED',
  'not-applicable': 'NOT_APPLICABLE',
});

const CONTRACT_ID = /^[a-z][a-z0-9-]*-product$/;
const INVARIANT_ID = /^[A-Z][A-Z0-9]*-[A-Z]+-\d{3}$/;
const SEMVER = /^\d+\.\d+\.\d+$/;

function isObject(value) {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

async function readJson(path) {
  return JSON.parse(await readFile(path, 'utf8'));
}

function confined(root, relativePath) {
  const candidate = resolve(root, relativePath);
  if (candidate !== root && !candidate.startsWith(`${root}${sep}`)) {
    throw new Error(`path escapes its root: ${relativePath}`);
  }
  return candidate;
}

/**
 * Report path for a product contract: `authentication-product` →
 * `reports/authentication-v1.json`. Derived, never declared, so a capability
 * cannot point its report somewhere unexpected.
 */
function reportPathFor(contract) {
  const stem = contract.id.replace(/-product$/, '');
  const major = contract.version.split('.')[0];
  return join(REPORTS_DIR, `${stem}-v${major}.json`);
}

/**
 * Discovers every capability owning a product contract, by convention:
 * `capabilities/<id>/contracts/<name>.product.v<major>.json`. No central list —
 * adding a contract is enough to be measured.
 */
export async function discoverProductContracts(repoRoot = DEFAULT_ROOT) {
  const found = [];
  const capabilities = await readdir(join(repoRoot, CAPABILITIES_DIR), { withFileTypes: true });
  for (const entry of capabilities.filter((item) => item.isDirectory())) {
    let files;
    try {
      files = await readdir(join(repoRoot, CAPABILITIES_DIR, entry.name, 'contracts'));
    } catch {
      continue;
    }
    for (const file of files.filter((name) => /\.product\.v\d+\.json$/.test(name)).sort()) {
      found.push({
        capability: entry.name,
        path: join(CAPABILITIES_DIR, entry.name, 'contracts', file),
      });
    }
  }
  return found.sort((a, b) => a.capability.localeCompare(b.capability));
}

/**
 * Validates a product contract against the shared shape. The contract is
 * capability-agnostic: identity, roles and invariants are checked structurally,
 * and `capability` must match the directory that owns it.
 */
export function validateProductContract(contract, capability) {
  const issues = [];
  if (!isObject(contract)) return ['contract must be an object'];
  if (contract.schemaVersion !== '1') issues.push('schemaVersion must be 1');
  if (typeof contract.id !== 'string' || !CONTRACT_ID.test(contract.id)) {
    issues.push('id must match <name>-product');
  }
  if (typeof contract.version !== 'string' || !SEMVER.test(contract.version)) {
    issues.push('version must be semver');
  }
  if (typeof contract.capability !== 'string' || contract.capability === '') {
    issues.push('capability is required');
  } else if (capability !== undefined && contract.capability !== capability) {
    issues.push(`capability must be ${capability}`);
  }
  if (!Array.isArray(contract.roles) || contract.roles.length === 0) {
    issues.push('roles must be a non-empty array');
  }
  const roleIds = new Set(contract.roles ?? []);
  if (roleIds.size !== (contract.roles ?? []).length) issues.push('roles must be unique');
  if (!Array.isArray(contract.invariants) || contract.invariants.length === 0) {
    issues.push('invariants must be a non-empty array');
    return issues;
  }
  const invariantIds = new Set();
  for (const [index, invariant] of contract.invariants.entries()) {
    if (!isObject(invariant)) {
      issues.push(`invariants[${index}] must be an object`);
      continue;
    }
    if (!INVARIANT_ID.test(invariant.id ?? '')) {
      issues.push(`invariants[${index}].id is invalid`);
    }
    if (invariantIds.has(invariant.id)) issues.push(`duplicate invariant ${invariant.id}`);
    invariantIds.add(invariant.id);
    if (!Array.isArray(invariant.appliesTo) || invariant.appliesTo.length === 0) {
      issues.push(`${invariant.id}.appliesTo must be non-empty`);
    } else {
      for (const role of invariant.appliesTo) {
        if (!roleIds.has(role)) issues.push(`${invariant.id} references unknown role ${role}`);
      }
    }
    // Optional: when present, the invariant only binds targets that declare this
    // responsibility. That is what lets a partially-covering target be measured
    // on what it actually holds instead of failing on what it never claimed.
    if (invariant.responsibility !== undefined
      && (typeof invariant.responsibility !== 'string' || invariant.responsibility === '')) {
      issues.push(`${invariant.id}.responsibility must be a non-empty string`);
    }
    if (typeof invariant.requirement !== 'string' || invariant.requirement.trim() === '') {
      issues.push(`${invariant.id}.requirement is required`);
    }
  }
  return issues;
}

/** Runtime → family, from the canonical application-kind registry. */
const FAMILY_OF_RUNTIME = new Map(
  ['api', 'web', 'mobile'].flatMap(
    (family) => APPLICATION_KINDS[family].runtimes.map((runtime) => [runtime, family]),
  ),
);

/**
 * Family parity (mandate §8.4): runtimes of one family are interchangeable
 * implementations of the same product, so every ready target of a family must
 * hold the SAME responsibilities. A target alone in its family has nothing to
 * match and is unconstrained; two targets that diverge are a parity breach, not
 * a valid partial support.
 *
 * Returns, per target, the responsibilities its family holds but it does not.
 */
function familyParityGaps(manifest) {
  const byFamily = new Map();
  for (const [runtime, target] of Object.entries(manifest.targets)) {
    if (target.status !== 'ready') continue;
    const family = FAMILY_OF_RUNTIME.get(runtime);
    if (!family) continue;
    if (!byFamily.has(family)) byFamily.set(family, []);
    byFamily.get(family).push([runtime, new Set(target.responsibilities ?? [])]);
  }

  const gaps = new Map();
  for (const [family, members] of byFamily) {
    if (members.length < 2) continue;
    const expected = new Set(members.flatMap(([, held]) => [...held]));
    for (const [runtime, held] of members) {
      const missing = [...expected].filter((item) => !held.has(item)).sort();
      if (missing.length > 0) gaps.set(runtime, { family, missing });
    }
  }
  return gaps;
}

/**
 * Invariants a target must prove: those matching one of its roles AND, when the
 * invariant is scoped to a responsibility, only if the target declares holding
 * that responsibility. An unscoped invariant binds every target of the role.
 */
function applicableInvariants(contract, roles, responsibilities) {
  const selectedRoles = new Set(roles);
  const held = new Set(responsibilities ?? []);
  return contract.invariants
    .filter((invariant) => invariant.appliesTo.some((role) => selectedRoles.has(role)))
    .filter((invariant) => !invariant.responsibility || held.has(invariant.responsibility))
    .map((invariant) => invariant.id)
    .sort();
}

function validateEvidenceDescriptor(descriptor, manifest, contract) {
  const issues = [];
  if (!isObject(descriptor)) return ['evidence descriptor must be an object'];
  if (descriptor.schemaVersion !== '1') issues.push('schemaVersion must be 1');
  if (descriptor.capability !== manifest.id) issues.push('capability does not match manifest');
  if (descriptor.contract?.id !== contract.id || descriptor.contract?.version !== contract.version) {
    issues.push('contract identity/version does not match product contract');
  }
  if (!Array.isArray(descriptor.roles) || descriptor.roles.length === 0) {
    issues.push('roles must be non-empty');
  } else {
    for (const role of descriptor.roles) {
      if (!contract.roles.includes(role)) issues.push(`unknown role ${role}`);
    }
  }
  if (typeof descriptor.suite !== 'string' || descriptor.suite === '') issues.push('suite is required');
  if (typeof descriptor.golden !== 'string' || descriptor.golden === '') issues.push('golden is required');
  if (!isObject(descriptor.invariants)) issues.push('invariants must be an object');
  return issues;
}

async function validateProofs({
  repoRoot,
  capability,
  target,
  descriptor,
  projectDir,
  application,
}) {
  const issues = [];
  let proofCount = 0;
  for (const [invariantId, proofs] of Object.entries(descriptor.invariants ?? {})) {
    if (!Array.isArray(proofs) || proofs.length === 0) {
      issues.push(`${target}.${invariantId} must declare at least one proof`);
      continue;
    }
    for (const [index, proof] of proofs.entries()) {
      proofCount += 1;
      if (!isObject(proof) || !['test', 'source'].includes(proof.kind)) {
        issues.push(`${target}.${invariantId}[${index}] has an invalid kind`);
        continue;
      }
      if (proof.kind === 'test' && !/(test|spec)/i.test(proof.source ?? '')) {
        issues.push(`${target}.${invariantId}[${index}] test proof is not a test path`);
      }
      if (!Array.isArray(proof.contains) || proof.contains.length === 0) {
        issues.push(`${target}.${invariantId}[${index}] must declare content markers`);
        continue;
      }
      // A proof may live in another capability's overlay when the behaviour is
      // produced there (e.g. a shared security filter chain). `owner` makes that
      // explicit instead of letting a path silently escape the capability.
      const owner = proof.owner ?? capability;
      const sourceRoot = join(repoRoot, CAPABILITIES_DIR, owner, 'targets', target);
      const locations = [{
        label: 'source',
        path: confined(sourceRoot, proof.source ?? ''),
      }];
      if (projectDir && application) {
        locations.push({
          label: 'materialized',
          path: confined(join(projectDir, application.appDir), proof.materialized ?? ''),
        });
      }
      for (const location of locations) {
        let content;
        try {
          content = await readFile(location.path, 'utf8');
        } catch {
          issues.push(`${target}.${invariantId}[${index}] ${location.label} proof is missing`);
          continue;
        }
        for (const marker of proof.contains) {
          if (typeof marker !== 'string' || marker === '' || !content.includes(marker)) {
            issues.push(`${target}.${invariantId}[${index}] ${location.label} misses marker ${marker}`);
          }
        }
      }
    }
  }
  return { issues, proofCount };
}

/**
 * Evaluates one capability's neutral product contract against every manifest
 * target. A ready target reaches CONFORMANT only when its role-complete evidence
 * map is closed, references its declared suite and all proof payloads exist.
 *
 * `not-applicable` and `unsupported` are carried through as-is: a target with no
 * legitimate surface is never counted as conformant, and never as a gap either.
 *
 * When projectDir/plan are supplied, the same proof markers must also exist in
 * the materialized application. The golden driver calls this only after the
 * target's real test/build gates have passed.
 */
export async function evaluateCapabilityProduct({
  capability,
  contractPath,
  repoRoot = DEFAULT_ROOT,
  projectDir,
  plan,
} = {}) {
  let resolvedPath = contractPath;
  if (!resolvedPath) {
    const discovered = await discoverProductContracts(repoRoot);
    resolvedPath = discovered.find((item) => item.capability === capability)?.path;
    if (!resolvedPath) throw new Error(`no product contract for capability ${capability}`);
  }
  const contract = await readJson(join(repoRoot, resolvedPath));
  const manifest = await readJson(join(repoRoot, CAPABILITIES_DIR, capability, 'capability.json'));
  const contractIssues = validateProductContract(contract, capability);
  if (contractIssues.length > 0) {
    throw new Error(`invalid ${capability} product contract: ${contractIssues.join('; ')}`);
  }

  const applicationsByRuntime = new Map(
    (plan?.applications ?? []).map((application) => [application.runtime, application]),
  );
  const parityGaps = familyParityGaps(manifest);
  const targets = {};

  for (const [target, targetManifest] of Object.entries(manifest.targets)) {
    if (targetManifest.status !== 'ready') {
      targets[target] = {
        status: TARGET_STATES[targetManifest.status],
        manifestStatus: targetManifest.status,
        roles: [],
        responsibilities: [],
        coverage: `0/${(manifest.responsibilities ?? []).length}`,
        family: FAMILY_OF_RUNTIME.get(target) ?? null,
        familyParity: { status: 'OK' },
        invariants: [],
        proofCount: 0,
        materialized: false,
        issues: [],
      };
      continue;
    }

    const descriptorPath = join(
      repoRoot, CAPABILITIES_DIR, capability, 'targets', target, 'conformance.json',
    );
    let descriptor;
    const issues = [];
    try {
      descriptor = await readJson(descriptorPath);
    } catch {
      targets[target] = {
        status: 'NON_CONFORMANT',
        manifestStatus: 'ready',
        roles: [],
        // Declared coverage and parity still hold even without a descriptor: a
        // target that skips its evidence must not also hide its parity standing.
        responsibilities: [...(targetManifest.responsibilities ?? [])].sort(),
        coverage: `${(targetManifest.responsibilities ?? []).length}/${(manifest.responsibilities ?? []).length}`,
        family: FAMILY_OF_RUNTIME.get(target) ?? null,
        familyParity: parityGaps.has(target)
          ? { status: 'BREACH', missing: parityGaps.get(target).missing }
          : { status: 'OK' },
        invariants: [],
        proofCount: 0,
        materialized: false,
        // A missing descriptor does not hide a parity breach: both are reported,
        // so fixing one does not surface the other as a surprise.
        issues: parityGaps.has(target)
          ? [
            'conformance descriptor is missing',
            `family parity: ${parityGaps.get(target).family} runtimes must hold the same`
            + ` responsibilities; missing ${parityGaps.get(target).missing.join(', ')}`,
          ]
          : ['conformance descriptor is missing'],
      };
      continue;
    }

    issues.push(...validateEvidenceDescriptor(descriptor, manifest, contract));
    if (descriptor.target !== target) issues.push('target does not match descriptor location');
    if (!(targetManifest.conformance ?? []).includes(descriptor.suite)) {
      issues.push(`suite ${descriptor.suite} is not declared by target`);
    }

    const held = targetManifest.responsibilities ?? [];
    const parity = parityGaps.get(target);
    if (parity) {
      issues.push(
        `family parity: ${parity.family} runtimes must hold the same responsibilities;`
        + ` missing ${parity.missing.join(', ')}`,
      );
    }
    const expected = applicableInvariants(contract, descriptor.roles ?? [], held);
    const actual = Object.keys(descriptor.invariants ?? {}).sort();
    if (JSON.stringify(expected) !== JSON.stringify(actual)) {
      issues.push(`invariant closure differs: expected ${expected.join(', ')}, got ${actual.join(', ')}`);
    }

    const application = applicationsByRuntime.get(target);
    const proofResult = await validateProofs({
      repoRoot,
      capability,
      target,
      descriptor,
      projectDir,
      application,
    });
    issues.push(...proofResult.issues);

    targets[target] = {
      status: issues.length === 0 ? 'CONFORMANT' : 'NON_CONFORMANT',
      manifestStatus: 'ready',
      roles: [...(descriptor.roles ?? [])].sort(),
      // Coverage is reported next to the verdict on purpose: CONFORMANT over two
      // of seven responsibilities must never read like CONFORMANT over all seven.
      responsibilities: [...held].sort(),
      coverage: `${held.length}/${(manifest.responsibilities ?? []).length}`,
      family: FAMILY_OF_RUNTIME.get(target) ?? null,
      familyParity: parity ? { status: 'BREACH', missing: parity.missing } : { status: 'OK' },
      suite: descriptor.suite,
      golden: descriptor.golden,
      invariants: expected,
      proofCount: proofResult.proofCount,
      materialized: Boolean(projectDir && application),
      issues,
    };
  }

  const readyTargets = Object.entries(targets)
    .filter(([, result]) => result.manifestStatus === 'ready')
    .map(([target]) => target);
  const conformant = readyTargets.every((target) => targets[target].status === 'CONFORMANT');

  return {
    schemaVersion: '1',
    capability,
    contract: { id: contract.id, version: contract.version },
    evaluation: projectDir ? 'materialized-golden' : 'foundation-registry',
    status: conformant ? 'CONFORMANT' : 'NON_CONFORMANT',
    readyTargets: readyTargets.sort(),
    targets,
  };
}

/** Evaluates every capability owning a product contract. */
export async function evaluateAllCapabilityProducts({
  repoRoot = DEFAULT_ROOT,
  projectDir,
  plan,
  only,
} = {}) {
  const discovered = await discoverProductContracts(repoRoot);
  const selected = only ? discovered.filter((item) => only.includes(item.capability)) : discovered;
  const reports = [];
  for (const { capability, path } of selected) {
    reports.push(await evaluateCapabilityProduct({
      capability, contractPath: path, repoRoot, projectDir, plan,
    }));
  }
  return reports;
}

/** Writes one report per capability and returns them. */
export async function writeCapabilityProductReports(repoRoot = DEFAULT_ROOT, only) {
  const discovered = await discoverProductContracts(repoRoot);
  const selected = only ? discovered.filter((item) => only.includes(item.capability)) : discovered;
  const reports = [];
  for (const { capability, path } of selected) {
    const contract = await readJson(join(repoRoot, path));
    const report = await evaluateCapabilityProduct({ capability, contractPath: path, repoRoot });
    await writeFile(
      join(repoRoot, reportPathFor(contract)),
      `${JSON.stringify(report, null, 2)}\n`,
    );
    reports.push(report);
  }
  return reports;
}

/**
 * Re-checks, inside a materialized project, every capability the plan actually
 * composed. Throws on the first non-conformant materialized target so a golden
 * cannot go green while an application lost its evidence.
 */
export async function verifyMaterializedCapabilities(projectDir, plan, repoRoot = DEFAULT_ROOT) {
  const composed = (plan?.capabilities ?? []).map((item) => (
    typeof item === 'string' ? item : item?.id
  )).filter(Boolean);
  const reports = await evaluateAllCapabilityProducts({
    repoRoot, projectDir, plan, only: composed.length > 0 ? composed : undefined,
  });
  // A family-parity breach is a declared architectural gap carried by an ADR and
  // the roadmap, not a regression of this build: it is reported loudly but does
  // not fail the golden. Everything else — a missing or tampered proof — does,
  // because that IS a regression of the application being verified.
  const failures = [];
  const parityBreaches = [];
  for (const report of reports) {
    for (const [target, result] of Object.entries(report.targets)) {
      if (!result.materialized) continue;
      if (result.familyParity?.status === 'BREACH') {
        parityBreaches.push(
          `${report.capability}/${target} (${result.familyParity.missing.join(', ')})`,
        );
      }
      const blocking = result.issues.filter((issue) => !issue.startsWith('family parity:'));
      if (blocking.length > 0) failures.push(`${report.capability}/${target}: ${blocking.join('; ')}`);
    }
  }
  if (parityBreaches.length > 0) {
    console.warn(`   known family-parity gap (tracked): ${parityBreaches.join(' | ')}`);
  }
  if (failures.length > 0) {
    throw new Error(`capability product conformance failed: ${failures.join(' | ')}`);
  }
  await writeFile(
    join(projectDir, 'enistere.capability-conformance.json'),
    `${JSON.stringify({ schemaVersion: '1', capabilities: reports }, null, 2)}\n`,
  );
  return reports;
}
