"use client";

import { useRouter } from "next/navigation";
import type { ReactElement } from "react";

import { LoginForm } from "../../features/auth/login-form.js";
import { useLogin } from "../../features/auth/use-login.js";

export interface LoginPanelProps {
  /** Destination **déjà assainie côté serveur** (interne) où naviguer après connexion. */
  readonly returnTo: string;
  /** Service Auth perturbé (résolution serveur `unavailable`) — informatif. */
  readonly serviceDegraded?: boolean;
}

/**
 * Conteneur client de la connexion (wiring Next — validé par le build, exclu de `node:test` comme le
 * layout) : câble `useLogin` (mutation + purge du cache Auth) au `LoginForm`, et **navigue** après succès
 * via `router.replace(returnTo)` + `router.refresh()` (revalide la résolution serveur de session).
 * `replace` (et non `push`) évite que « Retour » ne ramène au formulaire.
 */
export function LoginPanel({ returnTo, serviceDegraded }: LoginPanelProps): ReactElement {
  const router = useRouter();
  const login = useLogin({
    onAuthenticated: () => {
      router.replace(returnTo);
      router.refresh();
    },
  });

  return (
    <LoginForm
      onSubmit={login.submit}
      isSubmitting={login.isPending}
      serverError={login.error}
      serviceDegraded={serviceDegraded}
    />
  );
}
