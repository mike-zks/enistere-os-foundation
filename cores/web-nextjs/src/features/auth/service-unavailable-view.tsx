import { Text } from "@enistere/ui-kit";
import type { ReactElement } from "react";

export interface ServiceUnavailableViewProps {
  /** Référence technique de corrélation (request id) — non sensible, aide au support. */
  readonly requestId?: string;
  /** Lien de réessai (rechargement → nouvelle résolution serveur). Aucun JS requis. */
  readonly retryHref?: string;
}

/**
 * Affichage **présentationnel** d'une indisponibilité du service Auth (Server-safe : aucun hook, aucun
 * `"use client"`). N'expose **aucune** donnée privée, cause, stack ni token — message **générique** + un
 * éventuel `requestId` comme simple référence. Distinct de l'état « anonyme » : ici l'utilisateur n'est
 * **pas** réputé déconnecté, le service est momentanément indisponible.
 */
export function ServiceUnavailableView({
  requestId,
  retryHref,
}: ServiceUnavailableViewProps): ReactElement {
  return (
    <section className="state state--error" role="alert" aria-label="Service indisponible">
      <Text as="h1" variant="heading" tone="danger">
        Service indisponible
      </Text>
      <Text as="p" variant="body" tone="muted">
        Le service d&apos;authentification est momentanément indisponible. Aucune donnée n&apos;a pu être
        chargée. Réessayez dans un instant.
      </Text>
      {requestId !== undefined ? (
        <Text as="p" variant="caption" tone="muted">
          Référence : {requestId}
        </Text>
      ) : null}
      {retryHref !== undefined ? (
        <a className="state__retry" href={retryHref}>
          <Text as="span" variant="label">
            Réessayer
          </Text>
        </a>
      ) : null}
    </section>
  );
}
