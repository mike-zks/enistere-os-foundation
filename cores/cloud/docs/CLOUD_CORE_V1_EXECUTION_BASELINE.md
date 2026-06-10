# Cloud Core V1 — Baseline d'exécution (cadrage)

> **Cadrage opérationnel, non destructif.** Ce document transforme la CI minimale existante en **socle
> gouverné** : environnements, protection de branche, politique CI/CD progressive, secrets, registry,
> runtime API et E2E. **Aucun déploiement, Docker, registry, secret ni workflow runtime n'est créé ici.**
> Source de vérité : le repository réel + `cores/cloud/CORE_SPECIFICATION.md`. Date : 2026-06-10.

## 1. Objectif

Donner au Cloud Core une **base d'exécution gouvernée** avant toute infrastructure réelle : décrire ce qui
existe (CI minimale ADR-013), définir les **environnements logiques**, la **protection de branche**, la
**progression CI/CD**, et les **politiques** (secrets, registry, runtime API, E2E). Ces décisions préparent
l'implémentation future **sans l'anticiper** (pas de Compose, pas de Traefik, pas de GHCR, pas de déploiement).

## 2. État actuel

- **CI minimale présente** (`.github/workflows/ci.yml`, ADR-013 partiel) : GitHub Actions, Node 24, `npm ci`,
  `permissions: contents: read`, ordre `api-contracts → api-client-fetch → ui-kit → web-nextjs → audit`,
  `npm audit` 0 vuln, gardes Axios/Zustand. **Aucun secret, Docker, base, stockage, registry ni déploiement.**
- **API Core NestJS** : exécuté localement avec PostgreSQL + MinIO **jetables** (preuves runtime), mais
  **aucune CI runtime** ne le rejoue (pas de services GitHub Actions).
- **Web Core Next.js** : build **indépendant de l'API** ; preuves runtime rejouées localement (PostgreSQL +
  MinIO), **aucun E2E navigateur permanent**.
- **Cloud Core** : `CORE_SPECIFICATION.md` (cible complète) ; **aucune infrastructure réelle**.

## 3. Périmètre Cloud Core V1 (cette mission)

**Inclus** : cadrage des environnements, checklist de protection de branche (à appliquer manuellement dans
GitHub Settings), politique CI progressive (4 niveaux), politiques secrets/registry, plans (non implémentés)
CI runtime API et E2E Web, notes observabilité/rollback, mise à jour du checkpoint. **Statut Cloud Core :
`CADRAGE_OPERATIONNEL`** (cadrage gouverné, **pas** d'implémentation).

**Exclus** : Dockerfile, Compose, Traefik, GHCR/registry, déploiement, Helm/K8s/Terraform/Ansible, secrets
GitHub réels, GitHub Environments réels via API, workflows deploy/registry/runtime, monitoring réel, OSRM/
PostGIS réels, backups réels.

## 4. Ce qui existe déjà

| Élément | État |
|---|---|
| CI non-régression monorepo (ADR-013) | **présent** (`.github/workflows/ci.yml`, niveau 1) |
| Ordre de build imposé | **présent** (jobs `needs`) |
| Garde `npm audit` 0 vuln | **présent** |
| Gardes Axios/Zustand | **présent** (ADR-011/012) |
| Build Web sans API | **présent** (force-dynamic) |
| Preuves runtime API+MinIO (locales) | **présent** (non CI) |

## 5. Ce qui n'existe pas encore

Protection de branche `main` · GitHub Environments · CI runtime API (PostgreSQL/MinIO en CI) · e2e API en CI ·
E2E navigateur Web · couverture publiée · build/push d'images (GHCR, ADR-014) · déploiement · staging/preview/
production réels · monitoring/observabilité · backups/restore · Traefik/DNS/TLS · secrets manager.

## 6. Environnements cibles (logiques)

Voir la section **8** de cette baseline et `GITHUB_BRANCH_PROTECTION_CHECKLIST.md`. Cinq environnements
logiques : `local`, `ci`, `preview`, `staging`, `production`. **Seuls `local` et `ci` existent réellement
aujourd'hui** ; `preview`/`staging`/`production` sont **cadrés mais non implémentés**.

## 7. Politique de branches

`main` est la branche par défaut et la seule branche longue durée (ADR-001). **Recommandation V1** : protéger
`main` (PR obligatoire, CI obligatoire, force-push interdit, suppression interdite). Application **manuelle**
dans GitHub Settings — voir `GITHUB_BRANCH_PROTECTION_CHECKLIST.md`. Aucune application via l'API GitHub dans
cette mission.

## 8. Politique de CI (progressive)

Quatre niveaux — **seul le niveau 1 est implémenté** (voir aussi `.github/workflows/README.md`) :

- **Niveau 1 (présent)** : contrats, client API, UI Kit, Web Core, audit, gardes dépendances.
- **Niveau 2 (prochain)** : CI **runtime API NestJS** (PostgreSQL + MinIO en services), e2e API, migrations
  Prisma, OpenAPI generate/check. Détail : `API_RUNTIME_CI_PLAN.md`.
- **Niveau 3 (ensuite)** : **E2E navigateur** Web (Health/Auth/Files), artefacts de test non sensibles.
  Détail : `WEB_E2E_CI_PLAN.md`.
- **Niveau 4 (futur)** : build images, **GHCR** (ADR-014), déploiement staging, approbation production,
  rollback. Détail : `REGISTRY_POLICY.md`.

## 9. Politique de secrets

Détail : `SECRETS_POLICY.md`. Principe : **aucun secret dans le repository ni dans la CI minimale actuelle** ;
usage futur via **GitHub Environments** scoppés ; jamais de secret en `NEXT_PUBLIC_*` ; jamais de secret
journalisé. Cette mission **n'ajoute aucun secret**.

## 10. Politique registry

Détail : `REGISTRY_POLICY.md`. Cible **GHCR** (ADR-014), tags **immuables** (sha court ; pas de `latest` comme
référence prod unique), semver/provenance plus tard. **ADR-014 reste `NON_IMPLEMENTE`** — aucune image
construite ni poussée dans cette mission.

## 11. Politique déploiement

**Aucun déploiement** en V1. Cible (V4, future) : manuel documenté → scripté → CI/CD avec environnements
protégés et **rollback** (voir §15). Tout déploiement futur passera par Traefik (exposition), GitHub
Environments protégés et approbation production. **Non implémenté.**

## 12. Politique runtime API (future)

Détail : `API_RUNTIME_CI_PLAN.md`. Prochaine CI possible pour l'API NestJS : services PostgreSQL + MinIO,
`prisma generate/validate/migrate deploy`, tests unitaires + e2e, `openapi:check`, `npm audit`, **logs sans
secret**. **Non implémentée** ici (prérequis : scripts API stables, variables de test, temps CI acceptable,
cleanup).

## 13. Politique E2E (future)

Détail : `WEB_E2E_CI_PLAN.md`. Niveau E2E navigateur futur : stack API + PostgreSQL + MinIO + Web, parcours
Health/Auth/Files, **données éphémères**, captures uniquement en échec, **aucun secret**. Outil (Playwright ou
alternative) **à décider** ; **non ajouté** ici.

## 14. Politique observabilité (future)

Aujourd'hui : **logs structurés** (Pino, ADR-040) + **`X-Request-Id`** propagé (API ↔ BFF Web). Plus tard
(V3/VF) : OpenTelemetry possible, Prometheus/Grafana/Loki/Alertmanager, dashboards **protégés**, rétention
définie. **Aucun monitoring réel** maintenant.

## 15. Politique rollback (future)

**Non implémenté.** Principe futur : revenir à un **tag/image précédent** (registry immuable), migrations DB
**prudentes** (compatibilité ascendante, pas de destructive sans plan), feature flags possibles. Tout
déploiement futur devra documenter sa procédure de rollback.

## 16. Limites V1

Pas de protection de branche appliquée (manuel) ; pas de CI runtime API/e2e ; pas d'E2E navigateur ; pas de
couverture publiée ; pas de registry/déploiement/monitoring/backups ; environnements `preview`/`staging`/
`production` **théoriques**. La reproductibilité hors-CI (clone local) reste à documenter (ordre `npm run
build` racine). **Aucun statut n'est augmenté artificiellement.**

## 17. Étapes suivantes

1. **Appliquer** la checklist de protection de branche `main` (manuel, GitHub Settings).
2. **Niveau 2** : workflow CI runtime API (PostgreSQL + MinIO services) — `API_RUNTIME_CI_PLAN.md`.
3. **Niveau 3** : E2E navigateur — `WEB_E2E_CI_PLAN.md`.
4. **Niveau 4** : registry GHCR (ADR-014) puis déploiement par environnement protégé.
5. Rédiger les ADR structurants au moment voulu (registry si structurante, OSRM/PostGIS si adoptés).
