/**
 * Thème UI (Web 1).
 *
 * Le UI Kit résout le thème via l'attribut `data-theme` sur `<html>` :
 * - `:root` (UI Kit) porte les valeurs du thème **clair** (défaut) ;
 * - `[data-theme="dark"]` porte les surcharges **sombres**.
 *
 * Web 1 fixe le thème clair en dur dans `app/layout.tsx`. Pas de bascule runtime, pas de
 * gestionnaire de thème, pas de persistance : ce sera l'objet d'un incrément ultérieur (sans flash).
 */
export type Theme = "light" | "dark";

/** Thème par défaut du socle (clair). */
export const DEFAULT_THEME: Theme = "light";

/** Attribut HTML porteur du thème, lu par le UI Kit. */
export const THEME_ATTRIBUTE = "data-theme";
