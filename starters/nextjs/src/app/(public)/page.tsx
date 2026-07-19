import type { Metadata } from "next";
import Link from "next/link";
import type { ReactElement } from "react";
import { Text } from "@enistere/ui-kit";

import { PageHeader } from "../../shared/components/page-header.js";

export const metadata: Metadata = {
  title: "Enistère OS Foundation",
  description:
    "Socle technique Next.js — baseline modulaire, TypeScript strict, TanStack Query et UI Kit maison.",
  robots: { index: true, follow: true },
  openGraph: {
    title: "Enistère OS Foundation",
    description:
      "Socle technique Next.js — baseline modulaire, TypeScript strict, TanStack Query et UI Kit maison.",
    type: "website",
  },
};

const FEATURES: readonly string[] = [
  "Baseline modulaire — capabilities composées par la Factory",
  "TanStack Query — SSR, hydratation, états",
  "UI Kit maison — composants accessibles",
  "TypeScript strict — App Router, Server Components",
  "CI 4 niveaux — lint, typecheck, tests, E2E, build",
];

/**
 * Page d'accueil publique du socle (Server Component statique). Aucun appel API, aucune donnée
 * privée. Rendue statiquement au build et indexable par les moteurs de recherche.
 */
export default function LandingPage(): ReactElement {
  return (
    <main className="landing" aria-label="Présentation du socle">
      <PageHeader
        title="Enistère OS Foundation"
        description="Socle technique Next.js — baseline modulaire, TypeScript strict, TanStack Query et UI Kit maison."
      />

      <section aria-label="Modules disponibles">
        <ul className="landing__features">
          {FEATURES.map((feature) => (
            <li key={feature}>
              <Text as="span" variant="body">
                {feature}
              </Text>
            </li>
          ))}
        </ul>
      </section>

      <div className="landing__actions">
        <Link href="/status" className="landing__cta landing__cta--primary">
          État du socle
        </Link>
      </div>
    </main>
  );
}
