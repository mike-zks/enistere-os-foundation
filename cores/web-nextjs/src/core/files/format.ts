/**
 * Formatage **pur** des métadonnées fichier publiques. `size` arrive en **chaîne décimale** (BigInt côté
 * API) : on n'utilise jamais `Number` (perte de précision possible). Dates rendues en **UTC + locale fixe**
 * (déterministe, aucun mismatch SSR/hydratation).
 */
const SIZE_UNITS = ["B", "KiB", "MiB", "GiB", "TiB", "PiB"] as const;

/** Taille lisible (base 1024) depuis une chaîne décimale d'octets. Entrée invalide/négative → « — ». */
export function formatFileSize(size: string): string {
  let bytes: bigint;
  try {
    bytes = BigInt(size);
  } catch {
    return "—";
  }
  if (bytes < 0n) return "—";
  if (bytes < 1024n) return `${bytes.toString()} B`;

  let unit = 0;
  let divisor = 1n;
  while (unit < SIZE_UNITS.length - 1 && bytes / divisor >= 1024n) {
    divisor *= 1024n;
    unit += 1;
  }
  const tenths = (bytes * 10n) / divisor; // une décimale, sans flottant
  const intPart = tenths / 10n;
  const decPart = tenths % 10n;
  return `${intPart.toString()}.${decPart.toString()} ${SIZE_UNITS[unit]}`;
}

const DATE_FORMAT = new Intl.DateTimeFormat("fr-FR", {
  dateStyle: "medium",
  timeStyle: "short",
  timeZone: "UTC",
});

/** Date/heure lisible (UTC, locale fixe `fr-FR`). Entrée invalide → « — ». */
export function formatDateTime(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "—";
  return `${DATE_FORMAT.format(date)} UTC`;
}
