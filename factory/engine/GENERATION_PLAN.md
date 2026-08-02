# Generation Plan

**Entrée unique** du générateur. Décision : [ADR-046](../../docs/adr/ADR-046-single-canonical-factory-pipeline.md).

> Ce fichier décrit le plan exécutable actuel. La cible adoptée par
> [ADR-057](../../docs/adr/ADR-057-reference-architecture-and-platform-baseline.md) étend ce plan aux
> sélection de providers de primitives, contrats polyglottes, opérations
> lifecycle, risques, approbations et statuts. ADR-066 ajoute communications et
> déploiement distribués minimaux ; ADR-067 ajoute Capability Graph v2 et les
> exigences de primitives par application. ADR-086 fixe la frontière entre
> sources de fabrication et artefacts réellement livrés. ADR-087 dérive les
> identités exécutables des applications depuis le CSM.

## Rôle

```text
buildPlan(resolvedSystem) → GenerationPlan
```

Le plan est un artefact **distinct**, auto-suffisant, produit depuis un ResolvedSystem. Le générateur
(`materializeProject`) ne lit **que** le plan : celui-ci porte chaque donnée nécessaire à la
matérialisation. **Aucune référence au blueprint brut.**

## Forme

```text
GenerationPlan
├── project, displayName
├── architecture { profile, clients, backend, deployment, data, communication, operations }
├── generationMode, bundledFeaturesMayExceedSelection
├── stack, targetAdapters
├── capabilities[]                 (ids)
├── capabilityGraph { requested[], autoIncluded[], order[], edges[] }
├── capabilityTargets { <id>: { version, inclusion, requiredBy[], requires[],
│                                resolved[], notApplicable[], configuration,
│                                byApplication{} } }
├── communications[]
├── deploymentPlan { units[], order[], rollbackOrder[] }
├── domain { entities[] }
├── designSystem
├── environments[] { id, kind }
├── profile | null                 (descriptif)
├── support { level, blockers[], notApplicable[] }
├── gates { <appId>: [{ gate, command }] }
├── directories[], applications[] { id, kind, runtime, baseline, source, appDir,
│                                   consumes[], ownership?, identity,
│                                   resolvedCapabilities[] }, starterSources
├── diagnostics[]                  (RESOLUTION_* + PLAN_*)
├── systemDigest, resolutionDigest
└── planDigest
```

## Consommation

Le générateur refuse une composition non générable **depuis le plan seul** :
`support.level !== 'ready'` ou un diagnostic `error` (les diagnostics de résolution sont portés par le
plan). Tous les fichiers générés (lock, README, `package.json`, contrats, compose, verify, docs)
dérivent du plan.

Les overlays sont appliqués exclusivement dans `capabilityGraph.order`. Le
générateur ne possède ni liste d’arêtes ni ordre de registre secondaire.
`packages/contracts/capabilities.json` matérialise le graphe et les résolutions
par application.

Les racines `starters/` et `capabilities/` sont des sources de fabrication. La
sortie reçoit les applications sélectionnées puis les seuls overlays résolus ;
elle ne reçoit jamais une copie de `capabilities/`. Après composition, le
générateur calcule depuis les manifests applicatifs la fermeture transitive des
packages `@enistere/*` consommés. Seuls ces packages sont copiés, déclarés comme
workspaces et inscrits dans `enistere.lock.sharedPackages`. Cette fermeture est
un résultat de matérialisation déterministe, pas une seconde entrée du plan.

Après les overlays et avant cette fermeture, chaque runtime matérialise
`application.identity` dans ses champs exécutables : manifests, coordonnées,
packages/imports, chemins natifs et labels. La dérivation ne lit aucun nom de
starter. `enistere.identity.json` enregistre le résultat livré et permet à la
régénération de refuser tout renommage implicite d'un identifiant existant.

## Sérialisation

`serializeGenerationPlan` (clés triées, déterministe). `planDigest` = sha256 stable du plan (champ digest
exclu). Le plan préfigure `enistere.plan.json` ; cette mission ne l'écrit pas encore dans le projet
généré (il est intégré à `enistere.lock`).

## Immutabilité

Profondément immuable (`model/immutable.mjs`) : le générateur ne peut pas muter le plan.
