# ADR-079 — Trois zones : ce que la Factory possède, ce qu'elle génère, ce qui est métier

- Statut : Validé — Next.js et NestJS migrés, trois runtimes restants
- Date : 2026-07-30
- Décideur : Owner Foundation
- Complète : ADR-055 et ADR-074

## Contexte

Un projet généré ne reste pas figé : l'équipe qui le reçoit y écrit ses propres
modules métier. Sans frontière nommée, **« régénérer pour prendre le socle
2.1 » est une opération que la Factory ne peut pas mener** — rien ne distingue
ce qu'elle a écrit de ce que l'équipe a écrit, donc rien ne lui dit ce qu'elle a
le droit de remplacer.

La séparation existait déjà, mais sur trois runtimes sur sept et de façon
incohérente : Spring avait `modules/`, Next.js et Flutter `features/`, tandis que
NestJS, FastAPI et React Native étaient plats. Deux runtimes portaient carrément
l'inversion — une capability *dans* la zone du cœur — corrigée par la PR
précédente.

## Décision

### 1. Trois zones, définies par ce qu'elles promettent

| Zone | Contenu | Promesse |
|---|---|---|
| **cœur** | socle de plateforme, ports, adaptateurs neutres | **remplaçable** par la Factory à la régénération |
| **composition** | fichiers générés par les coutures | **régénéré** intégralement, jamais édité à la main |
| **métier** | capabilities composées et modules de l'équipe | **jamais touché** par la Factory après matérialisation |

### 2. La zone dépend de la nature du code, pas de qui le livre

C'est le point qui tranche les cas ambigus. `app/persistence/` est apporté par la
capability Authentication sur FastAPI, mais c'est de l'infrastructure : il relève
du **cœur**. Inversement, un fichier livré par le starter qui nommerait un domaine
métier serait mal placé.

Corollaire opérant : **le cœur ne doit jamais savoir qu'une capability existe.**
C'est exactement ce que les coutures de composition rendent possible ; la zone
rend visible ce qu'elles imposent déjà dynamiquement.

### 3. Le nom de la zone métier suit la famille

* famille **API** → `modules/` — le mot qu'emploient Spring et NestJS ;
* familles **Web** et **Mobile** → `features/` — le mot qu'emploient Next.js,
  Angular, React Native et Flutter.

Imposer un seul mot aux sept aurait été plus simple à écrire et plus étranger à
chaque écosystème. La parité porte sur le comportement, pas sur le vocabulaire.

### 4. Les clés de requête sont du métier

Le cas était explicitement laissé ouvert. Il est tranché : `auth-keys.ts`,
`file-keys.ts` et `authorization-keys.ts` nomment des domaines métier, donc
appartiennent à leur feature. Le cœur garde l'**infrastructure** de cache — le
client, le provider — et `health-keys.ts`, qui nomme une préoccupation du socle.

Le test décisif est le corollaire ci-dessus : si `core/query/keys/auth-keys.ts`
reste, alors le cœur sait qu'« auth » existe.

## Ce que la migration NestJS a ajouté

NestJS n'avait aucune zone métier : sept répertoires — `auth`, `users`, `files`,
`authorization`, `roles`, `permissions`, `rbac` — vivaient à plat, mêlés à
`platform`, `common`, `database`. Ils sont désormais sous `src/modules/`.

Trois fichiers de Files logeaient dans le cœur — `src/config/files.configuration.ts`,
`src/common/errors/files-error-codes.ts`, `src/audit/files-audit-events.ts`. Ils
appliquent exactement le critère : une configuration qui nomme un domaine métier
apprend au cœur que ce domaine existe. Aucun fichier du cœur ne les référençait,
seulement Files lui-même — le déplacement était donc net.

**NestJS n'a pas de répertoire `core/` unique.** Sa zone cœur est l'ensemble des
répertoires de premier niveau que le starter possède, et FF5d les énumère. C'est
l'encodage honnête : inventer un `core/` que le framework n'a jamais eu aurait
été plus élégant à écrire et étranger à l'idiome.

## Ce que la règle a révélé sur Spring

En étendant FF5d à Spring — réputé « net » parce qu'il avait déjà `modules/` — la
mesure a montré **neuf violations** : toutes ses classes `@Configuration` de
capability siègent dans `core/config/`. Le diagnostic initial était trop
généreux : avoir une zone métier ne prouve pas qu'on l'utilise partout.

Ces neuf écarts sont déclarés et datés ; le runtime Spring devient une migration
à part entière, qui n'était pas prévue.

## Ce que la migration Next.js a révélé

Next.js déclarait déjà les deux zones, et les trois capabilities écrivaient dans
**les deux à la fois**. Le déplacement a montré deux choses qu'aucune relecture
n'aurait données :

* **La compilation des tests changeait de périmètre.** `tsconfig.test.json`
  excluait `src/core/auth/server` — des modules liant `next/headers`,
  invérifiables sous `node:test`. Le code déplacé, l'exclusion ne portait plus et
  la suite tentait de compiler du code Next-only.
* **Des tests de frontière énuméraient des chemins en dur.** Les tests qui
  vérifient qu'aucun module client n'importe un module serveur listaient
  `core/auth/...` littéralement : ils passaient encore *par vacuité* sur des
  fichiers devenus introuvables. Un test de frontière qui ne trouve plus sa
  frontière ne la vérifie plus.

Les deux sont des défauts de couplage caché entre l'arborescence et l'outillage —
précisément ce qu'une zone nommée rend explicite.

## Conséquences

### Acquis

* **Next.js et NestJS n'ont plus aucune capability dans leur zone cœur.** Les
  sept violations Next.js déclarées sont refermées.
* FF5d couvre désormais cinq runtimes : Angular, Flutter, Next.js, NestJS et
  Spring.
* Le vocabulaire est fixé, donc les migrations restantes sont mécaniques.

### Assumé

* **La migration est incomplète et le reste sciemment.** FastAPI et React Native
  n'ont pas encore de zone métier, et Spring garde neuf classes `@Configuration`
  dans son cœur — écarts déclarés et datés. Chacun est une migration à part
  entière, derrière son golden : les grouper multiplierait le risque sans rien
  accélérer.
* NestJS prend `src/modules/`, légèrement à contre-courant de son idiome usuel
  (`src/<feature>` à plat). Coût accepté au bénéfice de la cohérence de famille
  avec Spring.

### Non revendiqué

* **La règle mesure les destinations d'overlay, pas les imports.** Interdire à
  `core/**` d'importer `features/**` est l'invariant complémentaire, et il n'est
  pas encore posé.
* Rien n'est fait, à ce stade, du bénéfice visé : la Factory ne sait toujours pas
  **régénérer** un projet existant. La zone est le prérequis de cette capacité,
  pas la capacité.

## Alternatives écartées

* **Un seul mot pour les sept runtimes.** Uniformité d'écriture contre
  étrangeté dans chaque écosystème.
* **Tout migrer d'un coup.** Sept runtimes, onze overlays, tous les chemins
  d'import : un seul lot où la première erreur masque les suivantes.
* **Laisser les clés de requête dans le cœur.** Confort de regroupement contre
  un cœur qui connaît le nom des capabilities.

## Tests

```bash
npm run factory:test                      # 497
npm run factory:capability-conformance    # aucune dérive
node factory/quality/scripts/golden-runtime.mjs nest-next-files
node factory/quality/scripts/golden-runtime.mjs nestjs-files
```

Applications réellement générées, chacune composant **les trois capabilities** :

* **Next.js** — `lint` propre, `typecheck` propre, **457/457 tests**,
  `next build` réussi ;
* **NestJS** — `lint` et `build` verts, **387 tests sur 52 suites**.

## Rollback

Révoquer les commits remet les capabilities Next.js et NestJS dans la zone cœur.
La règle FF5d et le vocabulaire restent valides : ils ne dépendent d'aucun
runtime en particulier.
