"use client";

import type { ReactElement } from "react";

import { CAPABILITY_STATUS_SECTIONS } from "../../core/composition/status-sections.js";

/**
 * Rend les sections de statut apportées par les capabilities composées, dans
 * l'ordre déclaré. La baseline n'en a aucune : le composant ne rend rien.
 * Les capabilities n'écrasent jamais la page de statut partagée.
 */
export function CapabilityStatusSections(): ReactElement | null {
  if (CAPABILITY_STATUS_SECTIONS.length === 0) return null;
  return (
    <>
      {CAPABILITY_STATUS_SECTIONS.map(({ capability, Component }) => (
        <Component key={capability} />
      ))}
    </>
  );
}
