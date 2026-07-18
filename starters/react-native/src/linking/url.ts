/**
 * Pure URL / deep-link parser (RN 12 — deep-linking / routing).
 *
 * A small, deterministic parser that handles both custom-scheme deep links
 * (`myapp://home/details?id=1`) and `https` universal links. It deliberately
 * does NOT use the global `URL` (whose behaviour for non-special schemes varies
 * across RN/Hermes/Node) so the result is predictable and `node --test`-able.
 *
 * SECURITY (07_SECURITY) : this layer only PARSES — it never follows a link,
 * never logs, never stores a full URL. Safety decisions live in
 * {@link resolveLink} (allowlist, open-redirect, sensitive params).
 *
 * PURE / framework-agnostic (no React/RN/ESM import) → unit-tested under
 * `node --test`.
 */

/** Structured view of a parsed link. */
export interface ParsedLink {
  /** Lowercased scheme without the `:` (null when the input is relative). */
  readonly scheme: string | null;
  /** Lowercased authority host (null when absent / opaque). */
  readonly host: string | null;
  /** Path component (may be empty; not yet normalised). */
  readonly path: string;
  /** Decoded query parameters (flat). */
  readonly query: Readonly<Record<string, string>>;
  /** Raw fragment after `#` (null when absent). */
  readonly fragment: string | null;
}

/** `decodeURIComponent` that returns the input unchanged on malformed escapes. */
export function decodeSafe(value: string): string {
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
}

function parseQuery(queryString: string): Record<string, string> {
  const out: Record<string, string> = {};
  if (queryString.length === 0) {
    return out;
  }
  for (const pair of queryString.split('&')) {
    if (pair.length === 0) {
      continue;
    }
    const eq = pair.indexOf('=');
    const rawKey = eq >= 0 ? pair.slice(0, eq) : pair;
    const rawValue = eq >= 0 ? pair.slice(eq + 1) : '';
    const key = decodeSafe(rawKey.replace(/\+/g, ' '));
    if (key.length === 0) {
      continue;
    }
    out[key] = decodeSafe(rawValue.replace(/\+/g, ' '));
  }
  return out;
}

/**
 * Parse an arbitrary string into a {@link ParsedLink}, or `null` when it is not a
 * string / empty. Never throws. Relative inputs (`/path`) yield `scheme: null`.
 */
export function parseDeepLink(input: unknown): ParsedLink | null {
  if (typeof input !== 'string') {
    return null;
  }
  let rest = input.trim();
  if (rest.length === 0) {
    return null;
  }

  // Fragment.
  let fragment: string | null = null;
  const hashIndex = rest.indexOf('#');
  if (hashIndex >= 0) {
    fragment = rest.slice(hashIndex + 1);
    rest = rest.slice(0, hashIndex);
  }

  // Scheme.
  let scheme: string | null = null;
  let afterScheme = rest;
  const schemeMatch = /^([a-zA-Z][a-zA-Z0-9+.-]*):(.*)$/.exec(rest);
  if (schemeMatch) {
    scheme = (schemeMatch[1] ?? '').toLowerCase();
    afterScheme = schemeMatch[2] ?? '';
  }

  // Authority (host) when `//` is present.
  let host: string | null = null;
  let pathAndQuery = afterScheme;
  if (afterScheme.startsWith('//')) {
    const authorityAndRest = afterScheme.slice(2);
    const slashOrQuery = authorityAndRest.search(/[/?]/);
    const authority = slashOrQuery >= 0 ? authorityAndRest.slice(0, slashOrQuery) : authorityAndRest;
    pathAndQuery = slashOrQuery >= 0 ? authorityAndRest.slice(slashOrQuery) : '';
    host = authority.length > 0 ? authority.toLowerCase() : null;
  }

  // Query.
  let path = pathAndQuery;
  let query: Readonly<Record<string, string>> = {};
  const questionIndex = pathAndQuery.indexOf('?');
  if (questionIndex >= 0) {
    path = pathAndQuery.slice(0, questionIndex);
    query = parseQuery(pathAndQuery.slice(questionIndex + 1));
  }

  return { scheme, host, path, query, fragment };
}

/**
 * Trim a URL and lowercase its scheme + authority (host casing is
 * insignificant). Path/query/fragment are left untouched. Returns `''` for a
 * non-string input. Never throws.
 */
export function normalizeUrl(input: unknown): string {
  if (typeof input !== 'string') {
    return '';
  }
  return input
    .trim()
    .replace(
      /^([a-zA-Z][a-zA-Z0-9+.-]*:)?(\/\/[^/?#]*)?/,
      (_match, scheme: string | undefined, authority: string | undefined) =>
        `${scheme ? scheme.toLowerCase() : ''}${authority ? authority.toLowerCase() : ''}`,
    );
}
