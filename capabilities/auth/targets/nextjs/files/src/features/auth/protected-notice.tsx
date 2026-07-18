import { Text } from "@enistere/ui-kit";
import type { ReactElement } from "react";

/**
 * Bandeau **présentationnel** (Server-safe) de la page protégée technique. Explicite ce que la preuve
 * démontre : accès **validé côté serveur** (résolution `read-only` de `/auth/me`), profil **hydraté**
 * dans TanStack Query (pas de second appel au premier rendu), tandis que les **autorisations** restent
 * vérifiées par l'API (autorité finale). Aucune donnée privée ici — la session est rendue par le panneau.
 */
export function ProtectedNotice(): ReactElement {
  return (
    <section className="protected__notice" aria-label="Accès protégé">
      <Text as="h1" variant="display">
        Accès protégé validé
      </Text>
      <Text as="p" variant="body" tone="muted">
        Cette page technique n&apos;est rendue qu&apos;après résolution de la session côté serveur (lecture
        seule de /auth/me, aucun token exposé). Le profil courant est hydraté dans TanStack Query :
        useSession est authentifié dès le premier rendu, sans flash. Les autorisations restent vérifiées
        par l&apos;API — l&apos;affichage conditionnel n&apos;est pas une protection.
      </Text>
    </section>
  );
}
