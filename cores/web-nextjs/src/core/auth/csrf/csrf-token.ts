/**
 * Jeton CSRF (stratégie double-submit) — **sans secret d'authentification**, sans persistance serveur.
 * Valeur aléatoire à forte entropie (256 bits), encodée base64url.
 */

const CSRF_BYTES = 32; // 256 bits
// base64url : 43 caractères pour 32 octets ; on borne large pour tolérer d'autres longueurs valides.
const CSRF_TOKEN_PATTERN = /^[A-Za-z0-9_-]{32,128}$/;

/** Génère un jeton CSRF (256 bits, base64url). Aucune persistance. */
export function generateCsrfToken(): string {
  const bytes = new Uint8Array(CSRF_BYTES);
  crypto.getRandomValues(bytes);
  return Buffer.from(bytes).toString("base64url");
}

/** Format strict d'un jeton CSRF (charset base64url, longueur bornée). */
export function isValidCsrfFormat(token: string): boolean {
  return typeof token === "string" && CSRF_TOKEN_PATTERN.test(token);
}

/** Comparaison à temps constant de deux chaînes de **même longueur**. */
function timingSafeEqualStrings(a: string, b: string): boolean {
  let diff = 0;
  for (let i = 0; i < a.length; i += 1) {
    diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return diff === 0;
}

/**
 * Valide le double-submit : cookie et en-tête doivent être présents, de format valide, de **même
 * longueur**, et **égaux** (comparaison à temps constant). N'expose jamais les valeurs.
 */
export function validateCsrfToken(
  cookieToken: string | undefined | null,
  headerToken: string | undefined | null,
): boolean {
  if (!cookieToken || !headerToken) {
    return false;
  }
  if (!isValidCsrfFormat(cookieToken) || !isValidCsrfFormat(headerToken)) {
    return false;
  }
  if (cookieToken.length !== headerToken.length) {
    return false;
  }
  return timingSafeEqualStrings(cookieToken, headerToken);
}
