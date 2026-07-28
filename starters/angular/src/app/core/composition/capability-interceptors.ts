// Point d'intégration central des capabilities (contrat de composition Factory).
//
// Ce fichier est REMPLACÉ par la Factory lors d'une génération composée : les
// overlays déclarent leurs intercepteurs via l'intégration connue
// `angular.http-interceptor` et la Factory régénère ce fichier de manière
// déterministe.
//
// L'ordre compte : les intercepteurs de base (corrélation, journalisation,
// erreurs) s'exécutent d'abord ; ceux des capabilities viennent ensuite, triés
// par `order`, afin qu'un rejeu d'authentification voie une réponse déjà
// normalisée.
import type { HttpInterceptorFn } from '@angular/common/http';

/** Intercepteurs HTTP apportés par les capabilities composées. */
export const CAPABILITY_INTERCEPTORS: readonly HttpInterceptorFn[] = [];
