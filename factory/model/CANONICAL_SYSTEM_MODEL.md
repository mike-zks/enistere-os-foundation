# Canonical System Model (CSM)

Représentation interne normalisée d'un système Enistere. Décision : [ADR-045](../../docs/adr/ADR-045-canonical-system-model.md).

## Blueprint vs CSM

| | Blueprint | Canonical System Model |
|---|---|---|
| Rôle | intention utilisateur | représentation interne du moteur |
| Format | YAML/JSON (sous-ensemble JSON), forme `stack` **ou** `applications[]` | objet typé, unique, indépendant du format |
| Autorité | entrée à valider | modèle stable consommé par le planning |
| Évolution | schéma `version: "1"` | `apiVersion: enistere.io/v1alpha1` |

Le moteur ne raisonne plus directement sur le document utilisateur : il consomme le CSM.

## Flux

```text
readBlueprint → assertBlueprint (schéma)
   → normalizeBlueprint()  → CanonicalSystem     (factory/blueprint/normalize.mjs)
   → validateCanonicalSystem() → Diagnostic[]     (factory/blueprint/validate.mjs)
   → buildGenerationPlan() dérive les applications du CSM
```

`buildGenerationPlan` **refuse** la composition si un diagnostic est `error`.

## Responsabilités

- `factory/model/canonical-system.mjs` — forme du modèle, fabriques figées, sérialisation
  déterministe + digest. **Pur** (n'importe pas le moteur).
- `factory/model/diagnostics.mjs` — diagnostics structurés `{ code, message, path?, severity, details? }`.
- `factory/blueprint/normalize.mjs` — traduction pure blueprint → CSM (réutilise
  `engine/applications.mjs` pour la résolution des surfaces).
- `factory/blueprint/validate.mjs` — invariants du modèle (réutilise `engine/topologies.mjs` pour les
  règles kind→runtime).

## Forme

```text
CanonicalSystem
├── apiVersion : enistere.io/v1alpha1
├── metadata { name, version, description? }
├── architecture { style }              # standard | multi-client | modular-monolith
├── applications[] { id, kind, runtime, sourceProfile?, consumes[], capabilities[], options }
├── capabilities[] { id, version?, targets[], configuration }
├── environments[] { id, kind }         # local | staging | production
├── policies {}
└── source { blueprintVersion, file?, profile?, digest }
```

- **Styles** : `standard`, `multi-client`, `modular-monolith` supportés ; `service-oriented`,
  `microservices` réservés dans les types mais **refusés** par la validation.
- **Kinds** : `api`, `web`, `mobile`. Le modèle autorise plusieurs applications d'un même kind.

## Invariants et diagnostics

| Code | Refus |
|---|---|
| `CSM_EMPTY_SYSTEM_NAME` | nom de système vide |
| `CSM_DUPLICATE_APPLICATION_ID` | identifiant d'application dupliqué |
| `CSM_UNSUPPORTED_RUNTIME` | runtime inconnu |
| `CSM_INCOMPATIBLE_KIND_RUNTIME` | runtime invalide pour le kind |
| `CSM_INVALID_APPLICATION` | application structurellement invalide |
| `CSM_INVALID_CAPABILITY_TARGET` | capability ciblant une application inexistante |
| `CSM_UNSUPPORTED_ARCHITECTURE_STYLE` | style d'architecture non supporté |
| `CSM_MISSING_API` | aucune application API |
| `CSM_INCOHERENT_STRUCTURE` | structure incohérente (0 app, consumes inconnu, env invalide) |

Sévérité `error` (bloque) ou `warning` (informatif). Toute émission passe par une fabrique qui refuse
un code inconnu.

## Déterminisme

`serializeCanonicalSystem` trie les clés récursivement (ordre des tableaux préservé, construit de façon
déterministe). Aucun timestamp, chemin absolu ni aléatoire. `source.digest` est un sha256 stable du
modèle (le champ digest exclu de son propre calcul). Base du futur `enistere.plan.json` (non émis par
cette mission).

## Limites actuelles (transitoire)

- **Adapter legacy** : `buildGenerationPlan` dérive les *applications* du CSM, mais le reste du plan
  (`capabilities`, `stack`, profil, gates, `designSystem`, `project.slug`) et `generateProject`
  consomment encore le blueprint. Couplage transitoire, isolé et testé, à résorber avec la refonte du
  générateur.
- **Capabilities** : `targets` = toutes les applications (portée demandée). Le support par target
  (`ready` / `not-applicable`) reste résolu par `engine/capabilities.mjs`.
- **Non modélisés** (réservés) : `primitives`, `communications`, `policies` peuplés,
  `architecture.evolutionTarget`, `metadata.description`, plusieurs API/worker/gateway/bff.

## Extension future

Le CSM est la cible de compilation du Blueprint V2
([SYSTEM_BLUEPRINT_SPECIFICATION](../../docs/specifications/SYSTEM_BLUEPRINT_SPECIFICATION.md)) et
l'entrée des moteurs à venir (Platform Contract exécutable, lifecycle). Toute évolution incompatible
exigera une nouvelle `apiVersion` et une migration.
