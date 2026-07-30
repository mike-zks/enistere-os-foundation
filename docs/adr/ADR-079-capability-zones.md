# ADR-079 — Trois zones : ce que la Factory possède, ce qu'elle génère, ce qui est métier

- Statut : Validé — Next.js migré, quatre runtimes restants
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

* **Next.js n'a plus aucune capability dans sa zone cœur.** Les sept violations
  déclarées sont refermées et `layout-gaps.json` est vide.
* Angular, Flutter, Next.js et Spring respectent la règle ; FF5d la mesure sur
  les trois qui déclarent deux zones.
* Le vocabulaire est fixé, donc les migrations restantes sont mécaniques.

### Assumé

* **La migration est incomplète et le reste sciemment.** NestJS, FastAPI et
  React Native n'ont pas encore de zone métier. Chacun est une migration à part
  entière, derrière son golden : les grouper multiplierait le risque sans rien
  accélérer.
* NestJS aura `src/modules/`, ce qui est légèrement à contre-courant de son
  idiome usuel (`src/<feature>` à plat). C'est un coût accepté au bénéfice de la
  cohérence de famille avec Spring.

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
```

Application Next.js composée avec **les trois capabilities**, réellement
générée : `lint` propre, `typecheck` propre, **457/457 tests**, `next build`
réussi.

## Rollback

Révoquer le commit remet les capabilities Next.js dans la zone cœur et réactive
les sept écarts déclarés. La règle FF5d et le vocabulaire restent valides : ils
ne dépendent d'aucun runtime en particulier.
