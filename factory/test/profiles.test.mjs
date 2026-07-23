import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { loadCapabilityManifests } from '../engine/capabilities.mjs';
import { loadStarterManifests, modularStarterIds, STARTER_IDS } from '../engine/starters.mjs';
import { validateBlueprint } from '../engine/blueprint.mjs';
import { buildGenerationPlan } from '../engine/plan.mjs';
import { COMPOSITIONS } from '../quality/scripts/golden-runtime.mjs';
import {
  API_STARTER_IDS,
  GENERATABLE_PROFILE_STATUSES,
  PROFILE_STATUSES,
  apiLessStarterFor,
  assessProfile,
  getProfile,
  listProfiles,
  matchProfileSelection,
  profileStarterIds,
  validateBlueprintProfile,
  validateProfileRegistry,
} from '../engine/profiles.mjs';

const root = resolve(import.meta.dirname, '../..');
const manifests = () => loadCapabilityManifests(root);
const starterManifests = () => loadStarterManifests(root);

function blueprintFor(entry, extra = {}) {
  return {
    version: '1',
    project: { name: 'Demo', slug: 'demo' },
    topology: 'monorepo',
    designSystem: true,
    stack: { ...entry.stack },
    domain: { entities: [] },
    capabilities: [...entry.capabilities],
    deployment: { environments: ['local'] },
    ...extra,
  };
}

describe('profile registry', () => {
  it('declares every status against the real capability matrix', async () => {
    assert.deepEqual(validateProfileRegistry(await manifests(), await starterManifests()), []);
  });

  it('uses only known statuses and unique ids', () => {
    const ids = listProfiles().map((entry) => entry.id);
    assert.equal(new Set(ids).size, ids.length);
    assert.ok(listProfiles().every((entry) => PROFILE_STATUSES.includes(entry.status)));
  });

  it('gives each profile a distinct selection so matching stays unambiguous', () => {
    const selections = listProfiles().map((entry) => (
      `${entry.stack.api}|${entry.stack.web}|${entry.stack.mobile}|${[...entry.capabilities].sort().join(',')}`
    ));
    assert.equal(new Set(selections).size, selections.length);
  });

  it('never declares a profile without an API', () => {
    for (const entry of listProfiles()) {
      assert.ok(API_STARTER_IDS.includes(entry.stack.api), `${entry.id} must pin an API`);
    }
  });

  it('composes only registered starters', () => {
    for (const entry of listProfiles()) {
      for (const starterId of profileStarterIds(entry)) assert.ok(STARTER_IDS.includes(starterId));
    }
  });

  it('treats API_STARTER_IDS as the starters whose manifest kind is api', async () => {
    const starters = await loadStarterManifests(root);
    const apis = starters.filter((starter) => starter.kind === 'api').map((starter) => starter.id);
    assert.deepEqual([...API_STARTER_IDS].sort(), apis.sort());
  });
});

describe('ready is never granted without proof', () => {
  // Requirement R8A-7: every golden is wired to the right profile — the selection
  // it generates must be the selection the profile pins, not merely a similar one.
  it('wires every claimed golden to the profile it actually generates', () => {
    for (const entry of listProfiles().filter((item) => item.golden)) {
      const golden = COMPOSITIONS[entry.golden];
      assert.ok(golden, `${entry.id} claims unknown golden ${entry.golden}`);
      assert.deepEqual(golden.stack, entry.stack, `${entry.id} golden stack mismatch`);
      assert.deepEqual([...golden.capabilities].sort(), [...entry.capabilities].sort(), `${entry.id} golden capability mismatch`);
    }
  });

  // R8A: a golden proves gates, not that the delivery matches the profile.
  it('requires an exact composition for every ready profile', async () => {
    const [capabilities, starters] = [await manifests(), await starterManifests()];
    for (const entry of listProfiles().filter((item) => item.status === 'ready')) {
      assert.ok(assessProfile(entry, capabilities, starters).compositionExact, `${entry.id} is ready and must compose exactly`);
    }
  });

  it('keeps green-gated baseline-copy profiles at supported', async () => {
    const [capabilities, starters] = [await manifests(), await starterManifests()];
    for (const entry of listProfiles().filter((item) => item.status === 'supported' && item.golden)) {
      const assessment = assessProfile(entry, capabilities, starters);
      assert.equal(assessment.compositionExact, false, `${entry.id} is exact and should be ready`);
      assert.ok(entry.note, `${entry.id} must state why green gates do not earn ready`);
    }
  });

  it('never lets green gates alone promote a profile', async () => {
    const [capabilities, starters] = [await manifests(), await starterManifests()];
    // The seven baseline-copy base profiles: golden green, still supported.
    const baselineCopy = listProfiles().filter((item) => (
      item.golden && !assessProfile(item, capabilities, starters).compositionExact
    ));
    assert.ok(baselineCopy.length >= 0, 'baseline-copy profiles are allowed to reach zero after extraction');
    for (const entry of baselineCopy) assert.equal(entry.status, 'supported');
  });

  it('never lets a planned profile claim a golden', () => {
    for (const entry of listProfiles().filter((item) => item.status === 'planned')) {
      assert.equal(entry.golden, null);
    }
  });
});

describe('the API is mandatory', () => {
  // The table from the mission: an API-less name is refused, its API-bearing
  // counterparts are accepted.
  const refused = ['angular-only-base', 'flutter-only-base', 'nextjs-only-base', 'react-native-only-base'];
  const accepted = [
    'spring-angular-base', 'spring-flutter-base', 'nestjs-next-base', 'nestjs-react-native-base',
    'nestjs-angular-base', 'nestjs-flutter-base',
    'nestjs-next-files', 'nestjs-next-react-native-auth', 'nestjs-next-react-native-rbac',
  ];

  for (const name of refused) {
    it(`refuses ${name} because an API is mandatory`, () => {
      assert.throws(() => getProfile(name), (error) => {
        assert.match(error.message, /An API is mandatory/);
        assert.match(error.message, new RegExp(`Unsupported profile: ${name}`));
        return true;
      });
    });
  }

  for (const name of accepted) {
    it(`accepts ${name}`, async () => {
      const entry = getProfile(name);
      assert.ok(API_STARTER_IDS.includes(entry.stack.api));
      assert.ok(GENERATABLE_PROFILE_STATUSES.includes(entry.status));
      assert.ok(assessProfile(entry, await manifests(), await starterManifests()).composable);
    });
  }

  it('suggests only registered profiles that actually compose the starter', () => {
    const known = new Set(listProfiles().map((entry) => entry.id));
    // Every API-less name the CLI can meet, not only the four canonical ones.
    const probes = [...refused, 'angular-base', 'flutter-auth', 'nextjs-anything', 'rn-only-base', 'next-only-base'];
    for (const name of probes) {
      let message = '';
      try { getProfile(name); assert.fail(`${name} must be refused`); } catch (error) { message = error.message; }
      const line = message.split('\n').find((item) => item.startsWith('Profiles composing '));
      assert.ok(line, `${name} must suggest alternatives`);
      const [, starterId] = line.match(/^Profiles composing ([^:]+):/);
      const suggestions = line.split(': ')[1].split(', ');
      assert.ok(suggestions.length > 0);
      for (const suggestion of suggestions) {
        assert.ok(known.has(suggestion), `${suggestion} is suggested but not registered`);
        assert.ok(profileStarterIds(getProfile(suggestion)).includes(starterId));
      }
    }
  });

  it('recognises any name led by a web or mobile starter', () => {
    for (const name of ['angular-base', 'flutter-auth', 'nextjs-anything', 'rn-only-base', 'next-only-base']) {
      assert.ok(apiLessStarterFor(name), `${name} must be recognised as API-less`);
    }
    for (const name of ['nestjs-next-base', 'spring-angular-base']) {
      assert.equal(apiLessStarterFor(name), null);
    }
  });

  it('reports an unknown name as unknown, not as API-less', () => {
    assert.throws(() => getProfile('nestjs-quantum'), /Unknown profile: nestjs-quantum/);
  });
});

describe('valid and invalid combinations', () => {
  it('accepts every generatable profile as a blueprint claiming itself', () => {
    for (const entry of listProfiles().filter((item) => GENERATABLE_PROFILE_STATUSES.includes(item.status))) {
      assert.deepEqual(validateBlueprint(blueprintFor(entry, { profile: entry.id })), [], `${entry.id} must validate`);
    }
  });

  it('refuses every planned profile with an explicit reason', () => {
    for (const entry of listProfiles().filter((item) => item.status === 'planned')) {
      const issues = validateBlueprint(blueprintFor(entry, { profile: entry.id }));
      assert.ok(issues.some((issue) => issue.includes('is planned and cannot be generated')), `${entry.id} must be refused`);
    }
  });

  it('refuses a blueprint whose capabilities drift from its profile', () => {
    const blueprint = blueprintFor(getProfile('nestjs-next-auth'), { profile: 'nestjs-next-auth' });
    blueprint.capabilities = ['base', 'auth', 'rbac'];
    assert.ok(validateBlueprint(blueprint).some((issue) => /pins capabilities/.test(issue)));
  });

  it('refuses a blueprint whose stack drifts from its profile', () => {
    const blueprint = blueprintFor(getProfile('nestjs-next-auth'), { profile: 'nestjs-next-auth' });
    blueprint.stack = { api: 'nestjs', web: null, mobile: null };
    assert.ok(validateBlueprint(blueprint).some((issue) => /pins stack\.web/.test(issue)));
  });

  it('refuses an API-less profile name inside a blueprint', () => {
    const blueprint = blueprintFor(getProfile('nestjs-next-base'), { profile: 'angular-only-base' });
    assert.ok(validateBlueprint(blueprint).some((issue) => /An API is mandatory/.test(issue)));
  });

  it('keeps the profile optional', () => {
    assert.deepEqual(validateBlueprint(blueprintFor(getProfile('nestjs-next-auth'))), []);
    assert.deepEqual(validateBlueprintProfile(blueprintFor(getProfile('nestjs-next-auth'))), []);
  });

  it('refuses a capability selection that breaks its dependencies', () => {
    // rbac without auth is not a profile question: the dependency contract refuses it.
    const blueprint = blueprintFor(getProfile('nestjs-next-base'));
    blueprint.capabilities = ['base', 'rbac'];
    assert.ok(validateBlueprint(blueprint).some((issue) => /rbac requires auth/.test(issue)));
  });
});

describe('profiles stay distinct from the 18 stack combinations', () => {
  it('counts 18 stack combinations, which the registry does not enumerate', () => {
    const apis = STARTER_IDS.filter((id) => API_STARTER_IDS.includes(id));
    const webs = [null, 'nextjs', 'angular'];
    const mobiles = [null, 'react-native', 'flutter'];
    assert.equal(apis.length * webs.length * mobiles.length, 18);
    // A profile is a functional composition, not a stack cell: several profiles
    // share one stack combination, and some combinations carry none.
    const stacks = listProfiles().map((entry) => `${entry.stack.api}|${entry.stack.web}|${entry.stack.mobile}`);
    assert.ok(new Set(stacks).size < listProfiles().length, 'profiles must not be one-per-stack');
    assert.ok(new Set(stacks).size <= 18);
  });

  it('names the profile a blueprint matches, and none when it matches nothing', () => {
    assert.equal(matchProfileSelection(getProfile('nestjs-next-rbac').stack, getProfile('nestjs-next-rbac').capabilities)?.id, 'nestjs-next-rbac');
    const unmatched = blueprintFor(getProfile('nestjs-next-rbac'));
    unmatched.stack = { api: 'nestjs', web: 'angular', mobile: 'flutter' };
    assert.equal(matchProfileSelection(unmatched.stack, unmatched.capabilities), null);
  });
});

describe('documentation matches the registry', () => {
  const matrixPath = resolve(root, 'docs/project-status/PROFILE_MATRIX.md');

  // Profile ids appear as the first cell of a table row: `| \`<id>\` | ...`.
  async function documentedProfileIds() {
    const doc = await readFile(matrixPath, 'utf8');
    const ids = [...doc.matchAll(/^\| `([a-z0-9-]+)` \|/gm)].map((match) => match[1]);
    const statuses = new Set(PROFILE_STATUSES);
    return new Set(ids.filter((id) => !statuses.has(id)));
  }

  it('documents every registered profile', async () => {
    const documented = await documentedProfileIds();
    const missing = listProfiles().map((entry) => entry.id).filter((id) => !documented.has(id));
    assert.deepEqual(missing, [], 'these profiles are registered but undocumented');
  });

  it('registers every documented profile', async () => {
    const registered = new Set(listProfiles().map((entry) => entry.id));
    const extra = [...await documentedProfileIds()].filter((id) => !registered.has(id));
    assert.deepEqual(extra, [], 'these profiles are documented but not registered');
  });

  it('states the counts the registry actually holds', async () => {
    const doc = await readFile(matrixPath, 'utf8');
    for (const status of PROFILE_STATUSES) {
      const count = listProfiles().filter((entry) => entry.status === status).length;
      assert.match(doc, new RegExp(`### \`${status}\`[^\\n]*\\(${count}\\)`), `${status} count must read ${count}`);
    }
  });
});

describe('golden coverage is reported honestly', () => {
  it('claims a distinct, existing golden per ready profile', () => {
    const claimed = listProfiles().map((entry) => entry.golden).filter(Boolean);
    assert.equal(new Set(claimed).size, claimed.length, 'two profiles must not claim the same golden');
    for (const golden of claimed) assert.ok(COMPOSITIONS[golden], `unknown golden ${golden}`);
  });

  it('covers the triple auth and rbac goldens', () => {
    const byGolden = new Map(listProfiles().filter((entry) => entry.golden).map((entry) => [entry.golden, entry.id]));
    assert.equal(byGolden.get('triple-auth'), 'nestjs-next-react-native-auth');
    assert.equal(byGolden.get('triple-auth-rbac'), 'nestjs-next-react-native-rbac');
  });

  it('documents the goldens that still carry no named profile', async () => {
    const claimed = new Set(listProfiles().map((entry) => entry.golden).filter(Boolean));
    const uncovered = Object.keys(COMPOSITIONS).filter((golden) => !claimed.has(golden));
    // Not a failure: a golden may be tested without being offered as a supported
    // combination. It must however be named in the matrix rather than hidden.
    const doc = await readFile(resolve(root, 'docs/project-status/PROFILE_MATRIX.md'), 'utf8');
    for (const golden of uncovered) {
      assert.match(doc, new RegExp(`\`${golden}\``), `uncovered golden ${golden} must be documented`);
    }
  });
});

describe('the plan reports capabilities and gates', () => {
  it('reports the selected capabilities, the matched profile and its proof', async () => {
    const starters = await loadStarterManifests(root);
    const plan = buildGenerationPlan(blueprintFor(getProfile('nestjs-next-auth')), { starters });
    assert.deepEqual(plan.capabilities, ['base', 'auth']);
    assert.equal(plan.profile.id, 'nestjs-next-auth');
    assert.equal(plan.profile.status, 'ready');
    assert.equal(plan.profile.runtimeProven, true);
  });

  it('shows the extracted Angular base as an exact ready profile', async () => {
    const starters = await loadStarterManifests(root);
    const modularStarters = modularStarterIds(starters);
    const plan = buildGenerationPlan(blueprintFor(getProfile('spring-angular-base')), { starters, modularStarters });
    assert.equal(plan.profile.status, 'ready');
    assert.equal(plan.profile.runtimeProven, true);
    assert.equal(plan.profile.golden, 'spring-angular-base');
    assert.equal(plan.profile.compositionExact, true);
    assert.equal(plan.bundledFeaturesMayExceedSelection, false);
  });

  it('reports the Spring Auth golden after capability promotion', async () => {
    const starters = await loadStarterManifests(root);
    const modularStarters = modularStarterIds(starters);
    const plan = buildGenerationPlan(blueprintFor(getProfile('spring-auth')), { starters, modularStarters });
    assert.equal(plan.profile.status, 'ready');
    assert.equal(plan.profile.runtimeProven, true);
    assert.equal(plan.profile.golden, 'spring-auth');
    assert.equal(plan.profile.compositionExact, true);
  });

  it('reports the gates each generated app will run', async () => {
    const starters = await loadStarterManifests(root);
    const plan = buildGenerationPlan(blueprintFor(getProfile('nestjs-next-react-native-files')), { starters });
    assert.deepEqual(Object.keys(plan.gates), ['api', 'web', 'mobile']);
    assert.deepEqual(plan.gates.api.map((gate) => gate.gate), ['install', 'test', 'build', 'verify']);
    assert.equal(plan.gates.api.find((gate) => gate.gate === 'verify').command, 'npm run openapi:check');
    // Slots the blueprint does not select carry no gates.
    const apiOnly = buildGenerationPlan(blueprintFor(getProfile('nestjs-auth')), { starters });
    assert.deepEqual(Object.keys(apiOnly.gates), ['api']);
  });
});
