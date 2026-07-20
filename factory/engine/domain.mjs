/**
 * Domain seam — the plug-in shape for the domain compiler (R9).
 *
 * The domain is NOT a new subsystem: it is a **synthetic capability** computed
 * from the blueprint entities (and, later, `applications[].modules`) rather than
 * authored on disk. A target renders its domain through its adapter's optional
 * `renderDomain(entities)`, producing the SAME overlay-shaped contribution as any
 * capability (`files`, `dependencies`, `environment`, `integrations`, `contract`,
 * `verification`). It therefore flows through the exact same composition pipeline
 * in `overlay.mjs` — one renderer per target, gated by a support status, no
 * per-target pipeline and no combinatorial explosion.
 *
 * Phase 0 freezes this seam (contract + extension point). Phase A fills
 * `renderDomain` on the NestJS adapter (Prisma models + CRUD module per entity +
 * typed client); other targets stay `planned` and still consume the contract.
 */

const SEMVER = /^\d+\.\d+\.\d+$/;

/**
 * Domain support status of a target, in the capability-status vocabulary:
 * - `not-applicable` : the blueprint declares no entities — no domain surface;
 * - `ready`          : the target adapter provides a `renderDomain` renderer;
 * - `planned`        : entities exist but this target has no renderer yet — the
 *                      contract (OpenAPI/domain.json) is still emitted, no code.
 */
export function domainStatusFor(adapter, entities = []) {
  if (!Array.isArray(entities) || entities.length === 0) return 'not-applicable';
  return typeof adapter?.renderDomain === 'function' ? 'ready' : 'planned';
}

/**
 * Builds the domain's overlay-shaped contribution for one target, or `null` when
 * there is nothing to compose (no entities, or the target has no renderer). The
 * returned shape is identical to a loaded capability overlay so the engine can
 * apply it with the same `copyOverlayEntry`/`mergeDependencies`/integration code.
 */
export function buildDomainContribution(entities, adapter) {
  if (domainStatusFor(adapter, entities) !== 'ready') return null;
  const rendered = adapter.renderDomain(entities);
  if (!rendered || typeof rendered !== 'object') {
    throw new Error(`${adapter.id}: renderDomain must return a contribution object`);
  }
  if (!SEMVER.test(rendered.version ?? '')) {
    throw new Error(`${adapter.id}: domain contribution version must use SemVer`);
  }
  return {
    capability: 'domain',
    target: adapter.id,
    version: rendered.version,
    files: rendered.files ?? [],
    dependencies: rendered.dependencies ?? {},
    environment: rendered.environment ?? [],
    integrations: rendered.integrations ?? [],
    contract: rendered.contract ?? {},
    verification: rendered.verification ?? [],
  };
}
