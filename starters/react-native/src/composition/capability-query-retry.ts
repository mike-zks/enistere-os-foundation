// Point d'intégration central des capabilities (contrat de composition Factory).
//
// Ce fichier est REMPLACÉ par la Factory lors d'une génération composée : les
// overlays déclarent leurs gardes via l'intégration connue
// `expo.query-retry-guard`. La baseline n'en apporte aucune.
//
// Une couture plutôt qu'un écrasement de `query-client.ts` : la politique de
// réessai est une décision du socle, et une capability n'a besoin d'y ajouter
// qu'une exception — pas de réécrire le fichier qui la porte.

/**
 * Rend `true` quand l'erreur ne doit PAS être réessayée.
 *
 * Formulé en « arrêter », jamais en « continuer » : une garde qui se tromperait
 * de sens échouerait alors du côté sûr — un réessai de moins, jamais une boucle.
 */
export type CapabilityRetryGuard = (error: unknown) => boolean;

/** Gardes apportées par les capabilities composées. */
export const CAPABILITY_RETRY_GUARDS: readonly CapabilityRetryGuard[] = [];
