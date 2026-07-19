import Link from "next/link";
import type { ReactElement, ReactNode } from "react";

import { CAPABILITY_PUBLIC_NAV_LINKS } from "../../core/composition/public-nav.js";

/**
 * Layout public (groupe `(public)`). Enveloppe le header de navigation et le footer pour toutes
 * les pages accessibles sans authentification (landing, status technique). Aucune vérification de
 * session — Server Component pur, rendu statique par défaut. Les actions du header apportées par
 * les capabilities composées (ex. « Se connecter ») viennent du fichier de composition généré.
 */
export default function PublicLayout({ children }: { readonly children: ReactNode }): ReactElement {
  return (
    <>
      <header className="public-header">
        <nav className="public-nav" aria-label="Navigation principale">
          <Link href="/" className="public-nav__brand">
            Enistère
          </Link>
          {CAPABILITY_PUBLIC_NAV_LINKS.map((link) => (
            <Link key={link.href} href={link.href} className="public-nav__action">
              {link.label}
            </Link>
          ))}
        </nav>
      </header>
      {children}
      <footer className="public-footer">
        <p className="public-footer__text">© Enistère OS Foundation</p>
      </footer>
    </>
  );
}
