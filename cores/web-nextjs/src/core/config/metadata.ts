/**
 * Métadonnées du socle (titre, description, robots…).
 *
 * Module sans dépendance de type sur `next` (donc testable sous node:test/nodenext). La conformité
 * au type `Metadata` de Next est vérifiée à l'assignation dans `app/layout.tsx`
 * (`export const metadata: Metadata = appMetadata`).
 *
 * `robots: { index: false, follow: false }` : starter technique, volontairement non indexé.
 */
export const appMetadata = {
  title: {
    default: "Enistère — Web Core",
    template: "%s · Enistère",
  },
  description: "Starter minimal du Web Core Enistère (Next.js App Router).",
  applicationName: "Enistère",
  robots: { index: false, follow: false },
};
