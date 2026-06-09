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
- **En cours** : **UI Kit** (`@enistere/ui-kit`, **0.1.1**, privé) — design tokens **+ 6 primitives Web React**
  (Button, Input, Label, Text, Spinner, VisuallyHidden) pilotées par tokens, accessibles. React =
  peerDependency `>=18` ; **aligné et testé sous React 19** (64 tests, 100 %). CSS via
  `@enistere/ui-kit/styles.css`. Statut : **IMPLEMENTATION_PARTIELLE** ; **consommé par le Web Core**.
- **Starter** : **Web Core** (`@enistere/web-nextjs`, 0.1.0, privé) — **Next 16 App Router + React 19**,
  TypeScript strict, Server Components par défaut, UI Kit consommé (+ `styles.css`), thème clair via
  `data-theme`, états loading/error/not-found, en-têtes sécurité + pas de `X-Powered-By`. **25 tests**
  (node:test + Testing Library + jest-axe) + build + sonde HTTP. **Aucun appel réseau, aucune auth.**
  Statut : **STARTER_INITIALISE**.
- **Packages** : `@enistere/api-contracts` et `@enistere/api-client-fetch` (0.1.0, privés) — validés
  **localement** (tests + live 16/16), **non publiés** ; **résolus à la compilation** dans le Web Core,
  **non instanciés**.
- **Documentaires (spéc seule, aucun starter)** : `cloud`, `mobile-react-native`.
- **Vides** : `ai-core`, `api-spring`, `docs-core`, `mobile-flutter`, `quality-core`, `web-angular`.
- **Absents** : CI/CD, conteneurisation.
- **Git** : `main` poussé sur `origin` (SSH). Commits récents : `feat(web-nextjs): initialize minimal starter`
  (+ alignement UI Kit React 19), `feat(ui-kit): add minimal web primitives`, baseline.
- **Audit** : **0 vulnérabilité** (override `postcss ^8.5.15` neutralisant l'advisory transitif de Next 16).

## 4. Cores techniquement implémentés

`cores/api-nestjs/` (avancé), `cores/ui-kit/` (starter tokens + primitives, React 19) et
`cores/web-nextjs/` (starter Next 16 App Router, **STARTER_INITIALISE**).

## 5. Cores documentaires

`cloud`, `mobile-react-native` (un `CORE_SPECIFICATION.md` chacun, **pas** de starter).
`ui-kit` et `web-nextjs` ont leur spéc **et** un starter.

## 6. Packages

`@enistere/api-contracts` (types OpenAPI, runtime-indépendant) ; `@enistere/api-client-fetch`
(client Fetch typé + wrappers : auth, erreurs, timeout, refresh, multipart). Workspaces npm
(`packages/*`, `cores/ui-kit`, `cores/web-nextjs`). **Non publiés** ; UI Kit **consommé** par le Web
Core, paquets API **résolus à la compilation** (non instanciés).

## 7. ADR clés

18 ADR **Validés** (001–016, 039, 040). Implémentés et revus : 002 (Prisma), 006 (RBAC), 007 (upload),
039 (Argon2id), 040 (logging). Partiels : 001 (monorepo, **mais aucun commit**), 003, 004, 011, 016.
Décidés non implémentés : 005, 012, 013, 014, 015. **008/009/010 partiels** (UI Kit : tokens + primitives
Web ; stacks Tailwind/RN non ajoutées). ADR-017→038 = backlog non rédigé. Détail : [`DECISIONS_REGISTER.md`](./DECISIONS_REGISTER.md).

## 8. Dernière étape terminée

**Web Core Next.js 1 — starter minimal** (`@enistere/web-nextjs`) : Next 16 App Router + React 19,
TypeScript strict, Server Components par défaut, UI Kit **réellement consommé** (classes `enistere-*` +
`styles.css`), thème clair via `data-theme`, états loading/error/not-found, métadonnées, en-têtes
sécurité + `X-Powered-By` absent, **aucun appel réseau / aucune auth**. 25 tests + build + sonde HTTP
verts ; **0 vulnérabilité**. UI Kit **aligné React 19** (v0.1.1, 64 tests, 0 régression) ; API Core et
paquets non régressés. Commit `feat(web-nextjs): initialize minimal starter`.

## 9. Prochaine étape

**Action unique** : faire progresser le **Web Core** de `STARTER_INITIALISE` à `IMPLEMENTATION_PARTIELLE`
— **instancier `@enistere/api-client-fetch`** + hooks TanStack Query (ADR-012), puis Auth/BFF
(cookies `HttpOnly`, CSRF — ADR-005/011). Alternative : compléter le UI Kit ou démarrer le Mobile Core.
Détail : [`NEXT_ACTIONS.md`](./NEXT_ACTIONS.md).

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

# UI Kit (cores/ui-kit/)
npm run test --workspace=@enistere/ui-kit

# Web Core (cores/web-nextjs/) — port 3100
npm run check --workspace=@enistere/web-nextjs   # typecheck + lint + test + build
```
