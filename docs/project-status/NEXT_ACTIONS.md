# NEXT_ACTIONS.md — Prochaines actions autorisées

> Vérifié depuis le repository (2026-06-09). Ordre cohérent avec l'état réel, les dépendances, les ADR
> validés et les packages déjà disponibles. **Une seule action à la fois.**

## 1. Prochaine action UNIQUE

> **Web Core — cadrage & implémentation des états UI et composants structurels manquants** (`cores/web-nextjs/`) :
> standardiser les états **`loading`/`empty`/`error`/`success`**, le **système de formulaires** et des
> **composants réutilisables** (cf. `CORE_SPECIFICATION.md` §3/§4). Le parcours Auth (login + espace protégé)
> fournit désormais une **surface réelle** à standardiser. **Alternative** : intégration **Files** minimale.

**Justification** : la **Revue globale Auth Web (1 → 5)** est **terminée** (rapport permanent
`cores/web-nextjs/docs/WEB_AUTH_V1_REVIEW.md`, commit `docs(web-nextjs): review web auth v1`). **Verdict :
`AUTH_WEB_V1_STABLE_WITH_RESERVATIONS`** — socle Auth **sûr et cohérent** (aucune fuite de token, aucun open
redirect, session cohérente, contenu privé jamais exposé, droits sans nouveau JWT), **263 tests fiables ×2** +
**runtime 33/33**, **aucun défaut bloquant**. **Réserves opérationnelles** (non bloquantes pour la correction) :
CI, E2E navigateur, sémantique streaming-redirect, multi-onglets, durcissement CSP/HSTS. Le bloc Auth étant
stable (avec réserves), la suite logique est la **standardisation UI/formulaires** du Web Core (priorité
`CORE_SPECIFICATION`), pas une extension Auth post-V1.

**Recommandé en parallèle (réserves V1, non bloquant)** : **CI minimale** (ADR-013, ordre de build des paquets +
non-régression) et amorce d'un **E2E navigateur** (Playwright).

**Alternative (justifiée)** : **intégration Files minimale**, **compléter le UI Kit**, ou démarrer le
**Mobile Core**. À arbitrer par décision humaine.

**Note gouvernance** : `main` est poussé sur `origin` (SSH). Cette mission ajoute le commit
`docs(web-nextjs): review web auth v1`.

## 2. Actions immédiatement suivantes (ordre recommandé)

1. **Web Core — états UI & composants structurels** — `loading`/`empty`/`error`/`success`, système de formulaires, composants réutilisables (`CORE_SPECIFICATION` §3/§4). ✦ prochaine action.
2. **CI minimale (ADR-013) + amorce E2E navigateur** — réserves V1 du bloc Auth (recommandées en parallèle).
3. **Files Web minimal** — alternative à (1) selon priorité produit.
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
| Auth post-V1 (register/reset/OAuth/MFA) | **hors périmètre V1** — ne pas poursuivre l'Auth ; priorité = états UI & composants structurels |
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
