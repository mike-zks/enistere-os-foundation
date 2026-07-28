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

## Mission CI achevée dans la foulée

`factory:test`, `factory:capability-conformance` et `factory:baseline-gap` sont
exécutés par la CI sur chaque PR, en étapes bloquantes (~8 s, sans base ni
Docker), avec un gate anti-péremption : les rapports de conformité committés
doivent correspondre aux rapports calculés. Le CLI de `repository-gap` sort
désormais en échec quand un runtime perd sa conformité.

Une revue d'architecture a suivi
([ARCHITECTURE_REVIEW_2026-07-28](../audits/ARCHITECTURE_REVIEW_2026-07-28.md)).
Constat prioritaire : `factory/schema/capability.schema.json` n'est exécuté
nulle part — la validation réelle est `validateCapabilityManifest`, à la main.
Deux sources de vérité pour le même contrat, dont une morte, en violation de la
hiérarchie §5 qui place les « schémas exécutables » au rang 3.

## Mission schéma achevée

`capability.schema.json` est désormais **normatif et exécuté**
([ADR-072](../adr/ADR-072-normative-capability-schema.md)) : compilé par Ajv,
appliqué à toute validation de manifest, et source des énumérations du moteur
(statuts, primitives, modes de déploiement) au lieu qu'elles soient redéclarées.

`capabilities.mjs` passe de 596 à 356 lignes ; le code ne garde que les règles
inexprimables en JSON Schema — les références croisées entre parties d'un même
document. Une lacune du schéma (motif des noms de clés `configuration`) a été
comblée plutôt que conservée en code : la couverture a été vérifiée cas par cas
avant suppression.

Non revendiqué : les quatre autres schémas du dépôt (`blueprint`, `overlay`,
`conformance-report`, `platform-baseline-contract`) n'ont pas été audités pour
cette propriété — le même défaut peut s'y trouver.

## Mission secret scanning achevée

Un scan de secrets bloquant s'exécute sur chaque PR
([ADR-073](../adr/ADR-073-secret-scanning.md)) : historique complet (352 commits),
binaire épinglé et vérifié par SHA-256 plutôt qu'une action tierce, détections
censurées dans les journaux, et exceptions justifiées — jamais de désactivation.

Quatre détections dans l'historique, toutes des fixtures de tests de censure :
un test de censure doit contenir une chaîne ressemblant à un secret, sinon il ne
teste rien. Aucun secret réel dans le dépôt.

Vérifié par canari dans les deux sens : jeton factice → CI bloquée et valeur
`REDACTED` au rapport ; historique réel → passe.

## Recommandations de la revue finalisées

Les cinq premières recommandations de la revue du 2026-07-28 sont traitées
(D1 et secret scanning par ADR-072/073, puis en une PR) :

- **audits périmés clos** — chaque analyse supersédée porte un bandeau daté
  disant ce qui a changé ; le README distingue les analyses closes de l'audit
  courant. Correction en passant : les rapports d'exécution de `deployment/docs/`
  ne sont **pas** retirés comme la revue le recommandait — ils sont référencés
  par la checklist de release et le runbook. Ce sont des preuves citées par un
  processus actif, pas des visions concurrentes ; datés, gardés ;
- **`FileQuarantineService` extrait** — la séparation suit l'autorité, pas la
  taille : les opérations propriétaire sont autorisées par la possession, la
  quarantaine par une permission **sans** possession ;
- **appels au stockage bornés** — timeouts explicites (connect/write/read) : sans
  eux, un stockage lent immobilisait le thread de requête et un incident de
  stockage devenait une panne d'API. `objectExists` distingue désormais un objet
  absent d'un stockage en panne ;
- **marqueurs orphelins détectés** — un test parcourt chaque preuve déclarée et
  signale celles dont le marqueur ne correspond plus à sa source.

## Reste ouvert de la revue

- **D3 — codes d'erreur générés** depuis la source neutre : relève de la phase 11
  (Polyglot Contracts), plus large qu'une mission.
- **Audit d'hermétisme des gates non mobiles** contre ADR-071.
- **§12 largement documentaire** : SAST, SBOM, signatures, provenance, licence
  scanning, threat modeling. Le secret scanning a fermé **un** point.
- **Profondeur de preuve non bornée** entre runtimes d'une même famille : Flutter
  tient 25 invariants avec 2 fichiers de test, React Native avec 95. Licite
  aujourd'hui, friction garantie le jour où une capability visera Flutter.
- **CLI** : ni mode interactif ni sortie `--json`, flags inconnus silencieux
  (§14 partiellement couvert).

## Décision prise : la parité couvre tous les runtimes

ADR-070 ne mesurait la parité qu'entre targets `ready` ; un runtime s'exonérait
donc en déclarant `unsupported`. C'est exactement ce que faisait FastAPI :
conforme au baseline (28/28), annoncé comme runtime API, et ne portant rien.

[ADR-074](../adr/ADR-074-family-parity-covers-every-runtime.md) étend la règle à
**tous** les runtimes d'une famille servie. La barre reste la couverture des
pairs, pas le périmètre total — `files/flutter` ne doit qu'`upload` parce que
React Native ne tient qu'`upload` ; `rbac/flutter` ne doit rien parce qu'aucun
mobile n'implémente RBAC.

**Les trois capabilities passent `NON_CONFORMANT`.** Premier verdict honnête,
pas régression : toutes les preuves des targets `ready` passent. Ce qui change,
c'est que la mesure cesse d'ignorer les absents.

Huit écarts sont déclarés, justifiés et datés au 2026-12-31 dans
`factory/quality/parity-gaps.json`. Le gate tolère un écart déclaré et non
expiré ; il échoue sur un écart non déclaré, plus large que déclaré, expiré, ou
sur toute preuve manquante — vérifié par canari dans les deux sens.

## Prochaine mission unique

> **Porter Authentication sur Angular**, première fermeture d'écart de parité.

### Justification de l'ordre

Trois écarts sont ouverts ; Angular est celui dont le risque est le plus faible
et la référence la plus proche :

- **Angular avant Flutter** : Angular compte 73 fichiers de test pour 38 sources
  — le starter pratique déjà la preuve. Flutter tient ses 25 invariants de
  baseline avec **2 fichiers de test** là où React Native en a 95 ; lui imposer
  la parité d'abord reviendrait à découvrir en même temps la capability et une
  culture de test absente.
- **Angular avant FastAPI** : Next.js sert de référence directe dans la même
  famille Web, avec un contrat produit déjà écrit et six invariants client
  applicables. Côté API, la référence est double (NestJS et Spring à 4/4) et le
  portage inclut la persistance, la cryptographie et l'émission de jetons.
- **Authentication avant RBAC et Files** : le graphe l'impose
  (`auth → rbac → files`).

Fermer d'abord l'écart le mieux outillé donne un modèle de portage réutilisable
pour les deux autres.

### Critères de sortie

- `auth/angular` passe `planned` → `ready` avec les quatre responsabilités ;
- parité Web `OK` : Angular tient ce que Next.js tient ;
- contrat produit Authentication satisfait sur les invariants client
  applicables, preuves vérifiées en Foundation **et** en application
  matérialisée ;
- l'écart `auth/angular` disparaît de `parity-gaps.json` — il est comblé, pas
  reconduit ;
- golden Angular vert avec démarrage prouvé ;
- aucun nouveau runtime, provider ou capability ; aucun dossier `base/`.
