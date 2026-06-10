import { Text } from "@enistere/ui-kit";
import type { ReactElement, ReactNode } from "react";

import { PageHeader } from "../../shared/components/page-header.js";

export interface FoundationFact {
  readonly label: string;
  readonly value: string;
}

/** Faits vérifiables sur la stack du Web Core. */
export const FOUNDATION_FACTS: readonly FoundationFact[] = [
  { label: "Framework", value: "Next.js 16 · App Router" },
  { label: "Rendu", value: "React 19 · Server Components · SSR + hydratation" },
  { label: "Langage", value: "TypeScript strict" },
  { label: "Design system", value: "@enistere/ui-kit (consommé)" },
  { label: "API", value: "Publique — Health (aucune authentification)" },
  { label: "Server state", value: "TanStack Query" },
  { label: "Thème", value: "Clair par défaut (data-theme)" },
];

export type ConnectionState = "connected" | "not-configured";

export interface FoundationConnection {
  readonly label: string;
  readonly state: ConnectionState;
}

/**
 * Matrice de connexion **objective** : ce qui est réellement câblé dans le socle. « Connecté » décrit
 * l'intégration (transport/couche présente), pas la disponibilité de l'API distante — celle-ci est
 * affichée par le panneau Health.
 */
export const FOUNDATION_CONNECTIONS: readonly FoundationConnection[] = [
  { label: "UI Kit (@enistere/ui-kit)", state: "connected" },
  { label: "Client API public (Fetch typé)", state: "connected" },
  { label: "TanStack Query (server state)", state: "connected" },
  { label: "Authentification", state: "not-configured" },
  { label: "Fichiers (Files)", state: "not-configured" },
];

/** Hors périmètre de cet incrément (cadrage explicite). */
export const FOUNDATION_OUT_OF_SCOPE: readonly string[] = [
  "Auth · BFF · cookies HttpOnly · CSRF · login/refresh/logout",
  "Endpoints authentifiés · Files · upload",
  "État global (Zustand) · Axios · Orval",
  "i18n complet · monitoring · CI/CD · Dockerfile",
];

/**
 * Page technique d'accueil du Web Core (Server Component). Consomme réellement les primitives du
 * UI Kit (classes `enistere-*` + palette via `@enistere/ui-kit/styles.css`). `children` reçoit le
 * panneau Health (Client Component) injecté par la page.
 */
export function FoundationStatus({ children }: { readonly children?: ReactNode }): ReactElement {
  return (
    <main className="foundation" aria-label="Enistère — Web Core">
      <PageHeader
        title="Enistère — Web Core"
        description="Page technique du Web Core Next.js (App Router) : API publique (Health), TanStack Query, BFF Auth + session, layout protégé et page de connexion. Aucune donnée privée affichée ici."
      />

      <section className="foundation__facts" aria-label="Stack du socle">
        <dl className="foundation__facts-list">
          {FOUNDATION_FACTS.map((fact) => (
            <div key={fact.label} className="foundation__fact">
              <dt className="foundation__fact-label">
                <Text as="span" variant="label" tone="muted">
                  {fact.label}
                </Text>
              </dt>
              <dd className="foundation__fact-value">
                <Text as="span" variant="body">
                  {fact.value}
                </Text>
              </dd>
            </div>
          ))}
        </dl>
      </section>

      <section className="foundation__connections" aria-label="État des intégrations">
        <Text as="h2" variant="title">
          Intégrations
        </Text>
        <ul className="foundation__connections-list">
          {FOUNDATION_CONNECTIONS.map((connection) => (
            <li key={connection.label} className="foundation__connection" data-state={connection.state}>
              <Text
                as="span"
                variant="body"
                tone={connection.state === "connected" ? "success" : "muted"}
              >
                {connection.state === "connected" ? "✓" : "—"} {connection.label}
                {connection.state === "not-configured" ? " (non configuré)" : ""}
              </Text>
            </li>
          ))}
        </ul>
      </section>

      {children}

      <section className="foundation__scope" aria-label="Hors périmètre">
        <Text as="h2" variant="title">
          Hors périmètre
        </Text>
        <ul className="foundation__scope-list">
          {FOUNDATION_OUT_OF_SCOPE.map((item) => (
            <li key={item}>
              <Text as="span" variant="body" tone="muted">
                {item}
              </Text>
            </li>
          ))}
        </ul>
      </section>
    </main>
  );
}
