# Changelog

Les changements détaillés sont disponibles dans Git et les GitHub Releases.

## Unreleased

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
