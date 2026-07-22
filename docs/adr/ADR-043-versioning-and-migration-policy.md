# ADR-043 — Politique de versioning et de migration des artefacts

- Statut : Validé
- Date : 2026-07-20
- Décideur : Owner Foundation

## Contexte

La Foundation manipule plusieurs artefacts versionnés indépendamment : le blueprint
(`version: "1"`, schéma `factory/schema/blueprint.schema.json`), les manifests de capability
(`schemaVersion: "2"`, `factory/schema/capability.schema.json`), les manifests de starter
(`schemaVersion: "2"`), les overlays (`schemaVersion: "1"`, `factory/schema/overlay.schema.json`),
les target adapters (SemVer, `factory/engine/target-adapters.mjs`) et le `enistere.lock` d'un projet
généré (`schemaVersion: "1"`).

Le socle V2 (« Contrats stables, plugins gatés ») exige que ces contrats **puissent évoluer sans
rupture** et que le lock/provenance soit **extensible en append-only**, sinon l'Evolution Engine
(diff/upgrade/migrate) et l'ajout futur de kinds, runtimes et capabilities imposeraient de casser le
socle. Il manque une politique unique qui distingue changement additif et changement de rupture, et
qui définit le mécanisme de migration.

## Décision

### 1. Chaque artefact porte une version de schéma majeure explicite

`blueprint.version`, `capability.schemaVersion`, `starter.schemaVersion`, `overlay.schemaVersion`,
`lock.schemaVersion` et la version SemVer des adapters. Aucune version globale unique : coupler des
artefacts indépendants les forcerait à évoluer ensemble.

### 2. Additif = même majeur ; rupture = nouveau majeur + migration

- **Additif (même majeur)** : ajout d'un champ **optionnel**, ajout d'une valeur d'enum qu'un
  consommateur plus ancien ignore sans risque, assouplissement d'une contrainte. Exemples déjà
  livrés : les champs riches optionnels de Capability v2 (`conflicts`, `provides`, `configuration`,
  `compatibility`, `migrations`) et la surface `applications[]` / `architecture` du blueprint.
- **Rupture (nouveau majeur)** : suppression/renommage/retypage d'un champ, retrait d'une valeur
  d'enum, resserrement d'une contrainte, changement de sémantique. Interdit sans **migration fournie**.

### 3. Ajouter un plugin n'est jamais un changement de schéma

Enregistrer une capability, un target adapter, un `kind` d'application, un runtime ou un statut est de
la **donnée de registre**, pas une modification de contrat : cela ne bump aucune version de schéma.
C'est la garantie « plugins gatés » — voir les critères de non-régression du socle du plan directeur.

### 4. Le lock et la provenance sont append-only, et déterministes

Le `enistere.lock` ne contient que des champs déterministes (versions, digests, plan) : aucune donnée
non reproductible (horodatage, chemin machine). L'enrichir (provenance étendue, SBOM CycloneDX/SPDX en
Phase A) se fait par **ajout de champs** sous le même majeur ; un consommateur plus ancien les ignore.

### 5. Mécanisme de migration

Les migrations vivent dans `factory/engine/migrations/` : par type d'artefact, des fonctions **pures**
`migrate(fromMajor, value) -> value` chaînables du plus ancien au courant. `enistere migrate` (Phase C)
les applique à un blueprint ou à un projet généré, sous approbation humaine, sans écrasement implicite.
Le sucre rétro-compatible (par ex. `stack{}` → `applications[]`) est **préservé** au sein d'un majeur ;
son retrait éventuel est une rupture qui exige un nouveau majeur et une migration.

## Alternatives considérées

- **Version globale unique de la Foundation** pour tous les artefacts : rejetée — couple des contrats
  indépendants et force des bumps inutiles.
- **Pas de versioning explicite des schémas** : rejetée — rend toute évolution ambiguë et interdit un
  Evolution Engine fiable.
- **Migrations impératives ad hoc dans le moteur** : rejetées — non testables en isolation ; on impose
  des fonctions pures par artefact.

## Conséquences

- Positif : le socle peut grandir sans rupture ; l'Evolution Engine (Phase C) a un contrat clair ;
  l'enrichissement du lock/provenance et l'ajout de plugins n'impactent pas les projets existants.
- Vigilance : discipline « additif d'abord » requise en revue ; une fitness function pourra plus tard
  vérifier la cohérence des versions de schéma et la présence d'une migration pour tout bump majeur.
- Suite : `factory/engine/migrations/` est amorcé (contrat de registre) ; les migrations réelles sont
  écrites lorsqu'un majeur est introduit (Phase C).
