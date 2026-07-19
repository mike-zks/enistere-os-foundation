import {
  ApiClientError,
  type EnistereApiClientOptions,
} from "@enistere/api-client-fetch";

import { createAuthenticatedServerApiClient } from "../api/server/create-authenticated-server-api-client.js";
import type { UserProfile } from "./client/auth-bff-client.js";
import type { CookieEnv } from "./cookie-config.js";
import { guardReadOnly, type ReadOnlyServerCookieStore } from "./read-only-cookie-store.js";
import { buildLoginRedirect } from "./return-to.js";
import type { PublicAuthError } from "./session-state.js";

type InjectedFetch = NonNullable<EnistereApiClientOptions["fetch"]>;

/**
 * Destination de redirection des visiteurs **anonymes** d'un espace protégé : la **page de connexion**
 * (`/login`) avec un `returnTo` **assaini** vers la route demandée (par défaut `/protected`). Chemin
 * **interne** (aucune open redirect, aucun token). Voir `return-to.ts` (`buildLoginRedirect`).
 */
export const PROTECTED_ANONYMOUS_REDIRECT = buildLoginRedirect("/protected");

/**
 * Résultat **serveur** de la résolution de session — **sans token** (jamais d'access/refresh/sessionId/
 * cookie/Authorization/réponse brute). Le profil dérive des contrats OpenAPI (`UserProfile`).
 *
 * - `authenticated` : profil courant valide ;
 * - `anonymous` : pas de session valide (401) — **jamais** produit par un défaut d'infrastructure ;
 * - `unavailable` : défaut d'infrastructure / 403 / 5xx / réseau / réponse invalide (à ne **pas** assimiler
 *   à anonyme).
 */
export type ServerSessionResolution =
  | { readonly status: "authenticated"; readonly user: UserProfile; readonly requestId?: string }
  | { readonly status: "anonymous"; readonly requestId?: string }
  | { readonly status: "unavailable"; readonly error: PublicAuthError; readonly requestId?: string };

export interface ResolveServerSessionOptions {
  /** Vue **lecture seule** des cookies (le résolveur ne peut pas écrire). */
  readonly cookieStore: ReadOnlyServerCookieStore;
  readonly env?: CookieEnv;
  /** Base URL explicite (tests). Défaut : `API_INTERNAL_URL` validée. */
  readonly baseUrl?: string;
  /** `fetch` injecté (tests). */
  readonly fetch?: InjectedFetch;
  /** Identifiant de corrélation entrant à propager. */
  readonly requestId?: string;
}

/** Profil minimalement valide (réponse 2xx exploitable) : objet avec `id` et `email` chaînes. */
function isUserProfile(value: unknown): value is UserProfile {
  return (
    typeof value === "object" &&
    value !== null &&
    typeof (value as { id?: unknown }).id === "string" &&
    typeof (value as { email?: unknown }).email === "string"
  );
}

/** Mappe une erreur serveur en `PublicAuthError` **générique** (jamais de cause/stack/token/réponse brute). */
function toServerAuthError(error: unknown, requestId?: string): PublicAuthError {
  if (error instanceof ApiClientError) {
    let message: string;
    if (error.kind === "network") {
      message = "Service injoignable.";
    } else if (error.kind === "timeout") {
      message = "Délai dépassé.";
    } else if (error.status === 403) {
      message = "Accès refusé.";
    } else if (error.status !== null && error.status >= 500) {
      message = "Service indisponible.";
    } else {
      message = "Erreur d'authentification.";
    }
    return {
      status: error.status ?? undefined,
      message,
      requestId,
    };
  }
  return { message: "Erreur inattendue.", requestId };
}

/**
 * Résout la session **côté serveur** en **lecture seule** : client API serveur authentifié `read-only`
 * (`enableRefresh:false` → **aucun refresh**, **aucune écriture de cookie**), appel **direct** à l'API
 * NestJS `/auth/me` (jamais le BFF local). Ne retourne **aucun token**.
 *
 * Classification : 200 → `authenticated` ; 401 / `session_expired` → `anonymous` ; 403 → `unavailable`
 * (distinct, jamais anonyme) ; réseau / timeout / 5xx / réponse invalide / inattendu → `unavailable`.
 *
 * **Limite (assumée)** : un access token expiré produit `anonymous` (pas de rotation). Une future
 * orchestration de refresh avant rendu exigerait un **contexte writable distinct** et ne doit pas être
 * introduite ici silencieusement.
 */
export async function resolveServerSession(
  options: ResolveServerSessionOptions,
): Promise<ServerSessionResolution> {
  const { requestId } = options;
  const client = createAuthenticatedServerApiClient({
    cookieStore: guardReadOnly(options.cookieStore),
    mode: "read-only",
    env: options.env,
    fetch: options.fetch,
    baseUrl: options.baseUrl,
    requestId,
  });

  try {
    const user = await client.auth.getProfile();
    if (!isUserProfile(user)) {
      // 2xx mais corps inexploitable → indisponibilité (jamais « authentifié » avec un profil vide).
      return {
        status: "unavailable",
        error: { message: "Réponse inattendue du service.", requestId },
        requestId,
      };
    }
    return { status: "authenticated", user, requestId };
  } catch (error) {
    if (
      error instanceof ApiClientError &&
      (error.status === 401 || error.kind === "session_expired")
    ) {
      return { status: "anonymous", requestId };
    }
    return { status: "unavailable", error: toServerAuthError(error, requestId), requestId };
  }
}

/**
 * Décision de rendu d'un espace protégé à partir d'une résolution serveur (politique **pure**, testable
 * sans Next) :
 * - `authenticated` → **render** (avec le profil à hydrater) ;
 * - `anonymous` → **redirect** vers {@link PROTECTED_ANONYMOUS_REDIRECT} (redirection **serveur**) ;
 * - `unavailable` → **unavailable** (erreur de service contrôlée — **pas** une redirection anonyme).
 */
export type ProtectedRenderDecision =
  | { readonly action: "render"; readonly user: UserProfile }
  | { readonly action: "redirect"; readonly location: string }
  | { readonly action: "unavailable"; readonly error: PublicAuthError; readonly requestId?: string };

export function decideProtectedRender(resolution: ServerSessionResolution): ProtectedRenderDecision {
  switch (resolution.status) {
    case "authenticated":
      return { action: "render", user: resolution.user };
    case "anonymous":
      return { action: "redirect", location: PROTECTED_ANONYMOUS_REDIRECT };
    case "unavailable":
      return { action: "unavailable", error: resolution.error, requestId: resolution.requestId };
  }
}
