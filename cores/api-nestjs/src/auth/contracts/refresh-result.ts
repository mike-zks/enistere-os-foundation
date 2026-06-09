/**
 * Résultat d'un refresh : nouvelle paire de tokens. Le nouveau refresh token
 * remplace obligatoirement l'ancien (rotation). Aucun secret de configuration,
 * `passwordHash` ni `tokenHash` n'est exposé.
 */
export interface RefreshResult {
  accessToken: string;
  refreshToken: string;
  accessTokenExpiresIn: number;
  refreshTokenExpiresIn: number;
  tokenType: 'Bearer';
}
