/**
 * Generic, stable, typed query-key factory (RN 5 — server-state data layer).
 *
 * Query keys are the cache identity in TanStack Query (ADR-012). This factory
 * builds NAMESPACED, hierarchical keys so that scopes never collide and partial
 * keys can target a whole scope for invalidation. It is GENERIC — `scope` is any
 * caller-defined string; there is NO business/domain shape here.
 *
 * Stability: {@link normalizeParams} produces a deterministic representation of
 * a params object (sorted keys, `undefined` dropped), so the SAME logical params
 * always yield the SAME key regardless of object construction order — a cache
 * hit, not a miss.
 *
 * SECURITY (ADR-015): NEVER put a token, Authorization header, signed URL or any
 * sensitive value in a query key — keys are kept in memory by the cache and can
 * surface in dev tools.
 *
 * Pure and framework-agnostic → unit-testable under `node --test`.
 */

/** A query key is a readonly tuple of serialisable segments. */
export type QueryKey = readonly unknown[];

/** Identifier segment for a single resource. */
export type QueryKeyId = string | number;

/** A params object used to scope a list/collection key. */
export type QueryKeyParams = Record<string, unknown>;

/**
 * Deterministic representation of `params`: keys sorted, `undefined` values
 * dropped. `{ b: 2, a: 1 }` and `{ a: 1, b: 2, c: undefined }` both normalise to
 * `{ a: 1, b: 2 }` → identical query keys → cache hit.
 */
export function normalizeParams(params: QueryKeyParams): Record<string, unknown> {
  const normalized: Record<string, unknown> = {};
  for (const key of Object.keys(params).sort()) {
    const value = params[key];
    if (value !== undefined) {
      normalized[key] = value;
    }
  }
  return normalized;
}

/**
 * Builds a namespaced key factory for `scope`. All produced keys start with
 * `[scope, …]`, so `invalidate(all)` matches every key in the scope, while
 * `list`/`detail` target sub-trees. `of(...)` escapes to an arbitrary sub-key.
 */
export function createQueryKeys<const Scope extends string>(scope: Scope) {
  return {
    /** The whole scope: `[scope]` — use to invalidate everything under it. */
    all: [scope] as const,
    /** All lists in the scope: `[scope, 'list']`. */
    lists: () => [scope, 'list'] as const,
    /** A list, optionally scoped by stable params: `[scope, 'list', params?]`. */
    list: (params?: QueryKeyParams) =>
      params === undefined
        ? ([scope, 'list'] as const)
        : ([scope, 'list', normalizeParams(params)] as const),
    /** All details in the scope: `[scope, 'detail']`. */
    details: () => [scope, 'detail'] as const,
    /** A single resource by id: `[scope, 'detail', id]`. */
    detail: (id: QueryKeyId) => [scope, 'detail', id] as const,
    /** An arbitrary sub-key under the scope: `[scope, ...segments]`. */
    of: <const Segments extends readonly unknown[]>(...segments: Segments) =>
      [scope, ...segments] as const,
  } as const;
}

/** The shape returned by {@link createQueryKeys} (handy for typing modules). */
export type QueryKeys<Scope extends string = string> = ReturnType<typeof createQueryKeys<Scope>>;
