/**
 * Résumé d'autorisation de l'utilisateur courant, destiné à l'UI conditionnelle des
 * clients (ADR-006 §14). Codes uniquement, triés. Ce n'est PAS une preuve d'autorisation
 * réutilisable côté serveur : l'API reste l'autorité finale à chaque requête.
 */
export interface AuthorizationSummary {
  roles: string[];
  permissions: string[];
}
