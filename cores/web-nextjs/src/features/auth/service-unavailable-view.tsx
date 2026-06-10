import type { ReactElement } from "react";

import { ServiceUnavailableState } from "../../shared/components/service-unavailable-state.js";

export interface ServiceUnavailableViewProps {
  /** Référence technique de corrélation (request id) — non sensible, aide au support. */
  readonly requestId?: string;
  /** Lien de réessai (rechargement → nouvelle résolution serveur). Aucun JS requis. */
  readonly retryHref?: string;
}

/**
 * Indisponibilité du service Auth — **délègue** désormais à la composition générique
 * `ServiceUnavailableState` (Web Core UI 1) pour éviter toute duplication. Comportement inchangé :
 * `role="alert"`, message générique, `requestId` de référence, lien de réessai server-safe ; **aucune**
 * donnée privée. Distinct de l'état « anonyme » : l'utilisateur n'est pas réputé déconnecté.
 */
export function ServiceUnavailableView({
  requestId,
  retryHref,
}: ServiceUnavailableViewProps): ReactElement {
  return <ServiceUnavailableState requestId={requestId} retryHref={retryHref} />;
}
