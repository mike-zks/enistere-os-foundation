# Changelog

Les changements détaillés sont disponibles dans Git et les GitHub Releases.

## Unreleased

### Capability Packs 1A-R — reproductibilité et preuve runtime des compositions Auth

- **Finalisation explicite des dépendances** : `enistere generate <blueprint> <out> --install` et
  `enistere install <projet>` résolvent le lock racine **sans script lifecycle**
  (`npm install --package-lock-only --ignore-scripts`), installent via `npm ci`, puis enregistrent
  `dependenciesLocked`, `lockDigest` (sha256) et `lockfileVersion` dans `enistere.lock`. Une génération
  sans finalisation est explicitement marquée `dependenciesLocked: false`.
- **`enistere verify <projet>`** (chemin de répertoire) recalcule le digest du lock et détecte toute
  modification, absence ou incohérence de l'état déclaré.
- **`npm audit` sur les quatre goldens**, par exceptions documentées et scopées
  (`factory/quality/audit-exceptions.json` : package, portée, justification, échéance). Aucune
  désactivation globale : les advisories Expo/RN préexistants (cause racine unique `uuid`, modérés,
  outillage de build) sont tolérés uniquement pour les compositions React Native et expirent le
  2026-10-31 ; toute autre vulnérabilité fait échouer le gate.
- **Déterminisme du lock** vérifié par golden (même blueprint + même Foundation → même digest) et par
  la suite de tests réseau `dependencies-install.test.mjs` (lockfiles byte-identiques).

- **Stratégie de lockfile déterministe** : le projet généré devient un workspace npm unifié. Le
  `package.json` racine déclare toutes les applications npm (`apps/api`, `apps/web`, `apps/mobile`) et
  `packages/*` comme membres ; les `@enistere/*` sont résolus via la portée `*` (jamais `file:`/`link:`).
  La fusion de dépendances ne supprime plus aucun lockfile ; un unique `package-lock.json` racine
  (écrit par `npm install`) fait autorité et `npm ci` réinstalle de façon reproductible. Corrige le
  bug 1A où la fusion de dépendances supprimait le lockfile, rendant `npm ci` impossible.
- **CI obligatoire `Factory Golden Runtime`** : pour `nestjs-base`, `nestjs-auth`, `nest-next-auth` et
  `triple-auth`, génère le projet, prouve l'installation reproductible et exécute les gates réels de
  chaque application (NestJS : prisma/lint/tests/e2e Auth/openapi/build ; Next.js :
  typecheck/lint/tests/build ; React Native : typecheck/lint/tests/doctor/`expo export`).
- **Découplage Auth ↔ RBAC (Next.js)** : la surface d'autorisation (résumé rôles/permissions) est
  retirée de l'overlay Auth (elle relève de RBAC), rendant `base+auth` propre au typecheck/build.
- **README de projet généré** dérivé du blueprint et du plan (stack, capabilities, prérequis,
  installation `npm install`/`npm ci`, variables d'env, infra, migrations, démarrage, tests, limites,
  provenance/lock).
- **Non-régression Auth V1** documentée et prouvée (`docs/project-status/AUTH_V1_NON_REGRESSION.md`) :
  aucune garantie Auth historique perdue ; suppression de la dépendance Auth → RBAC et d'une variable
  d'environnement requise mais morte (`JWT_REFRESH_SECRET`).

### Capability Packs 1A — extraction Auth (NestJS + Next.js + React Native)

- Moteur d'overlays déclaratifs (`factory/engine/overlay.mjs`, `overlay.schema.json`) : le
  moteur Factory est l'unique interpréteur (copies de fichiers, fusion de dépendances, variables
  d'environnement, intégrations centrales connues, commandes de vérification). Aucun script, hook,
  eval ni commande libre depuis un manifeste. Échec sur conflit de fichiers non déclaré, opération
  ou intégration inconnue, conflit de version de dépendance et chemin non sûr.
- `auth` passe à `ready`/`overlay` uniquement sur `nestjs`, `nextjs` et `react-native` ; Spring,
  Angular, Flutter, RBAC et Files restent `planned`. `generate` continue de refuser RBAC et Files.
- Baselines `base` réellement minimales : chaque starter compile/démarre et se teste sans Auth,
  via des points d'intégration générés (composition NestJS, providers Next.js/Expo, nav publique).
- Auth NestJS ne dépend plus de RBAC : `AuthModule` n'importe plus `AuthorizationModule`/Roles/
  Permissions. Configuration Auth auto-validée par namespace (`registerAs`), sans couplage à la
  configuration de la baseline.
- `generationMode` devient `modular-overlay` et `bundledFeaturesMayExceedSelection=false` pour les
  compositions dont toutes les targets sélectionnées sont modulaires ; `enistere.lock` inscrit les
  versions et digests des overlays appliqués.
- Contrat OpenAPI canonique complet figé dans `packages/api-contracts/contract/` : les clients
  restent typés contre la surface composée, indépendamment de la baseline générée.
- Goldens `base`/`base+auth` vérifiés pour les trois verticales (absence dans base, présence dans
  base+auth, aucune capability RBAC/Files injectée).

### Foundation V2 consolidation

- Taxonomie AI/Quality/Deployment aplatie : ces surfaces ne sont plus présentées comme des cores.
- Strategy et project-status réduits à des sources V2 décisionnelles.
- Rapports de micro-missions supprimés des sources actives ; Git reste l'archive.
- Préparation du contrat Starter/Capability V2 et des overlays réels.

## Foundation V2 architecture — 2026-07-18

- Project Factory déterministe et CLI `enistere`.
- Six starters indépendants, packages partagés et packs de deployment.
- Blueprint/lock, matrice de stacks et orchestration locale Codex/Claude/Gemini.
- ADR-042 validé.

## Foundation V1 — 2026-07-12

Baseline publiée sous le tag `foundation-v1.0.0`.
Voir `docs/project-status/FOUNDATION_V1_RELEASE_NOTES.md`.
