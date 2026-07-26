"use client";

import type { ReactElement, ReactNode } from "react";

import { RuntimeProvider } from "../../core/platform/runtime-provider.js";
import { QueryProvider } from "../../core/query/query-provider.js";
import { CapabilityProviders } from "./capability-providers.js";

/**
 * Fournisseurs client de l'application. Volontairement minimal (baseline : seulement
 * `QueryProvider`), afin que le Root Layout reste un **Server Component**. Les providers
 * des capabilities composées sont imbriqués via `CapabilityProviders` (fichier de
 * composition généré par la Factory), jamais dans le layout.
 */
export function AppProviders({ children }: { readonly children: ReactNode }): ReactElement {
  return (
    <RuntimeProvider>
      <QueryProvider>
        <CapabilityProviders>{children}</CapabilityProviders>
      </QueryProvider>
    </RuntimeProvider>
  );
}
