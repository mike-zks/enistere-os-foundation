import { UserStatus } from '@prisma/client';

// Le statut générique est réutilisé depuis l'enum Prisma pour éviter la
// duplication, sans exposer le modèle de persistance lui-même (ADR-002 §20).
export { UserStatus };

/**
 * Contrat utilisateur destiné aux usages applicatifs et publics futurs.
 * N'expose JAMAIS le `passwordHash`.
 */
export interface PublicUser {
  id: string;
  email: string;
  status: UserStatus;
  createdAt: Date;
  updatedAt: Date;
  deactivatedAt: Date | null;
}

/**
 * Contrat réservé aux usages d'authentification nécessitant l'empreinte du mot
 * de passe (vérification des identifiants par le futur AuthModule).
 * Ne doit jamais être retourné par une API publique ni journalisé.
 */
export interface AuthUser extends PublicUser {
  passwordHash: string;
}
