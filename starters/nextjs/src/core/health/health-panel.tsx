"use client";

import { Text } from "@enistere/ui-kit";
import type { UseQueryResult } from "@tanstack/react-query";
import type { ReactElement } from "react";

import { mapApiErrorToPublicMessage } from "../api/errors/map-api-error.js";
import { isPublicApiConfigured } from "../config/public-config.js";
import { EmptyState } from "../../shared/components/empty-state.js";
import { HealthProbeView, type HealthProbeViewProps } from "./health-probe-view.js";
import { useHealth, useLiveness, useReadiness } from "./use-health.js";

/** Projette un résultat de query sur les props présentationnelles d'une sonde. */
function toProbeProps<TData extends { status: string }>(
  label: string,
  query: UseQueryResult<TData>,
  configured: boolean,
): HealthProbeViewProps {
  if (!configured) {
    return { label, state: "not-configured" };
  }
  const common = { label, busy: query.isFetching, onRetry: () => void query.refetch() };
  if (query.isError) {
    const view = mapApiErrorToPublicMessage(query.error);
    return { ...common, state: "error", errorMessage: view.message, requestId: view.requestId };
  }
  if (query.isSuccess) {
    return { ...common, state: "success", value: query.data.status };
  }
  return { ...common, state: "loading" };
}

/**
 * Panneau Health (Client Component) : consomme les hooks `useHealth/useLiveness/useReadiness` et rend
 * des sondes présentationnelles. N'affiche jamais l'API comme « disponible » sans réponse réelle.
 */
export function HealthPanel(): ReactElement {
  const configured = isPublicApiConfigured();
  const health = useHealth();
  const liveness = useLiveness();
  const readiness = useReadiness();

  return (
    <section className="health" aria-label="Disponibilité de l'API (Health)">
      <Text as="h2" variant="title">
        API — Santé
      </Text>
      {!configured ? (
        <EmptyState
          inline
          title="API publique non configurée"
          description="`NEXT_PUBLIC_API_URL` absente — aucune requête n'est émise."
        />
      ) : null}
      <div className="health__list">
        <HealthProbeView {...toProbeProps("Santé", health, configured)} />
        <HealthProbeView {...toProbeProps("Liveness", liveness, configured)} />
        <HealthProbeView {...toProbeProps("Readiness", readiness, configured)} />
      </div>
    </section>
  );
}
