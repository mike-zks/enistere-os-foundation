# NEXT_ACTIONS.md — Prochaines actions autorisées

> Vérifié depuis le repository (2026-06-09). Ordre cohérent avec l'état réel, les dépendances, les ADR
> validés et les packages déjà disponibles. **Une seule action à la fois.**

## 1. Prochaine action UNIQUE

> **Web Core Next.js minimal** (`cores/web-nextjs/`) : starter consommant `@enistere/api-client-fetch`
> + `@enistere/ui-kit` (+ `styles.css`), avec hooks TanStack Query (ADR-012) — **un seul core**.

**Justification** : le **UI Kit fournit désormais tokens + 6 primitives Web** (`@enistere/ui-kit`,
64 tests, 100 %, SSR/install local validés) et les **packages clients** sont prêts. Le premier
consommateur réel est le Web Core Next.js, qui prouve l'intégration de bout en bout (contrat → client →
UI). C'est là qu'ADR-009 (Tailwind/Radix/shadcn) et ADR-005 (cookies/CSRF) s'appliquent.

**Alternative (justifiée)** : **compléter le UI Kit** (composants formulaire/feedback supplémentaires :
FormField, Alert, Card…) avant Next.js, si l'on veut un socle UI plus large d'abord. À arbitrer.

**Note gouvernance** : `main` est poussé sur `origin` (SSH). Cette mission ajoute le commit
`feat(ui-kit): add minimal web primitives`.

## 2. Actions immédiatement suivantes (ordre recommandé)

1. **Web Core Next.js minimal** — starter ; **intégration `@enistere/api-client-fetch`** + hooks TanStack Query (ADR-012) ; cookies/CSRF (ADR-005) ; consomme `@enistere/ui-kit` + `styles.css` ; ADR-009 (Tailwind/Radix/shadcn) au niveau du core. ✦ prochaine action.
2. **UI Kit (suite)** — composants supplémentaires au besoin (FormField, Alert, Card, états UI) ; pas de bibliothèque exhaustive d'un coup.
3. **Mobile Core React Native minimal** — starter Expo/RN ; intégration `api-client-fetch` ; secure storage (ADR-015) ; tokens via ThemeProvider (ADR-010).
4. **Cloud Core minimal** — CI/CD (ADR-013) + registry (ADR-014) + conteneurisation.

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
