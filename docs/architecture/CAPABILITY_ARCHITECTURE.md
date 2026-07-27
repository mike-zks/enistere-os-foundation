# Architecture des capabilities

## Définition

Une capability est une fonctionnalité optionnelle, composable, ciblable et versionnée. Elle porte une
valeur produit réutilisable et peut être ajoutée, retirée ou mise à niveau par le lifecycle.

Le Platform Baseline n'est pas une capability. Configuration, Canonical Errors, Structured Logging,
Correlation, Observability, Technical Audit, Security Baseline, Health, Diagnostics, Testing Foundation,
Lifecycle Hooks, Extension Points, Build et Quality Gates sont obligatoires.

## Catalogue cible

### Identité et accès

- Authentication ;
- Authorization ;
- User Management ;
- Multitenancy.

### Contenu et intégration

- Files ;
- Events ;
- Notifications ;
- Realtime ;
- Search.

### Pilotage

- Automation ;
- Feature Flags ;
- Workflow.

Des capabilities métier génériques telles que Payments, Subscriptions, Document Management, Reporting,
Media Management, Approval ou Import/Export pourront être adoptées par ADR.

## Sémantique du catalogue minimal

| Capability | Responsabilité | Targets/modes typiques | Primitives possibles |
|---|---|---|---|
| Authentication | preuve d'identité, sessions/tokens, révocation | API + clients ; local/federated | cache, mail, secrets |
| Authorization | décisions permissions/policies | API autoritaire + adaptations UI | cache optionnel |
| User Management | cycle de vie comptes/profils | API + interfaces admin/self-service | relational/document DB |
| Files | upload, metadata, accès, rétention | API + clients ; object/content modes | object storage ou content repository |
| Events | publication/consommation fiable | API/worker ; in-process/brokered | queue/broker |
| Notifications | préférences, templates, délivrance | API/worker + clients | mail, push, queue |
| Automation | triggers, jobs, règles bornées | API/worker | queue/broker/cache |
| Realtime | canaux live et présence | API + Web/Mobile | broker/cache |
| Search | indexation, requête, permissions | API + clients | search |
| Feature Flags | évaluation et rollout | tous runtimes | cache/provider |
| Multitenancy | contexte tenant, isolation et quotas | API + clients | DB/cache/secrets selon mode |
| Workflow | états, transitions, tâches/approbations | API + clients/worker | DB/queue/broker |

Chaque ligne décrit une cible fonctionnelle, pas un support actuel. Un mode de capability peut changer ses
dépendances et conflits ; il doit rester explicite et couvert par conformance.

## Manifeste

```text
Capability
├── identity and version
├── use cases and rules
├── contracts and errors
├── adapters and targets
├── dependencies and conflicts
├── required primitives
├── deployment modes
├── migrations
├── telemetry contributions
├── business audit declarations
└── conformance suites
```

Chaque runtime possède un statut explicite. Une target `planned` ou `unsupported`
ne rend pas la capability générable. Les
dépendances sont une source unique résolue par graphe ; les inclusions automatiques sont expliquées.

Le contrat exécutable courant est
[Capability Manifest v2](../specifications/CAPABILITY_SPECIFICATION.md). Il
ferme la forme du manifest et résout adapters, contrats, primitives, modes,
migrations et conformité par application. Le registre est découvert depuis les
répertoires de capabilities ; le moteur n’embarque aucune liste d’arêtes.

## Graphe initial indicatif

```text
Authorization ──requires──> Authentication
User Management ──────────> Authentication + Authorization
Files ────────────────────> Authorization + object-storage
Notifications ────────────> Events + mail|push
Automation ───────────────> Events
Realtime/Search/Flags/Multitenancy/Workflow → dépendances déclarées par mode
```

Le graphe réel appartient aux manifests versionnés, pas à ce diagramme.
`content-repository` est une primitive distincte qui ne remplace pas
implicitement `object-storage`.

## Graphe implémenté

Le catalogue actuel reste limité à trois capabilities :

```text
auth
  ↑
rbac
  ↑
files ──requires──> auth
```

La demande atomique `files` est résolue en `auth → rbac → files`. Le plan trace
`auth` et `rbac` comme inclusions de dépendance. Aucun catalogue cible non
implémenté n’est injecté dans ce graphe.

## Audit métier et observabilité

Une capability déclare ses événements métier sensibles et ses instruments spécifiques. Elle utilise les
ports du baseline pour l'audit, les logs, métriques et traces. Elle ne fournit jamais un deuxième moteur
d'audit ou de télémétrie.

## Parité

Deux adapters sont product-equivalent lorsqu'ils satisfont les mêmes cas d'usage, règles, contrats,
erreurs, permissions, événements, audit métier, migrations et suites. L'idiome du framework peut varier.

## Ordre de construction

Après le Platform Baseline, les Runtime Contracts et le Capability Framework :

1. Authentication ;
2. Authorization ;
3. User Management ;
4. Files ;
5. Events ;
6. Notifications ;
7. Automation ;
8. Realtime ;
9. Search ;
10. Feature Flags ;
11. Multitenancy ;
12. Workflow.
