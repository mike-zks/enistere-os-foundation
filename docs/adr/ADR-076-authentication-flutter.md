# ADR-076 — Authentication sur Flutter, et ce qu'il manquait pour l'y porter

- Statut : Validé et implémenté
- Date : 2026-07-29
- Décideur : Owner Foundation
- Complète : ADR-074 et ADR-075

## Contexte

Flutter était `planned` sur les trois capabilities. C'était le dernier écart de
parité d'Authentication : React Native tenait 4/4 des responsabilités de la
famille Mobile, Flutter aucune.

Comme pour Angular, le blocage n'était pas la logique d'authentification — elle
existe déjà, deux fois — mais **l'absence de tout point de composition**.
L'adapter Flutter était `integrationKinds: {}, composition: []`. Une capability
n'avait littéralement aucun moyen de s'attacher au starter.

Trois manques se sont révélés en chaîne, chacun invisible tant que le précédent
n'était pas levé.

## Décision

### 1. Trois coutures, aux trois points d'extension d'une application Riverpod

`flutter.provider-override`, `flutter.route`, `flutter.interceptor` — surcharges
de providers, routes, intercepteurs Dio. Le même raisonnement qu'Angular : les
routes contribuées sont ordonnées et une collision de chemin **lève**, de sorte
que deux capabilities résolues dans un ordre quelconque produisent le même
fichier.

Les intercepteurs sont **composés** dans le client de base plutôt que de le
remplacer : deux capabilities voulant chacune un intercepteur se disputeraient
sinon une seule surcharge exclusive.

### 2. L'ordre des intercepteurs est un contrat, pas un détail

C'est le défaut que la première écriture de cette mission portait, et il aurait
été silencieux :

```
logging → intercepteurs de capability → mapping d'erreur canonique
```

`ErrorInterceptor` appelle `handler.reject`, ce qui **termine** la chaîne. Un
intercepteur composé *après* lui n'aurait jamais vu un 401 — le rejeu unique
n'aurait tout simplement jamais eu lieu, sans qu'aucun test de la baseline ne
s'en aperçoive. Le mapping terminal reste donc en dernier, et ce qui veut
récupérer se place devant. Un test verrouille cet ordre dans le fichier.

### 3. `pub` est un gestionnaire de dépendances, pas `npm`

L'adapter Flutter n'en déclarait aucun et retombait sur le défaut `npm` : un
overlay déclarant une dépendance aurait écrit un `package.json` dans une
application Dart. La fusion `pubspec.yaml` est délibérément **ligne à ligne** et
non un aller-retour YAML : réécrire le document reformaterait des commentaires et
un ordre qui appartiennent au starter, et la Factory n'embarque aucune dépendance
YAML (ADR-072). Une contrainte déjà présente et différente est un **conflit**,
jamais un écrasement silencieux — la règle que `package.json` et `pom.xml`
suivent déjà.

### 4. Le routeur devient un vrai provider

`routerProvider` était une constante de premier niveau qui *ressemblait* à un
provider. La différence est opérante : une garde de route doit pouvoir demander
quelque chose à l'état de l'application, et une constante ne peut rien demander.

### 5. Sur mobile, la créance est persistée — et c'est le contraire d'Angular

ADR-075 a conclu qu'un SPA statique ne doit **rien** persister, faute de magasin
protégé. La conclusion inverse s'impose ici, à partir du même principe : *la
créance vit dans le magasin le plus protégé qu'offre la plateforme*. Un téléphone
en offre un réel. Garder la créance en mémoire sur Flutter jetterait une
protection que la plateforme donne, et imposerait une reconnexion à chaque
lancement sans rien acheter en échange.

La liaison passe par la couture `SecureStorageAdapter` **déjà définie par le
contrat runtime mobile** de la baseline. Le seul fichier de la capability qui
sait qu'un plugin existe est l'adaptateur ; tout le reste dépend du contrat.

Les options ne sont pas les défauts du plugin : `encryptedSharedPreferences`
sort la créance d'un fichier de préférences en clair sur Android, et
`first_unlock_this_device` la tient hors des sauvegardes iCloud — un appareil
restauré ne ressuscite pas la session de refresh de quelqu'un d'autre.

### 6. La baseline déclare la couture et ne fournit aucune liaison

`secureStorageProvider` **lève** par défaut. Un défaut en mémoire serait
strictement pire que rien : une capability pourrait croire avoir persisté une
créance en sécurité alors qu'elle n'a rien persisté du tout. C'est la capability
qui persiste un secret qui apporte la dépendance de plateforme — la même division
que React Native suit avec `expo-secure-store`.

### 7. Le transport d'authentification est un client séparé

Envoyer un refresh à travers l'intercepteur qui l'a déclenché est la manière dont
un client boucle contre sa propre autorité. Angular l'évite par un jeton de
contexte ; ici la séparation rend la boucle **irreprésentable** plutôt que
seulement gardée.

## Ce que cette mission a aussi corrigé

`capabilities/auth/targets/angular/conformance.json` désignait le golden
`nestjs-angular-auth`, **absent de `COMPOSITIONS`**. La preuve matérialisée
d'Angular ne s'exécutait donc nulle part — exactement le défaut de « descripteur
aspirationnel » corrigé pour Auth en début de chantier, réintroduit par le
portage Angular. Les deux compositions `nestjs-angular-auth` et
`nestjs-flutter-auth` sont créées et ajoutées à la matrice CI.

Le golden ainsi créé a immédiatement rempli son office : **l'application Angular
composée ne compilait pas**. `AUTH_PROVIDERS` était déclaré
`readonly (Provider | EnvironmentProviders)[]`, alors que le fichier de
composition liste chaque symbole comme **un** élément de ce même type ; un
tableau `readonly` n'y est pas assignable. Le portage Angular avait donc été
fusionné avec une composition qui ne construit pas.

Les 127 tests Karma passaient : seul `ng build` compile `app.config.ts`. Une
suite unitaire verte ne prouvait rien sur la composition — c'est précisément ce
qu'un golden est là pour attraper, et pourquoi un descripteur qui ne pointe vers
aucun golden est pire qu'un descripteur absent.

Le correctif est celui qu'Angular prescrit : `makeEnvironmentProviders` regroupe
un nombre quelconque de providers derrière **une** valeur, ce que retournent
aussi les fonctions `provideX()`. Un test verrouille la contrainte.

## Conséquences

### Acquis

* `auth/flutter` est `ready` : quatre responsabilités, six invariants.
  **L'écart de parité Mobile d'Authentication est refermé** — Flutter tient ce
  que React Native tient.
* Les trois coutures de composition Flutter existent et sont verrouillées par
  des tests, au bénéfice de toute capability future.
* Un overlay Flutter peut déclarer une dépendance.
* Le golden Angular d'Authentication s'exécute enfin.

### Assumé

* La couture `flutter.provider-override` n'a qu'un seul usage aujourd'hui. C'est
  le contrat de l'adapter, pas une facilité écrite pour un besoin unique.
* La liaison keystore n'est pas exercée par un test : `flutter_secure_storage`
  passe par des canaux de plateforme qu'un test unitaire ne peut pas atteindre.
  Ce qui est prouvé, c'est que la capability **ne parle qu'à la couture** — ce qui
  est précisément la garantie d'`AUTH-MOBILE-001`.

### Non revendiqué

* **Au moment de cette ADR, RBAC et Files restent `planned` sur Flutter** ;
  l'écart Files de la famille Mobile (`upload`) demeure déclaré.
* **Correction après audit (2026-08-01).** La première affirmation recopiait une
  prémisse déjà démentie par ADR-074 : `rbac/flutter` ne doit aucune
  responsabilité puisque la famille Mobile n'a pas de surface RBAC propre. La
  target devient `not-applicable`, comme React Native ; aucun overlay mobile
  RBAC n'est créé.
* Aucune garde n'est posée sur une route de la baseline : quels écrans sont
  publics est une décision produit, pas une décision d'authentification.
  `authRedirect` est fourni et documenté, comme `authGuard` l'est sur Angular.
* Le transport par cookie de refresh (ADR-075) reste une mission distincte.

## Alternatives écartées

* **Garder la créance en mémoire, comme Angular.** Applique la conclusion d'ADR-075
  au lieu de son principe. Le navigateur n'offrait rien de mieux ; le téléphone,
  si.
* **Surcharger `dioClientProvider` depuis la capability.** Une surcharge est
  exclusive : la deuxième capability voulant un intercepteur perdrait.
* **Composer les intercepteurs après le mapping d'erreur.** Ce que la première
  écriture faisait, et qui aurait rendu le rejeu unique inopérant en silence.
* **Un aller-retour YAML sur `pubspec.yaml`.** Reformaterait un fichier que le
  starter possède, et introduirait une dépendance que la Factory refuse.

## Tests

```bash
npm run factory:test
npm run factory:capability-conformance
node factory/quality/scripts/golden-runtime.mjs nestjs-flutter-auth
```

## Rollback

Révoquer le commit ramène `auth/flutter` à `planned` et rouvre l'écart de parité
Mobile dans `parity-gaps.json`. Les coutures de composition et le gestionnaire
`pub`, eux, sont indépendants de la capability et peuvent rester.
