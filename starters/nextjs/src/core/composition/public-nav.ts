// Point d'intégration central des capabilities (contrat de composition Factory).
//
// Ce fichier est REMPLACÉ par la Factory lors d'une génération composée : les
// overlays déclarent leurs liens de navigation publics via l'intégration connue
// `nextjs.public-nav-link` et la Factory régénère ce fichier de manière
// déterministe. La baseline `base` n'ajoute aucun lien.
export interface CapabilityNavLink {
  readonly href: string;
  readonly label: string;
}

/** Liens du header public apportés par les capabilities composées. */
export const CAPABILITY_PUBLIC_NAV_LINKS: readonly CapabilityNavLink[] = [];
