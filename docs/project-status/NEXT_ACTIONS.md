# NEXT_ACTIONS.md — Prochaines actions autorisées

> Vérifié depuis le repository (2026-06-09). Ordre cohérent avec l'état réel, les dépendances, les ADR
> validés et les packages déjà disponibles. **Une seule action à la fois.**

## 1. Prochaine action UNIQUE

> **Web Core Files 1 — consultation des métadonnées & téléchargement sécurisé** (`cores/web-nextjs/`) :
> consommer les opérations **Files** déjà présentes dans `@enistere/api-client-fetch` (liste/métadonnées +
> téléchargement via URL présignée), **sans upload**. Réutilise les **états UI** (loading/empty/error/
> forbidden/unavailable) et le BFF Auth. **Pas d'upload, pas d'admin RBAC, pas de composant lourd.**

**Justification** : **Web Core UI 1 est terminé** (commit `feat(web-ui): add standard interface states`) :
primitives UI Kit `Alert`/`Card`/`FormField` (**78 tests**) + compositions d'états Web
(loading/empty/error/**401≠403≠indisponible**/`PageHeader`, **270 tests**), intégrées (accueil/Health/
frontières/Auth), accessibles (axe), pilotées par tokens, **sans donnée sensible**. Le Web Core dispose
désormais d'un socle d'**états standardisés** ; la suite produit logique est une **première feature de
données** — **Files en lecture** — qui consomme l'API Core (Files déjà implémenté), le BFF Auth et ces états,
**sans** introduire l'upload (incrément ultérieur).

**Alternative (justifiée)** : **UI Kit 4** (primitives interactives suivantes) si une lacune structurelle est
confirmée ; ou démarrer le **Mobile Core**. À arbitrer par décision humaine.

**Réserves V1 Auth (recommandées en parallèle, non bloquantes)** : **CI minimale** (ADR-013 : ordre de build
des paquets + non-régression) + amorce d'un **E2E navigateur** (cf. `WEB_AUTH_V1_REVIEW.md`).

**Note gouvernance** : `main` est poussé sur `origin` (SSH). Cette mission ajoute le commit
`feat(web-ui): add standard interface states`.

## 2. Actions immédiatement suivantes (ordre recommandé)

1. **Web Core Files 1 — consultation métadonnées & téléchargement sécurisé** — consomme les Files de `api-client-fetch` (lecture), réutilise les états UI + BFF Auth ; **sans upload**. ✦ prochaine action.
2. **CI minimale (ADR-013) + amorce E2E navigateur** — réserves V1 du bloc Auth (recommandées en parallèle).
3. **UI Kit 4** — primitives interactives suivantes (alternative à (1) si lacune structurelle confirmée).
4. **Mobile Core React Native minimal** — starter Expo/RN ; intégration `api-client-fetch` ; secure storage (ADR-015) ; tokens via ThemeProvider (ADR-010).
5. **Cloud Core minimal** — CI/CD (ADR-013) + registry (ADR-014) + conteneurisation.

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
| Files Web (lecture) | **débloqué** — c'est **Web Core Files 1** (prochaine action) ; consomme Files de `api-client-fetch`, sans upload |
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
