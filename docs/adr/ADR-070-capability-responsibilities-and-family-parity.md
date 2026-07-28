# ADR-070 — Responsabilités par target et parité par famille de runtimes

- Statut : Validé et implémenté
- Date : 2026-07-28
- Décideur : Owner Foundation
- Complète : ADR-056, ADR-067, ADR-068 et ADR-069

## Contexte

ADR-068 et ADR-069 ont rendu la conformité produit mesurable, puis générique.
Les deux capabilities mesurées jusqu'ici couvraient réellement l'intégralité de
leur périmètre sur chacune de leurs targets, ce qui masquait une limite du
manifeste : `ready` est un booléen.

`files` déclare sept responsabilités — `upload`, `metadata`, `download-url`,
`delete`, `quarantine`, `reconciliation`, `quota`. La mesure du réel donne :

```text
NestJS        7 endpoints, 26 événements d'audit      7/7
Spring        2 endpoints (upload, download-url)      2/7
Next.js       6 hooks de gestion                      5/7
React Native  upload seul                             1/7
```

Les quatre portaient le statut `ready`. Un mot unique recouvrait donc une
couverture complète et une couverture de deux septièmes.

## Décision

### 1. Une target `ready` déclare ce qu'elle tient

`$defs/target` gagne `responsibilities` : un sous-ensemble non vide des
responsabilités de la capability, obligatoire dès que la target est `ready` et
validé contre la liste déclarée. Le support partiel devient énonçable au lieu
d'être implicite.

### 2. Les invariants sont attachés à une responsabilité

Un invariant du contrat produit peut porter `responsibility`. Il ne lie alors
que les targets qui déclarent la tenir. Un invariant sans `responsibility` est
transverse et lie **toutes** les targets de son rôle — c'est là que vivent
l'authentification, l'autorisation par ressource et l'absence de fuite interne,
qu'aucune couverture partielle ne dispense de prouver.

### 3. Parité par famille — la contrainte qui donne son sens au reste

Déclarer une couverture partielle ne la rend pas légitime. Le mandat §8.4 impose
la parité **au sein d'une famille de runtimes** : les runtimes d'une même famille
sont des implémentations interchangeables du même produit.

> Toutes les targets `ready` d'une même famille doivent déclarer le même
> ensemble de responsabilités. Une target seule dans sa famille n'a personne à
> égaler et n'est pas contrainte ; deux targets qui divergent constituent une
> rupture de parité.

Les familles proviennent du registre canonique `APPLICATION_KINDS` — aucune
seconde définition.

Sans cette règle, le mécanisme du point 1 aurait produit l'effet exact qu'ADR-068
rejetait : tout au vert sans rien prouver, non plus en affaiblissant le contrat
mais en le rendant propre à chaque target. La première rédaction de cette
décision comportait ce défaut ; la règle de parité le corrige.

### 4. La rupture de parité est une non-conformité, pas un manifeste invalide

La règle est portée par **l'évaluateur de conformité**, pas par le validateur de
manifeste. Un manifeste qui décrit fidèlement la réalité doit rester chargeable :
en faire une erreur de schéma rendrait `files` illisible et casserait la
génération d'applications qui fonctionnent. Conformément au mandat §5, la
divergence rend le composant **non conforme**, elle ne le rend pas inexistant.

### 5. Le gate golden distingue deux natures d'échec

Une preuve manquante ou altérée dans l'application matérialisée fait échouer le
golden : c'est une régression du build vérifié. Une rupture de parité déjà actée
par cet ADR et portée par la roadmap est affichée en clair à chaque exécution
mais ne fait pas échouer le golden : ce n'est pas une régression, c'est une dette
connue et suivie.

### 6. La couverture est publiée à côté du verdict

Le rapport porte `coverage`, `family` et `familyParity` par target. `CONFORMANT`
sur deux responsabilités sur sept ne doit jamais se lire comme `CONFORMANT` sur
sept.

## État mesuré

```text
auth   api  nestjs 4/4 · spring 4/4     web nextjs 4/4     mobile rn 4/4     CONFORMANT
rbac   api  nestjs 4/4 · spring 4/4     web nextjs 2/4                       CONFORMANT
files  api  nestjs 7/7 · spring 2/7 ✗   web nextjs 5/7     mobile rn 1/7     NON_CONFORMANT
```

`files` est **non conforme**, et c'est le résultat attendu de la mesure. Toutes
les preuves que Spring déclare passent ; le seul écart est la parité elle-même.

Next.js (5/7) et React Native (1/7) ne sont pas en rupture : Angular et Flutter
ne sont pas `ready`, ces targets sont seules dans leur famille. Leur couverture
partielle est une décision de périmètre, pas une divergence.

## Conséquences

### Acquis

- Le support partiel est déclaré, vérifié et publié au lieu d'être supposé.
- La parité de famille est mesurée automatiquement, sur les trois capabilities.
- L'écart Files/API est chiffré et nommé : `delete`, `metadata`, `quarantine`,
  `quota`, `reconciliation` manquent à Spring.
- Auth et RBAC restent conformes, mesurées par la même règle.

### Dette assumée

Spring ne tient pas cinq des sept responsabilités de `files`. Aucune dérogation
n'est accordée : la capability reste `NON_CONFORMANT` jusqu'à ce que l'écart soit
comblé. Le statut `ready` de la target est conservé parce qu'elle livre
réellement l'upload et le téléchargement — le déclasser retirerait une surface
fonctionnelle sans rien corriger.

### Non revendiqué

- Aucun statut `PRODUCT_EQUIVALENT` ni `PRODUCTION_READY`.
- FastAPI n'a aucune des trois capabilities ; Angular et Flutter restent
  `planned`.

## Alternatives écartées

- **Responsabilités par target sans contrainte de famille.** Première version de
  cette décision : elle légitimait la divergence NestJS/Spring et déclarait les
  deux conformes. Rejetée après relecture au regard du mandat §8.4.
- **Contrat calé sur le minimum commun API** (upload + download-url). Tout au
  vert, cinq responsabilités sur sept jamais mesurées.
- **Parité en erreur de manifeste.** Rendrait `files` inchargeable et casserait
  la génération d'applications Spring qui fonctionnent.
- **Exception de parité datée**, sur le modèle des exceptions d'audit CVE.
  Transforme une règle structurante en formalité contournable dès sa création.
- **Déclasser `files/spring` en `planned`.** Retire une surface upload/télé-
  chargement réelle et casse les goldens `spring-files` et `triple-files`.
- **Implémenter les cinq responsabilités manquantes dans cette mission.**
  Stockage objet, verrous de maintenance, quotas concurrents : c'est construire
  une surface produit, pas la mesurer.

## Migration

Tout manifeste de capability doit déclarer `responsibilities` sur chaque target
`ready` ; les trois manifestes livrés sont à jour. Aucune application générée
n'est affectée : la décision porte sur la description et la mesure.

## Tests

```bash
npm run factory:capability-conformance   # 2/3 — files non conforme, écart nommé
npm run factory:test                     # 450 tests
npm run factory:baseline-gap             # 7 runtimes inchangés
```

Verrouillé par tests : responsabilité inconnue refusée, liste vide refusée,
couverture partielle acceptée quand elle est déclarée, invariants transverses
imposés à toutes les targets, rupture de parité détectée sur `files/spring`,
absence de contrainte pour une target seule dans sa famille, et gate golden qui
tolère la parité mais échoue sur une preuve disparue.

## Rollback

Révoquer le commit : le champ `responsibilities`, la règle de parité et le
contrat produit Files forment une unité. `files` cesserait d'être mesurée et
l'écart Spring redeviendrait invisible.
