import { assessCapabilitySupport, validateCapabilityDependencies } from './capabilities.mjs';
import { STARTER_IDS } from './starters.mjs';

/**
 * A profile is a **named composition** of `{api, web?, mobile?, capabilities}`.
 *
 * The API is a Foundation invariant, not a parameter: a project always composes
 * around an API. `web` and `mobile` are optional; `api` never is. Any request
 * for a web-only or mobile-only profile is refused with an explicit message
 * pointing at the API-bearing profiles that cover the same starter.
 *
 * Profiles are a *functional* layer on top of the 18 stack combinations
 * (2 apis x 3 web x 3 mobile). A stack combination says what can be assembled;
 * a profile says what is supported, and with which proof.
 */

/**
 * Support status of a profile, with explicit semantics:
 *
 * - `ready`     : composable, proven by a golden runtime, **and** composed
 *                 exactly — the generated project contains the selected
 *                 capabilities and nothing beyond them. The only status that
 *                 promises the delivery matches the profile.
 * - `supported` : generatable, but the promise is weaker. Either no golden
 *                 proves it, or its gates are green while a selected starter is
 *                 baseline-copy and ships capabilities the profile never
 *                 selected. The shortfall is reported, never hidden.
 * - `planned`   : not composable — at least one selected capability is
 *                 `planned` or `unsupported` on a selected target. Generation
 *                 is refused. Declaring the profile documents the parity target
 *                 without ever presenting it as usable.
 *
 * Green gates alone never earn `ready` (R8A): a baseline-copy profile can pass
 * every gate while delivering Auth, RBAC and Files that were never asked for.
 * Calling it `ready` would promise a `base` project and hand over a full one.
 */
export const PROFILE_STATUSES = Object.freeze(['ready', 'supported', 'planned']);

/** Statuses whose profiles can be generated today. */
export const GENERATABLE_PROFILE_STATUSES = Object.freeze(['ready', 'supported']);

/** Starters that can satisfy the mandatory `stack.api` slot. */
export const API_STARTER_IDS = Object.freeze(['nestjs', 'spring']);

/**
 * Names that describe a composition without an API. They are refused on sight
 * so the error teaches the invariant instead of reporting "unknown profile".
 * Values are the starter the caller meant, used to suggest real profiles.
 */
export const API_LESS_PROFILE_ALIASES = Object.freeze({
  'angular-only-base': 'angular',
  'flutter-only-base': 'flutter',
  'nextjs-only-base': 'nextjs',
  'next-only-base': 'nextjs',
  'react-native-only-base': 'react-native',
  'rn-only-base': 'react-native',
});

/** Leading name segments that denote a non-API starter (web or mobile). */
const NON_API_PREFIXES = Object.freeze({
  nextjs: 'nextjs',
  next: 'nextjs',
  angular: 'angular',
  'react-native': 'react-native',
  rn: 'react-native',
  flutter: 'flutter',
});

const profile = (id, status, stack, capabilities, extra = {}) => Object.freeze({
  id,
  status,
  stack: Object.freeze({ api: stack.api, web: stack.web ?? null, mobile: stack.mobile ?? null }),
  capabilities: Object.freeze([...capabilities]),
  golden: extra.golden ?? null,
  note: extra.note ?? null,
});

/**
 * The registry. Every entry is cross-validated against the real capability
 * matrix by `validateProfileRegistry` — a declared status that the matrix does
 * not support fails the test suite rather than shipping a false promise.
 */
export const PROFILES = Object.freeze([
  // ── API-only : the API is a complete composition on its own ────────────────
  profile('nestjs-base', 'ready', { api: 'nestjs' }, ['base'], { golden: 'nestjs-base' }),
  profile('nestjs-auth', 'ready', { api: 'nestjs' }, ['base', 'auth'], { golden: 'nestjs-auth' }),
  profile('nestjs-rbac', 'ready', { api: 'nestjs' }, ['base', 'auth', 'rbac'], { golden: 'nestjs-auth-rbac' }),
  profile('nestjs-files', 'ready', { api: 'nestjs' }, ['base', 'auth', 'rbac', 'files'], { golden: 'nestjs-files' }),
  // Spring now has a minimal modular base. Its base golden therefore proves
  // the selected composition without importing Auth/RBAC/Files by accident.
  profile('spring-base', 'ready', { api: 'spring' }, ['base'], {
    golden: 'spring-base',
  }),

  // ── Base compositions with a web or mobile surface ─────────────────────────
  // Composition exacte (NestJS + Next.js / React Native sont modulaires) : R8A
  // prouve les gates ET l'absence de surface non sélectionnée.
  profile('nestjs-next-base', 'ready', { api: 'nestjs', web: 'nextjs' }, ['base'], {
    golden: 'nestjs-next-base',
  }),
  profile('nestjs-react-native-base', 'ready', { api: 'nestjs', mobile: 'react-native' }, ['base'], {
    golden: 'nestjs-react-native-base',
  }),
  profile('nestjs-angular-base', 'ready', { api: 'nestjs', web: 'angular' }, ['base'], {
    golden: 'nestjs-angular-base',
  }),
  profile('nestjs-flutter-base', 'ready', { api: 'nestjs', mobile: 'flutter' }, ['base'], {
    golden: 'nestjs-flutter-base',
  }),
  profile('spring-next-base', 'ready', { api: 'spring', web: 'nextjs' }, ['base'], {
    golden: 'spring-next-base',
  }),
  profile('spring-react-native-base', 'ready', { api: 'spring', mobile: 'react-native' }, ['base'], {
    golden: 'spring-react-native-base',
  }),
  profile('spring-angular-base', 'ready', { api: 'spring', web: 'angular' }, ['base'], {
    golden: 'spring-angular-base',
  }),
  profile('spring-flutter-base', 'ready', { api: 'spring', mobile: 'flutter' }, ['base'], {
    golden: 'spring-flutter-base',
  }),

  // ── Proven TypeScript vertical ─────────────────────────────────────────────
  profile('nestjs-next-auth', 'ready', { api: 'nestjs', web: 'nextjs' }, ['base', 'auth'], {
    golden: 'nest-next-auth',
  }),
  profile('nestjs-next-rbac', 'ready', { api: 'nestjs', web: 'nextjs' }, ['base', 'auth', 'rbac'], {
    golden: 'nest-next-auth-rbac',
  }),
  profile('nestjs-next-files', 'ready', { api: 'nestjs', web: 'nextjs' }, ['base', 'auth', 'rbac', 'files'], {
    golden: 'nest-next-files',
  }),
  profile('nestjs-next-react-native-auth', 'ready', { api: 'nestjs', web: 'nextjs', mobile: 'react-native' }, ['base', 'auth'], {
    golden: 'triple-auth',
  }),
  profile('nestjs-next-react-native-rbac', 'ready', { api: 'nestjs', web: 'nextjs', mobile: 'react-native' }, ['base', 'auth', 'rbac'], {
    golden: 'triple-auth-rbac',
    note: 'RBAC is not-applicable on React Native: the mobile app receives decisions from the API.',
  }),
  profile('nestjs-next-react-native-files', 'ready', { api: 'nestjs', web: 'nextjs', mobile: 'react-native' }, ['base', 'auth', 'rbac', 'files'], {
    golden: 'triple-files',
    note: 'RBAC is not-applicable on React Native: the mobile app receives decisions from the API.',
  }),

  // ── Parity targets : declared, never presented as usable ───────────────────
  profile('spring-auth', 'planned', { api: 'spring' }, ['base', 'auth']),
  profile('spring-rbac', 'planned', { api: 'spring' }, ['base', 'auth', 'rbac']),
  profile('spring-files', 'planned', { api: 'spring' }, ['base', 'auth', 'rbac', 'files']),
  profile('spring-angular-auth', 'planned', { api: 'spring', web: 'angular' }, ['base', 'auth']),
  profile('spring-angular-rbac', 'planned', { api: 'spring', web: 'angular' }, ['base', 'auth', 'rbac']),
  profile('spring-flutter-auth', 'planned', { api: 'spring', mobile: 'flutter' }, ['base', 'auth']),
  profile('spring-angular-flutter-files', 'planned', { api: 'spring', web: 'angular', mobile: 'flutter' }, ['base', 'auth', 'rbac', 'files']),
]);

const BY_ID = new Map(PROFILES.map((entry) => [entry.id, entry]));

export function listProfiles() {
  return PROFILES;
}

/** Starter ids a profile composes, in slot order. */
export function profileStarterIds(entry) {
  return [entry.stack.api, entry.stack.web, entry.stack.mobile].filter(Boolean);
}

/** Registered profiles that compose `starterId`, generatable ones first. */
function profilesUsingStarter(starterId) {
  const rank = (entry) => (GENERATABLE_PROFILE_STATUSES.includes(entry.status) ? 0 : 1);
  return PROFILES.filter((entry) => profileStarterIds(entry).includes(starterId)).sort((a, b) => rank(a) - rank(b));
}

/**
 * The starter a name asks for without an API, or `null`. Recognises both the
 * explicit `<starter>-only-*` aliases and any name led by a web/mobile starter.
 */
export function apiLessStarterFor(name) {
  const alias = API_LESS_PROFILE_ALIASES[name];
  if (alias) return alias;
  for (const [prefix, starterId] of Object.entries(NON_API_PREFIXES)) {
    if (name === prefix || name.startsWith(`${prefix}-`)) return starterId;
  }
  return null;
}

/**
 * Resolves a profile by name. Refuses API-less names with the invariant and the
 * API-bearing profiles that cover the same starter, so the caller is redirected
 * rather than merely rejected.
 */
export function getProfile(name) {
  const entry = BY_ID.get(name);
  if (entry) return entry;

  const starterId = apiLessStarterFor(name);
  if (starterId) {
    const alternatives = profilesUsingStarter(starterId).map((item) => item.id);
    throw new Error([
      `Unsupported profile: ${name}`,
      'An API is mandatory: a Foundation project composes around an API, never a web or mobile starter alone.',
      alternatives.length
        ? `Profiles composing ${starterId}: ${alternatives.join(', ')}`
        : `No registered profile composes ${starterId} yet.`,
    ].join('\n'));
  }

  throw new Error(`Unknown profile: ${name}\nKnown profiles: ${PROFILES.map((item) => item.id).join(', ')}`);
}

/**
 * Recomputes a profile's status from the real capability matrix.
 *
 * A profile is composable when its capability dependencies hold and every
 * selected capability is `ready` or `not-applicable` on every selected target.
 * A composable profile is `ready` only when a golden runtime backs it.
 */
export function assessProfile(entry, manifests, starters) {
  const dependencyIssues = validateCapabilityDependencies([...entry.capabilities]);
  const selected = manifests.filter((manifest) => entry.capabilities.includes(manifest.id));
  const support = assessCapabilitySupport(profileStarterIds(entry), selected);
  const composable = dependencyIssues.length === 0 && support.ready;
  // A profile composes exactly when every starter it selects follows the modular
  // contract. A baseline-copy starter ships its whole baseline, so the generated
  // project carries capabilities the profile never selected.
  const modular = new Set(starters.filter((starter) => starter.composition?.model === 'modular').map((starter) => starter.id));
  const compositionExact = profileStarterIds(entry).every((starterId) => modular.has(starterId));
  return {
    composable,
    compositionExact,
    status: composable ? (entry.golden && compositionExact ? 'ready' : 'supported') : 'planned',
    dependencyIssues,
    blockers: support.blockers,
    notApplicable: support.notApplicable,
  };
}

/**
 * Cross-validates the whole registry against the matrix. Any profile whose
 * declared status overstates (or understates) reality is reported.
 */
export function validateProfileRegistry(manifests, starters) {
  const issues = [];
  const seen = new Set();
  // Two profiles sharing one selection would make `matchProfile` ambiguous.
  const selections = new Map();
  for (const entry of PROFILES) {
    if (seen.has(entry.id)) issues.push(`duplicate profile: ${entry.id}`);
    seen.add(entry.id);
    const selection = `${entry.stack.api}|${entry.stack.web}|${entry.stack.mobile}|${[...entry.capabilities].sort().join(',')}`;
    if (selections.has(selection)) issues.push(`${entry.id}: same selection as ${selections.get(selection)}`);
    selections.set(selection, entry.id);
    if (!PROFILE_STATUSES.includes(entry.status)) issues.push(`${entry.id}: unknown status ${entry.status}`);
    if (!API_STARTER_IDS.includes(entry.stack.api)) issues.push(`${entry.id}: stack.api is mandatory and must be an API starter`);
    for (const starterId of profileStarterIds(entry)) {
      if (!STARTER_IDS.includes(starterId)) issues.push(`${entry.id}: unknown starter ${starterId}`);
    }
    if (entry.status === 'planned' && entry.golden) issues.push(`${entry.id}: a planned profile cannot claim a golden`);
    const assessment = assessProfile(entry, manifests, starters);
    if (assessment.status !== entry.status) {
      issues.push(`${entry.id}: declared ${entry.status} but the matrix supports ${assessment.status}`);
    }
    // `ready` is the only status that promises the delivered project matches the
    // profile. It therefore requires an exact composition, never a baseline copy.
    if (entry.status === 'ready' && !assessment.compositionExact) {
      issues.push(`${entry.id}: ready requires an exact composition, but a selected starter is baseline-copy`);
    }
  }
  return issues;
}

/** Profile whose selection matches a blueprint exactly, or `null`. */
export function matchProfile(blueprint) {
  const capabilities = [...blueprint.capabilities].sort().join(',');
  return PROFILES.find((entry) => (
    entry.stack.api === blueprint.stack.api
    && entry.stack.web === (blueprint.stack.web ?? null)
    && entry.stack.mobile === (blueprint.stack.mobile ?? null)
    && [...entry.capabilities].sort().join(',') === capabilities
  )) ?? null;
}

/**
 * Validates a blueprint against the profile it claims. Returns the issues so
 * the caller decides whether to warn or refuse.
 */
export function validateBlueprintProfile(blueprint) {
  if (blueprint.profile === undefined) return [];
  const entry = getProfile(blueprint.profile);
  const issues = [];
  for (const slot of ['api', 'web', 'mobile']) {
    const declared = blueprint.stack[slot] ?? null;
    if (declared !== entry.stack[slot]) {
      issues.push(`profile ${entry.id} pins stack.${slot}=${entry.stack[slot] ?? 'null'} but the blueprint declares ${declared ?? 'null'}`);
    }
  }
  const expected = [...entry.capabilities].sort().join(',');
  const actual = [...blueprint.capabilities].sort().join(',');
  if (expected !== actual) issues.push(`profile ${entry.id} pins capabilities [${expected}] but the blueprint declares [${actual}]`);
  if (entry.status === 'planned') {
    issues.push(`profile ${entry.id} is planned and cannot be generated: ${entry.capabilities.join(' + ')} is not composable on ${profileStarterIds(entry).join(' + ')} yet`);
  }
  return issues;
}
