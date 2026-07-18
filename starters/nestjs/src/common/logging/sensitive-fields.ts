import { REDACTED } from './logging.constants';

/**
 * Redaction CENTRALISÉE (ADR-040). Liste de clés sensibles (insensible à la casse) masquées dans
 * tout log, à n'importe quelle profondeur. La clé `url`/`*url` n'est masquée que si la **valeur**
 * ressemble à une URL **signée** (la documentation distingue URL technique autorisée / URL signée
 * interdite). Centralisé : jamais dispersé dans chaque module.
 */
export const SENSITIVE_KEYS: ReadonlySet<string> = new Set(
  [
    'authorization',
    'cookie',
    'set-cookie',
    'password',
    'passwordhash',
    'accesstoken',
    'refreshtoken',
    'tokenhash',
    'jwt',
    'secret',
    'clientsecret',
    'accesskey',
    'secretkey',
    'database_url',
    's3_access_key_id',
    's3_secret_access_key',
    'jwt_access_secret',
    'jwt_refresh_secret',
    'refresh_token_hash_secret',
    'signedurl',
    'storagekey',
    'checksum',
  ].map((k) => k.toLowerCase()),
);

const SIGNED_URL_MARKERS = ['x-amz-signature', 'x-amz-credential', 'signature='];

function looksLikeSignedUrl(value: unknown): boolean {
  if (typeof value !== 'string') {
    return false;
  }
  const lower = value.toLowerCase();
  return SIGNED_URL_MARKERS.some((marker) => lower.includes(marker));
}

/** Masque les sous-chaînes sensibles d'un texte libre (messages/stacks d'erreurs externes). */
export function scrubString(input: string): string {
  return input
    // credentials dans une chaîne de connexion : scheme://user:PASSWORD@host
    .replace(/(\b[a-z][a-z0-9+.-]*:\/\/[^\s:/@]+:)[^\s@]+(@)/gi, `$1${REDACTED}$2`)
    // paramètres d'URL signée
    .replace(/x-amz-signature=[^&\s"']+/gi, `x-amz-signature=${REDACTED}`)
    .replace(/x-amz-credential=[^&\s"']+/gi, `x-amz-credential=${REDACTED}`)
    // jeton bearer
    .replace(/(bearer\s+)[a-z0-9._-]+/gi, `$1${REDACTED}`);
}

function redactValue(value: unknown, seen: WeakSet<object>): unknown {
  if (typeof value === 'string') {
    return value;
  }
  if (Array.isArray(value)) {
    return value.map((item) => redactValue(item, seen));
  }
  if (value !== null && typeof value === 'object') {
    if (seen.has(value)) {
      return '[Circular]';
    }
    seen.add(value);
    const result: Record<string, unknown> = {};
    for (const [key, raw] of Object.entries(value)) {
      const lower = key.toLowerCase();
      if (SENSITIVE_KEYS.has(lower) || ((lower === 'url' || lower.endsWith('url')) && looksLikeSignedUrl(raw))) {
        result[key] = REDACTED;
      } else if ((lower === 'err' || lower === 'error') && raw instanceof Error) {
        // Laisse le sérialiseur d'erreur Pino (liste blanche + scrub) traiter l'instance Error.
        result[key] = raw;
      } else {
        result[key] = redactValue(raw, seen);
      }
    }
    return result;
  }
  return value;
}

/**
 * Redaction récursive par CLÉ (objets, tableaux, imbrications), avec protection contre les cycles.
 * Ne masque jamais aveuglément `url` (seulement si la valeur est une URL signée). Générique :
 * conserve le type du conteneur fourni (utile pour `formatters.log` de Pino).
 */
export function redactDeep<T>(value: T): T {
  return redactValue(value, new WeakSet<object>()) as T;
}
