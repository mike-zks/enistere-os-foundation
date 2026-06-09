import { FileStatus } from '@prisma/client';

/**
 * Source UNIQUE des transitions de cycle de vie d'un fichier (Upload 4). Centralisée et
 * testable : les services (`upload`, `deletion`, `quarantine`, `reconciliation`) s'y réfèrent
 * plutôt que de disperser des règles ad hoc.
 *
 * Transitions autorisées :
 *   PENDING/UPLOADED → VALIDATED | REJECTED | DELETED
 *   VALIDATED        → QUARANTINED | DELETED
 *   QUARANTINED      → VALIDATED | DELETED
 *   REJECTED         → DELETED
 *   DELETED          → (état terminal)
 *
 * Interdites notamment : DELETED → quoi que ce soit ; REJECTED → VALIDATED (sans procédure
 * explicite) ; PENDING → QUARANTINED (pas d'objet validé à mettre en quarantaine).
 */
const ALLOWED_TRANSITIONS: Record<FileStatus, ReadonlySet<FileStatus>> = {
  [FileStatus.PENDING]: new Set([FileStatus.VALIDATED, FileStatus.REJECTED, FileStatus.DELETED]),
  [FileStatus.UPLOADED]: new Set([FileStatus.VALIDATED, FileStatus.REJECTED, FileStatus.DELETED]),
  [FileStatus.VALIDATED]: new Set([FileStatus.QUARANTINED, FileStatus.DELETED]),
  [FileStatus.QUARANTINED]: new Set([FileStatus.VALIDATED, FileStatus.DELETED]),
  [FileStatus.REJECTED]: new Set([FileStatus.DELETED]),
  [FileStatus.DELETED]: new Set<FileStatus>(),
};

/** Vrai si la transition `from → to` est autorisée (l'identité `from === to` n'est pas une transition). */
export function canTransition(from: FileStatus, to: FileStatus): boolean {
  return ALLOWED_TRANSITIONS[from].has(to);
}

/** Liste (triée) des cibles autorisées depuis un état — utile pour le diagnostic/tests. */
export function allowedTargets(from: FileStatus): FileStatus[] {
  return [...ALLOWED_TRANSITIONS[from]].sort();
}
