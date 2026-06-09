# NEXT_ACTIONS.md — Prochaines actions autorisées

> Vérifié depuis le repository (2026-06-09). Ordre cohérent avec l'état réel, les dépendances, les ADR
> validés et les packages déjà disponibles. **Une seule action à la fois.**

## 1. Prochaine action UNIQUE

> **Checkpoint de gouvernance Web Core** (`cores/web-nextjs/`) : **revue de socle** avant d'ouvrir de
> nouvelles capacités. Statuer (décision humaine) sur l'état `IMPLEMENTATION_PARTIELLE` du Web Core
> (Health + TanStack Query + BFF Auth + session/autorisations, 206 tests, preuves API réelles), arbitrer
> la **portée du SSR Auth** et des **routes protégées** (middleware / layout privé), et décider du
> séquencement vis-à-vis du UI Kit, du Mobile et du Cloud/CI-CD. **Pas directement un middleware** : la
> décision d'architecture (SSR Auth complet vs Option A actuelle) doit précéder l'implémentation.

**Justification** : l'**état de session/autorisations est opérationnel** (Web Auth 3 : `me`/`authorization`
read-only, `useSession`/`useAuthorization`, **401→anonymous / 403 distinct**, helpers OR/AND sans wildcard,
purge cache au logout, **changement de droits sans nouveau JWT** — prouvés contre l'API réelle). Avant
d'attaquer les **routes protégées**, un choix d'architecture s'impose (SSR Auth complet — appel `/me`
serveur, gestion du flash/redirection — vs l'**Option A client-only** actuelle). Ce checkpoint évite de
coder un middleware sur une fondation SSR non tranchée.

**Alternative (justifiée)** : **compléter le UI Kit** ou démarrer le **Mobile Core React Native minimal**
(parallélisable), ou avancer **Cloud/CI-CD** pour sécuriser la non-régression. À arbitrer par décision humaine.

**Note gouvernance** : `main` est poussé sur `origin` (SSH). Cette mission ajoute le commit
`feat(web-nextjs): add session and authorization state`.

## 2. Actions immédiatement suivantes (ordre recommandé)

1. **Checkpoint de gouvernance Web Core** — revue de socle ; arbitrage SSR Auth / routes protégées. ✦ prochaine action.
2. **Web Auth 4 — SSR Auth + routes protégées** — middleware / layout privé, redirections, **après** décision d'architecture du checkpoint.
3. **UI Kit (suite)** — composants supplémentaires au besoin (FormField, Alert, Card, états UI) ; pas de bibliothèque exhaustive d'un coup.
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
| Routes protégées / middleware (Web) | **décision d'architecture SSR Auth** (checkpoint de gouvernance) requise d'abord |
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
