# NEXT_ACTIONS.md — Prochaines actions autorisées

> Vérifié depuis le repository (2026-06-09). Ordre cohérent avec l'état réel, les dépendances, les ADR
> validés et les packages déjà disponibles. **Une seule action à la fois.**

## 1. Prochaine action UNIQUE

> **UI Kit 2 — primitives Web minimales** (`cores/ui-kit/`) : quelques composants primitifs (ex. Box,
> Text, Button) consommant les tokens, **sans bibliothèque complète**.

**Justification** : le **starter UI Kit (tokens) est livré** (`@enistere/ui-kit` — tokens validés,
générés, 25 tests, 100 % couverture). L'étape suivante naturelle est de prouver la **consommation** des
tokens par quelques primitives Web, avant d'initialiser le Web Core Next.js. Cela reste dans le UI Kit
(dépendance commune), sans créer de projet Next.js ni de bibliothèque exhaustive. ADR-009 (stack Web)
encadrera l'ajout éventuel de Tailwind/Radix/shadcn — **non requis** pour des primitives basées tokens.

**Note gouvernance** : la baseline Git existe (`7dcb543`) ; **push vers `origin` non fait** (décision
humaine). L'initialisation du UI Kit a ajouté un commit local `feat(ui-kit): initialize token foundation`.

## 2. Actions immédiatement suivantes (ordre recommandé)

1. **UI Kit 2 — primitives Web** (composants minimaux consommant les tokens) ✦ prochaine action.
2. **Web Core Next.js minimal** — starter ; **intégration de `@enistere/api-client-fetch`** + hooks TanStack Query (ADR-012) ; cookies/CSRF (ADR-005) ; consomme le UI Kit + `@enistere/ui-kit/tokens.css`.
3. **Mobile Core React Native minimal** — starter Expo/RN ; intégration `api-client-fetch` ; secure storage (ADR-015) ; consomme les tokens (ThemeProvider, ADR-010).
4. **Cloud Core minimal** — CI/CD (ADR-013) + registry (ADR-014) + conteneurisation, au service du API Core et des cores clients.

**Alternative envisageable (justifiée)** : avancer **Cloud Core / CI-CD (ADR-013)** plus tôt pour
sécuriser la non-régression (aucune CI aujourd'hui) et préparer la publication des packages. Reste
**non recommandé en premier** car il n'apporte pas de valeur produit immédiate et le UI Kit débloque
deux cores. À arbitrer par décision humaine.

## 3. Actions bloquées

| Action | Bloquée par |
|---|---|
| Intégrer les packages dans Web/Mobile | starters Web/Mobile inexistants (donc UI Kit d'abord) |
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

1. Starter UI Kit exécutable (build + lint + tests verts) **et** revu.
2. Aucune régression du API Core ni des packages.
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
