# NEXT_ACTIONS.md — Prochaines actions autorisées

> Vérifié depuis le repository (2026-06-10). Ordre cohérent avec l'état réel, les dépendances, les ADR
> validés et les packages déjà disponibles. **Une seule action à la fois.**

## 1. Prochaine action UNIQUE

> **CI minimale (ADR-013)** : pipeline de non-régression du monorepo imposant l'**ordre de build des
> paquets** (`api-contracts` → `api-client-fetch` → `ui-kit` → `web-nextjs`), exécutant
> `typecheck`/`lint`/`test` (Web + UI Kit + paquets), la couverture et **`openapi:generate:check`**.
> **Aucune nouvelle fonctionnalité produit.** Ne touche pas au comportement applicatif.

**Justification** : la **Revue globale Web Core — incrément V1** est **terminée** (rapport
`cores/web-nextjs/docs/WEB_CORE_V1_INCREMENT_REVIEW.md`, commit `docs(web-nextjs): review web core v1
increment`) — verdict **`WEB_CORE_V1_INCREMENT_STABLE_WITH_RESERVATIONS`** : socle sûr et cohérent (aucune
fuite de token/URL signée/donnée privée, CSRF + Origin/Referer, indisponible ≠ anonyme, 404 anti-énumération,
droits dynamiques sans nouveau JWT), **307 tests ×2** + **runtime réel 49/49** (PostgreSQL + MinIO), **aucun
défaut bloquant**. La revue identifie **l'absence de CI + l'ordre de build monorepo** (`packages/*/dist` non
versionnés) comme la **principale réserve transverse** de toutes les revues (gouvernance, Auth V1, Web Core
V1) — la seule **dette importante** qui menace la non-régression et la reproductibilité (clone neuf). La
sécuriser **avant** d'augmenter la surface (Files 2 / UI Kit 4 / Mobile) est l'ordre le plus sûr.

**Alternative (justifiée, décision humaine)** : **UI Kit 4** (primitives interactives Dialog/Select/Toast) si
des features riches sont imminentes ; **Files 2** (upload Web) ou **Mobile Core** **après** la CI. **Ne pas
démarrer Files 2 tant que la non-régression n'est pas outillée.**

**Note gouvernance** : `main` est poussé sur `origin` (SSH). Cette mission (revue) ajoute le commit
`docs(web-nextjs): review web core v1 increment` ; statut Web Core **inchangé** `IMPLEMENTATION_PARTIELLE`.

## 2. Actions immédiatement suivantes (ordre recommandé)

1. **CI minimale (ADR-013)** — non-régression monorepo + ordre de build des paquets + `generate:check`. ✦ prochaine action.
2. **Amorce E2E navigateur** — parcours navigateur automatisé pérenne (réserve V1, en complément de la CI).
3. **UI Kit 4** — primitives interactives (Dialog/Select/Toast) — alternative si features riches imminentes.
4. **Web Core Files 2** — upload sécurisé côté Web (multipart, finalisation, états) — **après** la CI.
5. **Mobile Core React Native minimal** — starter Expo/RN ; intégration `api-client-fetch` ; secure storage (ADR-015) ; tokens via ThemeProvider (ADR-010).
6. **Cloud Core minimal** — CI/CD (ADR-013) + registry (ADR-014) + conteneurisation.

**Alternative envisageable (justifiée)** : avancer **Cloud Core / CI-CD (ADR-013)** plus tôt pour
sécuriser la non-régression (aucune CI aujourd'hui) et préparer la publication des packages. Reste
**non recommandé en premier** car il n'apporte pas de valeur produit immédiate et le UI Kit débloque
deux cores. À arbitrer par décision humaine.

## 3. Actions bloquées

| Action | Bloquée par |
|---|---|
| Intégrer les packages API (public) dans le Web Core | **FAIT** — `api-client-fetch` instancié (Health), preuve API réelle |
| Usage **authentifié** des packages (Web) | **FAIT** — login/refresh/logout + CSRF (Web Auth 2) **et** me/authorization + session/autorisations (Web Auth 3), preuve API réelle |
| Premier layout/route protégé (Web) | **FAIT** — Web Auth 4 : résolution serveur read-only (Option C) + hydratation, page `/protected` |
| Page de connexion `/login` + navigation Auth (Web) | **FAIT** — Web Auth 5 : formulaire, login BFF, `returnTo` interne assaini, `replace`/`refresh`, preuve API réelle 22/22 |
| Bloc **Auth Web (1→5)** stable V1 ? | **REVU** — verdict **`AUTH_WEB_V1_STABLE_WITH_RESERVATIONS`** (`WEB_AUTH_V1_REVIEW.md`) : sûr/cohérent, aucun défaut bloquant ; réserves opérationnelles (CI, E2E, streaming-redirect, multi-onglets, CSP) |
| Auth post-V1 (register/reset/OAuth/MFA) | **hors périmètre V1** — ne pas poursuivre l'Auth |
| États UI & composants structurels (Web/UI Kit) | **FAIT** — Web UI 1 : Alert/Card/FormField (UI Kit, 78 tests) + LoadingState/EmptyState/ErrorState/Unauthorized/Forbidden/ServiceUnavailable/PageHeader (Web, 270 tests), intégrés + axe |
| Files Web (lecture/téléchargement) | **FAIT** — Web Core Files 1 : BFF ciblé `GET /api/files/:id` + `POST /api/files/:id/download-url`, client BFF, `fileKeys`, `useFileMetadata`/`useCreateDownloadUrl` (URL jamais en cache), page `/protected/files/[id]`, **307 tests** + preuve API+MinIO 21/21 |
| Revue globale Web Core (incrément V1) | **FAIT** — verdict **`WEB_CORE_V1_INCREMENT_STABLE_WITH_RESERVATIONS`** (`WEB_CORE_V1_INCREMENT_REVIEW.md`) : 307 tests ×2 + runtime réel 49/49, aucun défaut bloquant ; réserves : CI/ordre de build, E2E |
| CI minimale (ADR-013) | **débloqué** — prochaine action ; ordre de build paquets + non-régression monorepo + `generate:check` |
| Files Web (upload) | **débloqué après la CI** — c'est **Web Core Files 2** ; multipart + finalisation, **non** prioritaire avant l'outillage de non-régression |
| Middleware Auth « autoritaire » (Web) | **rejeté (checkpoint)** — un middleware ne valide pas un token / ne connaît pas la révocation ; UX léger (présence de cookie) seulement |
| Intégrer les packages dans le Mobile | starter Mobile inexistant |
| Publier les packages | décision registry/CI (ADR-013/014) non implémentée |
| Mobile Core Flutter | spécification absente + **ADR-034 non rédigé** |
| Web Core Angular | spécification absente + **ADR-035 non rédigé** |
| AI / Docs / Quality Cores | spécifications absentes |
| API Core Spring Boot | spécification absente |

## 4. Prérequis

- Commit Git de référence (gouvernance) — **avant tout**.
- Pour UI Kit : aucun prérequis technique manquant (ADR-008/009/010 Validés).
- Pour Web/Mobile : UI Kit initialisé + packages disponibles (déjà le cas).

## 5. Critères d'entrée (avant de démarrer la prochaine action)

1. Avoir lu `SESSION_HANDOFF.md`, `FOUNDATION_CURRENT_STATE.md`, `IMPLEMENTATION_MATRIX.md`, ce fichier.
2. Avoir vérifié le repository réel (ne rien supposer absent de la matrice).
3. Avoir signalé toute divergence entre les docs de statut et le repository.
4. Disposer d'une mission **explicite** ciblant **un seul** core.

## 6. Critères de sortie (fin de la prochaine action)

1. Core ciblé exécutable (build + lint + typecheck + tests verts) **et** revu.
2. Aucune régression du API Core, du UI Kit ni des packages.
3. `docs/project-status/` mis à jour (matrice, état, décisions si l'implémentation change, prochaines actions, handoff).
4. `CHANGELOG.md` mis à jour.
5. État Git propre / commit effectué.

## 7. Interdits pour la prochaine mission

- Initialiser **plus d'un** core à la fois.
- Modifier le API Core ou les packages sans mission explicite dédiée.
- Modifier des ADR ou des `CORE_SPECIFICATION.md` sans décision.
- Ajouter des dépendances non couvertes par un ADR validé.
- Déclarer un core « validé » sans tests + revue.
- Supprimer une preuve sans vérifier qu'elle est remplacée.
