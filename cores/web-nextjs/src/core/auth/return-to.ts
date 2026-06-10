/**
 * Validation **stricte** d'une destination de retour interne (`returnTo`) apres connexion - defense
 * **anti open-redirect**. Logique **pure** (sans Next), testable. N'accepte qu'un **chemin interne** ;
 * toute valeur externe / ambigue retombe sur `DEFAULT_RETURN_TO`.
 */
export const DEFAULT_RETURN_TO = "/protected";

const MAX_LENGTH = 512;
// Base **sentinelle** : toute URL qui s'evade de cette origine est consideree externe.
const SENTINEL_ORIGIN = "http://returnto.invalid";

/** Vrai si la chaine contient un caractere de controle, un espace, ou DEL (anti-CRLF / contournement). */
function hasControlOrSpace(value: string): boolean {
  for (let i = 0; i < value.length; i += 1) {
    const code = value.charCodeAt(i);
    if (code <= 0x20 || code === 0x7f) return true;
  }
  return false;
}

/** Cibles interdites : routes Auth (boucle) et endpoints API. */
function isForbiddenTarget(path: string): boolean {
  return (
    path === "/login" ||
    path.startsWith("/login/") ||
    path.startsWith("/login?") ||
    path === "/api" ||
    path.startsWith("/api/")
  );
}

/**
 * Retourne un chemin interne **sur** derive de `raw`, sinon `DEFAULT_RETURN_TO`. Refuse : non-chaine,
 * vide / trop longue, caracteres de controle / espaces, protocole-relatif (`//`), backslash, schema
 * (`javascript:`/`data:`/`https:`...), hote externe, `..`, encodages trompeurs, et les routes Auth/API.
 */
export function sanitizeReturnTo(raw: string | null | undefined): string {
  if (typeof raw !== "string") return DEFAULT_RETURN_TO;
  if (raw.length === 0 || raw.length > MAX_LENGTH) return DEFAULT_RETURN_TO;
  if (hasControlOrSpace(raw)) return DEFAULT_RETURN_TO;
  // Doit etre un chemin absolu interne ; jamais protocole-relatif ni backslash.
  if (!raw.startsWith("/") || raw.startsWith("//") || raw.startsWith("/\\")) return DEFAULT_RETURN_TO;

  let url: URL;
  try {
    url = new URL(raw, SENTINEL_ORIGIN);
  } catch {
    return DEFAULT_RETURN_TO;
  }
  // Schema absolu / hote => l'origine change => externe.
  if (url.origin !== SENTINEL_ORIGIN) return DEFAULT_RETURN_TO;

  const path = `${url.pathname}${url.search}`; // hash ignore
  if (!path.startsWith("/") || path.startsWith("//")) return DEFAULT_RETURN_TO;

  // Un double-encodage ne doit pas reintroduire `..`, `\`, `//`, un controle ou un espace.
  let decoded: string;
  try {
    decoded = decodeURIComponent(path);
  } catch {
    return DEFAULT_RETURN_TO;
  }
  if (
    hasControlOrSpace(decoded) ||
    decoded.includes("\\") ||
    decoded.includes("..") ||
    decoded.startsWith("//")
  ) {
    return DEFAULT_RETURN_TO;
  }
  if (isForbiddenTarget(path) || isForbiddenTarget(decoded)) return DEFAULT_RETURN_TO;

  return path;
}

/** Construit une URL `/login` **interne** portant un `returnTo` **assaini** et encode. */
export function buildLoginRedirect(returnTo: string = DEFAULT_RETURN_TO): string {
  return `/login?returnTo=${encodeURIComponent(sanitizeReturnTo(returnTo))}`;
}
