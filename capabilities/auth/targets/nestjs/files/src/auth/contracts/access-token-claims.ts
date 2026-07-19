/**
 * Claims minimaux d'un access token JWT (ADR-004).
 *
 * Le token ne doit pas devenir une copie du profil : ni email complet, ni
 * permissions, ni données métier ou sensibles.
 */
export interface AccessTokenClaims {
  /** Identifiant de l'utilisateur. */
  sub: string;
  /** Identifiant de la RefreshSession associée. */
  sid: string;
  /** Type de token. */
  typ: 'access';
}
