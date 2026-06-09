/**
 * Fondations de quota (Upload 4) — lecture seule. Agrégat d'usage ACTIF d'un propriétaire
 * (hors fichiers `REJECTED`/`DELETED`/soft-deleted). `totalSize` est une chaîne décimale
 * (somme de `BigInt`). Aucune application stricte de quota en V1 : un quota utilisateur
 * contraignant (et son éventuelle facturation) relève d'Upload 5 / d'un ADR dédié.
 */
export interface OwnerUsage {
  activeCount: number;
  totalSize: string;
}
