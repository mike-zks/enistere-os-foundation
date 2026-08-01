# Matrice des presets de composition (R7)

> **État d'implémentation, pas architecture cible.** Ce document décrit ce que le moteur de composition
> supporte *aujourd'hui*. La topologie « une API obligatoire, un Web et un Mobile optionnels » est un
> héritage d'[ADR-042](../adr/ADR-042-ai-native-project-factory-architecture.md), remplacée comme cible
> par [ADR-060](../adr/ADR-060-system-profile-taxonomy.md) et la
> [System Blueprint Specification](../specifications/SYSTEM_BLUEPRINT_SPECIFICATION.md). L'écart est mesuré
> dans [TARGET_VS_CURRENT_IMPLEMENTATION.md](../audits/TARGET_VS_CURRENT_IMPLEMENTATION.md).

Dans le moteur actuel, un **preset de composition** — historiquement nommé profil — est une composition
nommée de `{api, web?, mobile?, capabilities}`. Ce registre ne doit pas être confondu avec les quatre
profils système canoniques.

Il ne remplace pas la matrice des capabilities : celle-ci dit ce qu'une capability vaut sur une
target, le profil dit quelle **combinaison complète** est supportée, et avec quelle preuve.

Source de vérité exécutable : `factory/engine/profiles.mjs`, validé contre la matrice réelle par
`factory/test/profiles.test.mjs`.

## Invariant : l'API est obligatoire

Un projet Foundation se compose **autour d'une API**, jamais autour d'un starter Web ou Mobile
isolé. `stack.api` reste obligatoire dans le Blueprint v1 ; `web` et `mobile` sont optionnels.

Toute demande « web-only » ou « mobile-only » est refusée avec un message qui rappelle l'invariant
et propose les profils API correspondants :

```
$ enistere profile angular-only-base
Unsupported profile: angular-only-base
An API is mandatory: a Foundation project composes around an API, never a web or mobile starter alone.
Profiles composing angular: nestjs-angular-base, spring-angular-base, spring-angular-auth, ...
```

Le refus ne dépend pas d'une liste de noms interdits : tout nom introduit par un starter Web ou
Mobile (`angular-*`, `flutter-*`, `nextjs-*`, `next-*`, `react-native-*`, `rn-*`) est traité comme
une demande sans API. Les alternatives proposées sont toujours des profils réellement enregistrés,
les générables en premier.

## Statuts

| Statut | Signification | Génération |
|---|---|---|
| `ready` | Composable, prouvé par un golden runtime **et composé exactement** | Autorisée |
| `supported` | Générable, mais sans golden **ou** avec un dépassement de capability | Autorisée, écart signalé |
| `planned` | Non composable : une capability est `planned`/`unsupported` sur une target | **Refusée** |

Depuis R8A, `ready` exige trois conditions cumulatives :

1. **gates vertes** — le golden runtime du profil passe ;
2. **preuve runtime** — un golden exerce réellement cette sélection ;
3. **composition exacte** — le projet généré contient les capabilities sélectionnées et **rien
   au-delà** (`compositionExact: true`).

Des gates vertes ne suffisent donc jamais. Un starter en `baseline-copy` livre tout son baseline.
Le moteur applique la règle : `validateProfileRegistry` refuse tout profil `ready` dont la
composition n'est pas exacte. Spring possède désormais une base modulaire ; ses profils `base`
avec NestJS/Next.js/React Native sont donc exacts et promouvables uniquement parce qu'un golden
les prouve aussi.

Deux champs distincts portent cette nuance :

- `runtimeProven` — un golden exerce cette sélection ;
- `compositionExact` — la livraison ne dépasse pas la sélection.

Le golden topologique `distributed-spring-nestjs` prouve un profil système et
ne constitue pas un preset de composition mono-slot enregistré dans cette matrice.

## Profils enregistrés

### `ready` — composables, prouvés et exacts (28)

| Profil | API | Web | Mobile | Capabilities | Golden |
|---|---|---|---|---|---|
| `nestjs-base` | nestjs | — | — | aucune | `nestjs-base` |
| `nestjs-auth` | nestjs | — | — | auth | `nestjs-auth` |
| `nestjs-rbac` | nestjs | — | — | auth + rbac | `nestjs-auth-rbac` |
| `nestjs-files` | nestjs | — | — | auth + rbac + files | `nestjs-files` |
| `nestjs-next-auth` | nestjs | nextjs | — | auth | `nest-next-auth` |
| `nestjs-next-rbac` | nestjs | nextjs | — | auth + rbac | `nest-next-auth-rbac` |
| `nestjs-next-files` | nestjs | nextjs | — | auth + rbac + files | `nest-next-files` |
| `nestjs-next-react-native-auth` | nestjs | nextjs | react-native | auth | `triple-auth` |
| `nestjs-next-react-native-rbac` | nestjs | nextjs | react-native | auth + rbac | `triple-auth-rbac` |
| `nestjs-next-react-native-files` | nestjs | nextjs | react-native | auth + rbac + files | `triple-files` |
| `nestjs-next-base` | nestjs | nextjs | — | aucune | `nestjs-next-base` |
| `nestjs-react-native-base` | nestjs | — | react-native | aucune | `nestjs-react-native-base` |
| `spring-base` | spring | — | — | aucune | `spring-base` |
| `fastapi-base` | fastapi | — | — | aucune | `fastapi-base` |
| `spring-auth` | spring | — | — | auth | `spring-auth` |
| `spring-rbac` | spring | — | — | auth + rbac | `spring-auth-rbac` |
| `spring-files` | spring | — | — | auth + rbac + files | `spring-files` |
| `spring-next-base` | spring | nextjs | — | aucune | `spring-next-base` |
| `spring-react-native-base` | spring | — | react-native | aucune | `spring-react-native-base` |
| `nestjs-angular-base` | nestjs | angular | — | aucune | `nestjs-angular-base` |
| `nestjs-flutter-base` | nestjs | — | flutter | aucune | `nestjs-flutter-base` |
| `spring-angular-base` | spring | angular | — | aucune | `spring-angular-base` |
| `spring-flutter-base` | spring | — | flutter | aucune | `spring-flutter-base` |
| `nestjs-angular-auth` | nestjs | angular | — | auth | `nestjs-angular-auth` |
| `nestjs-angular-rbac` | nestjs | angular | — | auth + rbac | `nestjs-angular-auth-rbac` |
| `nestjs-flutter-auth` | nestjs | — | flutter | auth | `nestjs-flutter-auth` |
| `fastapi-auth` | fastapi | — | — | auth | `fastapi-auth` |
| `fastapi-rbac` | fastapi | — | — | auth + rbac | `fastapi-rbac` |

Sur `nestjs-next-react-native-rbac` et `nestjs-next-react-native-files`, `rbac` est `not-applicable` sur React
Native : l'autorisation fine reste côté serveur et **aucune surface RBAC n'est injectée** sur le
mobile. Les deux profils triples réutilisent exactement les compositions golden existantes
(`triple-auth`, `triple-auth-rbac`) : aucun renderer, overlay ou comportement runtime nouveau.

### `supported` — générable, sans golden dédié (3)

| Profil | API | Web | Mobile | Capabilities | Golden | Écart constaté |
|---|---|---|---|---|---|---|
| `spring-angular-auth` | spring | angular | — | auth | aucun | composable depuis ADR-075, mais aucun golden n'exerce cette sélection |
| `spring-angular-rbac` | spring | angular | — | auth + rbac | aucun | composable depuis le portage RBAC Angular, mais aucun golden n'exerce cette sélection |
| `spring-flutter-auth` | spring | — | flutter | auth | aucun | composable depuis ADR-076, mais aucun golden n'exerce cette sélection |

Angular porte Authentication depuis ADR-075, Flutter depuis ADR-076, ce qui rend ces presets
**générables**. Ils restent `supported` et non `ready` : `ready` exige une preuve runtime, pas
seulement la composabilité — et les goldens qui exercent ces deux sélections sont adossés à NestJS,
pas à Spring.

Ces profils sont valides parce que le Platform Baseline est **implicite sur les sept runtimes** ; le suffixe
historique `-base` signifie désormais « aucune capability optionnelle ». R8A prouve
que leurs gates passent réellement. Angular et Flutter suivent désormais le contrat modulaire :
la génération utilise `modular-overlay` (`bundledFeaturesMayExceedSelection: false`).

Authentication est portée sur Angular (ADR-075), Flutter (ADR-076) et FastAPI (ADR-077) : **les
trois familles sont à parité** sur cette capability. RBAC est porté sur les trois API et les deux
clients Web ; il est structurellement `not-applicable` sur les deux clients Mobile, conformément à
ADR-074. Files reste la capability incomplète. Sur Spring, **Auth, RBAC et Files sont prêts**
(overlays modulaires + golden `spring-files`).

### `planned` — cibles de parité, génération refusée (1)

| Profil | API | Web | Mobile | Capabilities | Bloqué par |
|---|---|---|---|---|---|
| `spring-angular-flutter-files` | spring | angular | flutter | auth + rbac + files | toute la verticale non-TS |

Ces profils déclarent la cible de parité **sans jamais être présentés comme prêts**. Le refus actuel
des targets `planned` n'est contourné par aucun d'entre eux.

## Profils et combinaisons de stacks

Les **27 combinaisons de stacks** (3 API × 3 Web dont aucun × 3 Mobile dont aucun) restent une
grandeur distincte des profils :

- une combinaison de stacks dit ce qui est **assemblable** ;
- un profil dit ce qui est **supporté**, avec ses capabilities et sa preuve.

Plusieurs profils partagent une même combinaison de stacks (`nestjs + nextjs` porte
`nestjs-next-base`, `nestjs-next-auth` et `nestjs-next-rbac`), et de nombreuses combinaisons ne
portent aucun profil. La matrice des profils n'est donc pas une énumération des 27 cellules.

## Couverture des goldens

R8A, Capability Packs 2, FastAPI, ADR-066, ADR-076, ADR-077, ADR-078 puis le
portage RBAC Angular portent le golden runtime
à **29 compositions** : les 10 compositions NestJS des capability packs, les 10 compositions sans
capability optionnelle, `spring-auth`, `spring-auth-rbac`, `spring-files`, les trois compositions
`nestjs-angular-auth`, `nestjs-flutter-auth` et `fastapi-auth` qui prouvent Authentication hors de
la verticale TypeScript historique, `fastapi-rbac` qui y prouve l'autorisation,
`nestjs-angular-auth-rbac` qui prouve le client Angular, et le golden topologique
`distributed-spring-nestjs`.

Chaque golden est adossé à exactement un profil, et deux profils ne peuvent pas revendiquer le même.
La correspondance n'est pas une convention de nommage : un test vérifie que la sélection générée par
le golden est bien celle que le profil épingle.

En revanche, **un golden n'est pas une promotion** : les 28 profils `ready` combinent golden
vert et composition exacte. Aucun profil `supported` ni `planned` n'est promu par la seule
existence de gates vertes. Le golden distribué prouve un profil système, pas
un preset historique supplémentaire.

## CLI

```
enistere profiles          # tous les profils, leur statut et leur preuve
enistere profile <name>    # détail d'un profil ; sortie non nulle s'il n'est pas générable
enistere plan <blueprint>  # capabilities, profil correspondant et gates attendus
```

Un blueprint peut déclarer `profile: <name>` (champ optionnel). Le blueprint est alors validé contre
le profil : dérive de stack, dérive de capabilities et profil `planned` sont refusés avec un message
explicite. Sans ce champ, `plan` nomme malgré tout le profil correspondant à la sélection s'il
existe, afin que la composition reste traçable.
