# ADR-071 — Gates hermétiques : un verdict ne dépend pas d'une valeur distante mutable

- Statut : Validé et implémenté
- Date : 2026-07-28
- Décideur : Owner Foundation
- Complète : ADR-057 et ADR-070

## Contexte

Le 2026-07-28, toutes les compositions golden contenant React Native sont passées
au rouge sur des commits inchangés.

Les faits, relevés dans les journaux CI :

```text
13:31  main        expo-doctor@1.20.1   19/19 checks passed
13:52  PR #219     expo-doctor@1.20.1   ✖ react-native expected 0.83.10, found 0.83.6
```

Même version d'outil, même lock, même code mobile — la PR incriminée ne touchait
aucun fichier mobile, et `nestjs-react-native-base` ne compose aucune capability.
Vingt minutes séparaient un vert d'un rouge.

La cause n'est ni une publication npm ni un changement du dépôt :
`expo-doctor` interroge `api.expo.dev/v2/sdks/55.0.0/native-modules` **au moment
de l'exécution** pour connaître les versions attendues par le SDK. Cette valeur
est servie côté serveur et Expo l'a modifiée entre les deux runs.

Un premier correctif (PR #220) a réaligné le pin sur `0.83.10` et rétabli le
vert. Il était juste sur le fond — la valeur attendue avait bien changé — mais sa
justification était fausse : elle invoquait une publication npm d'Expo, alors que
les dates de publication montrent que ni `expo` (55.0.28, 15 juillet) ni
`expo-doctor` (1.20.1, 15 juillet) n'avaient bougé ce jour-là. Le présent ADR
rectifie ce diagnostic.

Surtout, ce correctif ne traitait que l'occurrence. Le mécanisme restait intact :
n'importe quel commit pouvait redevenir rouge sans qu'une ligne ait changé.

## Décision

### 1. Un gate qui affirme la reproductibilité ne peut pas dépendre d'une valeur distante mutable

C'est le principe, et il dépasse Expo. Le golden runtime prouve qu'un même
blueprint produit le même système — il vérifie explicitement le déterminisme du
lock. Un gate dont le verdict peut changer sans que rien n'ait changé contredit
la propriété même qu'il est censé établir : il ne mesure plus le dépôt, il mesure
l'état d'un service tiers à un instant donné.

### 2. Les gates mobiles s'exécutent en mode hermétique

`runtimeEnvironmentFor` pose `EXPO_OFFLINE=1` pour les applications React Native.
L'attente de versions est alors lue dans `bundledNativeModules.json` du paquet
`expo` **verrouillé**, et non plus demandée au réseau. Elle ne bouge donc que
lorsque nous déplaçons délibérément le SDK.

Vérification discriminante : en falsifiant l'attente locale à `0.83.99` alors que
l'API annonce `0.83.10`, le mode en ligne passe (il suit l'API) et le mode
hors-ligne échoue en réclamant `0.83.99`. Le basculement de source de vérité est
démontré, pas supposé.

### 3. L'outil de vérification est épinglé

`npx expo-doctor` téléchargeait la dernière version publiée à chaque exécution.
Ce n'était pas la cause de l'incident, mais c'était une seconde source de
non-déterminisme — et l'exécution d'un outil non épinglé, résolu en ligne, à
l'intérieur d'une porte de qualité est une faiblesse de chaîne
d'approvisionnement (mandat §12).

`expo-doctor` devient une devDependency verrouillée et le script appelle le
binaire local.

### 4. Le produit généré conserve la vérification en ligne

Seul le **gate** est hermétique. Un développeur qui lance `npm run doctor` dans
un projet généré interroge toujours l'API : c'est utile, il apprend qu'une
dérive existe. La séparation est volontaire — le gate répond « ce dépôt est-il
cohérent et reproductible ? », l'outil du développeur répond « suis-je aligné
sur l'amont ? ». Ce sont deux questions différentes ; les confondre est ce qui a
produit l'incident.

## Conséquences

### Acquis

- Le verdict des goldens React Native ne dépend plus d'un service tiers.
- La version de l'outil de vérification est verrouillée et auditable.
- L'attente de versions devient un fait versionné du dépôt, qui évolue par
  décision explicite (montée du SDK) et non par surprise.

### Assumé

Nous n'apprenons plus automatiquement qu'Expo a changé ses attentes. C'est le
prix voulu : cette information arrive désormais au moment où nous montons `expo`,
c'est-à-dire quand nous sommes prêts à la traiter, plutôt qu'au milieu d'une PR
sans rapport. Si un besoin de détection de dérive se manifeste, il relèvera d'une
tâche planifiée et non bloquante — pas d'un gate.

### Non revendiqué

Les autres gates n'ont pas été audités pour cette propriété. Le principe posé ici
leur est applicable, mais aucune vérification systématique n'a été menée.

## Alternatives écartées

- **Réaligner le pin à chaque incident.** C'est ce qu'a fait la PR #220 : traite
  l'occurrence, laisse le mécanisme. Un diagnostic complet et une PR par
  changement amont, sans préavis.
- **`expo.install.exclude` sur `react-native`.** Fait taire la vérification sur
  le paquet le plus important du runtime mobile. Supprime le symptôme et le
  signal.
- **Retirer `expo-doctor` des goldens.** Perd une vérification réellement utile
  sur la cohérence du projet généré ; le problème n'était pas la vérification
  mais sa source de vérité.
- **Épingler la réponse de l'API dans le dépôt.** Duplique une donnée déjà
  présente dans le paquet `expo` installé, et crée une troisième source de vérité
  à maintenir.

## Migration

Aucune action sur les projets déjà générés. Les projets régénérés obtiennent le
script `doctor` épinglé ; le comportement en ligne du développeur est inchangé.

## Tests

```bash
node factory/quality/scripts/golden-runtime.mjs spring-react-native-base   # PASS
npm run factory:test                                                       # 450
npm run factory:baseline-gap                                               # 7 runtimes
```

Le golden confirme en outre que `expo-doctor` n'est plus téléchargé à
l'exécution : la ligne `npm warn exec … will be installed` a disparu des
journaux.

## Rollback

Révoquer le commit : le gate redeviendrait dépendant de l'API Expo et l'outil
serait de nouveau résolu en ligne à chaque exécution.
