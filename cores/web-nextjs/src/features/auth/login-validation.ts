/**
 * Validation **UX** légère du formulaire de connexion — **améliore** l'expérience, ne **remplace jamais**
 * la validation de l'API NestJS (autorité finale). Pure et typée ; aucune dépendance (pas de Zod en V1).
 */
export interface LoginInput {
  readonly email: string;
  readonly password: string;
}

export interface LoginFieldErrors {
  readonly email?: string;
  readonly password?: string;
}

// Forme e-mail **raisonnable** (pas une politique stricte) : un `@`, un domaine avec un point, sans espace.
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const EMAIL_MAX = 254;
const PASSWORD_MAX = 200;

/**
 * Valide les champs. Retourne un objet d'erreurs **par champ** (vide si tout est valide). L'e-mail est
 * `trim()` (comparaison/forme), le **mot de passe n'est jamais modifié** (ni trim, ni transformation).
 */
export function validateLoginForm(input: LoginInput): LoginFieldErrors {
  const errors: { email?: string; password?: string } = {};

  const email = typeof input.email === "string" ? input.email.trim() : "";
  if (email.length === 0) {
    errors.email = "Renseignez votre adresse e-mail.";
  } else if (email.length > EMAIL_MAX) {
    errors.email = "Adresse e-mail trop longue.";
  } else if (!EMAIL_PATTERN.test(email)) {
    errors.email = "Adresse e-mail invalide.";
  }

  const password = typeof input.password === "string" ? input.password : "";
  if (password.length === 0) {
    errors.password = "Renseignez votre mot de passe.";
  } else if (password.length > PASSWORD_MAX) {
    errors.password = "Mot de passe trop long.";
  }

  return errors;
}

/** `true` si aucun champ en erreur. */
export function isLoginFormValid(errors: LoginFieldErrors): boolean {
  return errors.email === undefined && errors.password === undefined;
}
