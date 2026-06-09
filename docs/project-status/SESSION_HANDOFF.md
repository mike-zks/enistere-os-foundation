# SESSION_HANDOFF.md — Transfert de session (compact)

> Document court et exploitable pour démarrer une nouvelle conversation / un autre agent.
> **Source de vérité = le repository**, résumé par `docs/project-status/`. Vérifié le 2026-06-09.

## Bloc de démarrage (à copier en début de session)

```
Nous poursuivons Enistere OS Foundation.
Les fichiers du dossier docs/project-status/ sont la source officielle
de vérité. Lis-les avant toute recommandation et ne suppose aucune
implémentation absente de la matrice.
```

## 1. Projet

Enistere OS Foundation — monorepo de socles (cores) techniques + packages partagés + stratégie/ADR.

## 2. Objectif courant

Faire progresser les cores V1 **un par un**, en s'appuyant sur le API Core et les packages déjà
disponibles, sans régression et sans confondre spécification et implémentation.

## 3. État réel (résumé)

- **Implémenté** : **API Core NestJS** (auth, sessions, refresh, RBAC, permissions, audit, files
  S3/MinIO, logging Pino, OpenAPI canonique) — 377 tests unitaires + 101 e2e + revues. Statut :
  **IMPLEMENTATION_AVANCEE**.
- **En cours** : **UI Kit** (`@enistere/ui-kit`, 0.1.0, privé) — design tokens **+ 6 primitives Web React**
  (Button, Input, Label, Text, Spinner, VisuallyHidden) pilotées par tokens, accessibles. React =
  peerDependency ; CSS via `@enistere/ui-kit/styles.css`. **64 tests, 100 % couverture** (node:test +
  global-jsdom + Testing Library + jest-axe). Statut : **IMPLEMENTATION_PARTIELLE** (pas de bibliothèque complète).
- **Packages** : `@enistere/api-contracts` et `@enistere/api-client-fetch` (0.1.0, privés) — validés
  **localement** (tests + live 16/16), **non publiés**, **non intégrés** dans un core client.
- **Documentaires (spéc seule, aucun starter)** : `cloud`, `web-nextjs`, `mobile-react-native`.
- **Vides** : `ai-core`, `api-spring`, `docs-core`, `mobile-flutter`, `quality-core`, `web-angular`.
- **Absents** : CI/CD, conteneurisation.
- **Git** : `main` poussé sur `origin` (SSH). Commits récents : `feat(ui-kit): add minimal web primitives`,
  `feat(ui-kit): initialize token foundation`, checkpoint, baseline.

## 4. Cores techniquement implémentés

`cores/api-nestjs/` (avancé) et `cores/ui-kit/` (starter tokens).

## 5. Cores documentaires

`cloud`, `web-nextjs`, `mobile-react-native` (un `CORE_SPECIFICATION.md` chacun, **pas** de starter).
Le `ui-kit` a sa spéc **et** un starter (tokens).

## 6. Packages

`@enistere/api-contracts` (types OpenAPI, runtime-indépendant) ; `@enistere/api-client-fetch`
(client Fetch typé + wrappers : auth, erreurs, timeout, refresh, multipart). Workspaces npm
(`packages/*`). **Non publiés, non intégrés.**

## 7. ADR clés

18 ADR **Validés** (001–016, 039, 040). Implémentés et revus : 002 (Prisma), 006 (RBAC), 007 (upload),
039 (Argon2id), 040 (logging). Partiels : 001 (monorepo, **mais aucun commit**), 003, 004, 011, 016.
Décidés non implémentés : 005, 012, 013, 014, 015. **008/009/010 partiels** (UI Kit : tokens + primitives
Web ; stacks Tailwind/RN non ajoutées). ADR-017→038 = backlog non rédigé. Détail : [`DECISIONS_REGISTER.md`](./DECISIONS_REGISTER.md).

## 8. Dernière étape terminée

**UI Kit 2 — primitives Web** : 6 composants React accessibles (Button, Input, Label, Text, Spinner,
VisuallyHidden) pilotés par tokens, CSS agrégé `styles.css`, 64 tests + a11y + install local SSR validé,
0 vulnérabilité, packages API non régressés ; commit `feat(ui-kit): add minimal web primitives`.

## 9. Prochaine étape

**Action unique** : initialiser le **Web Core Next.js minimal** (consommant `@enistere/api-client-fetch`
+ `@enistere/ui-kit` + `styles.css`, hooks TanStack Query ADR-012). Alternative : compléter le UI Kit
(composants supplémentaires). Détail : [`NEXT_ACTIONS.md`](./NEXT_ACTIONS.md).

## 10. Règles à ne pas violer

- Vérifier le repository ; ne jamais se fier au seul rapport précédent.
- Ne jamais inventer un starter ni déclarer « validé » sans tests + revue.
- Ne pas confondre ADR / spécification / preuve / package / intégration.
- Un seul core par mission ; ne pas modifier API Core ou packages sans mission dédiée.
- Signaler tout état Git non propre ; ne pas supprimer une preuve sans remplacement vérifié.
- Mettre à jour `docs/project-status/` + `CHANGELOG.md` en fin de mission.

## 11. Fichiers à lire (dans l'ordre)

1. `docs/project-status/SESSION_HANDOFF.md` (ce fichier)
2. `docs/project-status/FOUNDATION_CURRENT_STATE.md`
3. `docs/project-status/IMPLEMENTATION_MATRIX.md`
4. `docs/project-status/NEXT_ACTIONS.md`
5. `docs/project-status/DECISIONS_REGISTER.md`
6. Pour le API Core : `cores/api-nestjs/docs/API_CORE_V1_IMPLEMENTATION_STATUS.md`

## 12. Commandes utiles

```bash
# Vérifier l'état réel
git status --short
find cores -maxdepth 2 -type f | sort
ls packages/*/

# API Core (cores/api-nestjs/) — nécessite PostgreSQL + MinIO jetables pour e2e
npm run build && npm run lint && npm run test
npm run openapi:check

# Packages (racine)
npm install && npm run build && npm test && npm run generate:check
```
