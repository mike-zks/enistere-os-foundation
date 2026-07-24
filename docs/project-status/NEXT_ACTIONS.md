# Prochaine action

## Action unique

**Décision structurante actée : homogénéiser le modèle de composition des 6 runtimes**
([ADR-054](../adr/ADR-054-homogeneous-composition-model.md)) — modèle modular à **source unique** (racine =
base modulaire + overlays ; app complète toujours **composée**, jamais dédoublée ; **aucun `base/` nulle
part**). Aujourd'hui Spring/Angular/Flutter maintiennent une **app complète en double** (`src/`/`lib/`) qui
dérive de leur `base/` — la contradiction du contrat d'erreur Spring (`src/` complet ancien vs `base/`
canonique) en est le symptôme actif.

L'**interim ADR-054 est fait** : le contrat d'erreur du `src/` Spring complet est réconcilié sur l'enveloppe
plate canonique (`ApiError` == base, `GlobalExceptionHandler` + entry point sécurité, tests
`$.status`→`$.statusCode`), `mvnw verify` 99/0. Plus aucun écart **logique actif** entre `base/` et `src/`.

La **Phase 1 ADR-054 (Spring) est faite** : `files` est modularisé en overlay
(`capabilities/files/targets/spring`) — module files, service de stockage MinIO, `FilesConfig`/`StorageConfig`,
migration `V3__add_stored_files.sql`, tests + `FakeStorageService`, `FileService` découplé de l'audit
(cohérent avec les overlays auth/rbac). Target `files/spring` = `ready`, profil `spring-files` promu avec son
golden. Preuve : golden-runtime `spring-files` (mvnw verify vert, MinIO + Postgres Testcontainers) ;
`factory:test` 406/406. Spring compose désormais **base + auth + rbac + files** sans dépasser la sélection.

**Politique de composition des capabilities actée** ([ADR-055](../adr/ADR-055-capability-composition-policy.md)) :
capabilities **atomiques** + graphe `requires` **source unique** (la closure en dérive par tri topologique ;
l'enforcement codé en dur de `validateCapabilityDependencies` est supprimé) + **auto-closure tracée**. Pas de
fusion de capabilities, pas de bundles.

**Contrat de base par famille acté** ([ADR-056](../adr/ADR-056-base-contract-per-family.md)) : la base =
**plancher d'invariants** de la famille, mesuré par conformité, extras = capabilities. Le contrat **API** est
complété de `audit-trail` + `rate-limiting` (infra d'audit + mécanisme de throttling en **base**, événements /
limites par **overlay**, miroir NestJS). Découverte bloquante : l'app complète Spring loge `audit` et
`rate-limiting` **hors de la composition** (ni `base/` ni overlays) → supprimer le doublon régresserait la
sécurité (§12, §8.6) tant que la base Spring n'est pas complétée. Ces trois ADR (054/055/056) sont **des
décisions documentaires — aucune implémentation**.

**ADR-056 étapes 1-2 FAITES** : le contrat API porte désormais `audit-trail` + `rate-limiting`
(`platform-contract.mjs`, mesurés `compliant` sur Nest **et** Spring). La **base Spring** possède désormais la
couche DB/migrations (relocalisée depuis l'overlay auth), l'**infra d'audit** générique (`AuditService` +
`audit_logs` V0, événements par capability : `AuthAuditEvents`, `FilesAuditEvents`) et le **mécanisme de
throttling** (`RateLimiter` en base, interceptors auth/files par overlay). `spring-base` est maintenant
`compliant` sur `migrations`, `audit-trail`, `rate-limiting`. Preuves : `golden-runtime spring-base|spring-auth|
spring-auth-rbac|spring-files` verts ; `factory:test` 406/406.

**ADR-054 A (dédoublage Spring) FAITE** (même PR) : l'app dédoublée `starters/spring/src` est **supprimée**, la
base modulaire **remontée à la racine** (`starters/spring` = base, **plus aucun `base/`**), `composition.baseSource`
retiré (le resolver pointe la racine, comme NestJS). La CI `api-spring-ci.yml` (qui testait l'app écrite à la main)
est **supprimée** — la couverture passe aux golden-runtime `spring-*` (compositions **générées**). Fitness function
**FF5b « source unique »** : un starter sans `baseSource` ne doit pas garder de `base/`. Spring est donc
**source unique** (comme nestjs/nextjs/react-native).

**Prochaine action unique : appliquer le même modèle à Angular puis Flutter** (ADR-054 A pour Web/Mobile) :
supprimer leur app dédoublée (`src`/`lib`), remonter leur `base/` à la racine, retirer `baseSource` — FF5b les y
force dès qu'ils perdent `baseSource`. Prérequis symétrique : compléter leur base au contrat de famille (Web =
9 invariants dont a11y ; Mobile = 8). En parallèle, dette : **base RN sur-remplie** (extraire ses features en
capabilities). Puis ADR-055 étape 1 (dériver la closure du graphe `requires`). Ordre : Angular → Flutter → Mobile RN.

Puis : ADR-055 étape 1 (dériver la closure du graphe `requires`) ; **dette mobile** (base RN sur-remplie ↔
Flutter minimale, même vice) ; **vérification Web**. Ordre global : API → Mobile → Web.

Dette suivie : parité des contrats **générés** (Angular/Flutter → `@enistere/api-contracts`, audit P0) ; a11y ;
capabilities Web/Mobile (Phase 3).

## Cadrage gouvernance

Selon [`ARCHITECTURE_GOVERNANCE.md`](../governance/ARCHITECTURE_GOVERNANCE.md) et la
[Definition of Ready](../governance/DEFINITION_OF_READY.md), commencer par une analyse directe du dépôt après
merge (ne pas supposer les contrats Web suffisants), et aucune readiness sans preuve exécutable
([Definition of Done](../governance/DEFINITION_OF_DONE.md)).

## Dette suivie — missions d'upgrade dédiées

Deux advisories CVE-2026 sans correctif upstream sont couvertes par des exceptions documentées
(`factory/quality/audit-exceptions.json`, échéance 2026-10-31, revue forcée par le gate `audit-check`).
Elles se lèvent **hors du chemin critique** de l'action ci-dessus, chacune selon
[`DEPENDENCY_POLICY.md`](../governance/DEPENDENCY_POLICY.md) (matrice de compatibilité, tests, preuve golden) :

1. **Upgrade Next** — jusqu'à un Next promouvant `sharp` ≥ 0.35.0 → lève les exceptions `sharp` / `next` ;
2. **Upgrade Angular CLI** — jusqu'à ce que la chaîne `@angular/cli` → `@modelcontextprotocol/sdk` tire
   `@hono/node-server` ≥ 2.0.5 → lève la chaîne hono.

## Interdictions temporaires

- nouvelle capability ;
- nouveau runtime ;
- nouvelle topologie ;
- promotion de profil ;
- extension du Domain Compiler ;
- microservices.
