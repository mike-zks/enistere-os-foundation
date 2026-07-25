# ADR-057 — Architecture de référence complète et Platform Baseline

- Statut : Validé ; taxonomie des profils supersédée par
  [ADR-060](ADR-060-system-profile-taxonomy.md)
- Date : 2026-07-24
- Décideur : Owner Foundation

## Décision

Enistere adopte une architecture de référence indépendante du support actuel du générateur. Elle couvre les
profils `api`, `monolith`, `multi-client`, `modular-distributed` et `microservices`, ainsi que les familles
API, Web et Mobile.

Chaque runtime implémente obligatoirement un **Platform Baseline** :

```text
Configuration + Canonical Errors + Structured Logging + Correlation
+ Observability + Technical Audit + Security Baseline + Health
+ Diagnostics + Testing Foundation + Lifecycle Hooks + Extension Points
+ Build and Quality Gates
```

`Observability` et `Technical Audit` ne sont pas des capabilities. Les domaines et capabilities déclarent
les événements d'audit métier qu'ils produisent, mais utilisent l'infrastructure d'audit du baseline.

Le catalogue cible des runtimes est :

- API : NestJS, Spring Boot, FastAPI ;
- Web : Next.js, Angular ;
- Mobile : React Native, Flutter.

Le catalogue cible des capabilities commence par Authentication, Authorization, User Management, Files,
Events, Notifications, Automation, Realtime, Search, Feature Flags, Multitenancy et Workflow.

Les primitives distinguent notamment `object-storage` et `content-repository` : MinIO fournit la première,
Alfresco la seconde. Elles ne sont pas substituables sans changement de sémantique.

Le pipeline canonique devient :

```text
SystemBlueprint → CanonicalSystem → ResolvedSystem → GenerationPlan
→ MaterializedSystem → ConformanceReport
```

Les statuts normatifs sont `TARGET`, `PLANNED`, `IMPLEMENTED`, `GENERATABLE`, `BOOTABLE`, `CONFORMANT`,
`PRODUCT_EQUIVALENT` et `PRODUCTION_READY`. Un statut ne se déduit jamais d'un statut inférieur.

## Contexte

Le corpus V2 a établi un pipeline unique et des contrats de base partiellement exécutables, mais sa
taxonomie est encore influencée par six starters existants. Elle classe encore parfois Audit et
Observability comme capabilities et ne formalise pas complètement FastAPI, les architectures distribuées,
les primitives riches, la CLI système ou les deux périmètres IA.

Une architecture cible limitée aux actifs présents transformerait ces lacunes en contraintes permanentes.

## Alternatives

- **Étendre progressivement le modèle actuel** : rejeté, car les compromis deviendraient normatifs.
- **Réécrire tout le dépôt immédiatement** : rejeté, car la mission est documentaire et les actifs doivent
  d'abord être classés.
- **Définir la cible puis faire converger par preuves** : retenu.

## Justification

Le baseline rend les qualités de production non optionnelles. La séparation cible/support empêche les
revendications non démontrées. Le modèle complet fournit une destination stable au kernel, aux runtimes,
aux capabilities et au lifecycle.

## Conséquences

- `base` n'est plus une capability : c'est l'implémentation du Platform Baseline par un runtime.
- Les anciens `plannedCapabilities` Audit/Observability sont retirés des manifests dans la mission
  documentaire ; le modèle exécutable `base` reste à requalifier lors de l'exécution du contrat.
- FastAPI et `microservices` peuvent être représentés avec un statut honnête avant d'être générables.
- Les ADR-044 à ADR-056 restent historiques ; le présent ADR supersède leurs classifications et séquences
  incompatibles, notamment ADR-044 §catalogue cible et ADR-056 §« tout extra est une capability » lorsque
  l'extra est désormais un invariant du baseline.

## Risques

- cible trop large sans priorisation ;
- confusion entre `TARGET` et support réel ;
- inflation du baseline ;
- taxonomie du blueprint divergente du schéma exécutable.

Ces risques sont réduits par la roadmap à critères de sortie, les statuts fondés sur preuves et une mission
d'implémentation unique consacrée au baseline et aux contrats.

## Migration

1. adopter les documents normatifs et l'ADR ;
2. étendre le Blueprint V2 et le CSM sans activer de génération fictive ;
3. versionner les contrats Common/API/Web/Mobile ;
4. faire converger les runtimes présents ;
5. ajouter FastAPI seulement après un contrat API exécutable ;
6. construire les capabilities et primitives sur les extension points stabilisés.

## Tests et preuves

- link checker documentaire ;
- recherche sans classification active Audit/Observability comme capabilities ;
- cohérence de la taxonomie de profils alors adoptée, des sept runtimes, douze primitives et huit statuts ;
- audit cible/existant avec classification `KEEP|ADAPT|REFACTOR|REPLACE|REMOVE|CREATE`.

## Rollback

Un revert documentaire restaure le corpus précédent. Aucun code, runtime ou capability n'est ajouté par
cette décision.
