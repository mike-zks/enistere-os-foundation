/**
 * Application-kind registry — the frozen socle shape for the canonical
 * SystemBlueprint model (Contrat 1).
 *
 * A blueprint composes a list of deployable applications. Each application has a
 * `kind`; the kind decides its runtime slot and whether it is generatable today.
 * The registry expresses the FULL long-term vision (workers, gateways, BFFs) but
 * gates generation by `status`: adding a `worker` runtime later flips a status
 * and ships an adapter — it never changes this shape or the blueprint schema.
 *
 * - `api`    : mandatory invariant. A Foundation project always composes an API.
 * - `web`    / `mobile` : optional client surfaces. Generatable today.
 * - `worker` / `gateway` / `bff` : declared, `planned` — refused at generation
 *              until their distributed capability packs are proven (Phase D).
 *
 * `slot` maps a kind to the `stack.{api,web,mobile}` sugar slot for the
 * single-surface sugar; kinds without a slot (worker/gateway/bff) exist only in
 * the canonical `applications[]` form.
 */
export const APPLICATION_KINDS = Object.freeze({
  api: Object.freeze({ slot: 'api', status: 'ready', runtimes: Object.freeze(['nestjs', 'spring']) }),
  web: Object.freeze({ slot: 'web', status: 'ready', runtimes: Object.freeze(['nextjs', 'angular']) }),
  mobile: Object.freeze({ slot: 'mobile', status: 'ready', runtimes: Object.freeze(['react-native', 'flutter']) }),
  worker: Object.freeze({ slot: null, status: 'planned', runtimes: Object.freeze(['nestjs', 'spring']) }),
  gateway: Object.freeze({ slot: null, status: 'planned', runtimes: Object.freeze(['nestjs']) }),
  bff: Object.freeze({ slot: null, status: 'planned', runtimes: Object.freeze(['nestjs', 'nextjs']) }),
});

export const APPLICATION_KIND_IDS = Object.freeze(Object.keys(APPLICATION_KINDS));

/** Kinds a blueprint can generate today (status `ready`). */
export const GENERATABLE_KINDS = Object.freeze(
  APPLICATION_KIND_IDS.filter((kind) => APPLICATION_KINDS[kind].status === 'ready'),
);

/** The mandatory kind: every Foundation project composes around an API. */
export const MANDATORY_KIND = 'api';

/** Slots of the single-surface sugar, in canonical order. */
export const SUGAR_SLOTS = Object.freeze(['api', 'web', 'mobile']);

export function applicationKind(kind) {
  return APPLICATION_KINDS[kind] ?? null;
}

export function isGeneratableKind(kind) {
  return APPLICATION_KINDS[kind]?.status === 'ready';
}

/** True when `runtime` is valid for `kind`. */
export function isRuntimeForKind(kind, runtime) {
  return Boolean(APPLICATION_KINDS[kind]?.runtimes.includes(runtime));
}
