# Contrat d'overlay de capability

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
| `operations` | Liste optionnelle et unique des opérations utilisées par l'overlay. Chaque valeur doit être déclarée par l'adapter versionné de la target. |
| `files` | Copies `source` (sous `files/`) → `destination`. Un conflit non déclaré échoue. Les fichiers centraux gouvernés ne peuvent jamais être fournis par cette opération ; les rares remplacements autorisés sont recensés et justifiés dans `overwrite-policy.mjs`. |
| `dependencies` | Fusion contrôlée dans `package.json` (`dependencies`/`devDependencies`). Un conflit de version échoue. Chemins locaux (`file:`/`link:`) interdits. |
| `environment` | Variables ajoutées à `.env.example` (section générée commentée). |
| `integrations` | Intégrations **centrales connues** rendues par le moteur (voir ci-dessous). Une intégration inconnue échoue. |
| `verification` | Tableaux d'arguments exécutés depuis le répertoire de l'app par le script `verify` généré. |

## Adapters de target

Le moteur charge un adapter versionné pour chaque target depuis
`factory/engine/target-adapters.mjs`. L'adapter déclare les opérations communes
(`files`, `dependencies`, `environment`, `integrations`, `contract`, `verification`) et les
intégrations spécialisées acceptées par sa target. Une intégration ou une opération non déclarée
est refusée avant toute écriture.

Le registre est extensible : ajouter une target future ajoute un adapter et ses tests, sans
modifier le validateur central. La version de chaque adapter sélectionné est inscrite dans le plan
et le lock générés. Aucun adapter ne peut exécuter une commande, un hook ou du code arbitraire.

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

- **nestjs** : `nestjs.module`, `nestjs.global-guard`, `nestjs.throttler`,
  `nestjs.prisma-schema`, `nestjs.prisma-seed`. Rendues dans
  `src/composition/capabilities.ts` (modules, guards globaux, throttlers nommés), dans le schéma
  Prisma composé et dans le registre de seeds.
  - `nestjs.global-guard` porte un `order` entier **obligatoire** : la chaîne globale est triée par
    `order`, indépendamment de l'ordre de composition (authentification 10 → rôles 20 → permissions
    30). Un symbole déclaré deux fois ou deux guards réclamant le même rang sont **refusés** (chaîne
    ambiguë jamais rendue).
  - `nestjs.prisma-schema` référence un fragment JSON déclaratif strict (`enums`, `models`,
    extensions `fields`). Le moteur valide les propriétés et types, accumule les contributions
    dans un modèle intermédiaire, refuse modèles/enums/champs dupliqués ou extensions inconnues,
    puis rend le schéma complet une seule fois. Il ne parse ni ne modifie du texte Prisma.
  - `nestjs.prisma-seed` enregistre une fonction idempotente avec un `order` explicite. Le moteur
    génère `prisma/seed/capability-seeds.ts`, consommé par l'orchestrateur stable
    `prisma/seed.ts`. Symboles et rangs dupliqués sont refusés ; aucune capability ne remplace le
    seed central.
- **nextjs** : `nextjs.provider` (→ `src/app/providers/capability-providers.tsx`),
  `nextjs.public-nav-link` (→ `src/core/composition/public-nav.ts`) et
  `nextjs.status-section` (→ registre ordonné `src/core/composition/status-sections.tsx`) ainsi que
  `nextjs.dashboard-nav-link` (→ `src/core/composition/dashboard-nav.ts`). La page `/status` et le
  shell dashboard restent stables ; destinations, symboles et rangs ambigus sont refusés.
- **react-native** : `expo.provider` (→ `src/composition/capability-providers.tsx`) et
  `expo.home-action` (→ `src/composition/home-actions.ts`). Le shell Home reste stable ; une
  destination ou un rang dupliqué est refusé.

Les renderers déterministes vivent dans `factory/engine/overlay-renderers.mjs` : une même entrée
produit toujours la même sortie.

## Politique de fichiers centraux

`factory/engine/overwrite-policy.mjs` distingue :

- les fichiers **gouvernés**, qu'aucun overlay ne peut copier ou remplacer (schéma/seed Prisma,
  snapshot OpenAPI, shells et registres de composition) ;
- une allowlist réduite de fichiers exclusifs pouvant porter `overwrite: true`, chaque entrée ayant
  une justification revue ;
- tous les autres remplacements, refusés par défaut.

Cette politique évite le modèle « dernière capability appliquée gagne ». Un nouveau besoin central
doit introduire une intégration déclarative et un renderer, pas élargir l'allowlist par commodité.

## Contrat OpenAPI composé

Un overlay NestJS déclare uniquement ses `contract.openapiOperations`. Il ne livre ni snapshot
OpenAPI complet ni test central de remplacement. Après composition et génération du client Prisma,
le golden runtime :

1. génère OpenAPI depuis l'application réellement composée ;
2. compare les `operationId` aux opérations de `base` et des overlays inscrites dans
   `enistere.lock` ;
3. régénère et exige un document byte-identique ;
4. exécute les invariants transverses du contrat et les gates applicatifs.

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
sur les quatre compositions base/Auth et les trois compositions Auth/RBAC.

### Audit des dépendances

Chaque golden exécute `npm audit` via `factory/quality/scripts/audit-check.mjs` : **aucune désactivation
globale**, aucun `--audit-level` permissif. Le gate échoue sur toute vulnérabilité non couverte par une
exception **documentée et scopée** (`factory/quality/audit-exceptions.json` : package, portée,
justification, échéance), sur une sévérité supérieure à celle documentée, sur une exception hors périmètre
de la composition auditée, et sur une exception dont l'échéance est dépassée (revue forcée).

## Preuves

`factory/test/overlay.test.mjs`, `factory/test/goldens.test.mjs`,
`factory/test/rbac-composition.test.mjs` et `factory/test/composition-seams.test.mjs` couvrent les
rejets, conflits, digests, compositions, modèle Prisma déclaratif, seeds, sections Web, politique
de fichiers centraux et contrat OpenAPI.
