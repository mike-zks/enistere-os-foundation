# ADR-046 — Pipeline canonique unique de la Factory

- Statut : Validé
- Date : 2026-07-22
- Décideur : Owner Foundation

## Contexte

[ADR-045](ADR-045-canonical-system-model.md) a introduit un Canonical System Model (CSM) minimal, mais le
pipeline conservait une **coexistence** : le planner, les profils et le générateur relisaient directement
le blueprint brut (`resolveApplications`, `resolveStack`, `blueprint.stack/capabilities/domain/…`), les
capability targets étaient appliquées à toutes les applications, un profil servait de représentation
interne centrale (`matchProfile(blueprint)`), et un adapter transitoire reliait le CSM à l'ancienne
entrée de génération. Le blueprint circulait donc dans toutes les couches
([audit §BLUEPRINT_GAP](../audits/BLUEPRINT_GAP_ANALYSIS.md), [§FACTORY_ENGINE_GAP](../audits/FACTORY_ENGINE_GAP_ANALYSIS.md)).

## Décision

Faire du CSM l'**unique** représentation interne consommée après l'ingestion, et supprimer la coexistence.
Le pipeline devient une chaîne à sens unique avec trois modèles immuables distincts :

```text
Blueprint → normalize → Canonical System Model → validate → resolve → Resolved System → plan → Generation Plan → generate
```

- **Frontière d'entrée** : seules les couches d'entrée/ingestion lisent le blueprint
  (`engine/blueprint.mjs`, `blueprint/normalize.mjs`, `profiles.validateBlueprintProfile`,
  `applications.mjs`). Après `normalizeBlueprint()`, le blueprint n'est plus lu.
- **Canonical System Model** — modèle d'intention unique, complet (metadata, architecture, applications,
  capabilities avec `requestedTargets`, domain, environments, policies), immuable et déterministe.
- **Resolved System** — modèle de résolution unique (`resolveSystem(csm, registry)`) : adapters,
  targets résolues, dépendances, support. Il reçoit uniquement un CSM.
- **Generation Plan** — entrée unique du générateur (`buildPlan(resolvedSystem)`), sans référence au
  blueprint. Le générateur (`materializeProject(plan)`) ne lit que le plan.
- **Profils = presets** : `materializeProfileInput(profileId)` produit un blueprint d'entrée qui suit la
  chaîne normale ; ni le planner ni le générateur ne lisent un profil.
- **Targets** : `requestedTargets` (intention) vs `resolvedTargets` (résolution) ; le calcul appartient
  au resolver, jamais « toutes les applications par défaut ».
- **Multi-applications** : support réel du multi-surface (plusieurs web/mobile sur une API) ; refus
  explicite des topologies non générables (plusieurs API) via `CSM_TOPOLOGY_NOT_GENERATABLE`.
- **Trois digests distincts** : `systemDigest`, `resolutionDigest`, `planDigest`, tous via une
  sérialisation canonique à clés triées.
- **Diagnostics par couche** : préfixes `BLUEPRINT_`, `CSM_`, `RESOLUTION_`, `PLAN_`.

## Conséquences positives

- une seule représentation interne d'intention, une seule de résolution, une seule entrée de générateur ;
- suppression des doubles résolutions et de l'adapter legacy ;
- immutabilité profonde et déterminisme des trois modèles ;
- base saine pour le Platform Contract exécutable et le lifecycle.

## Coûts et risques

- refonte du cœur du moteur (planner, générateur, overlays, contrats) : risque de régression maîtrisé par
  l'équivalence fonctionnelle (les 21 compositions et les goldens produisent les mêmes fichiers ; le
  format interne du lock change, ce qui est autorisé) ;
- la compatibilité d'entrée reste confinée au normalizer.

## Périmètre

Ne modifie ni les starters, ni les capabilities, ni les contrats applicatifs. N'implémente pas le Platform
Contract exécutable, la parité NestJS/Spring, Java/Dart, les primitives complètes, le lifecycle, de
nouvelles capabilities, ni le renommage `starters/` → `runtimes/`.

## Modèles V2 non encore implémentés (dette de modèle, pas de pipeline)

`primitives`, `communications`, `policies` étendues, `architecture.evolutionTarget`, multi-API/worker
(refusés explicitement), génération polyglotte des contrats.

## Alternatives rejetées

- déprécier l'ancien pipeline sans le supprimer : maintient la coexistence et le couplage au blueprint ;
- surcharger le CSM avec la résolution : confond intention et résolution ;
- conserver les profils comme source de composition : contredit la frontière d'entrée.

## Suite

Prochaine décision : rendre exécutable le Platform Contract minimal de la famille API sur ce pipeline
canonique unique.
