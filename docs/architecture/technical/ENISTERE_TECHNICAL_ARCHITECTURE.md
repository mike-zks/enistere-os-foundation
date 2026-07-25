# Architecture technique

## 1. Composants

```text
Product Intake / Design Assistant
              ↓
Blueprint Compiler
              ↓
Architecture Resolver
              ↓
Composition Planner
              ↓
Generation Engine
              ↓
Conformance Engine
              ↓
Lifecycle Manager
              ↓
Component Registry
```

La cible complète, incluant Platform Baseline, cinq profils et sept runtimes, est définie dans
[ENISTERE_REFERENCE_ARCHITECTURE.md](../ENISTERE_REFERENCE_ARCHITECTURE.md).

## 2. Blueprint Compiler

Transforme l’intention utilisateur en Canonical System Model.

Garanties :

- schéma versionné ;
- valeurs par défaut explicites ;
- diagnostics structurés ;
- aucune décision implicite non traçable.

## 3. Architecture Resolver

Construit le graphe des applications, runtimes, capabilities, primitives, contrats et communications.

Il détecte :

- incompatibilités ;
- dépendances manquantes ;
- cycles interdits ;
- adapters absents ;
- versions non résolubles ;
- ownership de données ambigu.

## 4. Composition Planner

Il ne modifie aucun fichier. Il produit :

- composants sélectionnés ;
- versions résolues ;
- fichiers prévus ;
- contrats et migrations ;
- gates attendus ;
- risques et avertissements ;
- niveau de support.

## 5. Generation Engine

- Template Renderer ;
- Structured Transformer ;
- Contract Generator ;
- Client Generator ;
- Configuration Composer ;
- Migration Materializer ;
- Deployment Pack Generator ;
- Documentation Generator.

Les transformations structurées sont privilégiées aux remplacements textuels fragiles.

## 6. Conformance Engine

- schema validation ;
- Platform Contract tests ;
- capability conformance ;
- architecture fitness functions ;
- contract tests ;
- integration tests ;
- runtime goldens ;
- E2E goldens ;
- security gates.

## 7. Lifecycle Manager

Commandes cibles :

```bash
enistere validate
enistere plan
enistere generate
enistere diff
enistere add application
enistere add capability
enistere remove capability
enistere upgrade
enistere migrate
enistere reconcile
enistere rollback
```

## 8. Registry

Types de composants :

- runtime-adapter ;
- capability ;
- primitive ;
- policy-pack ;
- deployment-pack.

Chaque composant est versionné, signé, documenté et accompagné de compatibilités, migrations, tests et checksums.

## 9. Organisation cible

```text
platform/
runtimes/
capabilities/
primitives/
feature-packs/
contracts/
factory/
deployment/
goldens/
docs/
```
