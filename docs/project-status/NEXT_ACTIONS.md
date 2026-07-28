# Prochaine action

## Mission achevée

`reconciliation` et `quota` sont portées sur Spring. **L'écart de parité API de
`files` est refermé** : les trois capabilities livrées sont conformes.

```text
auth   api  nestjs 4/4 · spring 4/4   web nextjs 4/4   mobile rn 4/4    CONFORMANT
rbac   api  nestjs 4/4 · spring 4/4   web nextjs 2/4                    CONFORMANT
files  api  nestjs 7/7 · spring 7/7   web nextjs 5/7   mobile rn 1/7    CONFORMANT
3/3 capabilities CONFORMANT
```

Preuves :

- **quota** tenu sous uploads concurrents : réservation du créneau avant l'écriture
  de l'objet, sous verrou consultatif par propriétaire, dans une transaction courte ;
- les fichiers rejetés et supprimés cessent de consommer le quota ; le refus
  n'expose ni le seuil ni l'usage courant ;
- **réconciliation** sous verrou exclusif non bloquant : une passe concurrente est
  refusée immédiatement, pas mise en file ;
- une ligne supprimée n'est purgée qu'après confirmation de l'absence de son objet ;
  si l'objet est encore là, la ligne est **conservée** et l'incohérence signalée ;
- audit métier sur le dépassement de quota, la purge et les décisions de maintenance ;
- 139/139 tests Spring sur PostgreSQL réel.

## Deux défauts trouvés par le test de concurrence

**Épuisement du pool de connexions.** `reserveSlot` en `REQUIRES_NEW` appelé depuis
un `upload` déjà transactionnel consommait deux connexions par requête : dix uploads
concurrents interbloquaient l'API. Corrigé — l'upload ne porte plus de transaction
ambiante (il fait de l'E/S réseau) et chaque étape ouvre sa propre transaction courte.

**Forme de rapport incohérente.** La branche « descripteur manquant » de
l'évaluateur omettait `familyParity` : une target sans preuves masquait aussi son
état de parité. Le rapport a désormais une seule forme et énonce les deux problèmes.

## Limites honnêtes

- la réconciliation Spring purge et signale, mais **ne balaie pas le bucket** à la
  recherche d'objets orphelins comme le fait NestJS : cela demanderait un
  `listObjects` que le port de stockage n'expose pas. L'invariant déclaré est
  satisfait ; l'écart de couverture est réel et assumé ;
- NestJS conditionne en outre la restauration à un checksum connu, que Spring ne
  stocke pas (voir mission précédente) ;
- le test de concurrence du quota s'exécute **sous la taille du pool** de connexions :
  au-delà, l'échec porterait sur la capacité, pas sur l'invariant. La tenue en charge
  d'un verrou par propriétaire reste une question ouverte, non mesurée ;
- aucun statut `PRODUCT_EQUIVALENT` ou `PRODUCTION_READY` ;
- `factory:test` n'est toujours invoqué par aucun workflow CI (dette héritée) ;
- les gates autres que mobiles ne sont pas audités contre ADR-071.

## Prochaine mission unique

> **Faire exécuter `factory:test` par la CI.**

### Justification de l'ordre

C'est désormais la dette la plus coûteuse du dépôt. 452 tests — dont l'évaluateur de
conformité produit lui-même, la règle de parité par famille et la découverte des
contrats — ne sont rejoués par **aucun** workflow. Toute la mesure sur laquelle
reposent ADR-068 à ADR-070 n'est vérifiée qu'en local.

Autrement dit : la CI valide les applications générées, mais pas l'outil qui juge si
elles sont conformes. Une régression de l'évaluateur passerait inaperçue et rendrait
silencieusement fausses toutes les affirmations de conformité.

Cette mission est petite et referme un angle mort structurel. Elle doit précéder
toute nouvelle capability.

### Critères de sortie

- `npm run factory:test` exécuté par un workflow sur chaque PR ;
- `factory:capability-conformance` et `factory:baseline-gap` exécutés et bloquants ;
- durée d'exécution mesurée et acceptable ;
- aucun assouplissement des gates existants ;
- aucune nouvelle dépendance.
