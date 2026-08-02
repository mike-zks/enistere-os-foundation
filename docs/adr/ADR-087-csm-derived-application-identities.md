# ADR-087 — Les identités applicatives dérivent du Canonical System Model

- Statut : Validé et implémenté
- Date : 2026-08-02
- Décideur : Owner Foundation
- Complète : ADR-045, ADR-046, ADR-083 et ADR-086

## Contexte

ADR-086 a cessé de livrer les sources de fabrication, mais les applications
matérialisées conservaient encore les identités de leurs starters : noms npm,
coordonnées et packages Java, distribution Python, projet Angular, slug Expo,
package Dart et identifiants Android/iOS. Une substitution globale n'aurait pas
été correcte : ces champs ont des grammaires, des limites et des effets de build
différents.

## Ce que l'exécution a montré

Une première génération des sept runtimes a prouvé que les manifests seuls ne
suffisaient pas. Spring exige de déplacer les arbres Java et de réécrire les
directives `package` et `import` ajoutées par les overlays. Flutter exige la même
cohérence entre `pubspec.yaml`, imports Dart, namespace Gradle, package Kotlin et
chemin de `MainActivity`. Angular lie son nom de projet aux targets de build.

Le premier golden Next.js corrigé a aussi démenti une lecture superficielle :
le build était valide, mais un test du starter exigeait encore que le gabarit de
titre contienne « Enistère ». Le golden est devenu vert seulement après avoir
matérialisé cette assertion depuis la même identité.

Sur une composition Spring + Angular + Flutter, le nouveau fichier d'identité
mesure **4 005 octets** et l'inventaire complet **27 776 octets** pour 211
fichiers. Il ne réintroduit pas le coût de 169 KiB observé avant ADR-086.

## Décision

Le `GenerationPlan` porte pour chaque application une identité déterministe,
calculée uniquement depuis `project`, `displayName` et l'id applicatif. Le
runtime choisit sa représentation ; le starter ne choisit jamais l'identité.

| Écosystème | Représentation matérialisée |
|---|---|
| commune | `<project>-<appId>`, borné à 63 caractères avec suffixe SHA-256 en cas de troncature |
| npm | `@<project>/<appId>` |
| Maven | `app.<project segments>:<project>-<appId>` |
| Java | package `app.<project segments>.<app segments>` et classe principale dérivée |
| Python | distribution `<project>-<appId>` |
| Angular | clé de projet et sortie `dist/<project>-<appId>` |
| Expo | nom visible, slug, scheme, package Android et bundle iOS dérivés |
| Dart | `<project>_<appId>`, borné à 64 caractères avec suffixe de digest |
| Android/Flutter | namespace, `applicationId`, label, package Kotlin et chemin dérivés |

Les segments Java réservés ou numériques sont préfixés par `x`. Toute
troncature conserve dix caractères de SHA-256 ; les collisions calculées dans
un même système font échouer la construction du plan. Les JSON sont modifiés
structurellement. Les autres fichiers ne subissent que des remplacements de
champs connus qui échouent si le marqueur attendu manque ; les directives
Java/Dart sont traitées par syntaxe ciblée, après application des overlays.

`enistere.identity.json` matérialise l'identité livrée et entre dans
`enistere.inventory.json`. À la régénération :

1. une modification ou suppression propriétaire de ce fichier bloque toute
   opération ;
2. le slug projet ne peut plus changer ;
3. un id applicatif déjà livré ne peut être retiré ou renommé ;
4. un ajout d'application et un réordonnancement restent permis.

Une future opération de renommage devra être une migration explicite. Aucun
mode de `regenerate` ne contourne cette garde.

## Conséquences

### Acquis

* Les sept runtimes livrent des coordonnées exécutables qui représentent le
  projet et l'application du CSM, y compris les imports et chemins natifs.
* Les overlays Auth Spring et Flutter sont réécrits après composition ; ils ne
  réintroduisent pas les packages des starters.
* Les identités externes livrées sont inventoriées et protégées contre un
  renommage implicite pendant la régénération.
* Les goldens ont construit les packages partagés réellement consommés : leur
  identité `@enistere/*` reste celle d'un package Foundation partagé, pas celle
  d'une application dérivée.

### Assumé

* Faute de domaine propriétaire dans le CSM, Maven et les identifiants natifs
  utilisent le namespace neutre `app.*`. Il est buildable et déterministe, mais
  ne prétend pas représenter un domaine DNS appartenant au produit.
* `displayName` reste une métadonnée modifiable : ses labels peuvent évoluer par
  régénération lorsque le propriétaire n'a pas modifié les fichiers concernés.

### Non revendiqué

* Aucun cycle de renommage, de retrait d'application, de transfert de bundle
  mobile ou de publication Maven/npm n'est livré.
* Aucun binding Java, Python ou Dart n'est généré depuis `api-contracts`. Les
  packages partagés TypeScript restent fournis seulement à leurs consommateurs.
* Le contrat historique `packages/api-contracts` contient encore des exemples
  issus du contrat NestJS qui l'a produit ; sa neutralisation et les bindings
  polyglottes constituent la mission suivante.
* Aucun démarrage sur appareil ou simulateur, build iOS natif, signature ou
  publication store n'est revendiqué. Expo a été exporté pour iOS et Flutter a
  produit un APK debug.
* Aucun audit exhaustif de l'exploitation de tous les avantages propres à
  chaque framework ni aucune équivalence produit/production n'est revendiqué.

## Tests

```bash
node --test factory/test/application-identities.test.mjs factory/test/regenerate.test.mjs
npm run factory:test
node factory/quality/scripts/fitness-functions.mjs
node factory/quality/scripts/docs-link-check.mjs
node factory/quality/scripts/golden-runtime.mjs spring-angular-base
env GOLDEN_RUNTIME_START=1 node factory/quality/scripts/golden-runtime.mjs fastapi-base
env GOLDEN_RUNTIME_START=1 node factory/quality/scripts/golden-runtime.mjs nest-next-auth --regenerate-from nestjs-base
node factory/quality/scripts/golden-runtime.mjs nestjs-react-native-base
node factory/quality/scripts/golden-runtime.mjs nestjs-flutter-auth --regenerate-from nestjs-flutter-base
```

Les preuves exécutent installations, tests et builds, dont les coordonnées
Maven/packages Java dérivés et le projet Angular renommé. FastAPI répond réellement
sur ses trois routes Health et Next.js répond 200 après démarrage. Expo passe
Doctor puis exporte le bundle iOS ; Flutter passe analyse/tests et produit un
APK debug. Les deux goldens de régénération injectent des fichiers propriétaire
et vérifient qu'ils restent intacts.

## Rollback

Révoquer cette décision retire la dérivation du plan, les matérialiseurs et le
registre d'identité. Les projets recommencent alors à exposer les coordonnées
des starters et `regenerate` ne peut plus distinguer une évolution légitime
d'un renommage externe destructeur.
