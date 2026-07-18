# TECHNICAL_BLUEPRINT.md

> Projet derive : `<project-name>`.
> Profil stack retenu : `<stack-profile>`.
> Statut : `DRAFT`.
> Date : `<YYYY-MM-DD>`.

## 1. Sources Foundation

| Source | Version / ref |
|---|---|
| Foundation commit/tag | `<commit-or-tag>` |
| Stack profile | `<profile>` |
| Matrice | `docs/project-factory/STACK_PROFILES_MATRIX.md` |
| Processus | `docs/project-factory/DERIVED_PROJECT_PROCESS.md` |

## 2. Composition cible

| Couche | Core choisi | Statut | Notes |
|---|---|---|---|
| API | `<api-nestjs/api-spring/aucun>` | `<DIRECT/ADAPT>` | `<notes>` |
| Web | `<web-nextjs/web-angular/aucun>` | `<DIRECT/ADAPT>` | `<notes>` |
| Mobile | `<mobile-react-native/mobile-flutter/aucun>` | `<DIRECT/ADAPT>` | `<notes>` |
| UI | `<ui-kit/angular-material/material3/aucun>` | `<DIRECT/ADAPT>` | `<notes>` |
| Cloud | `<cloud-v1/custom/aucun>` | `<DIRECT/ADAPT>` | `<notes>` |
| Quality | `quality-core` | `DIRECT` | gates et checklists |
| Docs | `docs-core` | `DIRECT` | documentation projet |

## 3. Profil mobile + API

Remplir si le projet contient une application mobile.

| Question | Réponse |
|---|---|
| Profil API + mobile | `<nestjs-react-native/spring-flutter/spring-react-native/nestjs-flutter/autre>` |
| Mode auth mobile | `<Bearer + refresh>` |
| Stockage refresh token | `<SecureStore/SecureStorage/adaptateur projet>` |
| Smoke Android requis | `<oui/non>` |
| Smoke iOS requis | `<oui/non + environnement>` |
| Offline requis V1 | `<oui/non>` |

## 4. Contrats API

| Sujet | Décision |
|---|---|
| Source OpenAPI canonique | `<NestJS/Spring/autre>` |
| Client TypeScript | `<api-client-fetch/tarball/registry/adaptation>` |
| Client Dart | `<Dio manuel/generation future/autre>` |
| Client Angular | `<HttpClient direct/adaptateur futur>` |
| Compatibilité à vérifier | `<oui/non + détails>` |

## 5. Auth, session, RBAC

- Mode web :
- Mode mobile :
- Roles V1 :
- Permissions V1 :
- Refresh :
- Logout/purge :
- Anti open-redirect :
- CSRF/Origin pour mutations web :

## 6. Données et stockage

| Donnee | Stockage | Sensible ? | Retention |
|---|---|---|---|
| `<donnee>` | `<postgres/minio/secure-storage/preferences/...>` | `<oui/non>` | `<retention>` |

## 7. Fichiers

- Upload requis :
- Categories :
- Taille maximale :
- Types MIME :
- URL signées :
- Quarantaine/restauration :
- Suppression :

## 8. Environnements

| Environnement | Objectif | Infra |
|---|---|---|
| Local | développement | `<docker compose/local services>` |
| Staging | validation | `<cloud core/staging custom>` |
| Production | hors V1 ? | `<à définir>` |

## 9. Variables d'environnement

Ne jamais mettre de secret réel dans ce document.

| Variable | Couche | Obligatoire | Description |
|---|---|---:|---|
| `<ENV_NAME>` | `<api/web/mobile/cloud>` | `<oui/non>` | `<description>` |

## 10. Gates qualité

| Gate | Obligatoire V1 | Commande / preuve |
|---|---:|---|
| Docs | oui | `node cores/quality-core/scripts/quality-gates.mjs run docs` |
| API | `<oui/non>` | `<commande>` |
| Web | `<oui/non>` | `<commande>` |
| Mobile | `<oui/non>` | `<commande>` |
| E2E/smoke | `<oui/non>` | `<preuve>` |

## 11. Ecarts Foundation

| Ecart | Justification | ADR projet requis ? |
|---|---|---:|
| `<écart>` | `<raison>` | `<oui/non>` |

## 12. Critères techniques V1

- [ ] composition stack validée ;
- [ ] contrats API vérifiés ;
- [ ] auth/session documentée ;
- [ ] secrets exclus du Git ;
- [ ] gates définis ;
- [ ] smoke minimal défini ;
- [ ] écarts documentés.

