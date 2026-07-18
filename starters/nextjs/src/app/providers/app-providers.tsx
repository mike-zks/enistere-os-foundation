"use client";

import type { ReactElement, ReactNode } from "react";

import { QueryProvider } from "../../core/query/query-provider.js";

/**
 * Fournisseurs client de l'application. Volontairement minimal (V1 : seulement `QueryProvider`),
 * afin que le Root Layout reste un **Server Component**. Les futurs fournisseurs (thème dynamique,
 * etc.) viendront s'ajouter ici, jamais dans le layout.
 */
export function AppProviders({ children }: { readonly children: ReactNode }): ReactElement {
  return <QueryProvider>{children}</QueryProvider>;
}
