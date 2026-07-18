import Link from "next/link";
import type { ReactElement, ReactNode } from "react";

/**
 * Layout public (groupe `(public)`). Enveloppe le header de navigation et le footer pour toutes
 * les pages accessibles sans authentification (landing, status technique). Aucune vérification de
 * session — Server Component pur, rendu statique par défaut.
 */
export default function PublicLayout({ children }: { readonly children: ReactNode }): ReactElement {
  return (
    <>
      <header className="public-header">
        <nav className="public-nav" aria-label="Navigation principale">
          <Link href="/" className="public-nav__brand">
            Enistère
          </Link>
          <Link href="/login" className="public-nav__action">
            Se connecter
          </Link>
        </nav>
      </header>
      {children}
      <footer className="public-footer">
        <p className="public-footer__text">© Enistère OS Foundation</p>
      </footer>
    </>
  );
}
