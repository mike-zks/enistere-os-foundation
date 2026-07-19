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

## Profils enregistrés

### `ready` — composables, prouvés et exacts (15)

| Profil | API | Web | Mobile | Capabilities | Golden |
|---|---|---|---|---|---|
| `nestjs-base` | nestjs | — | — | base | `nestjs-base` |
| `nestjs-auth` | nestjs | — | — | base + auth | `nestjs-auth` |
| `nestjs-rbac` | nestjs | — | — | base + auth + rbac | `nestjs-auth-rbac` |
| `nestjs-files` | nestjs | — | — | base + auth + rbac + files | `nestjs-files` |
| `nestjs-next-auth` | nestjs | nextjs | — | base + auth | `nest-next-auth` |
| `nestjs-next-rbac` | nestjs | nextjs | — | base + auth + rbac | `nest-next-auth-rbac` |
| `nestjs-next-files` | nestjs | nextjs | — | base + auth + rbac + files | `nest-next-files` |
| `nestjs-next-react-native-auth` | nestjs | nextjs | react-native | base + auth | `triple-auth` |
| `nestjs-next-react-native-rbac` | nestjs | nextjs | react-native | base + auth + rbac | `triple-auth-rbac` |
| `nestjs-next-react-native-files` | nestjs | nextjs | react-native | base + auth + rbac + files | `triple-files` |
| `nestjs-next-base` | nestjs | nextjs | — | base | `nestjs-next-base` |
| `nestjs-react-native-base` | nestjs | — | react-native | base | `nestjs-react-native-base` |
| `spring-base` | spring | — | — | base | `spring-base` |
| `spring-next-base` | spring | nextjs | — | base | `spring-next-base` |
| `spring-react-native-base` | spring | — | react-native | base | `spring-react-native-base` |

Sur `nestjs-next-react-native-rbac` et `nestjs-next-react-native-files`, `rbac` est `not-applicable` sur React
Native : l'autorisation fine reste côté serveur et **aucune surface RBAC n'est injectée** sur le
mobile. Les deux profils triples réutilisent exactement les compositions golden existantes
(`triple-auth`, `triple-auth-rbac`) : aucun renderer, overlay ou comportement runtime nouveau.

### `supported` — générables, gates vertes, mais composition inexacte (4)

| Profil | API | Web | Mobile | Capabilities | Golden | Dépassement constaté |
|---|---|---|---|---|---|---|
| `spring-angular-base` | spring | angular | — | base | `spring-angular-base` | API **et** Web |
| `spring-flutter-base` | spring | — | flutter | base | `spring-flutter-base` | API **et** Mobile |
| `nestjs-angular-base` | nestjs | angular | — | base | `nestjs-angular-base` | 15 fichiers d'authentification côté Angular |
| `nestjs-flutter-base` | nestjs | — | flutter | base | `nestjs-flutter-base` | écran de connexion côté Flutter |

Ces quatre profils sont valides **parce que `base` est disponible sur les six starters**, et R8A prouve
que leurs gates passent réellement. Ils restent néanmoins `supported` : Angular et Flutter ne
suivent pas le contrat de composition modulaire, donc la génération retombe sur `baseline-copy`
(`bundledFeaturesMayExceedSelection: true`) et le projet livré dépasse la sélection.

**Aucun de ces profils ne sera promu par des gates vertes seules.** La promotion passe par
l'extraction modulaire des starters secondaires — mission dédiée, préalable à tout travail
Auth/RBAC/Files sur ces stacks.

### `planned` — cibles de parité, génération refusée (7)

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

R8A porte le golden runtime de 10 à **19 compositions** : les 10 compositions NestJS des capability
packs, plus les 9 compositions `base` seul (Spring, Angular et Flutter compris).

Chaque golden est adossé à exactement un profil, et deux profils ne peuvent pas revendiquer le même.
La correspondance n'est pas une convention de nommage : un test vérifie que la sélection générée par
le golden est bien celle que le profil épingle.

En revanche, **un golden n'est pas une promotion**. Quinze profils sont `ready` (golden vert +
composition exacte) ; quatre sont `supported` avec un golden tout aussi vert, retenus par leur
composition inexacte. Aucun profil `planned` n'a de golden.

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
