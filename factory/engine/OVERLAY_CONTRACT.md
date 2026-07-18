# Contrat d'overlay de capability (Capability Packs 1A)

Un overlay est la **seule** façon dont une capability se compose sur une baseline `base`. Le moteur
Factory (`factory/engine/overlay.mjs`) est l'unique interpréteur : il n'exécute jamais de script,
hook, `eval` ni commande libre fournis par un manifeste. Schéma : `factory/schema/overlay.schema.json`.

## Emplacement

```
capabilities/<capability>/targets/<target>/
  overlay.json          # manifeste déclaratif (schemaVersion "1")
  files/…               # charges utiles copiées telles quelles
  fragments/…           # fragments structurés (ex. fragment Prisma)
```

Un répertoire `targets/<target>/` **sans** `overlay.json` est un **payload parqué** (code extrait
mais non câblé) : la capability reste `planned` et `generate` la refuse.

## Opérations déclarées (`overlay.json`)

| Champ | Rôle |
|---|---|
| `files` | Copies `source` (sous `files/`) → `destination`. `overwrite: true` requis pour remplacer un fichier de la baseline ; un conflit non déclaré échoue. |
| `dependencies` | Fusion contrôlée dans `package.json` (`dependencies`/`devDependencies`). Un conflit de version échoue. Chemins locaux (`file:`/`link:`) interdits. |
| `environment` | Variables ajoutées à `.env.example` (section générée commentée). |
| `integrations` | Intégrations **centrales connues** rendues par le moteur (voir ci-dessous). Une intégration inconnue échoue. |
| `verification` | Tableaux d'arguments exécutés depuis le répertoire de l'app par le script `verify` généré. |

## Intégrations connues (par target)

- **nestjs** : `nestjs.module`, `nestjs.global-guard`, `nestjs.throttler`, `nestjs.prisma-fragment`.
  Rendues dans `src/composition/capabilities.ts` (modules, guards globaux, throttlers nommés) et par
  ajout de fragment à `prisma/schema.prisma`.
- **nextjs** : `nextjs.provider` (→ `src/app/providers/capability-providers.tsx`),
  `nextjs.public-nav-link` (→ `src/core/composition/public-nav.ts`).
- **react-native** : `expo.provider` (→ `src/composition/capability-providers.tsx`).

Les renderers déterministes vivent dans `factory/engine/overlay-renderers.mjs` : une même entrée
produit toujours la même sortie.

## Résolution et lock

Le moteur résout `base → auth → …` dans l'ordre du registre, copie la baseline puis les overlays,
fusionne les dépendances sans doublon, génère les fichiers d'intégration centraux, puis inscrit dans
`enistere.lock` (`overlays[]`) la `version` et le `digest` sha256 (manifeste + charge utile) de chaque
overlay appliqué. `generationMode` devient `modular-overlay` (et `bundledFeaturesMayExceedSelection`
`false`) uniquement lorsque **toutes** les targets sélectionnées déclarent `composition.model: "modular"`.

## Preuves

`factory/test/overlay.test.mjs` (validation, rejets, conflits, digest déterministe, refus des targets
`planned` et de RBAC/Files) et `factory/test/goldens.test.mjs` (six compositions `base`/`base+auth`
avec assertions d'absence et de présence).
