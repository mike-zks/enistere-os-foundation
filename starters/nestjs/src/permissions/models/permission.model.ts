/** Contrat interne d'une permission (jamais le modèle Prisma brut, ADR-002 §20). */
export interface PermissionView {
  id: string;
  code: string;
  resource: string;
  action: string;
  description: string | null;
  isSystem: boolean;
}
