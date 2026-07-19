"use client";

// Point d'intégration central des sections de la page de statut (contrat de
// composition Factory).
//
// Ce fichier est REMPLACÉ par la Factory lors d'une génération composée : les
// overlays déclarent leurs sections via l'intégration connue
// `nextjs.status-section` (importPath, symbol, order) et la Factory régénère ce
// registre de manière déterministe. La baseline `base` n'ajoute aucune section.
import type { ComponentType } from "react";

export interface CapabilityStatusSection {
  readonly capability: string;
  readonly order: number;
  readonly Component: ComponentType;
}

/** Sections contribuées par les capabilities composées, dans l'ordre déclaré. */
export const CAPABILITY_STATUS_SECTIONS: readonly CapabilityStatusSection[] = [];
