# ADR-072 — Le schéma de capability est normatif et exécuté

- Statut : Validé et implémenté
- Date : 2026-07-28
- Décideur : Owner Foundation
- Complète : ADR-067 et ADR-070

## Contexte

`factory/schema/capability.schema.json` était présenté comme la forme normative
du Capability Manifest v2 (ADR-067 §1). La revue du 2026-07-28 a établi que
**rien ne l'exécutait** : aucun chargement, aucun validateur, aucun test. La
validation réelle était `validateCapabilityManifest`, un jumeau écrit à la main
dans `factory/engine/capabilities.mjs`.

Deux sources de vérité pour un même contrat, dont une morte — et la hiérarchie
§5 place les « schémas exécutables » au rang 3, au-dessus du code. Celui-ci
n'était pas exécutable ; il était décoratif.

Aggravant : ADR-070 a consciencieusement mis à jour **les deux** en ajoutant
`responsibilities`, entretenant la duplication sans la voir. C'est exactement le
mode de défaillance que §8.1 interdit — deux décisions pour une règle — et il
avait déjà commencé à coûter.

## Décision

### 1. Le schéma est la forme normative, et il est compilé

`factory/engine/capability-schema.mjs` charge `capability.schema.json`, le
compile et expose `validateManifestSchema`. Toute validation de manifest passe
par lui.

La compilation est assurée par `factory/engine/json-schema.mjs`, un évaluateur
du sous-ensemble draft 2020-12 réellement employé par les schémas du dépôt
(18 mots-clés). Raison : **le moteur doit tourner sur un checkout nu**. Les jobs
`dependency-contract` et `golden-runtime` — 25 exécutions — lancent
`node factory/...` sans aucune installation. Une dépendance runtime les casse
toutes ; la première version de cette décision l'a fait, et la CI l'a démontré.

Ce n'est pas la duplication qu'ADR-072 supprime : l'évaluateur ne réénonce
aucune règle, il **interprète le document**. Les règles restent en un seul
endroit. Et il refuse de compiler un schéma employant un mot-clé qu'il
n'appliquerait pas — ignorer serait désactiver une validation en silence.

### 2. Le vocabulaire du moteur est lu dans le schéma

`CAPABILITY_STATUSES`, `INFRASTRUCTURE_PRIMITIVE_KINDS` et
`CAPABILITY_DEPLOYMENT_MODES` ne sont plus redéclarés : ils sont extraits du
document. Les redéclarer aurait recréé la duplication que cette décision
supprime. L'extraction échoue bruyamment si une réorganisation déplace un enum —
une constante silencieusement vide désactiverait des validations ailleurs.

### 3. Le code ne garde que l'inexprimable en JSON Schema

`validateCrossReferences` conserve uniquement les règles portant sur des
**identifiants qui référencent d'autres parties du même document** :

```text
unicité des id (contracts, primitives, migrations, conformance, conflicts)
migrations[i].path appartient à targets/<son target>/
configuration.<x>.default ∈ configuration.<x>.values
targets.<r>.adapter.id === <r>
targets.<r>.responsibilities ⊆ responsibilities
targets.<r>.{contracts,primitives,migrations,conformance} ⊆ déclarés
migrations/conformance référencées appartiennent au bon target
```

Forme, types, énumérations, motifs et contrat de target `ready` relèvent
désormais du schéma seul.

### 4. Les messages restent actionnables

L'évaluateur produit des erreurs structurées, pas des phrases. Un traducteur convertit
`instancePath` en chemin pointé (`targets.nestjs.contracts[0].kind`) et rend les
messages de l'ancien validateur. Les erreurs de branchement (`if`, `anyOf`,
`allOf`) sont écartées : l'erreur concrète à l'intérieur de la branche est celle
sur laquelle l'auteur peut agir.

### 5. Une lacune du schéma corrigée au passage

Le schéma n'imposait aucun motif aux **noms** de clés de `configuration` ; le
validateur à la main le faisait. `propertyNames` a été ajouté plutôt que de
conserver la règle en code : la couverture a été vérifiée cas par cas avant
suppression, jamais supposée.

## Conséquences

### Acquis

- Une seule vérité par contrat de capability, et elle est exécutée.
- `capabilities.mjs` passe de 596 à 356 lignes ; le module schéma en fait 107.
  La suppression nette est de 133 lignes de règles dupliquées.
- Une évolution du manifest se fait désormais en un seul endroit.
- Les trois manifests réels sont validés contre le schéma par un test, et le
  test vérifie aussi que les enums du moteur **proviennent** du document.

### Assumé

- **~150 lignes d'évaluateur** plutôt qu'une dépendance runtime. C'est de la
  complexité assumée au titre de §8.2 : l'exigence mesurée est que le moteur
  démarre sans installation. `ajv` reste en devDependency, mais **uniquement
  comme oracle de test** : `factory:test` compare chaque verdict — 3 manifests
  réels et 28 manifests délibérément invalides — et échoue au premier désaccord.
  L'évaluateur n'est donc jamais cru sur parole.
- Deux écarts de forme avec Ajv, sans effet sur les verdicts : Ajv émet des
  erreurs de branchement `if`/`allOf`/`anyOf` que le formateur de production
  écarte déjà, et la détection de mots-clés non gérés est volontairement
  conservatrice (elle peut sur-signaler à l'intérieur d'un mot-clé inconnu —
  refuser est la direction sûre).
- Un message change : `targets.<r>.responsibilities must be an array` devient
  `… is required when ready`, plus juste.

### Non revendiqué

Les autres schémas du dépôt (`blueprint`, `overlay`, `conformance-report`,
`platform-baseline-contract`) n'ont **pas** été audités pour cette propriété.
Le même défaut peut s'y trouver.

## Alternatives écartées

- **Supprimer le schéma.** Cohérent, mais perd un artefact interopérable et
  lisible par des outils tiers ; et §5 veut des schémas exécutables, pas leur
  absence.
- **Garder les deux, synchronisés par un test d'équivalence.** Maintient deux
  décisions pour une règle et ajoute un troisième artefact pour les réconcilier.
- **Générer le validateur depuis le schéma à la compilation.** Supprime la
  dépendance runtime mais ajoute une étape de build et un artefact généré à
  committer, pour un gain nul ici.
- **Ajouter `npm ci` aux jobs concernés.** Rétablirait Ajv au prix d'une
  installation racine — les sept starters — sur 25 jobs, et surtout renoncerait
  à une propriété que le dépôt tenait délibérément : le générateur démarre
  partout avec Node seul.

## Migration

Aucune : les trois manifests existants sont valides sans modification, et
l'ensemble des règles antérieures reste appliqué.

## Tests

```bash
npm run factory:test   # 458 tests
```

Un test balaie `factory/{engine,conformance,quality,cli,ai}` et échoue si un
module importe autre chose qu'un builtin Node — la régression exacte qui a cassé
25 jobs, désormais attrapée avant la CI.

Verrouillé : le schéma valide les trois manifests réels ; les enums du moteur
sont égaux à ceux du document ; treize violations structurelles sont refusées
**par le schéma seul** ; cinq règles de références croisées sont refusées par le
code ; les tests de refus antérieurs passent inchangés.

## Rollback

Révoquer le commit rétablit le validateur à la main et le schéma décoratif.
