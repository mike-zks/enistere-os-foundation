import type { ReactElement } from "react";
import { Button, Text } from "@enistere/ui-kit";

export interface FoundationFact {
  readonly label: string;
  readonly value: string;
}

/** Faits vérifiables sur l'état du socle Web (affichés sur la page technique d'accueil). */
export const FOUNDATION_FACTS: readonly FoundationFact[] = [
  { label: "Statut", value: "STARTER_INITIALISE" },
  { label: "Framework", value: "Next.js 16 · App Router" },
  { label: "Rendu", value: "React 19 · Server Components par défaut" },
  { label: "Langage", value: "TypeScript strict" },
  { label: "Design system", value: "@enistere/ui-kit (consommé)" },
  { label: "Thème", value: "Clair par défaut (data-theme)" },
];

/** Ce qui est volontairement HORS périmètre en Web 1 (cadrage explicite). */
export const FOUNDATION_OUT_OF_SCOPE: readonly string[] = [
  "Auth · BFF · cookies HttpOnly · CSRF",
  "Appels API · client typé · TanStack Query",
  "État global (Zustand) · Axios · Orval",
  "i18n complet · monitoring · CI/CD · Dockerfile",
];

/**
 * Page technique d'accueil du Web Core (Server Component). Consomme réellement les primitives du
 * UI Kit (`Text`, `Button`) — leurs classes `enistere-*` et la palette proviennent de
 * `@enistere/ui-kit/styles.css`. Aucune donnée distante, aucune interactivité (V1).
 */
export function FoundationStatus(): ReactElement {
  return (
    <main className="foundation" aria-labelledby="foundation-title">
      <header className="foundation__header">
        <Text as="h1" variant="display" id="foundation-title">
          Enistère — Web Core
        </Text>
        <Text as="p" variant="body" tone="muted">
          Starter minimal Next.js (App Router). Socle technique vérifiable — aucune logique métier,
          aucun appel réseau.
        </Text>
      </header>

      <section className="foundation__facts" aria-label="État du socle">
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

      <section className="foundation__scope" aria-label="Hors périmètre V1">
        <Text as="h2" variant="title">
          Hors périmètre (V1)
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

      <footer className="foundation__footer">
        <Button variant="primary" disabled>
          Interactions à venir (V2)
        </Button>
      </footer>
    </main>
  );
}
