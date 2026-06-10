# Sécurité — Web Core (V1)

Cette note décrit la **posture de sécurité de base** (en-têtes, variables d'environnement, CSP) et ce qui
est explicitement reporté. La sécurité **Auth** (BFF, cookies `HttpOnly`, CSRF double-submit,
Origin/Referer, état de session sans token, purge au logout) est désormais **implémentée** et documentée
séparément : [`auth-architecture.md`](auth-architecture.md), [`csrf.md`](csrf.md),
[`session-state.md`](session-state.md).

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
  côté serveur (`core/config/server-config.ts`). La frontière repose sur une **convention documentée +
  test statique d'imports** (`test/auth-boundaries.test.ts`) ; le paquet `server-only` n'est **pas**
  utilisé (il lève à l'import sous `node:test`).

## Implémenté (Auth — Web Auth 2 → 5)

BFF Auth (`login`/`refresh`/`logout`/`csrf`, `me`/`authorization`) · cookies `HttpOnly` access/refresh
(`__Host-` en production) · **CSRF double-submit** (comparaison à temps constant, rotation) ·
**Origin/Referer** fail-closed · erreurs génériques (aucune fuite token/cause/stack/réponse brute) ·
`no-store` · état de session **sans token** au navigateur · purge du cache Auth au logout · **routes
protégées** : layout `(protected)` à **résolution serveur read-only** (anonyme ⇒ redirection ; **indisponible
⇒ état contrôlé**, jamais assimilé à anonyme, aucun contenu privé) · page `/login` (`returnTo` interne
assaini, **anti open-redirect**).

## Implémenté (Files — lecture, Files 1)

BFF **ciblé** `GET /api/files/:id` + `POST /api/files/:id/download-url` (jamais un proxy générique) ·
**validation UUID** (400 sans appel API) · **Origin/Referer + CSRF** sur `download-url` · `no-store` ·
**404 anti-énumération** (ownership = API) · mapping d'erreurs distinct (401/403/404/409/503) · **aucun champ
interne** exposé (storageKey/bucket/checksum/ownerId) · **URL signée jamais mise en cache/journalisée**
(mutation consommée puis abandonnée) · téléchargement par ancre `https`-only (`rel="noopener noreferrer"`).

## Reporté en V2 (hors périmètre V1)

CSP à nonces · rate limiting **au niveau BFF** (l'API applique déjà des limites par route) · en-têtes HSTS
(dépend du déploiement TLS) · COOP/CORP · journalisation/observabilité de sécurité · SSR Auth complet
(préchargement serveur des pages publiques) · middleware UX (non autoritaire).
