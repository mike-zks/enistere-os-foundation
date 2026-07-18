import type { EnistereApiClient } from "@enistere/api-client-fetch";
import type { SchemaOf } from "@enistere/api-contracts";

import { runPublicRequest, type RunRequestOptions } from "../run-public-request.js";

// Types dérivés des contrats générés (ADR-016) — AUCUN DTO recopié.
export type HealthStatus = SchemaOf<"HealthResponseDto">;
export type LivenessStatus = SchemaOf<"LivenessResponseDto">;
export type ReadinessStatus = SchemaOf<"ReadinessResponseDto">;

/** `GET /health` — statut applicatif général (public). */
export function getHealth(
  client: EnistereApiClient,
  options?: RunRequestOptions,
): Promise<HealthStatus> {
  return runPublicRequest<HealthStatus>((signal) => client.raw.GET("/health", { signal }), options);
}

/** `GET /health/live` — liveness (public). */
export function getLiveness(
  client: EnistereApiClient,
  options?: RunRequestOptions,
): Promise<LivenessStatus> {
  return runPublicRequest<LivenessStatus>(
    (signal) => client.raw.GET("/health/live", { signal }),
    options,
  );
}

/** `GET /health/ready` — readiness (public ; 503 si une dépendance dure est indisponible). */
export function getReadiness(
  client: EnistereApiClient,
  options?: RunRequestOptions,
): Promise<ReadinessStatus> {
  return runPublicRequest<ReadinessStatus>(
    (signal) => client.raw.GET("/health/ready", { signal }),
    options,
  );
}
