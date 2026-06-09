# NEXT_ACTIONS.md — Prochaines actions autorisées

> Vérifié depuis le repository (2026-06-09). Ordre cohérent avec l'état réel, les dépendances, les ADR
> validés et les packages déjà disponibles. **Une seule action à la fois.**

## 1. Prochaine action UNIQUE

> **Web Auth 3 — profil, autorisations et état de session** (`cores/web-nextjs/`) : exposer
> `GET /api/auth/me` et `GET /api/auth/authorization` (Route Handlers BFF, client **authentifié** lisant
> le cookie ; refresh **writable**), hooks **`useSession`/`useAuthorization`** (TanStack Query), et
> **purge du cache au logout**. **Un seul incrément à la fois.**

**Justification** : les **flux Auth BFF sont opérationnels** (Web Auth 2 : login/refresh/logout + CSRF +
Origin/Referer, cookies `HttpOnly`, prouvés contre l'API réelle). La suite logique est de **lire l'identité
authentifiée** (profil/autorisations) et d'en dériver l'état de session côté client, puis les écrans
protégés (middleware). Découper : (a) `me`/`authorization` + hooks ; (b) purge cache au logout ;
(c) middleware + écrans.

**Alternative (justifiée)** : **compléter le UI Kit** ou démarrer le **Mobile Core React Native minimal**
(parallélisable). À arbitrer par décision humaine.

**Note gouvernance** : `main` est poussé sur `origin` (SSH). Cette mission ajoute le commit
`feat(web-nextjs): implement secure auth BFF flows`.

## 2. Actions immédiatement suivantes (ordre recommandé)

1. **Web Auth 3 — `me`/`authorization` + session TanStack Query** — hooks `useSession`/`useAuthorization`, purge cache au logout. ✦ prochaine action.
2. **Web Auth 4 — écrans authentifiés + middleware** — protection de routes privées, redirections.
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
| Usage **authentifié** des packages (Web) | **flux login/refresh/logout + CSRF opérationnels** (Web Auth 2) ; reste `me`/`authorization` = Web Auth 3 |
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
