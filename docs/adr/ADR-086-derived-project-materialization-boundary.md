# ADR-086 — La livraison dérivée exclut les sources de fabrication

- Statut : Validé et implémenté
- Date : 2026-08-02
- Décideur : Owner Foundation
- Complète : ADR-046, ADR-063, ADR-064 et ADR-083

## Contexte

La Factory distinguait correctement le starter sélectionné des overlays à
appliquer, mais sa copie finale ne respectait pas cette frontière. Elle livrait
la racine complète de chaque capability sélectionnée, donc les implémentations,
tests et assets de targets étrangères, ainsi qu'une liste fixe de packages
TypeScript sans vérifier qu'une application les consommait.

Des caches et métadonnées propres au checkout de la Foundation pouvaient aussi
être copiés. La forme livrée dépendait alors de l'état local de la machine qui
générait le projet.

## Ce que la mesure a montré

L'audit a généré les sept runtimes, les 27 combinaisons de stack et les 35
profils enregistrés. Tous étaient générables, mais tous livraient les trois
packages TypeScript, même sans consommateur. Les sorties Angular, FastAPI et
Flutter pouvaient respectivement contenir `.angular`, `.ruff_cache`, `.idea` et
`android/local.properties`; ce dernier révélait les chemins locaux du SDK
Android et du SDK Flutter.

L'exécution de la suite complète a ensuite révélé un deuxième couplage :
l'évaluateur de conformité Flutter relisait le manifest de starter dans le
projet dérivé pour retrouver ses commandes de qualité. Ces commandes étaient
déjà résolues dans le `GenerationPlan`; l'évaluateur consomme désormais cette
source canonique au lieu d'exiger une métadonnée de fabrication dans la sortie.

Sur la composition représentative FastAPI + Angular + Flutter + Files :

| mesure | avant | après |
|---|---:|---:|
| fichiers | 1 080 | 286 |
| octets | 5 529 012 | 718 339 |
| `enistere.inventory.json` | 149 828 | 32 799 |

Sur FastAPI seul, la sortie passe de 217 à 46 fichiers et de 569 454 à
62 417 octets. Next.js conserve les trois packages partagés parce qu'il les
consomme réellement. React Native avec Auth conserve `api-contracts` et
`api-client-fetch`. FastAPI seul n'en conserve aucun.

## Décision

La racine d'un starter et la racine d'une capability sont des **sources de
fabrication**, pas des unités de livraison.

La matérialisation :

1. copie seulement les racines des applications sélectionnées, en excluant les
   caches, sorties de build, métadonnées de starter et fichiers locaux machine ;
2. applique uniquement les overlays résolus pour ces applications ;
3. ne livre jamais `capabilities/` dans le projet dérivé ;
4. inspecte, après composition, les dépendances npm déclarées par les
   applications ;
5. calcule la fermeture transitive de ces consommateurs dans le registre local
   `packages/*`, puis ne copie et ne bâtit que cette fermeture ;
6. inscrit cette fermeture sous `sharedPackages` dans `enistere.lock` et déclare
   des workspaces racine explicites, jamais un glob qui rendrait un package
   accidentellement applicable.

Un consommateur d'un package `@enistere/*` inconnu fait échouer la génération.
Les dépendances locales cycliques font également échouer la génération.

Cette décision ne modifie pas les Runtime Contracts. Chaque application reste
le code idiomatique de son framework ; la frontière commune porte sur ce que la
Factory livre, pas sur la façon dont NestJS, Spring, FastAPI, Next.js, Angular,
React Native ou Flutter doivent implémenter leurs responsabilités.

## Conséquences

### Acquis

* Une sortie ne dépend plus des caches ou chemins SDK présents dans le checkout
  qui exécute la génération.
* Les payloads des capabilities et targets non livrées ne gonflent plus le
  projet propriétaire ni son inventaire de régénération.
* Un package partagé est fourni et bâti lorsqu'un consommateur le déclare, y
  compris par fermeture transitive ; sans consommateur, il n'est pas livré.
* La composition représentative est gardée sous 400 fichiers, 1 000 000
  d'octets et 50 000 octets d'inventaire. Ces budgets laissent environ 40 % de
  marge par rapport à la mesure après correction.
* Les sept familles de runtime sont couvertes par une gate de non-livraison des
  métadonnées et chemins machine.
* La conformité Flutter prouve ses gates depuis le plan résolu, pas depuis une
  copie du manifest de starter.

### Assumé

* `.metadata` est conservé pour Flutter : c'est une métadonnée de projet gérée
  par l'outil Flutter, pas une donnée locale machine comme
  `android/local.properties`.
* `packages/contracts` reste toujours généré depuis le blueprint neutre. Ce
  contrat neutre n'est pas assimilé aux packages TypeScript partagés.
* Les starters restent des projets autonomes dans la Foundation. Le nettoyage
  porte sur la frontière de copie ; il ne supprime pas les caches ignorés du
  checkout d'un développeur.

### Non revendiqué

* Les noms, descriptions, coordonnées Maven, identifiants Expo/Android et noms
  Dart internes restent ceux des starters. Leur dérivation depuis le CSM est la
  mission suivante et exige des règles propres à chaque écosystème.
* Aucun binding Java, Python ou Dart n'est généré depuis `api-contracts`; la
  fermeture de consommateurs ne transforme pas un package TypeScript en contrat
  polyglotte.
* Aucun benchmark exhaustif des avantages propres à chaque framework n'est
  introduit. Les Runtime Contracts v2, leurs suites idiomatiques et leurs
  goldens restent les preuves canoniques, sans revendiquer
  `PRODUCT_EQUIVALENT` ou `PRODUCTION_READY`.
* Les documents applicatifs internes autres que la spécification et le manifest
  de starter ne sont pas encore classifiés un par un.
* Cette décision ne réduit pas le coût des inventaires de projets déjà générés
  et ne rend pas régénérables les projets historiques dépourvus d'inventaire.

## Alternatives écartées

* **Copier tous les packages partagés par convention.** Leur présence ne prouve
  pas leur applicabilité et surcharge les runtimes non npm.
* **Copier la capability complète pour conserver sa provenance.** Le lock porte
  déjà version et digest de chaque overlay ; livrer les autres targets expose
  du code de fabrication sans consommateur.
* **Imposer une abstraction runtime commune plus riche.** Cela réduirait les
  frameworks à un plus petit dénominateur commun. La conformité porte sur les
  contrats, tandis que l'implémentation reste idiomatique.

## Tests

```bash
node factory/test/materialization.test.mjs
npm run factory:test
node factory/quality/scripts/fitness-functions.mjs
node factory/quality/scripts/docs-link-check.mjs
node factory/quality/scripts/golden-runtime.mjs fastapi-angular-files
node factory/quality/scripts/golden-runtime.mjs fastapi-flutter-files
```

La gate dédiée génère les sept runtimes, une composition multi-familles Files
et trois graphes de consommateurs représentatifs. Les goldens prouvent que la
forme réduite se verrouille, se construit et s'exécute ; une simple comparaison
de fichiers ne suffit pas.

## Rollback

Révoquer cette décision rétablit la copie des racines de capabilities et la
liste fixe de packages. Cela réintroduit les payloads étrangers, les packages
sans consommateur et la dépendance à l'état local du checkout.
