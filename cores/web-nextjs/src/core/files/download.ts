/**
 * Déclenchement du téléchargement d'une **URL signée** (fournie par l'API, jamais reconstruite). L'URL est
 * une donnée **temporaire sensible** : consommée immédiatement, **jamais** journalisée/persistée ici.
 */

/**
 * Valide une URL de téléchargement : **https** uniquement (http toléré si `allowInsecure`, ex. MinIO local
 * en dev/test). Rejette `javascript:`/`data:`/relatif/malformé. Ne modifie jamais la signature.
 */
export function isSafeDownloadUrl(url: string, allowInsecure = false): boolean {
  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    return false;
  }
  if (parsed.protocol === "https:") return true;
  if (parsed.protocol === "http:" && allowInsecure) return true;
  return false;
}

/**
 * Crée une ancre temporaire (`rel="noopener noreferrer"`), déclenche le clic, puis la retire. Retourne
 * `false` si l'URL est refusée (aucun téléchargement). Le `Content-Disposition` est gouverné par S3/MinIO
 * (l'attribut `download` n'est pas garanti en cross-origin — documenté).
 */
export function triggerDownload(url: string, options?: { allowInsecure?: boolean }): boolean {
  if (!isSafeDownloadUrl(url, options?.allowInsecure ?? false)) {
    return false;
  }
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.rel = "noopener noreferrer";
  anchor.style.display = "none";
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
  return true;
}

/** Vrai si l'app est servie en clair (dev/test) → autorise une URL MinIO http locale. */
export function currentContextAllowsInsecure(): boolean {
  return typeof window !== "undefined" && window.location?.protocol === "http:";
}
