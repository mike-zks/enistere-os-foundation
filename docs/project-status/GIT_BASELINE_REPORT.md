# GIT_BASELINE_REPORT.md — Baseline Git de référence

> Preuve durable de l'établissement de la **baseline Git** d'Enistere OS Foundation (ADR-001).
> Date : **2026-06-09**.

## Synthèse

| Élément | Valeur |
|---|---|
| Branche | `main` |
| Commit baseline | `7dcb543` |
| Message | `chore: establish Enistere OS Foundation baseline` |
| Fichiers versionnés | **322** |
| Identité Git | Mike Zacharia Sanogo `<arijacksanogo@gmail.com>` (déjà configurée) |
| Remote | `origin` = `github.com/mike-zks/enistere-os-foundation` (configuré, **NON poussé**) |
| Working tree final | **propre** |

## Exclusions (non versionnées)

`node_modules/`, `dist/`, `build/`, `coverage/`, `.next/`, `.env`/`.env.*` (sauf `.env.example`),
`*.log`, `*.tsbuildinfo`, `*.tgz`, `*.pid`, `*.tmp`, `tmp/`/`temp/`/`.cache/`, `.DS_Store`, et
**`.claude/`** (état runtime de l'outillage agent — `scheduled_tasks.lock`, retiré de l'index).

## Versionnés intentionnellement

`starters/nestjs/openapi/openapi.json` (snapshot canonique), `packages/api-contracts/src/generated/schema.ts`
(types générés suivis), `starters/nestjs/prisma/migrations/` (5 migrations), `package-lock.json`
(racine + api-nestjs), `starters/nestjs/.env.example` (placeholders, **pas** de secret réel).

## Répartition (fichiers indexés)

`starters/nestjs` ~221 · `packages/api-client-fetch` 30 · `docs/adr` 20 · `packages/api-contracts` 9 ·
`docs/project-status` 6 · `strategy` 10 · `prompts` 7 · `templates` 4 · `.github` (templates) ·
racine (`README.md`, `CHANGELOG.md`, `.gitignore`, `package.json`, `package-lock.json`, etc.).

## Dossiers vides (non représentables dans Git)

`cores/{ai-core, api-spring, docs-core, mobile-flutter, quality-core, web-angular}` sont vides : Git ne
versionne pas les dossiers vides et **aucun `.gitkeep` n'a été créé** (décision : ne pas modifier le
contenu documentaire des cores). Leur statut logique reste `DOSSIER_SEULEMENT` (voir
[`IMPLEMENTATION_MATRIX.md`](./IMPLEMENTATION_MATRIX.md)) ; ils seront recréés à l'ajout d'un fichier.

## Validations exécutées avant baseline

Toutes **vertes** (exécution locale, 2026-06-09) :

- **Packages** : `generate:check`, `typecheck`, `build`, `test` (`@enistere/api-contracts` **11/11**) ;
  `typecheck`, `build`, `test` (`@enistere/api-client-fetch` **29/29**) ; `npm audit` racine **0**.
- **API Core** : `npm install`, `openapi:check`, `prisma:generate`, `prisma:validate`, `build`,
  `lint`, `test` unitaire **377/377**, `npm audit` **0**.

**Non exécuté** : suite **e2e** du API Core (nécessite PostgreSQL + MinIO jetables ; conteneurs non
provisionnés pour cette mission Git). Référence : e2e **101/101 ×2** verts lors de la mission
précédente (packages) ; aucune modification fonctionnelle depuis.

## Audit de sécurité

Recherche de credentials réelles sur les fichiers indexés : **aucune**. Les occurrences détectées sont
des **placeholders** (`.env.example` : `replace-with-…`, `user:password@localhost`), des **noms de
variables** (README/docs) ou des **sentinelles/fixtures de test** (`SENTINEL_ACCESS`, faux
`postgresql://user:secretpw@…`, `minioadmin` dans des assertions de non-fuite). Aucune clé privée,
aucun secret long réel.

## Artefacts / tailles

Aucun fichier > 1 Mo hors dossiers ignorés ; aucun dump, binaire, média, archive, donnée
PostgreSQL/MinIO ni artefact de build dans l'index.

## Remote

`origin` est configuré mais **aucun `git push` n'a été effectué** (conformément au périmètre). Le push
est une **décision humaine/gouvernance**.

## Prochaine action

Le prérequis « baseline Git » étant satisfait, la prochaine action est l'**initialisation du starter
UI Kit minimal** (`packages/ui-kit/`) — voir [`NEXT_ACTIONS.md`](./NEXT_ACTIONS.md). Décision humaine
recommandée : **pousser** la baseline vers `origin`.
