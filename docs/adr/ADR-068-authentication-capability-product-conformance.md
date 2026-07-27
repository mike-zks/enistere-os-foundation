# ADR-068 — Conformité produit de la capability Authentication

- Statut : Validé et implémenté
- Date : 2026-07-27
- Décideur : Owner Foundation
- Complète : ADR-047, ADR-048, ADR-055, ADR-057 et ADR-067

## Contexte

ADR-067 a rendu le Capability Manifest v2 et son graphe exécutables : la Factory
sait **décrire** et **résoudre** une capability. Elle ne savait pas encore
**prouver** qu’une même capability tient le même contrat produit sur plusieurs
runtimes.

Authentication était livrée `ready` sur quatre targets (`nestjs`, `spring`,
`nextjs`, `react-native`). Ses preuves existaient, mais uniquement sous forme de
suites locales à chaque overlay :

- aucune source neutre ne décrivait les cas d’usage, erreurs et garanties ;
- chaque target était jugée contre ses propres tests, donc contre elle-même ;
- la matrice « autorité API » / « client officiel » était implicite ;
- l’audit métier Authentication n’était déclaré nulle part ;
- rien n’empêchait deux adapters de diverger tout en restant « verts ».

La mesure a confirmé le risque : dès qu’un contrat neutre commun a été appliqué,
Spring s’est révélé **non conforme sur quatre invariants**, alors que sa suite
locale passait intégralement.

## Décision

### 1. Un contrat produit neutre et versionné

`capabilities/auth/contracts/authentication.product.v1.json` est la source
unique des exigences Authentication. Il est **indépendant de tout framework** et
déclare :

```text
roles       authority | client | web-client | mobile-client
invariants  AUTH-AUTHORITY-001..008
            AUTH-CLIENT-001..005
            AUTH-WEB-001
            AUTH-MOBILE-001
```

Un invariant énonce une exigence observable (contrat, erreur, garantie de
sécurité, événement d’audit), jamais une implémentation.

### 2. Des rôles, pas des runtimes

Une target n’est pas évaluée sur tous les invariants, mais sur la **closure de
ses rôles**. Une autorité API répond des huit invariants serveur ; un client
officiel des cinq invariants client, plus ceux de sa plateforme. La matrice est
explicite et calculée, jamais devinée :

```text
nestjs        authority
spring        authority
nextjs        client + web-client
react-native  client + mobile-client
```

### 3. La preuve est déclarée, localisée et vérifiée deux fois

Chaque target `ready` porte un `conformance.json` qui associe **chaque**
invariant applicable à au moins une preuve (`test` ou `source`) et à des
marqueurs de contenu. L’évaluateur `factory/conformance/capability-product.mjs` :

- refuse une closure d’invariants incomplète ou excédentaire ;
- refuse une suite non déclarée par le manifest ;
- refuse une preuve `test` qui ne pointe pas un test ;
- vérifie les marqueurs dans la Foundation **et** dans l’application
  matérialisée.

Le second contrôle est branché dans `golden-runtime.mjs`, **après** les gates
réels : une preuve qui disparaît à la composition fait échouer le golden.

### 4. Statuts par preuves

`CONFORMANT` n’est atteint que si toutes les preuves d’une target passent.
`angular` et `flutter` restent `PLANNED`, `fastapi` reste `UNSUPPORTED` : la
conformité d’Authentication ne les rend pas éligibles et ne masque pas leur
absence.

### 5. Convergence Spring imposée par le contrat

Le contrat neutre a exposé quatre divergences réelles de Spring, corrigées ici :

| Invariant | Divergence constatée | Correction |
|---|---|---|
| `AUTH-AUTHORITY-001` | réponse `{ accessToken, refreshToken, tokenType, expiresIn }` : durée de vie du refresh absente, identité publique absente | réponse canonique `{ user, accessToken, refreshToken, tokenType, accessTokenExpiresIn, refreshTokenExpiresIn }` |
| `AUTH-AUTHORITY-002` | `errorCode: "UNAUTHORIZED"` (nom du statut HTTP) | `errorCode: "AUTH_INVALID_CREDENTIALS"`, identique pour identité inconnue, mot de passe faux et compte désactivé |
| `AUTH-AUTHORITY-007` | `429` sans code applicatif | `errorCode: "AUTH_RATE_LIMITED"` |
| `AUTH-AUTHORITY-008` | `AUTH_REFRESH_FAILED` ni déclaré ni émis | constante ajoutée et émise sur chaque échec de refresh |

### 6. Un seul chemin d’erreur

Exprimer un code applicatif exigeait un porteur explicite :
`ResponseStatusException` ne produit que le nom du statut HTTP. Plutôt qu’un
second `@RestControllerAdvice` dans l’overlay — un pipeline d’erreur parallèle,
interdit par le mandat §8.1 — le Platform Baseline gagne
`CodedException (status, errorCode, message)`, traitée par le
`GlobalExceptionHandler` existant. L’enveloppe plate canonique d’ADR-048 est
inchangée ; seul le champ `errorCode` devient exprimable par une capability.

C’est une extension du baseline « Canonical Errors », pas une capability.

## Conséquences

### Acquis

- Authentication est `CONFORMANT` sur ses quatre targets `ready`, contre les
  mêmes invariants neutres.
- NestJS et Spring satisfont chacun les huit invariants serveur ; Next.js et
  React Native leurs six invariants client applicables.
- L’audit métier Authentication (`AUTH_LOGIN_SUCCEEDED`, `AUTH_LOGIN_FAILED`,
  `AUTH_REFRESH_SUCCEEDED`, `AUTH_REFRESH_FAILED`, `AUTH_LOGOUT`) est déclaré et
  testé sur les deux autorités, en s’appuyant sur l’infrastructure d’audit du
  baseline, sans la dupliquer.
- Le rapport calculé est écrit dans
  `factory/conformance/reports/authentication-v1.json`.

### Rupture de contrat assumée

La réponse de session Spring et ses codes d’erreur d’authentification changent.
C’est une **rupture volontaire du contrat HTTP public** des applications Spring
générées, décidée au titre de la parité produit (mandat §8.4 « mêmes contrats,
mêmes erreurs »). Un consommateur qui lisait `expiresIn` ou testait
`errorCode === "UNAUTHORIZED"` doit être mis à jour.

Aucune compatibilité ascendante n’est conservée : maintenir les deux formes
créerait deux contrats concurrents pour la même capability.

### Non revendiqué

- Aucun statut `PRODUCT_EQUIVALENT` ni `PRODUCTION_READY`.
- Angular, Flutter et FastAPI restent sans Authentication.
- Le lifecycle `add/remove/upgrade/migrate` in-place n’est pas livré.
- Aucun test sur device réel.

## Alternatives écartées

- **Aligner le contrat neutre sur l’existant Spring.** Aurait rendu tout le
  monde vert sans rien prouver : le contrat aurait décrit le plus petit
  dénominateur commun au lieu de l’exigence produit.
- **Un `@RestControllerAdvice` propre à Auth.** Second chemin de mapping
  d’erreur pour une même enveloppe, interdit par §8.1.
- **Conserver `expiresIn` en plus des deux durées explicites.** Deux
  représentations de la même donnée dans une même réponse.
- **Déclarer Spring non conforme et différer.** Aurait laissé une divergence
  connue dans une capability annoncée `ready` sur quatre targets.

## Migration

Les applications Spring générées avant cet ADR exposent l’ancienne forme. Le
lifecycle de migration in-place n’existant pas encore, la mise à jour se fait
par régénération. Les clients officiels Next.js et React Native consomment
l’autorité NestJS dans les goldens et ne sont pas affectés.

## Tests

```bash
npm run factory:auth-conformance   # 4 targets ready CONFORMANT
npm run factory:test               # 444 tests, dont capability-product
npm run factory:baseline-gap       # 7 runtimes inchangés
```

Preuves d’exécution réelle :

- Spring `mvn test` : 54/54, dont `AuthIntegrationTest` 16/16 sur PostgreSQL
  réel (Testcontainers) ;
- Spring sans capability : 21/21, baseline non régressé ;
- NestJS `auth.service.spec.ts` : 23/23 ;
- React Native : 359/359, dont `enistere-auth-api.test.ts` désormais matérialisé.

## Rollback

Révoquer le commit : le contrat neutre, l’évaluateur, les descripteurs, la
`CodedException` et la convergence Spring forment une unité. Les targets
redeviennent jugées par leurs seules suites locales, et les quatre divergences
Spring réapparaissent.
