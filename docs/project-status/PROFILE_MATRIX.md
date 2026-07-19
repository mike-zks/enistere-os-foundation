# Matrice des profils (R7)

Un **profil** est une composition *nommée* de `{api, web?, mobile?, capabilities}`.

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
| `ready` | Composable selon la matrice **et** prouvé par un golden runtime | Autorisée |
| `supported` | Composable selon la matrice, **sans** preuve golden | Autorisée, non-preuve signalée |
| `planned` | Non composable : une capability est `planned`/`unsupported` sur une target | **Refusée** |

`ready` n'est jamais attribué sans overlay **et** golden. Un profil `supported` est générable mais
son absence de preuve runtime est explicite (`runtimeProven: false`) — elle n'est jamais masquée.

## Profils enregistrés

### `ready` — composables et prouvés

| Profil | API | Web | Mobile | Capabilities | Golden |
|---|---|---|---|---|---|
| `nestjs-base` | nestjs | — | — | base | `nestjs-base` |
| `nestjs-auth` | nestjs | — | — | base + auth | `nestjs-auth` |
| `nestjs-rbac` | nestjs | — | — | base + auth + rbac | `nestjs-auth-rbac` |
| `nestjs-files` | nestjs | — | — | base + auth + rbac + files | `nestjs-files` |
| `nestjs-next-auth` | nestjs | nextjs | — | base + auth | `nest-next-auth` |
| `nestjs-next-rbac` | nestjs | nextjs | — | base + auth + rbac | `nest-next-auth-rbac` |
| `nestjs-next-rn-files` | nestjs | nextjs | react-native | base + auth + rbac + files | `triple-files` |

Sur `nestjs-next-rn-files`, `rbac` est `not-applicable` sur React Native : l'autorisation fine reste
côté serveur et **aucune surface RBAC n'est injectée** sur le mobile.

### `supported` — composables, sans preuve runtime

| Profil | API | Web | Mobile | Capabilities |
|---|---|---|---|---|
| `spring-base` | spring | — | — | base |
| `nestjs-next-base` | nestjs | nextjs | — | base |
| `nestjs-react-native-base` | nestjs | — | react-native | base |
| `nestjs-angular-base` | nestjs | angular | — | base |
| `nestjs-flutter-base` | nestjs | — | flutter | base |
| `spring-next-base` | spring | nextjs | — | base |
| `spring-react-native-base` | spring | — | react-native | base |
| `spring-angular-base` | spring | angular | — | base |
| `spring-flutter-base` | spring | — | flutter | base |

Ces profils sont valides **parce que `base` est disponible sur les six starters**. Les starters
Spring, Angular et Flutter ne suivent pas encore le contrat de composition modulaire : la génération
retombe sur `baseline-copy` et les fonctionnalités embarquées peuvent dépasser la sélection
(`bundledFeaturesMayExceedSelection: true`).

### `planned` — cibles de parité, génération refusée

| Profil | API | Web | Mobile | Capabilities | Bloqué par |
|---|---|---|---|---|---|
| `spring-auth` | spring | — | — | base + auth | auth/spring |
| `spring-rbac` | spring | — | — | base + auth + rbac | auth+rbac/spring |
| `spring-files` | spring | — | — | base + auth + rbac + files | auth+rbac+files/spring |
| `spring-angular-auth` | spring | angular | — | base + auth | auth/spring, auth/angular |
| `spring-angular-rbac` | spring | angular | — | base + auth + rbac | auth+rbac/spring, auth+rbac/angular |
| `spring-flutter-auth` | spring | — | flutter | base + auth | auth/spring, auth/flutter |
| `spring-angular-flutter-files` | spring | angular | flutter | base + auth + rbac + files | toute la verticale non-TS |

Ces profils déclarent la cible de parité **sans jamais être présentés comme prêts**. Le refus actuel
des targets `planned` n'est contourné par aucun d'entre eux.

## Profils et combinaisons de stacks

Les **18 combinaisons de stacks** (2 API × 3 Web dont aucun × 3 Mobile dont aucun) restent une
grandeur distincte des profils :

- une combinaison de stacks dit ce qui est **assemblable** ;
- un profil dit ce qui est **supporté**, avec ses capabilities et sa preuve.

Plusieurs profils partagent une même combinaison de stacks (`nestjs + nextjs` porte
`nestjs-next-base`, `nestjs-next-auth` et `nestjs-next-rbac`), et de nombreuses combinaisons ne
portent aucun profil. La matrice des profils n'est donc pas une énumération des 18 cellules.

## Couverture des goldens

Les 10 goldens runtime sont tous NestJS. Sept d'entre eux adossent un profil `ready`. Les deux
goldens `triple-auth` et `triple-auth-rbac` (composition triple sans Files) restent des compositions
testées sans profil nommé : elles sont couvertes par la CI mais ne sont pas proposées comme
combinaison supportée. Aucun profil `supported` ou `planned` n'est adossé à un golden.

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
