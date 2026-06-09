"use client";

import { QueryClientProvider } from "@tanstack/react-query";
import { type ReactElement, type ReactNode, useState } from "react";

import { createQueryClient } from "./query-client.js";

/**
 * Fournit le `QueryClient` à l'arbre client.
 *
 * Client Component. Le `QueryClient` est créé **une seule fois par instance navigateur** (via
 * `useState`, pas à chaque rendu). Côté serveur, chaque rendu de requête crée son propre client
 * (aucun `QueryClient` global serveur partagé). Aucune logique métier ici.
 */
export function QueryProvider({ children }: { readonly children: ReactNode }): ReactElement {
  const [queryClient] = useState(() => createQueryClient());
  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
}
