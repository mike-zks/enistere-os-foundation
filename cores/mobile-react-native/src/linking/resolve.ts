/**
 * Deep-link → internal route resolution (RN 12 — deep-linking / routing).
 *
 * Turns an incoming link into one of:
 * - `internal`        — a validated, safe in-app {@link LinkRoute};
 * - `externalBlocked` — a link whose scheme/host is NOT in the allowlist;
 * - `invalid`         — empty / unparseable / unsafe.
 *
 * SECURITY (07_SECURITY §7/§8) — the whole point of this layer:
 * - **Strict allowlist** of schemes (custom + `https`) and of `https` hosts;
 *   everything else is `externalBlocked` (`http` too — insecure).
 * - **No open redirect**: a resolved route that still encodes `//authority` or an
 *   absolute `scheme://` is blocked; path traversal (`..`) is rejected.
 * - **Sensitive query params dropped** (token/secret/code/signature/…): they
 *   never reach the route, and a full/sensitive URL is never kept.
 * - **Bounded** params (count/length) and path length.
 * This layer never logs and never stores the link (mission).
 *
 * The foundation ships GENERIC primitives — **derived projects define their own
 * concrete routes** by mapping `route.path`/`route.params`.
 *
 * PURE / framework-agnostic (no React/RN/ESM import) → `node --test`-able.
 */
import { parseDeepLink } from './url';

/** An allowed scheme (e.g. `myapp`, or `https` to permit universal links). */
export type AllowedScheme = string;

/** A validated, safe in-app route. */
export interface LinkRoute {
  /** Internal path, always begins with `/`. */
  readonly path: string;
  /** Safe, bounded query params (sensitive ones removed). */
  readonly params: Readonly<Record<string, string>>;
}

export type ExternalReason = 'external_scheme' | 'external_host' | 'insecure_scheme' | 'open_redirect';
export type InvalidReason = 'empty' | 'unparseable' | 'unsafe_path';

/** Result of resolving a link. */
export type LinkResolution =
  | { readonly kind: 'internal'; readonly route: LinkRoute }
  | { readonly kind: 'externalBlocked'; readonly reason: ExternalReason }
  | { readonly kind: 'invalid'; readonly reason: InvalidReason };

export interface LinkingConfig {
  /** Allowed schemes — custom (e.g. `myapp`) and/or `https` for universal links. */
  readonly schemes: readonly AllowedScheme[];
  /** Allowed hosts for `https` universal links (required to accept any). */
  readonly hosts?: readonly string[];
  /** Extra query-param names to drop (merged with the built-in sensitive set). */
  readonly sensitiveParams?: readonly string[];
  /** Max kept params (default 32). */
  readonly maxParams?: number;
  /** Max kept length of a param value (default 512). */
  readonly maxParamValueLength?: number;
  /** Max kept length of the route path (default 1024). */
  readonly maxPathLength?: number;
}

/** Query-param names always removed from a resolved route. */
const DEFAULT_SENSITIVE_PARAMS: readonly string[] = [
  'token',
  'access_token',
  'refresh_token',
  'id_token',
  'secret',
  'password',
  'pwd',
  'code',
  'sig',
  'signature',
  'key',
  'apikey',
  'auth',
  'authorization',
  'otp',
  'session',
  'jwt',
  'bearer',
];

const MAX_PARAMS = 32;
const MAX_PARAM_VALUE_LENGTH = 512;
const MAX_PATH_LENGTH = 1024;

/** Reject path traversal; ensure a single leading `/`. Returns null if unsafe. */
function sanitizePath(input: string): string | null {
  let path = input.length === 0 ? '/' : input;
  if (!path.startsWith('/')) {
    path = `/${path}`;
  }
  const segments = path.split('/');
  if (segments.some((segment) => segment === '..' || segment === '.')) {
    return null;
  }
  return path;
}

function sanitizeParams(
  query: Readonly<Record<string, string>>,
  config: LinkingConfig,
): Record<string, string> {
  const sensitive = new Set(
    [...DEFAULT_SENSITIVE_PARAMS, ...(config.sensitiveParams ?? [])].map((p) => p.toLowerCase()),
  );
  const maxParams = config.maxParams ?? MAX_PARAMS;
  const maxValue = config.maxParamValueLength ?? MAX_PARAM_VALUE_LENGTH;
  const out: Record<string, string> = {};
  let kept = 0;
  for (const [key, value] of Object.entries(query)) {
    if (kept >= maxParams) {
      break;
    }
    if (sensitive.has(key.toLowerCase())) {
      continue; // sensitive param dropped entirely (never kept/redacted in a route)
    }
    out[key] = value.slice(0, maxValue);
    kept += 1;
  }
  return out;
}

/** Resolve an incoming link to a safe {@link LinkResolution}. Never throws. */
export function resolveLink(input: unknown, config: LinkingConfig): LinkResolution {
  if (typeof input !== 'string' || input.trim().length === 0) {
    return { kind: 'invalid', reason: 'empty' };
  }
  const parsed = parseDeepLink(input);
  if (!parsed) {
    return { kind: 'invalid', reason: 'unparseable' };
  }

  const schemes = config.schemes.map((s) => s.toLowerCase());
  let candidatePath: string;

  if (parsed.scheme === null) {
    // Relative input — only an absolute internal path is acceptable.
    if (!parsed.path.startsWith('/')) {
      return { kind: 'invalid', reason: 'unparseable' };
    }
    candidatePath = parsed.path;
  } else if (parsed.scheme === 'https') {
    if (!schemes.includes('https')) {
      return { kind: 'externalBlocked', reason: 'external_scheme' };
    }
    const allowedHosts = (config.hosts ?? []).map((h) => h.toLowerCase());
    if (parsed.host === null || !allowedHosts.includes(parsed.host)) {
      return { kind: 'externalBlocked', reason: 'external_host' };
    }
    candidatePath = parsed.path.length > 0 ? parsed.path : '/';
  } else if (parsed.scheme === 'http') {
    return { kind: 'externalBlocked', reason: 'insecure_scheme' };
  } else if (schemes.includes(parsed.scheme)) {
    // Custom app scheme: the authority is the first route segment.
    const hostSegment = parsed.host ? `/${parsed.host}` : '';
    candidatePath = `${hostSegment}${parsed.path}`;
  } else {
    return { kind: 'externalBlocked', reason: 'external_scheme' };
  }

  const safePath = sanitizePath(candidatePath);
  if (safePath === null) {
    return { kind: 'invalid', reason: 'unsafe_path' };
  }
  // Open-redirect guard: a route must not encode an external authority/URL.
  if (/^\/\//.test(safePath) || /[a-zA-Z][a-zA-Z0-9+.-]*:\/\//.test(safePath)) {
    return { kind: 'externalBlocked', reason: 'open_redirect' };
  }

  const path = safePath.slice(0, config.maxPathLength ?? MAX_PATH_LENGTH);
  const params = sanitizeParams(parsed.query, config);
  return { kind: 'internal', route: { path, params } };
}

/** True when `input` resolves to a safe internal route. */
export function isInternalRoute(input: unknown, config: LinkingConfig): boolean {
  return resolveLink(input, config).kind === 'internal';
}

export interface NotificationLinkOptions {
  /** Which `data` key holds the link (default `link`). */
  readonly key?: string;
}

/**
 * Resolve a link carried in a notification's `data` (RN 10). Reads a CONFIGURABLE
 * key (default `link`) — it assumes NO business content. A missing/non-string
 * value resolves to `invalid`.
 */
export function resolveNotificationLink(
  data: Readonly<Record<string, unknown>> | null | undefined,
  config: LinkingConfig,
  options?: NotificationLinkOptions,
): LinkResolution {
  if (!data || typeof data !== 'object') {
    return { kind: 'invalid', reason: 'empty' };
  }
  const key = options?.key ?? 'link';
  return resolveLink((data as Record<string, unknown>)[key], config);
}
