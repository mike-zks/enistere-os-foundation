"use client";

import { Button, Input, Label, Text } from "@enistere/ui-kit";
import { useId, useState, type FormEvent, type ReactElement } from "react";

import type { PublicAuthError } from "../../core/auth/session-state.js";
import { isLoginFormValid, validateLoginForm, type LoginFieldErrors } from "./login-validation.js";

export interface LoginFormProps {
  /** Soumission **valide** (e-mail `trim()`, mot de passe inchangé). */
  readonly onSubmit: (input: { email: string; password: string }) => void;
  readonly isSubmitting: boolean;
  /** Erreur **serveur** générique (message public + `requestId` éventuel). */
  readonly serverError?: PublicAuthError;
  /** Service Auth momentanément perturbé (résolution serveur `unavailable`). */
  readonly serviceDegraded?: boolean;
}

/**
 * Formulaire de connexion **présentationnel** (Client Component) : champs e-mail / mot de passe, validation
 * **UX** locale (l'API reste l'autorité), états accessibles. Le **mot de passe** ne vit que dans l'état
 * local du composant — jamais journalisé, mis en cache ni sérialisé.
 */
export function LoginForm({
  onSubmit,
  isSubmitting,
  serverError,
  serviceDegraded,
}: LoginFormProps): ReactElement {
  const emailId = useId();
  const passwordId = useId();
  const emailErrorId = `${emailId}-error`;
  const passwordErrorId = `${passwordId}-error`;

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState<LoginFieldErrors>({});
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (event: FormEvent<HTMLFormElement>): void => {
    event.preventDefault();
    if (isSubmitting) return;
    const fieldErrors = validateLoginForm({ email, password });
    setErrors(fieldErrors);
    setSubmitted(true);
    if (!isLoginFormValid(fieldErrors)) return;
    onSubmit({ email: email.trim(), password });
  };

  const emailError = submitted ? errors.email : undefined;
  const passwordError = submitted ? errors.password : undefined;

  return (
    <form
      className="login"
      aria-label="Connexion"
      aria-busy={isSubmitting}
      noValidate
      onSubmit={handleSubmit}
    >
      <Text as="h1" variant="display">
        Connexion
      </Text>

      {serviceDegraded ? (
        <Text as="p" variant="caption" tone="muted" role="status">
          Le service d&apos;authentification est momentanément perturbé ; la connexion peut échouer.
        </Text>
      ) : null}

      {serverError ? (
        <div role="alert" className="login__error">
          <Text as="p" variant="body" tone="danger">
            {serverError.message}
          </Text>
          {serverError.requestId !== undefined ? (
            <Text as="p" variant="caption" tone="muted">
              Référence : {serverError.requestId}
            </Text>
          ) : null}
        </div>
      ) : null}

      <div className="login__field">
        <Label htmlFor={emailId} required>
          Adresse e-mail
        </Label>
        <Input
          id={emailId}
          name="email"
          type="email"
          autoComplete="email"
          required
          value={email}
          invalid={emailError !== undefined}
          aria-describedby={emailError !== undefined ? emailErrorId : undefined}
          disabled={isSubmitting}
          onChange={(event) => setEmail(event.target.value)}
        />
        {emailError !== undefined ? (
          <Text as="p" id={emailErrorId} variant="caption" tone="danger" role="alert">
            {emailError}
          </Text>
        ) : null}
      </div>

      <div className="login__field">
        <Label htmlFor={passwordId} required>
          Mot de passe
        </Label>
        <Input
          id={passwordId}
          name="password"
          type="password"
          autoComplete="current-password"
          required
          value={password}
          invalid={passwordError !== undefined}
          aria-describedby={passwordError !== undefined ? passwordErrorId : undefined}
          disabled={isSubmitting}
          onChange={(event) => setPassword(event.target.value)}
        />
        {passwordError !== undefined ? (
          <Text as="p" id={passwordErrorId} variant="caption" tone="danger" role="alert">
            {passwordError}
          </Text>
        ) : null}
      </div>

      <Button
        type="submit"
        variant="primary"
        loading={isSubmitting}
        loadingText="Connexion en cours"
        disabled={isSubmitting}
      >
        Se connecter
      </Button>
    </form>
  );
}
