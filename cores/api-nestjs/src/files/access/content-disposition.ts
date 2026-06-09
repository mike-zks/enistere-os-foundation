/**
 * Construction d'un en-tête `Content-Disposition` SÛR pour un téléchargement (Upload 3).
 *
 * `originalName` est une métadonnée NON fiable : il ne doit jamais être injecté tel quel dans
 * un header HTTP (risque d'injection CR/LF, de guillemets cassant le header, de caractères de
 * contrôle). On produit toujours :
 *
 *     attachment; filename="<fallback-ascii-sûr>"; filename*=UTF-8''<nom-encodé-RFC5987>
 *
 * - `filename` : repli ASCII strict (compatible tous clients), sans guillemet ni contrôle ;
 * - `filename*` : nom UTF-8 encodé RFC 5987 (clients modernes), pour préserver les accents.
 *
 * Aucune valeur ne peut contenir CR/LF : les caractères de contrôle sont retirés et l'encodage
 * RFC 5987 percent-encode tout ce qui n'est pas un caractère sûr.
 */
const FALLBACK_NAME = 'download';
const MAX_NAME_LENGTH = 100;

/** Nettoyage commun : basename, suppression des contrôles/guillemets/séparateurs, bornage. */
export function sanitizeDownloadName(originalName: string | null | undefined): string {
  if (typeof originalName !== 'string') {
    return FALLBACK_NAME;
  }

  // Ne garder que le dernier segment (anti-traversal : retire tout chemin).
  const base = originalName.split(/[/\\]/).pop() ?? '';

  let cleaned = '';
  for (const ch of base) {
    const code = ch.codePointAt(0) ?? 0;
    // Retire les caractères de contrôle (dont CR/LF) et DEL.
    if (code <= 0x1f || code === 0x7f) {
      continue;
    }
    // Retire les guillemets et le backslash (cassent le header / ouvrent une injection).
    if (ch === '"' || ch === '\\') {
      continue;
    }
    cleaned += ch;
  }

  cleaned = cleaned.trim().slice(0, MAX_NAME_LENGTH).trim();
  return cleaned.length > 0 ? cleaned : FALLBACK_NAME;
}

/** Repli ASCII strict : tout caractère non imprimable-ASCII devient `_`. Jamais vide. */
function asciiFallback(name: string): string {
  let out = '';
  for (const ch of name) {
    const code = ch.codePointAt(0) ?? 0;
    // Imprimable ASCII (0x20–0x7E), hors guillemet/backslash déjà retirés en amont.
    out += code >= 0x20 && code <= 0x7e ? ch : '_';
  }
  out = out.trim();
  return out.length > 0 ? out : FALLBACK_NAME;
}

/** Encodage RFC 5987 (value-chars) : `encodeURIComponent` + percent-encodage de `'()*`. */
function encodeRfc5987(name: string): string {
  return encodeURIComponent(name).replace(
    /['()*]/g,
    (c) => `%${c.charCodeAt(0).toString(16).toUpperCase()}`,
  );
}

/** En-tête `Content-Disposition: attachment` sûr (jamais d'injection de header). */
export function buildContentDisposition(originalName: string | null | undefined): string {
  const cleaned = sanitizeDownloadName(originalName);
  const ascii = asciiFallback(cleaned);
  const encoded = encodeRfc5987(cleaned);
  return `attachment; filename="${ascii}"; filename*=UTF-8''${encoded}`;
}
