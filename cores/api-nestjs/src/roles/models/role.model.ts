/** Contrat interne d'un rôle (jamais le modèle Prisma brut, ADR-002 §20). */
export interface RoleView {
  id: string;
  code: string;
  name: string;
  description: string | null;
  isSystem: boolean;
}
