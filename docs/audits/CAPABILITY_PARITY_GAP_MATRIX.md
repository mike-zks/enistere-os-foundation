# Matrice de parité des capabilities

> **CLOS — analyse historique, arrêtée au 2026-07-25.**
> La parité est désormais mesurée par famille de runtimes (ADR-070) et les trois capabilities sont CONFORMANT.
> Ce document est conservé comme preuve de l'état observé à sa date : **il ne décrit
> plus le dépôt**. L'état courant fait foi —
> [`FOUNDATION_CURRENT_STATE`](../project-status/FOUNDATION_CURRENT_STATE.md),
> [`TARGET_VS_CURRENT_IMPLEMENTATION`](TARGET_VS_CURRENT_IMPLEMENTATION.md).

> Rapport de mesure antérieur à l'ADR-057. Le Platform Baseline et l'audit technique ne sont pas des
> capabilities. Le constat courant est
> [TARGET_VS_CURRENT_IMPLEMENTATION.md](TARGET_VS_CURRENT_IMPLEMENTATION.md).

Parité par capability et target, mesurée contre la
[Capability Specification](../specifications/CAPABILITY_SPECIFICATION.md) et la
[Capability Architecture](../architecture/CAPABILITY_ARCHITECTURE.md).

Sources d'évidence : manifestes `capabilities/*/capability.json`, payloads
`capabilities/*/targets/*/overlay.json`, matrice CI `.github/workflows/factory-golden-runtime.yml`.

## Existence vs cible

La cible courante est définie par
[Capability Architecture](../architecture/CAPABILITY_ARCHITECTURE.md). Le tableau ci-dessous est
requalifié selon cette cible.

| Cible | Implémentation | État |
|---|---|---|
| Platform Baseline | ancien `base` | présent partiellement, à sortir du modèle capability |
| Authentication | `auth` | présent (renommage) |
| Authorization | `rbac` | présent (renommage) |
| User Management | — | **absent** |
| Files | `files` | présent |
| Events | — | **absent** |
| Notifications | — | **absent** |

## Matrice de statut (déclaré)

Statut déclaré dans `capability.json` (`ready` avec `mode`, `planned`, `unsupported`, `not-applicable`) :

| Capability | NestJS | Spring | Next.js | Angular | React Native | Flutter |
|---|:--:|:--:|:--:|:--:|:--:|:--:|
| Base | ready | ready | ready | ready | ready | ready |
| Authentication (`auth`) | ready | ready | ready | **planned** | ready | **planned** |
| Authorization (`rbac`) | ready | ready | ready | **planned** | n/a | **planned** |
| Files | ready | **planned** | ready | **planned** | ready | **planned** |
| User Management | — | — | — | — | — | — |
| Events / Notifications | — | — | — | — | — | — |

## Matrice de preuve runtime (golden CI)

`✓` = composition exécutée dans `factory-golden-runtime` (install reproductible + gates réels) ;
`—` = non couverte ; `n/a` = non applicable.

| Capability | NestJS | Spring | Next.js | Angular | React Native | Flutter |
|---|:--:|:--:|:--:|:--:|:--:|:--:|
| Base | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| Authentication | ✓ | ✓ | ✓ (`nest-next-auth`) | — | ✓ (`triple-auth`) | — |
| Authorization | ✓ | ✓ (`spring-auth-rbac`) | ✓ (`nest-next-auth-rbac`) | — | n/a | — |
| Files | ✓ | — | ✓ (`nest-next-files`) | — | ✓ (`triple-files`) | — |

## Détail par cellule non conforme

| Cellule | Adapter | Contrat | Tests | Golden | Écart principal | Sévérité |
|---|:--:|:--:|:--:|:--:|---|:--:|
| Files / Spring | absent | via OpenAPI | non | non | Aucun `capabilities/files/targets/spring/` ; casse la parité API | P1 |
| Auth / Angular | absent | — | non | non | Web base-only ; casse la parité Web | P1 |
| RBAC / Angular | absent | — | non | non | idem | P1 |
| Files / Angular | absent | — | non | non | idem | P1 |
| Auth / Flutter | absent | — | non | non | Mobile base-only ; casse la parité Mobile | P1 |
| Files / Flutter | absent | — | non | non | idem | P1 |
| User Management (toutes) | absent | absent | non | non | Capability cible entièrement manquante | P1 |
| Events / Notifications | absent | absent | non | non | Capabilities cibles manquantes | P2 |

## Conclusion de parité

| Famille | Verdict | Détail |
|---|---|---|
| **API — NestJS vs Spring** | **Quasi-parité, sauf Files** | auth + rbac prouvés des deux côtés ; `files` présent NestJS, absent Spring |
| **Web — Next.js vs Angular** | **Pas de parité** | Next.js = auth/rbac/files ; Angular = base seul |
| **Mobile — React Native vs Flutter** | **Pas de parité** | RN = auth/files ; Flutter = base seul |

La parité n'est aujourd'hui **ni tenue ni mesurable** : Angular et Flutter sont des coquilles base-only,
Spring n'a pas Files, et aucune suite de conformité commune ne prouverait l'équivalence même là où deux
adapters existent (voir [P0-1](FOUNDATION_V2_IMPLEMENTATION_GAP_AUDIT.md)).
