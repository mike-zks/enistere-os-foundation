/**
 * Abstraction unique de hachage de mot de passe (ADR-039).
 *
 * Aucune utilisation directe de la bibliothèque Argon2 ailleurs (controllers,
 * UsersService...). Le mot de passe et le hash ne doivent jamais être journalisés.
 */
export interface PasswordHasher {
  /** Produit le hash d'un mot de passe en clair. */
  hash(plainPassword: string): Promise<string>;

  /** Vérifie un mot de passe en clair contre un hash, via l'API de la bibliothèque. */
  verify(hash: string, plainPassword: string): Promise<boolean>;

  /** Indique si le hash devrait être recalculé (algorithme/paramètres obsolètes). */
  needsRehash(hash: string): boolean;
}

/** Jeton d'injection NestJS pour `PasswordHasher`. */
export const PASSWORD_HASHER = Symbol('PASSWORD_HASHER');
