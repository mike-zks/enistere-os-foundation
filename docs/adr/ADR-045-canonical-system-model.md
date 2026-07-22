# ADR-045 — Canonical System Model

- Statut : Validé
- Date : 2026-07-22
- Décideur : Owner Foundation

## Contexte

L'audit d'écart V2 ([`docs/audits/`](../audits/README.md)) a classé **P0-3** l'absence de Canonical
System Model : le blueprint (`version: "1"`) circule brut dans toutes les couches de la Factory
(planning, résolution des profils, génération) via `factory/engine/applications.mjs`. Le moteur raisonne
directement sur le document utilisateur — son format, ses valeurs par défaut implicites, sa forme
« stack » — plutôt que sur une représentation normalisée et stable.

La [System Blueprint Specification](../specifications/SYSTEM_BLUEPRINT_SPECIFICATION.md) décrit un modèle
cible (applications, capabilities, primitives, communications, policies) que le blueprint actuel ne porte
que partiellement. Faire converger le code vers cette cible exige d'abord une **frontière interne** : une
représentation typée, normalisée, indépendante du format d'entrée, que le resolver, le planner et les
futurs moteurs (Platform Contract, lifecycle) consomment à la place du blueprint brut.

## Décision

Introduire le **Canonical System Model** (CSM) comme représentation interne normalisée d'un système
Enistere, insérée entre la validation du blueprint et le planning :

```text
Blueprint utilisateur → parsing/validation → Canonical System Model → planning / génération
```

Le CSM est **typé**, **déterministe**, indépendant de YAML/JSON et des templates, et stable pour les
consommateurs. Sa forme minimale (cette décision) couvre les concepts déjà nécessaires au fonctionnement
actuel et réserve les extensions V2 sans les activer :

```text
CanonicalSystem
├── apiVersion
├── metadata { name, version, description? }
├── architecture { style }
├── applications[] { id, kind, runtime, sourceProfile?, consumes[], capabilities[], options }
├── capabilities[] { id, version?, targets[], configuration }
├── environments[] { id, kind }
├── policies
└── source { blueprintVersion, file?, profile?, digest? }
```

- **Styles d'architecture** supportés : `standard`, `multi-client`, `modular-monolith`. `service-oriented`
  et `microservices` sont réservés dans les types mais **explicitement non supportés** (refusés par
  diagnostic).
- Le modèle interne autorise **plusieurs applications d'un même kind**, même si le blueprint actuel ne
  permet pas encore de les exprimer entièrement.

Une couche d'ingestion `normalizeBlueprint()` traduit **explicitement** le blueprint actuel (forme `stack`
ou `applications[]`) vers le CSM, **sans introduire de décision métier implicite nouvelle**. Le CSM est
validé par `validateCanonicalSystem()`, qui produit des **diagnostics structurés**
(`{ code, message, path?, severity, details? }`).

Une étape réelle de la Factory — le planning — consomme le CSM : la génération dérive désormais ses
applications du modèle normalisé et validé, la sortie restant byte-identique à l'actuelle (adapter
transitoire vers l'entrée de génération existante, explicite et testé).

## Concepts adoptés

- **Canonical System Model** : frontière interne normalisée.
- **Normalizer** : traduction pure blueprint → CSM.
- **Validation de modèle** : invariants structurels du CSM, distincts de la validation de schéma du
  blueprint.
- **Diagnostics structurés** : codes `CSM_*` réutilisables par les futures commandes `plan`/`diff`.
- **Sérialisation déterministe** : base du futur `enistere.plan.json` (non émis par cette décision).

## Conséquences positives

- le moteur cesse de raisonner sur le document utilisateur brut ;
- le resolver, le planner et les futurs moteurs partagent une représentation stable ;
- les invariants sont exprimés une fois, sur le modèle, avec des diagnostics traçables ;
- la voie vers le Blueprint V2 (primitives, communications, policies, multi-application) est ouverte sans
  rupture de schéma.

## Coûts et risques

- un adapter transitoire CSM → entrée de génération legacy subsiste tant que le générateur n'est pas
  refondu ; il est explicite, isolé, documenté et testé ;
- la normalisation doit rester byte-identique pour ne pas régresser les 21 profils et les goldens ;
- risque de sur-modélisation : la forme est délibérément **minimale** et gate les extensions non livrées.

## Périmètre

Cette décision introduit **uniquement** le CSM minimal, son normalizer, sa validation, ses diagnostics,
son intégration limitée au planning et sa documentation. Elle **n'implémente pas** : le Platform Contract
exécutable, la parité NestJS/Spring, la génération Java/Dart, les primitives typées complètes, les
communications, le lifecycle, de nouvelles capabilities, ni le renommage `starters/` → `runtimes/`. Le
blueprint public actuel reste accepté sans modification pour les utilisateurs existants.

## Migration

- la forme `stack` et la forme `applications[]` du blueprint se normalisent vers le même CSM ;
- les capabilities globales deviennent des capabilities du CSM avec targets calculées selon les règles
  existantes ; le support par target (`ready`/`not-applicable`) reste résolu par le moteur de capabilities
  existant (transitoire) ;
- toute évolution incompatible du CSM exigera une nouvelle `apiVersion` et une migration
  ([`LIFECYCLE_AND_UPGRADE_SPECIFICATION`](../specifications/LIFECYCLE_AND_UPGRADE_SPECIFICATION.md)).

## Alternatives rejetées

- continuer à faire circuler le blueprint brut : maintient le couplage au format d'entrée et bloque la
  convergence V2 ;
- refondre immédiatement le générateur autour du CSM : hors périmètre, risque de régression massive ;
- exprimer directement le Blueprint V2 complet : prématuré tant que le Platform Contract et le lifecycle
  ne sont pas exécutables.

## Suite

Prochaine décision attendue : rendre exécutable le Platform Contract minimal de la famille API
(ADR-046 à venir), en consommant le CSM.
