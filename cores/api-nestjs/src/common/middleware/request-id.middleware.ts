import { randomUUID } from 'node:crypto';

import { NextFunction, Request, Response } from 'express';

export const REQUEST_ID_HEADER = 'X-Request-Id';

// Format borné : caractères sûrs uniquement, longueur limitée. Exclut CR/LF et tout caractère de
// contrôle → empêche l'injection de logs et le header splitting via une valeur entrante.
const REQUEST_ID_PATTERN = /^[A-Za-z0-9._-]{8,128}$/;

declare module 'express-serve-static-core' {
  interface Request {
    requestId?: string;
  }
}

/**
 * Identifiant de corrélation par requête (`X-Request-Id`). Accepte une valeur entrante **seulement**
 * si elle respecte un format borné et sûr ; sinon génère un UUID. La valeur retenue est exposée
 * dans la réponse et attachée à `req.requestId` (disponible pour logs/audit). Ce n'est **pas** une
 * donnée de sécurité (non authentifiée) : aucune décision d'autorisation ne doit en dépendre.
 */
export function requestIdMiddleware(req: Request, res: Response, next: NextFunction): void {
  const incoming = req.headers['x-request-id'];
  const candidate = Array.isArray(incoming) ? incoming[0] : incoming;
  const requestId = candidate && REQUEST_ID_PATTERN.test(candidate) ? candidate : randomUUID();

  req.requestId = requestId;
  res.setHeader(REQUEST_ID_HEADER, requestId);
  next();
}
