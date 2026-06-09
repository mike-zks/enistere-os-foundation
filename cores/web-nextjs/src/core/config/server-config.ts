/**
 * Configuration SERVEUR UNIQUEMENT.
 *
 * ⚠️ Ne JAMAIS importer ce module depuis un Client Component : il expose des valeurs
 * d'environnement non préfixées `NEXT_PUBLIC_` qui ne doivent pas atteindre le navigateur.
 * (Le paquet `server-only` n'est pas ajouté en Web 1 ; la garantie repose ici sur la convention
 * documentée + l'absence d'appel côté client. Il pourra être introduit en V2.)
 *
 * Web 1 : aucune de ces valeurs n'est consommée (aucun appel API). Cadrage uniquement.
 */
export interface ServerConfig {
  /** URL d'API interne (serveur). `null` tant que `API_INTERNAL_URL` est absente. */
  readonly apiInternalUrl: string | null;
}

export function getServerConfig(): ServerConfig {
  return {
    apiInternalUrl: process.env.API_INTERNAL_URL ?? null,
  };
}
