import type { ReactElement, ReactNode } from "react";

const NAV_LINKS: readonly { readonly href: string; readonly label: string }[] = [
  { href: "/protected", label: "Accueil" },
  { href: "/protected/files", label: "Fichiers" },
  { href: "/protected/files/upload", label: "Envoyer un fichier" },
];

/**
 * Shell du tableau de bord protégé (Server Component). Fournit un header de navigation
 * minimal pour toutes les pages sous `(protected)/`. Aucune logique auth — la session
 * est déjà résolue par le layout parent avant que ce composant soit rendu.
 *
 * Liens HTML natifs (`<a>`) intentionnels : ce composant est inclus dans `src/features/`
 * (testé hors runtime Next.js) — `next/link` n'est pas disponible dans ce contexte.
 */
export function DashboardShell({ children }: { readonly children: ReactNode }): ReactElement {
  return (
    <div className="dashboard-layout">
      <header className="dashboard-header">
        {/* eslint-disable @next/next/no-html-link-for-pages -- Composant testé hors runtime Next/link. */}
        <nav className="dashboard-nav" aria-label="Navigation du tableau de bord">
          <a href="/" className="dashboard-nav__brand">
            Enistère
          </a>
          {NAV_LINKS.map((link) => (
            <a key={link.href} href={link.href} className="dashboard-nav__link">
              {link.label}
            </a>
          ))}
        </nav>
        {/* eslint-enable @next/next/no-html-link-for-pages */}
      </header>
      {children}
    </div>
  );
}
