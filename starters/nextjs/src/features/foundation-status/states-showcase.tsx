import {
  Alert,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Text,
} from "@enistere/ui-kit";
import type { ReactElement } from "react";

import { EmptyState } from "../../shared/components/empty-state.js";
import { ErrorState } from "../../shared/components/error-state.js";
import { ForbiddenState } from "../../shared/components/forbidden-state.js";
import { LoadingState } from "../../shared/components/loading-state.js";
import { ServiceUnavailableState } from "../../shared/components/service-unavailable-state.js";
import { UnauthorizedState } from "../../shared/components/unauthorized-state.js";

const ALERT_VARIANTS = [
  { variant: "info", title: "Information", body: "Message neutre, rôle status (poli)." },
  { variant: "success", title: "Succès", body: "Opération réussie, rôle status." },
  { variant: "warning", title: "Avertissement", body: "À vérifier, rôle status." },
  { variant: "danger", title: "Erreur", body: "Échec, rôle alert (assertif)." },
] as const;

/**
 * Galerie **technique** (Server Component) démontrant les primitives `Alert`/`Card` et les compositions
 * d'états (`Loading`/`Empty`/`Error`/`Unauthorized`/`Forbidden`/`ServiceUnavailable`) en mode **compact**
 * (`inline`). Aucune donnée privée, aucune action client (liens/sans action) — sûr en Server Component.
 */
export function StatesShowcase(): ReactElement {
  return (
    <section className="foundation__showcase" aria-label="États & composants génériques (UI 1)">
      <Text as="h2" variant="title">
        États & composants génériques (UI 1)
      </Text>

      <div className="states-gallery">
        <Card>
          <CardHeader>
            <CardTitle as="h3">Alert</CardTitle>
            <CardDescription>Primitive UI Kit — pilotée par tokens, accessible.</CardDescription>
          </CardHeader>
          <CardContent>
            {ALERT_VARIANTS.map((a) => (
              <Alert key={a.variant} variant={a.variant} title={a.title}>
                {a.body}
              </Alert>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle as="h3">États applicatifs</CardTitle>
            <CardDescription>Compositions Web (sémantique 401/403/indisponible).</CardDescription>
          </CardHeader>
          <CardContent>
            <LoadingState inline label="Chargement…" />
            <EmptyState inline title="Aucun élément" description="Rien à afficher pour l'instant." />
            <ErrorState inline description="Une erreur générique est survenue." requestId="demo-req-1" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle as="h3">Accès & disponibilité</CardTitle>
            <CardDescription>401 ≠ 403 ≠ indisponibilité (jamais assimilés).</CardDescription>
          </CardHeader>
          <CardContent>
            <UnauthorizedState inline />
            <ForbiddenState inline />
            <ServiceUnavailableState inline requestId="demo-req-2" />
          </CardContent>
        </Card>
      </div>
    </section>
  );
}
