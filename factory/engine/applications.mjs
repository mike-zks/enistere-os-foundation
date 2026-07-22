/**
 * Canonical application model (Contrat 1).
 *
 * The engine consumes a project as a list of applications, but supports two
 * blueprint surfaces that resolve to the SAME model:
 *
 * - the single-surface sugar `stack: { api, web?, mobile? }` (today's form), and
 * - the canonical `applications: [{ id, kind, runtime, ... }]` (general form).
 *
 * `resolveApplications` normalizes both into `{ id, kind, runtime, slot }`.
 * `resolveStack` returns the `{ api, web, mobile }` slot view the current
 * generator/plan consume — and for a stack-based blueprint it returns
 * `blueprint.stack` UNCHANGED, so the generated plan/lock stays byte-identical.
 */

import { APPLICATION_KINDS, MANDATORY_KIND, SUGAR_SLOTS, isGeneratableKind } from './topologies.mjs';

/** Canonical `{ id, kind, runtime, slot }[]` from either blueprint surface. */
export function resolveApplications(blueprint) {
  if (Array.isArray(blueprint.applications)) {
    return blueprint.applications.map((app) => ({
      id: app.id,
      kind: app.kind,
      runtime: app.runtime,
      slot: APPLICATION_KINDS[app.kind]?.slot ?? null,
    }));
  }
  const stack = blueprint.stack ?? {};
  return SUGAR_SLOTS.flatMap((slot) => (stack[slot] ? [{ id: slot, kind: slot, runtime: stack[slot], slot }] : []));
}

/**
 * Slot view `{ api, web, mobile }` consumed by the current engine. A stack-based
 * blueprint passes its own `stack` through untouched (byte-identical output); an
 * applications-based blueprint synthesizes the same shape from its single app per
 * slot (multi-surface is refused upstream by `assertGeneratableTopology`).
 */
export function resolveStack(blueprint) {
  if (blueprint.stack) return blueprint.stack;
  const stack = { api: null, web: null, mobile: null };
  for (const app of resolveApplications(blueprint)) if (app.slot) stack[app.slot] = app.runtime;
  return stack;
}

/**
 * Structural validation of an explicit `applications[]` surface (shape only; the
 * generatability gate is `assertGeneratableTopology`). Returns issues.
 */
export function validateApplications(applications) {
  const issues = [];
  if (!Array.isArray(applications) || applications.length === 0) return ['applications must be a non-empty array'];
  const ids = new Set();
  const SLUG = /^[a-z][a-z0-9-]{1,62}$/;
  for (const [index, app] of applications.entries()) {
    if (!app || typeof app !== 'object' || Array.isArray(app)) { issues.push(`applications[${index}] must be an object`); continue; }
    for (const key of Object.keys(app)) if (!['id', 'kind', 'runtime', 'audience', 'consumes'].includes(key)) issues.push(`applications[${index}].${key} is not a known field`);
    if (!SLUG.test(app.id ?? '')) issues.push(`applications[${index}].id must be kebab-case`);
    else if (ids.has(app.id)) issues.push(`applications[${index}].id is duplicated: ${app.id}`);
    ids.add(app.id);
    const kind = APPLICATION_KINDS[app.kind];
    if (!kind) { issues.push(`applications[${index}].kind is invalid: ${app.kind}`); continue; }
    if (!kind.runtimes.includes(app.runtime)) issues.push(`applications[${index}].runtime ${app.runtime} is invalid for kind ${app.kind}`);
    if (app.audience !== undefined && (typeof app.audience !== 'string' || app.audience === '')) issues.push(`applications[${index}].audience must be a non-empty string`);
    if (app.consumes !== undefined && (!Array.isArray(app.consumes) || app.consumes.some((c) => typeof c !== 'string' || c === ''))) issues.push(`applications[${index}].consumes must be an array of application ids`);
  }
  return issues;
}

/**
 * The API-invariant and the generation gate. Every project composes at least one
 * API. Multiple web/mobile surfaces on a single API (multi-surface) are
 * generatable. A `worker`/`gateway`/`bff` (planned kind) or a second API
 * (multi-service) is declarable in the model but refused at generation until its
 * distributed capability packs are proven (Phase D). Returns issues.
 */
export function assertGeneratableTopology(blueprint) {
  const issues = [];
  const applications = resolveApplications(blueprint);
  if (!applications.some((app) => app.kind === MANDATORY_KIND)) {
    issues.push('An API is mandatory: a Foundation project composes around an API (kind: api).');
  }
  for (const app of applications) {
    if (!isGeneratableKind(app.kind)) {
      issues.push(`application ${app.id} (kind: ${app.kind}) is planned and not generatable yet`);
    }
  }
  const apiCount = applications.filter((app) => app.kind === MANDATORY_KIND).length;
  if (apiCount > 1) issues.push(`multiple API applications is planned (multi-service): ${apiCount} declared`);
  return issues;
}
