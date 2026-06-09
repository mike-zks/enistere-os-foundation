# Sécurité — Web Core (V1)

Périmètre **starter minimal** : pas d'auth, pas d'appel réseau, pas de stockage de token. Cette note
décrit la posture de sécurité de base et ce qui est explicitement reporté.

## En-têtes HTTP

Appliqués à toutes les routes via `next.config.ts` (`headers()` sur `/:path*`) :

| En-tête | Valeur | But |
| --- | --- | --- |
| `X-Content-Type-Options` | `nosniff` | empêche le MIME-sniffing |
| `Referrer-Policy` | `strict-origin-when-cross-origin` | limite la fuite de référent |
| `X-Frame-Options` | `DENY` | anti-clickjacking (héritage, complète une future CSP `frame-ancestors`) |
| `X-DNS-Prefetch-Control` | `off` | pas de préchargement DNS implicite |
| `Permissions-Policy` | `camera=(), microphone=(), geolocation=(), browsing-topics=()` | coupe des API puissantes par défaut |

`poweredByHeader: false` → l'en-tête **`X-Powered-By` est absent** (réduction d'empreinte).

## CSP — volontairement différée

Aucune `Content-Security-Policy` en V1. Une CSP incomplète (sans nonces, sources réelles, ni
`frame-ancestors`) donnerait une **fausse impression de protection** et casserait au premier ajout de
script/style. Elle sera introduite en V2 avec nonces et inventaire des sources.

## Variables d'environnement

- `NEXT_PUBLIC_*` = **exposé au client** : aucun secret/token ne doit y figurer.
- Valeurs serveur (ex. `API_INTERNAL_URL`) : **jamais** préfixées `NEXT_PUBLIC_`, lues uniquement
  côté serveur (`core/config/server-config.ts`). Le paquet `server-only` sera ajouté en V2 pour
  durcir cette frontière.

## Reporté en V2 (hors périmètre V1)

CSP à nonces · BFF Auth · cookies `HttpOnly` · protection CSRF · `server-only` · rate limiting ·
en-têtes HSTS (dépend du déploiement TLS) · journalisation/observabilité de sécurité.
