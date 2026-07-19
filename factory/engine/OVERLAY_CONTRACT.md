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

## Statuts de support d'une capability sur une target

| Statut | Sens | Bloque la génération ? |
|---|---|---|
| `ready` | composable aujourd'hui (`mode`: `built-in` ou `overlay`) | non |
| `planned` | prévue mais non livrée | **oui** |
| `unsupported` | ne sera pas livrée pour cette target | **oui** |
| `not-applicable` | la capability n'a **par conception** aucune surface sur cette target, qui en consomme les décisions ailleurs (ex. RBAC sur mobile : l'autorisation est serveur) | non — et **rien n'est injecté** |

`not-applicable` permet à une composition mixte (`base + auth + rbac` sur NestJS + Next.js + React
Native) de rester générable : la target concernée est ignorée par l'application d'overlays, jamais
dotée d'un overlay factice. `assessCapabilitySupport` retourne ces cas dans `notApplicable`.

## Intégrations connues (par target)

- **nestjs** : `nestjs.module`, `nestjs.global-guard`, `nestjs.throttler`, `nestjs.prisma-fragment`,
  `nestjs.prisma-model-field`. Rendues dans `src/composition/capabilities.ts` (modules, guards
  globaux, throttlers nommés) et par composition du schéma `prisma/schema.prisma`.
  - `nestjs.global-guard` porte un `order` entier **obligatoire** : la chaîne globale est triée par
    `order`, indépendamment de l'ordre de composition (authentification 10 → rôles 20 → permissions
    30). Un symbole déclaré deux fois ou deux guards réclamant le même rang sont **refusés** (chaîne
    ambiguë jamais rendue).
  - `nestjs.prisma-model-field` étend un modèle déjà défini par un fragment antérieur (ex. RBAC
    ajoutant `roles UserRole[]` au `User` d'Auth). L'insertion est **consciente des blocs** : le
    modèle est localisé par son en-tête, sa accolade fermante par profondeur, et le champ inséré
    avec les autres champs (avant les attributs `@@`). Modèle inconnu ou champ déjà déclaré →
    erreur. **Jamais de substitution textuelle/regex non gouvernée, jamais de duplication de modèle.**
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

## Reproductibilité et lockfiles (workspace unifié)

Le projet généré est un **workspace npm unifié** (strategy/06). Le `package.json` racine déclare comme
membres `packages/*` et chaque application npm (`apps/api`, `apps/web`, `apps/mobile`). Les packages
`@enistere/*` sont donc des membres du workspace, résolus par leurs consommateurs via la portée `*`
(**jamais** `file:`, `npm link` ni un chemin vers la Foundation). La fusion de dépendances d'un overlay
**ne supprime aucun lockfile** ; le générateur retire les lockfiles par-application (hérités des starters
autonomes) car un **unique `package-lock.json` racine** fait autorité.

La génération est hors ligne et ne peut pas résoudre le registre : un projet généré est donc
explicitement marqué `dependenciesLocked: false` dans `enistere.lock`. La **finalisation des
dépendances** est une étape explicite du CLI :

- `enistere generate <blueprint> <out> --install` (ou `enistere install <projet>`) ;
- 1. `npm install --package-lock-only --ignore-scripts` — résout tout le workspace dans le lock racine,
  **sans exécuter aucun script lifecycle** et sans écrire `node_modules` ;
- 2. `npm ci` — installe strictement depuis ce lock (reproductible) ;
- 3. enregistre dans `enistere.lock` : `dependenciesLocked: true`, `lockDigest` (sha256 du lock) et
  `lockfileVersion`.

`enistere verify <projet>` (chemin de **répertoire**) recalcule le digest et détecte tout lock modifié,
manquant ou incohérent avec l'état déclaré. Un projet non finalisé reste valide mais honnêtement
signalé comme non verrouillé.

La CI `Factory Golden Runtime` prouve cette chaîne bout-en-bout (génération → lock sans scripts →
`npm ci` → `verify` → gates réels par application → `npm audit` par exception → déterminisme du digest)
sur `nestjs-base`, `nestjs-auth`, `nest-next-auth` et `triple-auth`.

### Audit des dépendances

Chaque golden exécute `npm audit` via `factory/quality/scripts/audit-check.mjs` : **aucune désactivation
globale**, aucun `--audit-level` permissif. Le gate échoue sur toute vulnérabilité non couverte par une
exception **documentée et scopée** (`factory/quality/audit-exceptions.json` : package, portée,
justification, échéance), sur une sévérité supérieure à celle documentée, sur une exception hors périmètre
de la composition auditée, et sur une exception dont l'échéance est dépassée (revue forcée).

## Preuves

`factory/test/overlay.test.mjs` (validation, rejets, conflits, digest déterministe, refus des targets
`planned` et de RBAC/Files) et `factory/test/goldens.test.mjs` (six compositions `base`/`base+auth`
avec assertions d'absence et de présence).
