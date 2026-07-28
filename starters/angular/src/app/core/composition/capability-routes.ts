// Point d'intégration central des capabilities (contrat de composition Factory).
//
// Ce fichier est REMPLACÉ par la Factory lors d'une génération composée : les
// overlays déclarent leurs routes via l'intégration connue `angular.route` et la
// Factory régénère ce fichier de manière déterministe. La baseline n'apporte
// aucune route.
import type { Routes } from '@angular/router';

/** Routes apportées par les capabilities composées, triées par `order`. */
export const CAPABILITY_ROUTES: Routes = [];
