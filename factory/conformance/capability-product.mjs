import { readFile, writeFile } from 'node:fs/promises';
import { dirname, join, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const MODULE_DIR = dirname(fileURLToPath(import.meta.url));
const DEFAULT_ROOT = resolve(MODULE_DIR, '../..');
const AUTH_CONTRACT = 'capabilities/auth/contracts/authentication.product.v1.json';
const AUTH_REPORT = 'factory/conformance/reports/authentication-v1.json';

const TARGET_STATES = Object.freeze({
  ready: 'CONFORMANT',
  planned: 'PLANNED',
  unsupported: 'UNSUPPORTED',
  'not-applicable': 'NOT_APPLICABLE',
});

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

export function validateProductContract(contract) {
  const issues = [];
  if (!isObject(contract)) return ['contract must be an object'];
  if (contract.schemaVersion !== '1') issues.push('schemaVersion must be 1');
  if (contract.id !== 'authentication-product') issues.push('id must be authentication-product');
  if (contract.version !== '1.0.0') issues.push('version must be 1.0.0');
  if (contract.capability !== 'auth') issues.push('capability must be auth');
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
    if (!/^AUTH-[A-Z]+-\d{3}$/.test(invariant.id ?? '')) {
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
    if (typeof invariant.requirement !== 'string' || invariant.requirement.trim() === '') {
      issues.push(`${invariant.id}.requirement is required`);
    }
  }
  return issues;
}

function applicableInvariants(contract, roles) {
  const selected = new Set(roles);
  return contract.invariants
    .filter((invariant) => invariant.appliesTo.some((role) => selected.has(role)))
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
      const sourceRoot = join(repoRoot, 'capabilities', 'auth', 'targets', target);
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
 * Evaluates the neutral Authentication product contract against every manifest
 * target. A ready target reaches CONFORMANT only when its role-complete evidence
 * map is closed, references its declared suite and all proof payloads exist.
 *
 * When projectDir/plan are supplied, the same proof markers must also exist in
 * the materialized application. The golden driver calls this only after the
 * target's real test/build gates have passed.
 */
export async function evaluateAuthenticationProduct({
  repoRoot = DEFAULT_ROOT,
  projectDir,
  plan,
} = {}) {
  const contract = await readJson(join(repoRoot, AUTH_CONTRACT));
  const manifest = await readJson(join(repoRoot, 'capabilities/auth/capability.json'));
  const contractIssues = validateProductContract(contract);
  if (contractIssues.length > 0) {
    throw new Error(`invalid Authentication product contract: ${contractIssues.join('; ')}`);
  }

  const applicationsByRuntime = new Map(
    (plan?.applications ?? []).map((application) => [application.runtime, application]),
  );
  const targets = {};

  for (const [target, targetManifest] of Object.entries(manifest.targets)) {
    if (targetManifest.status !== 'ready') {
      targets[target] = {
        status: TARGET_STATES[targetManifest.status],
        manifestStatus: targetManifest.status,
        roles: [],
        invariants: [],
        issues: [],
      };
      continue;
    }

    const descriptorPath = join(repoRoot, 'capabilities', 'auth', 'targets', target, 'conformance.json');
    let descriptor;
    const issues = [];
    try {
      descriptor = await readJson(descriptorPath);
    } catch {
      targets[target] = {
        status: 'NON_CONFORMANT',
        manifestStatus: 'ready',
        roles: [],
        invariants: [],
        issues: ['conformance descriptor is missing'],
      };
      continue;
    }

    issues.push(...validateEvidenceDescriptor(descriptor, manifest, contract));
    if (descriptor.target !== target) issues.push('target does not match descriptor location');
    if (!(targetManifest.conformance ?? []).includes(descriptor.suite)) {
      issues.push(`suite ${descriptor.suite} is not declared by target`);
    }

    const expected = applicableInvariants(contract, descriptor.roles ?? []);
    const actual = Object.keys(descriptor.invariants ?? {}).sort();
    if (JSON.stringify(expected) !== JSON.stringify(actual)) {
      issues.push(`invariant closure differs: expected ${expected.join(', ')}, got ${actual.join(', ')}`);
    }

    const application = applicationsByRuntime.get(target);
    const proofResult = await validateProofs({
      repoRoot,
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
    capability: 'auth',
    contract: { id: contract.id, version: contract.version },
    evaluation: projectDir ? 'materialized-golden' : 'foundation-registry',
    status: conformant ? 'CONFORMANT' : 'NON_CONFORMANT',
    readyTargets: readyTargets.sort(),
    targets,
  };
}

export async function writeAuthenticationProductReport(
  output = join(DEFAULT_ROOT, AUTH_REPORT),
  repoRoot = DEFAULT_ROOT,
) {
  const report = await evaluateAuthenticationProduct({ repoRoot });
  await writeFile(output, `${JSON.stringify(report, null, 2)}\n`);
  return report;
}

export async function verifyMaterializedAuthentication(projectDir, plan, repoRoot = DEFAULT_ROOT) {
  const report = await evaluateAuthenticationProduct({ repoRoot, projectDir, plan });
  const materializedTargets = Object.entries(report.targets)
    .filter(([, target]) => target.materialized);
  const failures = materializedTargets
    .filter(([, target]) => target.status !== 'CONFORMANT')
    .map(([target, result]) => `${target}: ${result.issues.join('; ')}`);
  if (failures.length > 0) {
    throw new Error(`Authentication product conformance failed: ${failures.join(' | ')}`);
  }
  await writeFile(
    join(projectDir, 'enistere.capability-conformance.json'),
    `${JSON.stringify(report, null, 2)}\n`,
  );
  return report;
}
