# Carte d'impact de migration

> Rapport antérieur à l'ADR-057. Toute classification d'Audit ou Observability comme capability est
> supersédée par le Platform Baseline. Voir
> [TARGET_VS_CURRENT_IMPLEMENTATION.md](TARGET_VS_CURRENT_IMPLEMENTATION.md).

Impact, risque, dépendances et ordre recommandé par zone, pour converger de l'implémentation actuelle
vers l'architecture V2. Niveaux de risque : `LOW` · `MEDIUM` · `HIGH` · `CRITICAL`.

| Zone | Impact | Risque | Dépendances | Ordre |
|---|---|:--:|---|:--:|
| **Blueprint** | Canonical System Model, envelope `apiVersion/kind`, primitives/communications/policies | HIGH | — (fondation) | 1 |
| **Conformance / Platform Contract** | Suite exécutable commune + tests de parité | HIGH | Blueprint (modèle) | 2 |
| **Factory** | Resolver primitives/communications, Lifecycle Manager, ownership fichiers, registry | HIGH | Blueprint, Conformance | 3 |
| **NestJS** | Requalification contre Platform Contract (adapter de référence) | MEDIUM | Conformance | 4 |
| **Spring** | Requalification + **ajout Files** ; consommation contrats générés | HIGH | Conformance, Contrats | 4 |
| **Contracts** | Neutralisation polyglotte (TS+Java+Dart), `contracts/` racine | CRITICAL | Blueprint | 5 |
| **Next.js** | Requalification (adapter Web de référence) | MEDIUM | Conformance | 6 |
| **Angular** | **Extraction auth/rbac/files** (base-only aujourd'hui) | HIGH | Conformance, Contrats, capabilities | 6 |
| **React Native** | Requalification ; RBAC reste n/a | MEDIUM | Conformance | 7 |
| **Flutter** | **Extraction auth/files** (base-only aujourd'hui) | HIGH | Conformance, Contrats Dart | 7 |
| **Capabilities** | Modèle cible (adapters/contracts/conformance) ; ajout user-management/events/notifications | HIGH | Contrats, Conformance | 8 |
| **Goldens** | Goldens de parité par famille | MEDIUM | Adapters convergés | 9 |
| **Deployment / Primitives** | Modéliser les primitives typées ; mode production | MEDIUM | Blueprint (primitives) | 10 |
| **Dépendances / audit** | Bump CVE transitives (`brace-expansion`, `js-yaml`, `body-parser`) | LOW | — | **0 (immédiat)** |

## Chemins critiques

1. **Blueprint → Conformance → tout le reste.** Sans Canonical System Model ni suite Platform Contract,
   aucune convergence de runtime n'est mesurable ni prouvable.
2. **Contrats polyglottes → parité API/Web/Mobile.** Sans génération Java/Dart depuis une source neutre,
   Spring/Flutter continueront de réimplémenter à la main, rendant la parité asseurée mais non garantie.
3. **Adapters Angular/Flutter → Goldens de parité.** Tant qu'Angular et Flutter sont base-only, la
   Phase 4 « goldens de parité » de la roadmap est inatteignable.

## Risques transverses

- **CRITICAL — neutralisation des contrats** : chantier le plus lourd (touche NestJS, Spring, Flutter,
  packages, génération). À séquencer après un modèle stable, jamais en parallèle d'une refonte blueprint.
- **HIGH — Lifecycle Manager** : introduit la notion d'ownership de fichiers ; impose de ne plus
  régénérer aveuglément. Risque de régression sur le déterminisme si mal cadré.
- **LOW mais bloquant CI — audit CVE** : à traiter en premier, isolément, pour rétablir une base verte
  (voir [synthèse §Risques](FOUNDATION_V2_IMPLEMENTATION_GAP_AUDIT.md)).
