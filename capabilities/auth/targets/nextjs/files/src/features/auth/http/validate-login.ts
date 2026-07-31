/**
 * Validation **de forme et de bornes** du login côté Web (jamais un substitut à la validation API).
 * N'implémente aucune politique de mot de passe : seulement type, présence, bornes, champs autorisés.
 */

export class LoginValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "LoginValidationError";
  }
}

export interface LoginInput {
  readonly email: string;
  readonly password: string;
}

const EMAIL_MAX = 254;
const PASSWORD_MIN = 1;
const PASSWORD_MAX = 200;
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
// Détecte les caractères de contrôle (RegExp(string) → uniquement des caractères imprimables en source).
const CONTROL_CHARS = new RegExp("[\\x00-\\x1F\\x7F]");

export function parseLoginInput(raw: unknown): LoginInput {
  if (typeof raw !== "object" || raw === null || Array.isArray(raw)) {
    throw new LoginValidationError("Corps invalide.");
  }
  const record = raw as Record<string, unknown>;
  for (const key of Object.keys(record)) {
    if (key !== "email" && key !== "password") {
      throw new LoginValidationError("Champ inconnu.");
    }
  }
  const { email, password } = record;
  if (typeof email !== "string" || typeof password !== "string") {
    throw new LoginValidationError("email et password requis (chaînes).");
  }
  const normalizedEmail = email.trim().toLowerCase();
  if (
    normalizedEmail.length === 0 ||
    normalizedEmail.length > EMAIL_MAX ||
    !EMAIL_PATTERN.test(normalizedEmail)
  ) {
    throw new LoginValidationError("Email invalide.");
  }
  if (password.length < PASSWORD_MIN || password.length > PASSWORD_MAX || CONTROL_CHARS.test(password)) {
    throw new LoginValidationError("Mot de passe invalide.");
  }
  return { email: normalizedEmail, password };
}
