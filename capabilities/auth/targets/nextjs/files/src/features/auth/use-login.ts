"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useRef } from "react";

import { performBffLogin } from "./client/login-client.js";
import type { PublicAuthError } from "./session-state.js";
import { authKeys } from "./auth-keys.js";
import { toLoginError } from "./login-error.js";
import type { LoginInput } from "./login-validation.js";

export type LoginStatus = "idle" | "submitting" | "error";

export interface UseLoginResult {
  readonly submit: (input: LoginInput) => void;
  readonly status: LoginStatus;
  readonly isPending: boolean;
  readonly error?: PublicAuthError;
}

export interface UseLoginOptions {
  /** Navigation **fournie par l'appelant** (router) après authentification — découple le hook de Next. */
  readonly onAuthenticated: () => void;
}

/**
 * Mutation de connexion : `performBffLogin` (CSRF → BFF login). En cas de **succès**, **purge** le cache
 * Auth (`authKeys.all` — évite un `anonymous` résiduel ; **Health conservé**) puis délègue la navigation
 * à `onAuthenticated`. **Aucun credential** n'est mis en cache (pas de `mutationKey`, mot de passe non
 * persisté). **Anti-double-soumission** via un verrou synchrone (`useRef`).
 */
export function useLogin(options: UseLoginOptions): UseLoginResult {
  const queryClient = useQueryClient();
  const inFlight = useRef(false);

  const mutation = useMutation<void, unknown, LoginInput>({
    mutationFn: (input) => performBffLogin(input.email, input.password),
    onSuccess: () => {
      queryClient.removeQueries({ queryKey: authKeys.all });
      options.onAuthenticated();
    },
  });

  const submit = (input: LoginInput): void => {
    if (inFlight.current) return;
    inFlight.current = true;
    mutation.mutate(input, {
      onSettled: () => {
        inFlight.current = false;
      },
    });
  };

  const status: LoginStatus = mutation.isPending ? "submitting" : mutation.isError ? "error" : "idle";

  return {
    submit,
    status,
    isPending: mutation.isPending,
    error: mutation.isError ? toLoginError(mutation.error) : undefined,
  };
}
