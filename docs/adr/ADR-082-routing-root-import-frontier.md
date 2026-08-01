# ADR-082 — Les racines de routage sous la même frontière d'import

- Statut : Validé et implémenté
- Date : 2026-08-01
- Décideur : Owner Foundation
- Complète : ADR-081
- Corrige : le diagnostic « troisième catégorie » d'ADR-081

## Contexte

ADR-081 a posé FF5e — le cœur n'importe pas la zone métier — et a laissé une
zone hors de portée :

> Les racines de routage ne sont pas mesurées. `src/app/` sur Next.js, `app/` sur
> Expo sont des surfaces partagées, les capabilities y écrivent des pages.

Elle en tirait qu'il fallait **nommer une troisième catégorie**. La mesure a
démenti ce diagnostic, et c'est le seul intérêt de cette ADR.

## Ce que la mesure a montré

**Une seule racine de routage sur sept importe la zone métier** : Next.js,
depuis une unique page, `src/app/(public)/status/page.tsx`, cinq imports. La
racine Expo est propre — `app/index.tsx` n'importe que `@/theme` et `@/ui`.

Et ce qu'elle importait n'était pas du métier :

* `foundation-status` s'annonce lui-même comme « page technique de la baseline
  Next.js » : le framework, les intégrations câblées, le hors-périmètre. C'est
  le jumeau du `FOUNDATION_DIAGNOSTICS` de React Native — lequel vit dans la
  racine de routage, pas dans `features/` ;
* `capability-sections.tsx` est **le rendu d'une couture de composition**
  (`CAPABILITY_STATUS_SECTIONS`) : de l'infrastructure Factory, garée dans la
  zone métier ;
* `health` sondait `/health`, la sonde du socle — alors que
  `core/api/health/health-transport.ts` et `core/query/keys/health-keys.ts`
  étaient déjà dans le cœur. **Le même sujet était coupé en deux par la
  frontière**, et ADR-079 avait explicitement tranché que `health-keys.ts`
  restait au cœur.

Aucun de ces sept fichiers n'importait quoi que ce soit d'autre que le cœur,
`shared/` ou le UI Kit.

## Décision

**Il n'y avait pas de catégorie à inventer.** C'est le critère d'ADR-079 — *la
zone suit la nature du code, pas qui le livre* — qui n'avait pas été appliqué à
Next.js.

`src/features/foundation-status/` et `src/features/health/` passent dans
`src/core/`. Le starter Next.js ne livre plus rien dans la zone métier.

**Conséquence structurelle, et c'est elle qui compte** : `features/` est
désormais vide dans les **sept** starters. La zone métier cesse d'être
*surtout* du territoire capability-et-utilisateur pour l'être **exclusivement**.

### La règle, du coup

FF5e lit désormais aussi les racines de routage, sous une clé distincte
(`routes`) et non comme du cœur — parce que la distinction reste vraie pour
FF5d : les capabilities y écrivent des pages, et FF5d ne doit pas le leur
interdire.

**La distinction se tient sans règle particulière**, parce que FF5e lit les
*starters* : les pages d'une capability n'y apparaissent jamais, un starter n'en
livre aucune. Ce qu'un starter place sous sa racine de routage est
Factory-owned et remplacé par une régénération, donc soumis à la même frontière
que le cœur.

## Conséquences

### Acquis

* **Les sept starters ne livrent rien dans la zone métier.** L'invariant se dit
  désormais sans exception : ce qui est dans `features/` ou `modules/` vient
  d'une capability ou de l'utilisateur.
* La parité web est rétablie : Angular n'a jamais livré de features de
  démonstration, Next.js n'en livre plus.
* Le sujet Health n'est plus coupé en deux par la frontière.
* FF5e couvre tout ce qu'une régénération remplace.

### Assumé

* **Sept fichiers du starter Next.js changent de chemin**, plus la page de
  statut, six tests, le test de frontière navigateur de l'overlay
  Authentication et quatre documents. Un déplacement reste un déplacement.
* `states-showcase.tsx` — la galerie des états partagés — part au cœur avec
  `foundation-status` plutôt que dans `shared/`, faute d'être autre chose que
  la démonstration de la page de statut.

### Non revendiqué

* **Rien ne garantit qu'un utilisateur ne créera pas de page important le
  cœur**, ce qui est le sens autorisé de la dépendance ; l'inverse, une page
  utilisateur important une autre page utilisateur, sort du périmètre de la
  Factory.
* La règle lit les racines de routage **des starters**. Une capability qui
  écrirait une page important la *zone métier d'une autre capability* ne serait
  pas vue. Aucun overlay ne le fait aujourd'hui ; rien ne l'empêche.
* **La régénération n'existe toujours pas.** Cette ADR ne lève plus d'obstacle,
  elle referme la dernière zone non mesurée.

## Alternatives écartées

* **Nommer une troisième catégorie**, comme ADR-081 le supposait. Il aurait
  fallu inventer une règle pour une zone dont la seule violation était un
  mauvais rangement. On aurait légitimé le défaut au lieu de le corriger.
* **Laisser `foundation-status` et `health` dans `features/` et exempter la page
  de statut.** L'exemption aurait porté sur le seul fichier qui violait la
  règle : la définition d'un angle mort.
* **Inliner les diagnostics dans la page**, comme React Native. Cela aurait
  supprimé l'import mais aussi six tests unitaires qui portent sur des
  composants réellement séparés.

## Tests

```bash
npm run factory:test                      # 503
node factory/quality/scripts/fitness-functions.mjs
node factory/quality/scripts/golden-runtime.mjs nestjs-next-base
node factory/quality/scripts/golden-runtime.mjs nest-next-auth
```

* **Épreuve sur le dépôt réel** : réintroduire les cinq imports dans la page de
  statut produit **cinq violations** ; le correctif les supprime.
* **Non-vacuité étendue** : un test échoue si rien n'est lu sous une racine de
  routage déclarée — la moitié la plus récente de la règle est aussi celle qu'un
  refactor distrait laisserait tomber en silence.
* La règle mord sur les deux racines de routage, Next.js et Expo.
* Goldens Next.js verts, baseline et composé avec Authentication — ce dernier
  exerce le test de frontière navigateur dont trois chemins ont changé.

## Rollback

Révoquer le commit rend les deux paquets à `src/features/` et retire la clé
`routes` de la carte des zones.
