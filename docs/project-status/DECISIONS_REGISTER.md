# DECISIONS_REGISTER.md — Registre de lecture rapide des décisions (ADR)

> **Ne remplace pas les ADR** (`docs/adr/`). Fournit une lecture rapide du **statut d'implémentation**
> de chaque décision validée. Vérifié depuis le repository (2026-06-09).
>
> Statuts d'implémentation : `DECIDE_NON_IMPLEMENTE`, `PARTIELLEMENT_IMPLEMENTE`, `IMPLEMENTE`,
> `IMPLEMENTE_ET_REVU`, `NON_APPLICABLE_ACTUELLEMENT`.

## 1. ADR rédigés et Validés (18)

| ADR | Décision (résumé) | Statut ADR | Statut implémentation | Core | Preuve |
|---|---|---|---|---|---|
| ADR-001 | Monorepo Git hybride | Validé | **PARTIELLEMENT_IMPLEMENTE** | Tous | Structure présente ; ⚠️ **aucun commit** |
| ADR-002 | ORM = Prisma (vs TypeORM) | Validé | **IMPLEMENTE_ET_REVU** | api-nestjs | schema + 5 migrations + tests |
| ADR-003 | Validation = class-validator/transformer | Validé | **PARTIELLEMENT_IMPLEMENTE** | api/web/mobile | backend OK ; clients absents |
| ADR-004 | Auth/session multi-client | Validé | **PARTIELLEMENT_IMPLEMENTE** | api/web/mobile | API OK ; cookies web / secure storage mobile absents |
| ADR-005 | Cookies web + CSRF | Validé | **DECIDE_NON_IMPLEMENTE** | api/web | pas de core web |
| ADR-006 | RBAC + permissions fines | Validé | **IMPLEMENTE_ET_REVU** | api/web/mobile/ui | RBAC API + `AUTH_RBAC_REVIEW` |
| ADR-007 | Upload MinIO/S3 + contrats fichiers | Validé | **IMPLEMENTE_ET_REVU** | api/cloud/web/mobile/ui | Files + `FILES_REVIEW` |
| ADR-008 | Design tokens UI Kit | Validé | **PARTIELLEMENT_IMPLEMENTE** | ui-kit/web/mobile | `@enistere/ui-kit` : tokens + 6 primitives Web (64 tests) ; bibliothèque complète à venir |
| ADR-009 | Stack UI Web (Tailwind/Radix/shadcn) | Validé | **PARTIELLEMENT_IMPLEMENTE** | ui-kit/web | primitives Web pilotées par tokens (CSS `--enistere-*`) ; Tailwind/Radix/shadcn = Web Core (non ajoutés au package) |
| ADR-010 | Stack UI React Native | Validé | **PARTIELLEMENT_IMPLEMENTE** | ui-kit/mobile | tokens prêts (RN-safe) ; composants/ThemeProvider RN non implémentés |
| ADR-011 | Client HTTP = Fetch (vs Axios) | Validé | **PARTIELLEMENT_IMPLEMENTE** | web/mobile/api | package `api-client-fetch` ; non intégré aux cores |
| ADR-012 | Server state = TanStack Query | Validé | **DECIDE_NON_IMPLEMENTE** | web/mobile | hooks réservés aux cores (absents) |
| ADR-013 | CI/CD V1 | Validé | **DECIDE_NON_IMPLEMENTE** | cloud/api/web/mobile | aucun workflow |
| ADR-014 | Registry images | Validé | **DECIDE_NON_IMPLEMENTE** | cloud/api/web | aucune image |
| ADR-015 | Stockage mobile sécurisé | Validé | **DECIDE_NON_IMPLEMENTE** | mobile/api | pas de core mobile |
| ADR-016 | OpenAPI + clients typés | Validé | **PARTIELLEMENT_IMPLEMENTE** | api/web/mobile | contrat + packages ; clients non intégrés |
| ADR-039 | Hachage = Argon2id (vs bcrypt) | Validé | **IMPLEMENTE_ET_REVU** | api-nestjs | `PasswordHasher` + tests |
| ADR-040 | Logging structuré (Pino) | Validé | **IMPLEMENTE_ET_REVU** | api/cloud | Pino + `STRUCTURED_LOGGING_COMPATIBILITY_PROOF` + e2e |

## 2. Décisions validées mais NON encore appliquées

À traiter au fil des cores / de l'infrastructure (aucune n'est implémentée aujourd'hui) :

- **ADR-008/009/010** — UI Kit : **partiellement fait** (tokens + 6 primitives Web). Restent : composants
  supplémentaires, stacks Tailwind/Radix/shadcn (Web Core) et ThemeProvider/NativeWind (Mobile Core).
- **ADR-005** — cookies web/CSRF : avec le Web Core.
- **ADR-012** — TanStack Query : hooks dans les cores Web/Mobile (hors packages).
- **ADR-015** — secure storage mobile : avec le Mobile Core.
- **ADR-013 / 014** — CI/CD + registry : infrastructure (hors core API).
- **ADR-016 (reste)** — **publication** des packages et **intégration** dans les cores.

## 3. ADR au backlog, NON rédigés

`ADR-017 → ADR-038` sont listés dans [`../../docs/adr/ADR_BACKLOG.md`](../../docs/adr/ADR_BACKLOG.md)
avec le statut « À rédiger » (queues, monitoring, crash reporting, E2E, i18n, icônes, maps, offline,
backups, déploiement avancé, charts, Flutter/Angular UI, observabilité distribuée, feature flags,
analytics…). **Aucun fichier ADR correspondant n'existe** → `NON_APPLICABLE_ACTUELLEMENT` jusqu'à
rédaction. Bloquants futurs notables : **ADR-034** (Flutter UI) avant `mobile-flutter`, **ADR-035**
(Angular UI) avant `web-angular`.

## 4. Règle de lecture

Un ADR **Validé** documente une **décision**, pas une **implémentation**. Vérifier toujours la colonne
« Statut implémentation » et la « Preuve » avant de considérer une capacité comme disponible. Toute
divergence avec le repository doit être signalée et corrigée dans ce registre, jamais supposée.
