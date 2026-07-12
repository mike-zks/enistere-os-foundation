# API_CORE_V1_READINESS_REVIEW.md — Revue de validation API Core NestJS V1

> Date : 2026-07-12. Revue de statut gouvernée, sans changement runtime.

## 1. Verdict

**Décision : `IMPLEMENTATION_AVANCEE` -> `VALIDE_V1`.**

Le API Core NestJS satisfait les critères V1 de `strategy/04_ROADMAP_GLOBAL.md` §8.4 et de
`cores/api-nestjs/CORE_SPECIFICATION.md` §41. Les réserves restantes sont documentées comme V2/V3
ou hors core V1, et ne bloquent pas la validation du socle.

## 2. Critères Roadmap §8.4

| Critère | Verdict | Preuve |
|---|---|---|
| API démarre localement | OK | `npm run build`, scripts `start:*`, CI runtime API |
| Swagger disponible | OK | `openapi/openapi.json`, `openapi:check` à jour |
| Connexion DB fonctionne | OK | Prisma/PostgreSQL, migrations, CI `api-runtime` avec PostgreSQL jetable |
| Auth login/register fonctionne | OK partiel V1 | Login/refresh/logout/me validés ; register public reste dérivé/hors V1 |
| Rôles exploitables | OK | Roles/Permissions/Authorization + seed RBAC + tests |
| Upload fonctionne | OK | Files upload S3/MinIO, quotas, lifecycle, e2e |
| Erreurs standardisées | OK | `AllExceptionsFilter`, codes d'erreur, enveloppes |
| Logs lisibles | OK | Pino direct + requestId + redaction contractuelle ADR-040 |
| Tests critiques passent | OK | 386 tests unitaires locaux ; e2e couverts par CI runtime |

## 3. Critères Spec §41

| Critère | Verdict |
|---|---|
| Starter NestJS démarre localement | OK |
| Configuration validée | OK |
| Connexion PostgreSQL fonctionne | OK, validée en CI runtime |
| Auth JWT fonctionne | OK |
| Refresh token sécurisé, révocable et testé | OK |
| Users, roles et permissions exploitables | OK |
| `ValidationPipe` global actif | OK |
| Erreurs standardisées | OK |
| Logs lisibles et sans secrets | OK |
| Swagger/OpenAPI disponible et protégé en production si activé | OK |
| Health checks fonctionnent | OK |
| Tests critiques passent | OK |
| Documentation minimale existe | OK |
| Aucune dépendance critique non justifiée | OK, audit 0 vulnérabilité |

## 4. Vérifications locales

| Commande | Résultat |
|---|---|
| `npm run lint` (`cores/api-nestjs`) | PASS |
| `npm run build` (`cores/api-nestjs`) | PASS |
| `npm run test` (`cores/api-nestjs`) | PASS — 47 suites / 386 tests |
| `npm run openapi:check` avec placeholders valides | PASS — `openapi.json` à jour |
| `npm audit` (`cores/api-nestjs`) | PASS — 0 vulnérabilité |

Note environnement : un premier `npm run test` dans le sandbox a échoué sur `listen EPERM` quand
Supertest ouvrait un port local. La relance hors sandbox a passé 386/386 tests. Aucun échec
fonctionnel n'a été observé.

## 5. Preuves complémentaires

- `API_CORE_V1_REVIEW.md` : starter API Core V1 sain, durci, sans bloquant.
- `AUTH_RBAC_REVIEW.md` : Auth/RBAC validé comme composant V1 stable.
- `FILES_REVIEW.md` : bloc Files V1 stable, limites V2 explicites.
- CI `api-runtime` : PostgreSQL + MinIO jetables, migrations, unit + e2e, `openapi:check`, build,
  audit.
- Web Core VALIDE_V1 consomme les contrats/API Files/Auth via BFF et client officiel.
- Packages `@enistere/api-contracts` et `@enistere/api-client-fetch` restent privés/non publiés,
  mais sont intégrés localement et testés ; la publication n'est pas requise pour valider le core V1.

## 6. Réserves non bloquantes

- Register public et profils métier restent à la charge des projets dérivés.
- Redis distribué, queues/jobs, mail, notifications, antivirus réel, traitements médias, upload
  présigné, observabilité métriques/traces et administration RBAC sont V2/V3 ou dépendants
  d'ADR/Cloud futurs.
- Les e2e complets nécessitent PostgreSQL + MinIO ; ils sont validés par la CI runtime plutôt que
  rejoués systématiquement en local.
- La production n'est pas déclarée par cette revue : `VALIDE_V1` porte sur le core API, pas sur une
  release Foundation ni sur un déploiement production.

## 7. Prochaine étape recommandée

**Foundation V1 Baseline Readiness Review** : revue transverse pour décider si le socle
API + Web + UI Kit + Quality + CI/ruleset permet de déclarer une baseline Foundation V1 gouvernée,
sans tag/release automatique et sans tests Cloud réels avant gate final.
