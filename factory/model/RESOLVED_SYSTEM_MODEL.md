# Resolved System Model

Modèle **unique de résolution** de la Factory. Décision : [ADR-046](../../docs/adr/ADR-046-single-canonical-factory-pipeline.md).

> Ce fichier décrit l'implémentation actuelle. La cible ajoute graphes, primitives, communications,
> contrats, policies effectives, modes de déploiement et statuts de preuve ; voir
> [ADR-057](../../docs/adr/ADR-057-reference-architecture-and-platform-baseline.md).

## Rôle

Le resolver (`engine/resolver.mjs`) transforme une intention (CSM) en système résolu :

```text
resolveSystem(canonicalSystem, { starters, capabilityManifests, modularStarters }) → ResolvedSystem
```

Il reçoit **uniquement un CSM** (jamais un blueprint ni un profil legacy) et le contexte de registre. Il
est distinct du CSM : le CSM n'est jamais surchargé d'informations de résolution.

## Forme

```text
ResolvedSystem
├── metadata, architecture, domain, environments, policies   (repris du CSM)
├── applications[] { id, kind, runtime, adapter, baseline, source, appDir, gates[], resolvedCapabilities[], consumes[] }
├── capabilities[] { id, configuration, requestedTargets[], resolvedTargets[], notApplicableTargets[] }
├── selection { runtimes[], stack, allModular, generationMode, targetAdapters }
├── profile { id, status, golden, runtimeProven, compositionExact } | null   (descriptif)
├── support { level: ready|blocked, blockers[], notApplicable[] }
├── diagnostics[] (RESOLUTION_*)
├── systemDigest        (= CSM digest)
└── resolutionDigest
```

## Responsabilités

- **Runtime adapters** : version verrouillée par runtime (`target-adapters.mjs`).
- **Platform Baseline** : versions Common et famille résolues depuis le manifest du runtime.
- **Targets résolues** : calculées ici, pas « toutes les applications ». `requestedTargets` (intention,
  CSM) → `resolvedTargets` (applications où la capability est `ready`/`not-applicable`), avec
  `notApplicableTargets` distinct. Le calcul appartient au resolver.
- **Dépendances de capabilities** : `validateCapabilityDependencies` (`RESOLUTION_CAPABILITY_DEPENDENCY`).
- **Support** : `assessCapabilitySupport` → `blocked` si une capability n'est pas composable
  (`RESOLUTION_CAPABILITY_NOT_READY`).
- **Consumes** : l'intention `consumes` du CSM est reprise résolue par application.

## Diagnostics

`RESOLUTION_CAPABILITY_DEPENDENCY`, `RESOLUTION_CAPABILITY_NOT_READY`, `RESOLUTION_NO_VALID_TARGET`,
`RESOLUTION_UNKNOWN_RUNTIME_ADAPTER`.

## Immutabilité et déterminisme

Profondément immuable (`immutable.mjs`). `resolutionDigest` = sha256 stable de la résolution (CSM digest
inclus, champ digest exclu). Mêmes entrées → même résolution.
