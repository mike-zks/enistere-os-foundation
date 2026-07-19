import { Request } from 'express';

/**
 * Principal authentifié minimal, dérivé de l'access token validé.
 *
 * Ne contient ni `passwordHash`, ni `tokenHash`, ni refresh token, ni rôle/permission,
 * ni donnée métier, ni modèle Prisma brut. Les rôles/permissions viendront en Auth 5.
 */
export interface AuthenticatedPrincipal {
  userId: string;
  sessionId: string;
}

/** Requête Express enrichie du principal authentifié par le guard JWT. */
export interface AuthenticatedRequest extends Request {
  user: AuthenticatedPrincipal;
}
