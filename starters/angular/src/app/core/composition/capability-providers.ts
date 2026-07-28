// Point d'intégration central des capabilities (contrat de composition Factory).
//
// Ce fichier est REMPLACÉ par la Factory lors d'une génération composée : les
// overlays déclarent leurs providers via l'intégration connue `angular.provider`
// et la Factory régénère ce fichier de manière déterministe. La baseline
// n'apporte aucun provider.
import type { EnvironmentProviders, Provider } from '@angular/core';

/** Providers apportés par les capabilities composées, dans l'ordre déclaré. */
export const CAPABILITY_PROVIDERS: readonly (Provider | EnvironmentProviders)[] = [];
