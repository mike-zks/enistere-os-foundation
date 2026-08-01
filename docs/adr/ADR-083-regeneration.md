# ADR-083 — La régénération d'un projet existant

- Statut : Validé et implémenté
- Date : 2026-08-01
- Décideur : Owner Foundation
- Aboutit : ADR-079, ADR-080, ADR-081, ADR-082

## Contexte

Quatre ADR consécutives se terminent par la même phrase : *la régénération
n'existe pas*. Chacune levait un obstacle — le dernier angle mort de placement
(ADR-080), l'invariant d'import du cœur (ADR-081), celui des racines de routage
(ADR-082) — sans jamais livrer la capacité qu'elles préparaient.

## Ce que la mesure a montré avant toute conception

Un projet `nest-next-files` matérialisé contient **1 271 fichiers**. La zone
métier en représente **220, soit 17 %** ; les 1 051 autres appartiennent à la
Factory, dont 565 pour la copie de provenance des capabilities et 172 pour les
paquets partagés.

Et surtout : **`enistere.lock` enregistre un digest par overlay, jamais par
fichier.** La Factory n'avait donc aucun moyen de distinguer son propre travail
de celui accompli depuis la livraison. Les zones disent *où* les choses vont ;
elles ne disent pas *qui* a écrit le fichier qui s'y trouve aujourd'hui.

C'était l'obstacle réel, et aucune des trois ADR précédentes ne l'avait nommé.

## Décision

### 1. La Factory déclare ce qu'elle a écrit

`materializeProject` écrit **`enistere.inventory.json`** : un digest SHA-256 par
fichier produit, trié à plat.

Il est pris **en parcourant la sortie** plutôt qu'en comptabilisant chaque
écriture : un projet est matérialisé dans un répertoire vide, donc ce qui s'y
trouve ensuite est exactement ce que la Factory a produit. Une comptabilité
aurait dû être ajoutée à chaque écrivain, et aurait divergé au premier oubli.

Trois fichiers en sont exclus. `enistere.lock` est réécrit après coup par la
finalisation des dépendances ; l'inventaire ne peut pas contenir son propre
digest ; et **`enistere.yaml` est l'*entrée*** — l'éditer puis régénérer est le
mode d'emploi, une régénération ne doit jamais lire un blueprint modifié comme
un conflit.

Coût : **169 KiB** pour 1 269 entrées, contre 22 KiB pour `enistere.lock`. C'est
un fichier à part, pas une extension du lock — les deux répondent à des questions
différentes : ce qui était prévu, et ce qui est sur le disque.

### 2. La classification est toute la conception

| état | lecture | conséquence |
|---|---|---|
| inventorié, digest identique | à la Factory, intact | remplaçable ou supprimable |
| inventorié, digest différent | modifié par le propriétaire | **conflit** |
| inventorié, absent du disque | supprimé par le propriétaire | **conflit** |
| non inventorié, présent | fichier du propriétaire | **jamais touché** |
| non inventorié, à générer | nouveau | créé |

### 3. Aucun mode n'écrase un conflit

`onConflict: 'abort'` (défaut) **n'écrit rien du tout** dès qu'un conflit
existe : le projet n'est jamais laissé à moitié régénéré. `'keep'` applique
toutes les modifications sûres et laisse les fichiers en conflit exactement en
l'état.

**Il n'existe pas de mode qui détruit du travail.** C'est le seul point de cette
ADR sur lequel il n'y a pas d'arbitrage : une régénération capable d'effacer ce
qu'elle n'a pas écrit serait pire que pas de régénération du tout.

`--dry-run` produit le même rapport sans rien écrire.

### 4. Les répertoires vidés sont supprimés

Abandonner une capability supprimait ses fichiers et laissait `src/modules/auth/`
debout et vide — le projet aurait continué d'en *avoir l'air*. La suppression
remonte tant que le répertoire est vide, et s'arrête au premier qui ne l'est
pas : un répertoire contenant quoi que ce soit du propriétaire survit.

## Conséquences

### Acquis

* Une régénération remplace le cœur, la composition et la provenance d'un projet
  existant, **ajoute ou retire une capability**, et ne touche à rien d'autre.
* Ce qu'elle refuse est aussi explicite que ce qu'elle fait : chaque conflit est
  rapporté avec son chemin et sa raison (`owner-modified`, `owner-deleted`,
  `owner-created`).
* `enistere regenerate <projet> [--dry-run] [--keep-conflicts]`.

### Assumé

* **Les dépendances ne sont pas reverrouillées.** Une régénération qui ajoute une
  capability change `package.json` sans toucher au `package-lock.json` — qui
  n'est pas dans l'inventaire, donc traité comme un fichier du propriétaire.
  `enistere install` reste l'étape suivante, explicitement.
* **Un projet généré avant cette ADR ne peut pas être régénéré.** Sans inventaire,
  la Factory ne peut pas distinguer son travail du vôtre, et refuse plutôt que de
  deviner.
* 169 KiB de fichier généré supplémentaire dans chaque projet.

### Non revendiqué

* **Aucune fusion.** Un fichier du cœur que vous avez modifié reste un conflit ;
  la Factory ne propose ni patch à trois voies ni résolution. Elle dit quoi, et
  s'arrête.
* **Aucune migration de données ni de schéma.** Retirer une capability supprime
  son code, pas ses tables ni ses migrations déjà appliquées.

  *Cette phrase était juste et gravement incomplète. Mesuré depuis
  ([ADR-084](ADR-084-regeneration-across-families.md)) : la régénération
  supprimait aussi les **fichiers** de migration, ce qui laissait un projet
  FastAPI incapable d'exécuter la moindre migration —* `alembic current` *lui-même
  échouait. Une régénération ne retire plus jamais un fichier de migration.*
* Le golden de régénération couvre **une composition** (`nestjs-base →
  nestjs-auth`), pas les vingt-sept.
* La conservation d'un fichier *source* du propriétaire est prouvée par la suite
  unitaire ; le golden, lui, plante une note. Un fichier source planté serait
  jugé par sept linters pour des raisons étrangères à la régénération.

## Alternatives écartées

* **Se fier aux seules zones** : réécrire le cœur, ne jamais écrire la zone
  métier. Beaucoup plus simple, et destructeur en silence — un fichier du cœur
  modifié par le propriétaire disparaissait sans un mot. Le critère de sortie
  demandait l'inverse.
* **Mettre l'inventaire dans `enistere.lock`.** Le lock décrit un plan ;
  l'inventaire décrit un disque. Les mélanger aurait multiplié par huit la taille
  du fichier que l'on lit pour comprendre une composition.
* **Un mode `--force` qui écrase les conflits.** Le seul mode dont personne n'a
  besoin le jour où il en a besoin.

## Tests

```bash
npm run factory:test                      # 513
node factory/quality/scripts/golden-runtime.mjs nestjs-auth --regenerate-from nestjs-base
```

Dix tests, tous sur un projet **modifié par son propriétaire** — sur une copie
vierge, une implémentation qui écrase tout passerait :

* un projet intact reste identique au bit près, et le rapport le dit ;
* un fichier du cœur modifié fait **tout** refuser, et reste tel quel ;
* en mode `keep`, les modifications sûres passent et le conflit reste intact ;
* un fichier créé par le propriétaire est rapporté `preserved`, pas `untouched` ;
* un fichier de la Factory supprimé est rapporté, pas ressuscité ;
* **ajouter Authentication à un projet portant déjà du code du propriétaire** :
  la capability arrive dans la zone métier, la couture de composition est
  réécrite, le module du propriétaire est inchangé, et **une seconde exécution
  ne fait rien** ;
* retirer une capability supprime ce qu'elle avait livré — sauf ce qui a été
  modifié depuis ;
* `--dry-run` n'écrit rien ;
* un projet sans inventaire est refusé.

Le golden va plus loin que la comptabilité de fichiers : il génère
`nestjs-base`, y plante du travail du propriétaire, réécrit le blueprint,
régénère vers `nestjs-auth` — puis fait passer au résultat **les mêmes gates
qu'un projet généré directement** (installation reproductible, lint, tests,
build, audit, conformité).

## Rollback

Révoquer le commit retire `enistere.inventory.json`, la commande `regenerate` et
le drapeau `--regenerate-from` du golden. Les projets déjà générés gardent leur
inventaire, inerte.
