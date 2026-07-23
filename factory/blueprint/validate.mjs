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
  ENVIRONMENT_KINDS,
  RUNTIMES,
  SUPPORTED_ARCHITECTURE_STYLES,
} from '../model/canonical-system.mjs';
import { CSM_DIAGNOSTIC_CODES as CODES, diagnostic } from '../model/diagnostics.mjs';
import { isRuntimeForKind } from '../engine/topologies.mjs';

const RUNTIME_SET = new Set(RUNTIMES);
const KIND_SET = new Set(APPLICATION_KINDS);
const ENVIRONMENT_KIND_SET = new Set(ENVIRONMENT_KINDS);
const MANDATORY_KIND = 'api';

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

  if (!SUPPORTED_ARCHITECTURE_STYLES.includes(system?.architecture?.style)) {
    diagnostics.push(diagnostic(
      CODES.UNSUPPORTED_ARCHITECTURE_STYLE,
      `architecture.style '${system?.architecture?.style}' is not supported; supported: ${SUPPORTED_ARCHITECTURE_STYLES.join(', ')}`,
      { path: 'architecture.style', details: { supported: [...SUPPORTED_ARCHITECTURE_STYLES] } },
    ));
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
      { path: 'applications', details: { apiCount } },
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
