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
const SLUG = /^[a-z][a-z0-9-]{1,62}$/;

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

function profileMismatch(diagnostics, profile, path, actual, expected, rationale) {
  if (expected.includes(actual)) return;
  diagnostics.push(diagnostic(
    CODES.INCOHERENT_ARCHITECTURE_PROFILE,
    `${profile} requires architecture.${path} to be ${expected.join(' or ')}, got '${actual}': ${rationale}`,
    { path: `architecture.${path}`, details: { profile, actual, expected } },
  ));
}

function communicationCycle(applications) {
  const dependencies = new Map(applications.map((application) => [
    application.id,
    (application.consumes ?? []).filter((target) =>
      applications.some((candidate) => candidate.id === target)),
  ]));
  const visiting = new Set();
  const visited = new Set();
  const path = [];
  function visit(id) {
    if (visiting.has(id)) return [...path.slice(path.indexOf(id)), id];
    if (visited.has(id)) return null;
    visiting.add(id);
    path.push(id);
    for (const dependency of dependencies.get(id) ?? []) {
      const cycle = visit(dependency);
      if (cycle) return cycle;
    }
    path.pop();
    visiting.delete(id);
    visited.add(id);
    return null;
  }
  for (const application of applications) {
    const cycle = visit(application.id);
    if (cycle) return cycle;
  }
  return null;
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
  const domainOwners = new Map();
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

    if (app.ownership !== null && app.ownership !== undefined) {
      if (typeof app.ownership?.team !== 'string' || !SLUG.test(app.ownership.team)
        || !Array.isArray(app.ownership.domains) || app.ownership.domains.length === 0) {
        diagnostics.push(diagnostic(
          CODES.INVALID_OWNERSHIP,
          `application ${app.id} ownership requires a team and at least one domain`,
          { path: `${path}.ownership`, details: { application: app.id } },
        ));
      } else {
        for (const domain of app.ownership.domains) {
          if (typeof domain !== 'string' || !SLUG.test(domain)) {
            diagnostics.push(diagnostic(
              CODES.INVALID_OWNERSHIP,
              `application ${app.id} owns an invalid domain`,
              { path: `${path}.ownership.domains`, details: { application: app.id, domain } },
            ));
          } else if (domainOwners.has(domain)) {
            diagnostics.push(diagnostic(
              CODES.INVALID_OWNERSHIP,
              `data domain ${domain} has multiple authorities: ${domainOwners.get(domain)} and ${app.id}`,
              { path: `${path}.ownership.domains`, details: { domain, owners: [domainOwners.get(domain), app.id] } },
            ));
          } else {
            domainOwners.set(domain, app.id);
          }
        }
      }
    }
  });

  if (applications.length > 0 && !applications.some((app) => app.kind === MANDATORY_KIND)) {
    diagnostics.push(diagnostic(CODES.MISSING_API, 'a system must compose at least one API application', { path: 'applications' }));
  }

  const apiCount = applications.filter((app) => app.kind === MANDATORY_KIND).length;

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

  const architectureProfile = system?.architecture?.profile;
  if (architectureProfile === 'backend-service') {
    profileMismatch(
      diagnostics,
      architectureProfile,
      'backend.style',
      system.architecture.backend.style,
      ['modular-monolith'],
      'one backend authority remains internally modular',
    );
  }
  if (architectureProfile === 'product-platform') {
    profileMismatch(
      diagnostics,
      architectureProfile,
      'backend.style',
      system.architecture.backend.style,
      ['modular-monolith'],
      'several official clients do not imply a distributed backend',
    );
  }
  if (architectureProfile === 'distributed-platform') {
    profileMismatch(
      diagnostics,
      architectureProfile,
      'backend.style',
      system.architecture.backend.style,
      ['distributed-services'],
      'selected backend authorities are physically separated',
    );
    profileMismatch(
      diagnostics,
      architectureProfile,
      'data.ownership',
      system.architecture.data.ownership,
      ['bounded-context', 'per-service'],
      'every distributed authority needs explicit data ownership',
    );
    profileMismatch(
      diagnostics,
      architectureProfile,
      'operations.maturity',
      system.architecture.operations.maturity,
      ['advanced', 'distributed'],
      'several deployable authorities require distributed operational controls',
    );
    for (const [index, app] of applications.entries()) {
      if (app.kind === 'api' && app.ownership === null) {
        diagnostics.push(diagnostic(
          CODES.INVALID_OWNERSHIP,
          `distributed backend authority ${app.id} must declare its team and owned data domains`,
          { path: `applications[${index}].ownership`, details: { application: app.id } },
        ));
      }
    }
  }
  if (architectureProfile === 'service-ecosystem') {
    profileMismatch(
      diagnostics,
      architectureProfile,
      'backend.style',
      system.architecture.backend.style,
      ['microservices'],
      'autonomous services are the defining backend style',
    );
    profileMismatch(
      diagnostics,
      architectureProfile,
      'deployment.coupling',
      system.architecture.deployment.coupling,
      ['independent'],
      'each service must be independently deployable',
    );
    profileMismatch(
      diagnostics,
      architectureProfile,
      'data.ownership',
      system.architecture.data.ownership,
      ['per-service'],
      'a service cannot share persistence authority with another service',
    );
    profileMismatch(
      diagnostics,
      architectureProfile,
      'operations.maturity',
      system.architecture.operations.maturity,
      ['distributed'],
      'partial failures and per-service SLOs must be operable',
    );
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

  const communications = Array.isArray(system?.communications) ? system.communications : [];
  const communicationIds = new Set();
  communications.forEach((communication, index) => {
    const path = `communications[${index}]`;
    if (!communication || typeof communication !== 'object') {
      diagnostics.push(diagnostic(CODES.INVALID_COMMUNICATION, 'communication must be an object', { path }));
      return;
    }
    if (typeof communication.id !== 'string' || communication.id === '' || communicationIds.has(communication.id)) {
      diagnostics.push(diagnostic(
        CODES.INVALID_COMMUNICATION,
        `communication id '${communication.id}' must be non-empty and unique`,
        { path: `${path}.id`, details: { id: communication.id } },
      ));
    }
    communicationIds.add(communication.id);
    if (!ids.has(communication.from) || !ids.has(communication.to) || communication.from === communication.to) {
      diagnostics.push(diagnostic(
        CODES.INVALID_COMMUNICATION,
        `communication ${communication.id} must connect two distinct existing applications`,
        { path, details: { from: communication.from, to: communication.to } },
      ));
    }
    const source = applications.find((app) => app.id === communication.from);
    if (source && !(source.consumes ?? []).includes(communication.to)) {
      diagnostics.push(diagnostic(
        CODES.INCOHERENT_COMMUNICATION_GRAPH,
        `communication ${communication.id} is not declared by ${communication.from}.consumes`,
        { path, details: { from: communication.from, to: communication.to } },
      ));
    }
    if (!['synchronous', 'asynchronous'].includes(communication.mode)
      || !['http', 'amqp'].includes(communication.protocol)
      || typeof communication.contract !== 'string'
      || !/^[a-z][a-z0-9.-]*\.v[1-9][0-9]*$/.test(communication.contract)
      || !Number.isInteger(communication.timeoutMs)
      || communication.timeoutMs < 1
      || !Number.isInteger(communication.maxAttempts)
      || communication.maxAttempts < 1
      || communication.maxAttempts > 5
      || communication.identity !== 'workload'
      || !['fail-fast', 'degrade', 'queue'].includes(communication.failurePolicy)) {
      diagnostics.push(diagnostic(
        CODES.INVALID_COMMUNICATION,
        `communication ${communication.id} has an invalid policy contract`,
        { path, details: { communication: communication.id } },
      ));
    }
  });

  if (architectureProfile === 'distributed-platform') {
    const declaredEdges = new Set(communications.map((communication) => `${communication.from}->${communication.to}`));
    for (const [index, app] of applications.entries()) {
      for (const target of app.consumes ?? []) {
        if (!declaredEdges.has(`${app.id}->${target}`)) {
          diagnostics.push(diagnostic(
            CODES.INCOHERENT_COMMUNICATION_GRAPH,
            `distributed dependency ${app.id} -> ${target} requires an explicit communication contract`,
            { path: `applications[${index}].consumes`, details: { from: app.id, to: target } },
          ));
        }
      }
    }
    if (communications.length === 0) {
      diagnostics.push(diagnostic(
        CODES.INCOHERENT_COMMUNICATION_GRAPH,
        'distributed-platform requires at least one explicit communication edge',
        { path: 'communications' },
      ));
    }
    const cycle = communicationCycle(applications);
    if (cycle) {
      diagnostics.push(diagnostic(
        CODES.INCOHERENT_COMMUNICATION_GRAPH,
        `the first distributed slice requires an acyclic deployment graph; cycle: ${cycle.join(' -> ')}`,
        { path: 'applications', details: { cycle } },
      ));
    }
  }

  (system?.environments ?? []).forEach((environment, index) => {
    if (!ENVIRONMENT_KIND_SET.has(environment.kind)) {
      diagnostics.push(diagnostic(CODES.INCOHERENT_STRUCTURE, `environment kind '${environment.kind}' is invalid`, { path: `environments[${index}].kind` }));
    }
  });

  return diagnostics;
}
