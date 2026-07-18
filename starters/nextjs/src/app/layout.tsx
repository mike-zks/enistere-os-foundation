import type { Metadata } from "next";
import type { ReactElement, ReactNode } from "react";

// Feuilles de style à effet de bord — chargées une seule fois, ici, à la racine :
// 1) UI Kit : tokens + styles des primitives (source de vérité de la palette) ;
// 2) base locale (reset + structure), qui référence les variables du UI Kit (aucune palette dupliquée).
import "@enistere/ui-kit/styles.css";
import "./globals.css";

import { appMetadata } from "../core/config/metadata.js";
import { DEFAULT_THEME } from "../core/config/theme.js";
import { AppProviders } from "./providers/app-providers.js";

export const metadata: Metadata = appMetadata;

export default function RootLayout({
  children,
}: {
  readonly children: ReactNode;
}): ReactElement {
  // Layout = Server Component. Les fournisseurs client (TanStack Query) sont isolés dans
  // `AppProviders` (Client Component). Thème clair fixé via `data-theme` (résolu par le UI Kit).
  return (
    <html lang="fr" data-theme={DEFAULT_THEME}>
      <body>
        <AppProviders>{children}</AppProviders>
      </body>
    </html>
  );
}
