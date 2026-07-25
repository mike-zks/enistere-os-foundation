/**
 * Canonical System Model validation (ADR-045).
 *
 * Validates the invariants of a normalized system and returns structured
 * diagnostics. This is distinct from blueprint schema validation
 * (`engine/blueprint.mjs`): it checks the MODEL, so any consumer of the CSM — not
 * only the current blueprint parser — is protected by the same invariants.
 *
 * It reuses the engine's `topologies.mjs` registry for the authoritative
 * kind→runtime rules, keeping a single source of truth.
 */

import {
  APPLICATION_KINDS,
  BACKEND_STYLES,
  CLIENT_MODES,
  COMMUNICATION_MODES,
  DATA_OWNERSHIP_MODES,
  DEPLOYMENT_COUPLINGS,
  ENVIRONMENT_KINDS,
  OPERATIONS_MATURITY_LEVELS,
  RUNTIMES,
  SYSTEM_PROFILES,
} from '../model/canonical-system.mjs';
import { CSM_DIAGNOSTIC_CODES as CODES, diagnostic } from '../model/diagnostics.mjs';
import { isRuntimeForKind } from '../engine/topologies.mjs';

const RUNTIME_SET = new Set(RUNTIMES);
const KIND_SET = new Set(APPLICATION_KINDS);
const ENVIRONMENT_KIND_SET = new Set(ENVIRONMENT_KINDS);
const MANDATORY_KIND = 'api';

const ARCHITECTURE_DIMENSIONS = Object.freeze([
  ['clients.mode', CLIENT_MODES],
  ['backend.style', BACKEND_STYLES],
  ['deployment.coupling', DEPLOYMENT_COUPLINGS],
  ['data.ownership', DATA_OWNERSHIP_MODES],
  ['communication.primary', COMMUNICATION_MODES],
  ['operations.maturity', OPERATIONS_MATURITY_LEVELS],
]);

function nestedValue(object, path) {
  return path.split('.').reduce((value, key) => value?.[key], object);
}

/**
 * Returns the structured diagnostics for a system. An empty array means the
 * system is coherent. Callers refuse the composition when any diagnostic is an
 * `error` (see `hasErrors`).
 */
export function validateCanonicalSystem(system) {
  const diagnostics = [];

  if (typeof system?.metadata?.name !== 'string' || system.metadata.name.trim() === '') {
    diagnostics.push(diagnostic(CODES.EMPTY_SYSTEM_NAME, 'metadata.name must be a non-empty system name', { path: 'metadata.name' }));
  }

  if (!SYSTEM_PROFILES.includes(system?.architecture?.profile)) {
    diagnostics.push(diagnostic(
      CODES.INVALID_SYSTEM_PROFILE,
      `architecture.profile '${system?.architecture?.profile}' is invalid; expected: ${SYSTEM_PROFILES.join(', ')}`,
      { path: 'architecture.profile', details: { expected: [...SYSTEM_PROFILES] } },
    ));
  }
  if (system?.architecture?.evolutionTarget !== undefined && !SYSTEM_PROFILES.includes(system.architecture.evolutionTarget)) {
    diagnostics.push(diagnostic(
      CODES.INVALID_SYSTEM_PROFILE,
      `architecture.evolutionTarget '${system.architecture.evolutionTarget}' is invalid; expected: ${SYSTEM_PROFILES.join(', ')}`,
      { path: 'architecture.evolutionTarget', details: { expected: [...SYSTEM_PROFILES] } },
    ));
  }
  for (const [path, allowed] of ARCHITECTURE_DIMENSIONS) {
    const value = nestedValue(system?.architecture, path);
    if (!allowed.includes(value)) {
      diagnostics.push(diagnostic(
        CODES.INVALID_ARCHITECTURE_DIMENSION,
        `architecture.${path} '${value}' is invalid; expected: ${allowed.join(', ')}`,
        { path: `architecture.${path}`, details: { expected: [...allowed] } },
      ));
    }
  }

  const applications = Array.isArray(system?.applications) ? system.applications : [];
  if (applications.length === 0) {
    diagnostics.push(diagnostic(CODES.INCOHERENT_STRUCTURE, 'a system must declare at least one application', { path: 'applications' }));
  }

  const seenIds = new Set();
  const ids = new Set(applications.map((app) => app?.id).filter(Boolean));
  applications.forEach((app, index) => {
    const path = `applications[${index}]`;
    if (!app || typeof app !== 'object') {
      diagnostics.push(diagnostic(CODES.INVALID_APPLICATION, 'application must be an object', { path }));
      return;
    }
    if (typeof app.id !== 'string' || app.id === '') {
      diagnostics.push(diagnostic(CODES.INVALID_APPLICATION, 'application.id must be a non-empty id', { path: `${path}.id` }));
    } else if (seenIds.has(app.id)) {
      diagnostics.push(diagnostic(CODES.DUPLICATE_APPLICATION_ID, `duplicate application id: ${app.id}`, { path: `${path}.id`, details: { id: app.id } }));
    }
    if (app.id) seenIds.add(app.id);

    if (!KIND_SET.has(app.kind)) {
      diagnostics.push(diagnostic(CODES.INVALID_APPLICATION, `application.kind '${app.kind}' is invalid; expected: ${APPLICATION_KINDS.join(', ')}`, { path: `${path}.kind` }));
    }
    if (!RUNTIME_SET.has(app.runtime)) {
      diagnostics.push(diagnostic(CODES.UNSUPPORTED_RUNTIME, `unsupported runtime: ${app.runtime}`, { path: `${path}.runtime`, details: { runtime: app.runtime } }));
    } else if (KIND_SET.has(app.kind) && !isRuntimeForKind(app.kind, app.runtime)) {
      diagnostics.push(diagnostic(CODES.INCOMPATIBLE_KIND_RUNTIME, `runtime ${app.runtime} is not valid for kind ${app.kind}`, { path: `${path}.runtime`, details: { kind: app.kind, runtime: app.runtime } }));
    }

    for (const target of app.consumes ?? []) {
      if (!ids.has(target)) {
        diagnostics.push(diagnostic(CODES.INCOHERENT_STRUCTURE, `application ${app.id} consumes unknown application ${target}`, { path: `${path}.consumes`, details: { target } }));
      }
    }
  });

  if (applications.length > 0 && !applications.some((app) => app.kind === MANDATORY_KIND)) {
    diagnostics.push(diagnostic(CODES.MISSING_API, 'a system must compose at least one API application', { path: 'applications' }));
  }

  // Multi-app strategy (hybrid): multi-surface (several web/mobile on one API) is
  // generatable; several APIs are not yet. Refuse the non-generatable topology
  // explicitly rather than accepting it and generating a partial project.
  const apiCount = applications.filter((app) => app.kind === MANDATORY_KIND).length;
  if (apiCount > 1) {
    diagnostics.push(diagnostic(
      CODES.TOPOLOGY_NOT_GENERATABLE,
      `multiple API applications are not generatable yet (${apiCount} declared)`,
      { path: 'applications', severity: 'warning', details: { apiCount } },
    ));
  }

  const clientCount = applications.filter((app) => app.kind === 'web' || app.kind === 'mobile').length;
  const declaredClientMode = system?.architecture?.clients?.mode;
  const actualClientMode = clientCount === 0 ? 'none' : clientCount === 1 ? 'single' : 'multiple';
  if (declaredClientMode !== actualClientMode) {
    diagnostics.push(diagnostic(
      CODES.INCOHERENT_STRUCTURE,
      `architecture.clients.mode '${declaredClientMode}' does not match ${clientCount} declared client application(s)`,
      { path: 'architecture.clients.mode', details: { actual: actualClientMode, clientCount } },
    ));
  }
  if (system?.architecture?.profile === 'backend-service' && clientCount > 0) {
    diagnostics.push(diagnostic(
      CODES.INCOHERENT_STRUCTURE,
      'backend-service cannot own official web or mobile clients; use product-platform',
      { path: 'architecture.profile' },
    ));
  }
  if (system?.architecture?.profile === 'product-platform' && clientCount === 0) {
    diagnostics.push(diagnostic(
      CODES.INCOHERENT_STRUCTURE,
      'product-platform requires at least one official web or mobile client; use backend-service',
      { path: 'architecture.profile' },
    ));
  }
  if (['distributed-platform', 'service-ecosystem'].includes(system?.architecture?.profile) && apiCount < 2) {
    diagnostics.push(diagnostic(
      CODES.INCOHERENT_STRUCTURE,
      `${system.architecture.profile} requires at least two backend authorities`,
      { path: 'architecture.profile', details: { apiCount } },
    ));
  }

  (system?.capabilities ?? []).forEach((capability, index) => {
    for (const target of capability.requestedTargets ?? []) {
      if (!ids.has(target)) {
        diagnostics.push(diagnostic(
          CODES.INVALID_CAPABILITY_TARGET,
          `capability ${capability.id} targets unknown application ${target}`,
          { path: `capabilities[${index}].requestedTargets`, details: { capability: capability.id, target } },
        ));
      }
    }
  });

  (system?.environments ?? []).forEach((environment, index) => {
    if (!ENVIRONMENT_KIND_SET.has(environment.kind)) {
      diagnostics.push(diagnostic(CODES.INCOHERENT_STRUCTURE, `environment kind '${environment.kind}' is invalid`, { path: `environments[${index}].kind` }));
    }
  });

  return diagnostics;
}
