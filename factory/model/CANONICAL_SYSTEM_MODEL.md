# Canonical System Model (CSM)

Représentation interne **unique** de l'intention d'un système Enistere. Décisions :
[ADR-045](../../docs/adr/ADR-045-canonical-system-model.md) (introduction),
[ADR-046](../../docs/adr/ADR-046-single-canonical-factory-pipeline.md) (pipeline canonique unique).

> Ce fichier décrit l'implémentation actuelle. La forme cible complète est définie dans
> [l'architecture de référence](../../docs/architecture/ENISTERE_REFERENCE_ARCHITECTURE.md) et adoptée par
> [ADR-057](../../docs/adr/ADR-057-reference-architecture-and-platform-baseline.md).

## Blueprint vs CSM

| | Blueprint | Canonical System Model |
|---|---|---|
| Rôle | intention utilisateur | représentation interne du moteur |
| Format | YAML/JSON, forme `stack` **ou** `applications[]` | objet typé, unique, indépendant du format |
| Lecture | seule l'ingestion le lit | consommé après ingestion par tout le pipeline |

Après `normalizeBlueprint()`, aucune couche ne relit le blueprint : le CSM est complet.

## Flux

```text
blueprint → normalize → CSM → validate → resolve → ResolvedSystem → plan → generate
```

Voir l'[architecture de la Factory](../ARCHITECTURE.md).

## Forme

```text
CanonicalSystem
├── apiVersion : enistere.io/v1alpha1
├── metadata { name, displayName, version, description? }
├── architecture { style }              # standard | multi-client | modular-monolith
├── applications[] { id, kind, runtime, consumes[], options }
├── capabilities[] { id, version?, requestedTargets[], configuration }
├── domain { entities[] }
├── environments[] { id, kind }          # local | staging | production
├── policies { designSystem }
└── source { blueprintVersion, file?, profile?, digest }
```

- **Styles** : `standard`, `multi-client`, `modular-monolith` supportés ; `service-oriented`,
  `microservices` réservés mais **refusés** par la validation.
- **Kinds** : `api`, `web`, `mobile`. Plusieurs applications d'un même kind sont autorisées.
- `requestedTargets` porte l'**intention** ; la résolution des targets appartient au
  [resolver](RESOLVED_SYSTEM_MODEL.md).

## Invariants et diagnostics

`CSM_EMPTY_SYSTEM_NAME`, `CSM_DUPLICATE_APPLICATION_ID`, `CSM_UNSUPPORTED_RUNTIME`,
`CSM_INCOMPATIBLE_KIND_RUNTIME`, `CSM_INVALID_APPLICATION`, `CSM_INVALID_CAPABILITY_TARGET`,
`CSM_UNSUPPORTED_ARCHITECTURE_STYLE`, `CSM_MISSING_API`, `CSM_TOPOLOGY_NOT_GENERATABLE`
(refus des topologies non générables : plusieurs API), `CSM_INCOHERENT_STRUCTURE`.

## Déterminisme et immutabilité

`serializeCanonicalSystem` trie les clés récursivement (ordre des tableaux préservé). Aucun timestamp,
chemin absolu ni aléatoire. `source.digest` = sha256 stable (champ digest exclu). Le CSM est
**profondément immuable** (`immutable.mjs`).

## Limites actuelles

- `capabilities[].requestedTargets` = toutes les applications (intention globale du blueprint v1) ; la
  résolution effective par target est calculée par le resolver.
- Non modélisés dans le code actuel : les cinq profils cibles, `primitives`, `communications`, `deployment`,
  `security`, `quality`, `ai`, `policies` étendues, `architecture.evolutionTarget` et plusieurs API.
- Le blueprint public v1 (`stack`/`applications[]`) reste accepté ; il est traduit **immédiatement** en
  CSM. Aucune conversion inverse CSM → blueprint n'existe.
