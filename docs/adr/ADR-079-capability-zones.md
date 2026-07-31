# ADR-079 — Trois zones : ce que la Factory possède, ce qu'elle génère, ce qui est métier

- Statut : Validé et implémenté sur les sept runtimes
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

## Ce que la migration FastAPI a mis à l'épreuve

FastAPI est le cas qui teste le critère plutôt que de l'illustrer.
`app/auth` et `app/authorization` passent sous `app/modules/` ; **`app/persistence`
reste dans le cœur** alors qu'il est apporté par Authentication. C'est
exactement « la nature, pas le livreur ».

Cette décision expose une limite de la règle telle qu'énoncée : FF5d vérifie
qu'aucun overlay n'écrit dans la zone cœur, et ne sait donc pas exprimer *« une
capability contribue légitimement de l'infrastructure de cœur »*. La zone cœur
mesurée pour FastAPI est donc celle que **le starter possède**, et
`app/persistence/` n'y est pas mesuré. Le vrai correctif n'est pas d'assouplir la
règle mais de faire porter la persistance par le baseline — l'asymétrie
qu'ADR-077 avait déjà déclarée assumée.

## Ce que la migration React Native a révélé

React Native est le runtime où le critère demande le plus de jugement, parce que
son overlay Auth contribue **beaucoup d'infrastructure** en plus du métier.
La répartition retenue :

* **métier**, déplacé sous `src/features/` — `auth`, `upload`, le pont 401
  (`with-auth-retry`), le magasin de session et ses clés, les hooks
  `useAuthedQuery`/`useAuthedMutation`, et `navigation/` dont `resolveAuthRedirect`
  prend un `AuthStatus` en paramètre ;
* **cœur**, laissé en place — le port `SecureStorage` et ses adaptateurs, la
  fondation de formulaires, le client de requêtes : ils ne nomment aucun domaine.

La règle a aussi mis au jour **un défaut d'une autre nature**. React Native
compose en **écrasant des barils du cœur** (`overwrite: true`) plutôt que par une
couture : `src/api/index.ts` importe la capability pour câbler l'adaptateur de
session, `src/query/index.ts` ré-expose les hooks authentifiés. Déplacer ces
fichiers ne corrigerait rien — ils doivent rester au cœur. Le correctif est une
couture de composition, comme les six autres runtimes en ont une. Trois écarts
déclarés et datés.

Enfin, la mesure elle-même avait un trou : `destination.startsWith('src/api/')`
laissait passer une entrée écrivant `src/api` **en entier**, alors que remplacer
le répertoire est la brèche la plus large, pas une exemption.

## Spring : la mesure d'abord fausse, puis la migration

En étendant FF5d à Spring — réputé « net » parce qu'il avait déjà `modules/` — la
mesure a montré **neuf violations** : ses classes `@Configuration` de capability
siégeaient dans `core/config/`. Avoir une zone métier ne prouve pas qu'on
l'utilise partout.

**Et le premier inventaire était lui-même incomplet.** J'avais omis
`infrastructure/` de la zone cœur ; l'y ajouter a révélé cinq destinations de
plus. Une règle ne mesure que ce qu'on lui donne à mesurer.

Quatorze destinations au total, réparties selon le critère :

* **métier**, déplacé sous `modules/` — les neuf `@Configuration`, la chaîne de
  sécurité JWT (`infrastructure/security`) et les limiteurs de débit par
  capability (`infrastructure/ratelimit`) ;
* **cœur**, laissé en place — `infrastructure/storage` : `StorageService` est un
  port neutre, MinIO et Fake ses adaptateurs.

Java rend le déplacement plus intrusif qu'ailleurs : chaque fichier change de
`package`, et **une classe qui était voisine de package cesse de l'être**. Le
compilateur a trouvé trois vagues d'imports manquants que rien d'autre n'aurait
signalées — `RateLimiter`, `CorsConfig`, `GlobalExceptionHandler` — plus deux
`importPath` d'intégration encore pointés sur `core.config`. C'est la seule
migration où compiler était indispensable, pas seulement prudent.

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

* **Les sept runtimes ont une zone métier et n'y laissent aucune capability
  ailleurs.** FF5d les mesure tous, et **plus aucune violation de placement**
  n'existe.
* Les deux écarts restants ne sont pas des dettes de placement : ils sont
  déclarés avec leur nature propre — une contribution de cœur légitime, et une
  composition par écrasement.
* Le vocabulaire est fixé, donc les migrations restantes sont mécaniques.

### Assumé

* **Deux dettes restent, déclarées et datées, et aucune n'est un placement.**
  React Native compose par écrasement de barils au lieu de coutures ; Files sur
  Spring contribue un port de stockage au cœur. Ni l'une ni l'autre ne se règle
  par un déplacement — la première demande des coutures, la seconde que le
  baseline porte le port.
* NestJS prend `src/modules/`, légèrement à contre-courant de son idiome usuel
  (`src/<feature>` à plat). Coût accepté au bénéfice de la cohérence de famille
  avec Spring.

### Non revendiqué

* **La règle mesure les destinations d'overlay, pas les imports.** Interdire à
  `core/**` d'importer `features/**` est l'invariant complémentaire, et il n'est
  pas encore posé.
* **Elle ne sait pas exprimer une contribution de cœur par une capability.**
  Le motif s'est répété — `app/persistence` sur FastAPI, `infrastructure/storage`
  sur Spring — et mérite d'être nommé : une capability apporte un port neutre et
  ses adaptateurs parce que le baseline n'a pas choisi de fournisseur. Le
  correctif n'est pas d'assouplir la règle mais que le baseline porte le port.
* `migrations/env.py` **énumère en dur les modules de modèles à importer** pour
  l'autogénération Alembic — il ne voit pas ceux de RBAC. Sans effet aujourd'hui,
  les révisions étant écrites à la main, mais un `--autogenerate` proposerait de
  supprimer les tables RBAC. C'est un défaut antérieur à cette migration, mis au
  jour par elle.
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
node factory/quality/scripts/golden-runtime.mjs fastapi-rbac
node factory/quality/scripts/golden-runtime.mjs triple-files
node factory/quality/scripts/golden-runtime.mjs spring-files
```

Applications réellement générées, chacune composant **les trois capabilities** :

* **Next.js** — `lint` propre, `typecheck` propre, **457/457 tests**,
  `next build` réussi ;
* **NestJS** — `lint` et `build` verts, **387 tests sur 52 suites** ;
* **FastAPI** — `ruff` propre, **40/40 pytest** sur PostgreSQL réel, `compileall`
  et `pip check` verts, deux révisions Alembic appliquées (8 tables) ;
* **React Native** (composition triple) — `typecheck` et `lint` verts,
  **362/362 tests** ;
* **Spring** (trois capabilities) — `mvn verify` réussi, **139 tests**,
  Testcontainers compris.

## Rollback

Révoquer les commits remet les capabilities dans la zone cœur.
La règle FF5d et le vocabulaire restent valides : ils ne dépendent d'aucun
runtime en particulier.
