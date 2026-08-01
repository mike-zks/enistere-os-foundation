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

## Prérequis découvert et livré

La mission « porter Authentication sur Angular » a buté sur un fait que personne
n'avait relevé : **l'adapter Angular n'avait aucune couture de composition** —
`integrationKinds: {}`, `composition: []`. Aucune capability ne pouvait cibler
Angular, quelle qu'elle soit. Le statut `planned` sur les trois capabilities ne
traduisait pas un code d'authentification manquant, mais une machinerie absente.

Flutter est dans le même état.

Trois coutures existent désormais — providers, routes, intercepteurs HTTP —
sur le modèle des adapters Next.js et Expo, avec deux règles d'ordre qui comptent :
les intercepteurs de capability s'exécutent **après** ceux de la baseline (un
rejeu d'authentification doit voir une réponse déjà normalisée) et les routes
s'insèrent **avant** le joker (sinon toute route apportée serait redirigée sans
jamais s'ouvrir). Les collisions de route sont refusées.

Vérifié sur une application Angular générée : coutures présentes, typecheck
propre, 108/108 tests.

## Contrat produit corrigé

`AUTH-WEB-001` exigeait un **BFF avec CSRF** — le mécanisme de Next.js inscrit
dans un contrat censé être neutre. Or le CSRF est une menace portée par les
cookies : un SPA statique à jeton porteur en mémoire n'y est pas exposé.
L'invariant énonce désormais la garantie observable, que chaque runtime tient par
son moyen. Contrat en 1.1.0, quatre descripteurs alignés.

## Mission achevée

`auth/angular` est **`ready`** : quatre responsabilités, six invariants, neuf
preuves ([ADR-075](../adr/ADR-075-browser-credential-storage.md)). **L'écart de
parité Web est refermé** — Angular tient exactement ce que Next.js tient.

Le compromis de stockage est tranché et écrit : la créance vit derrière une
couture de la même forme que `SecureStorage` de React Native, et le défaut est la
**mémoire du processus** — seule option navigateur qui ne promet rien qu'elle ne
tienne. `localStorage` est proscrit, et un test le vérifie. Le prix est assumé :
un rechargement complet déconnecte.

Trois défauts trouvés par les tests en cours de route :

- `signOut` s'appuyait sur `AuthApi` pour avaler les erreurs — si le transport
  change, la purge locale n'avait jamais lieu. La garantie vit désormais dans le
  service, là où l'invariant la place ;
- un test **du starter** affirmait « aucune route Auth », vrai pour la baseline
  et faux dès qu'une capability compose : il mesure maintenant ce que la baseline
  possède, et vérifie en plus que les routes apportées précèdent le joker ;
- `spring-angular-auth` a été promu `ready` puis corrigé en **`supported`** : la
  composition est générable, mais aucun golden ne l'exerce et `ready` exige une
  preuve runtime.

127/127 tests sur l'application Angular composée réellement générée.

## Mission achevée — Authentication sur Flutter

`auth/flutter` est **`ready`** : quatre responsabilités, six invariants, neuf
preuves ([ADR-076](../adr/ADR-076-authentication-flutter.md)). **L'écart de
parité Mobile d'Authentication est refermé** — Flutter tient ce que React Native
tient.

```text
auth   api  nestjs 4/4 · spring 4/4 · fastapi 0/4 ✗   web nextjs 4/4 · angular 4/4 ✓
       mobile rn 4/4 · flutter 4/4 ✓
```

Authentication est désormais tenue par **six runtimes sur sept**. Le seul écart
restant est FastAPI, et il concerne les trois capabilities.

### Trois manques en chaîne, chacun invisible tant que le précédent tenait

1. **Aucune couture de composition** — `integrationKinds: {}`, `composition: []`,
   exactement le blocage d'Angular. Trois coutures posées :
   `flutter.provider-override`, `flutter.route`, `flutter.interceptor`.
2. **Aucun gestionnaire de dépendances** — l'adapter retombait sur `npm` et aurait
   écrit un `package.json` dans une application Dart. Fusion `pubspec.yaml`
   ligne à ligne, avec conflit sur contrainte divergente.
3. **L'ordre des intercepteurs était faux** — et silencieusement. `ErrorInterceptor`
   appelle `handler.reject`, ce qui **termine** la chaîne : composés après lui,
   les intercepteurs d'une capability n'auraient jamais vu un 401 et le rejeu
   unique n'aurait jamais eu lieu. Ils se composent maintenant *devant* le mapping
   terminal, et un test verrouille cet ordre.

### Défauts trouvés par la vérification réelle

- `Override` n'est pas exporté par l'entrée principale de Riverpod 3 mais par
  `misc.dart` : **la couture posée au prérequis ne compilait pas**. Aucun gate ne
  l'avait vu parce qu'aucun `flutter analyze` n'avait tourné sur un starter modifié.
- Les fichiers générés n'étaient pas stables sous `dart format`, qui est un gate
  du golden. Répliquer l'algorithme du formateur serait fragile : les fichiers
  générés portent désormais `// dart format off` — leur mise en forme appartient
  au renderer, et le gate continue de couvrir tout fichier écrit à la main.
- Les coutures vides étaient `const`, ce qui rendait `ProviderScope` const-ifiable
  dans la baseline mais pas dans une application composée : le lint passait dans
  un état et échouait dans l'autre. Elles sont `final` dans les deux.
- `capabilities/auth/targets/angular/conformance.json` désignait le golden
  `nestjs-angular-auth`, **absent de `COMPOSITIONS`** : la preuve matérialisée
  d'Angular ne s'exécutait nulle part. Les compositions `nestjs-angular-auth` et
  `nestjs-flutter-auth` sont créées et ajoutées à la matrice CI.
- Ce golden, dès sa première exécution, a montré que **l'application Angular
  composée ne compilait pas** : `AUTH_PROVIDERS` était un tableau `readonly`, non
  assignable là où le fichier de composition attend *un* provider. Les 127 tests
  Karma passaient — seul `ng build` compile `app.config.ts`. Le portage Angular
  avait donc été fusionné avec une composition qui ne construit pas. Corrigé par
  `makeEnvironmentProviders`, et verrouillé par un test.

### Spring : la mesure d'abord fausse, puis la migration

Mon premier inventaire annonçait neuf violations. **Il était incomplet** : j'avais
omis `infrastructure/` de la zone cœur. L'y ajouter en a révélé cinq de plus.
*Une règle ne mesure que ce qu'on lui donne à mesurer.*

Quatorze destinations, réparties selon le critère : les neuf `@Configuration`, la
chaîne de sécurité JWT et les limiteurs par capability passent sous `modules/` ;
`infrastructure/storage` reste au cœur — `StorageService` est un port neutre.

**Java rend le déplacement plus intrusif qu'ailleurs** : chaque fichier change de
`package`, et une classe qui était voisine cesse de l'être. Le compilateur a
trouvé trois vagues d'imports manquants que rien d'autre n'aurait signalées
(`RateLimiter`, `CorsConfig`, `GlobalExceptionHandler`), plus deux `importPath`
d'intégration encore pointés sur `core.config`. Seule migration où compiler était
indispensable, pas seulement prudent.

### Preuves

- 482/482 tests Foundation ;
- application Flutter composée réellement générée : `flutter analyze` propre,
  `dart format` stable, **26/26 tests** ;
- baseline non composée revérifiée : propre, stable, **9/9** ;
- `auth/flutter` **CONFORMANT**, parité Mobile `OK`, écart retiré de
  `parity-gaps.json`.

### Non revendiqué

- La liaison keystore n'est pas exercée par un test : `flutter_secure_storage`
  passe par des canaux de plateforme hors d'atteinte d'un test unitaire. Ce qui
  est prouvé, c'est que la capability **ne parle qu'à la couture**.
- Aucun golden runtime n'a été exécuté localement de bout en bout (il exige
  PostgreSQL, l'API NestJS et un build APK) ; les gates Flutter, eux, l'ont été.

## Mission achevée — Authentication sur FastAPI

`auth/fastapi` est **`ready`** : quatre responsabilités, huit invariants, onze
preuves ([ADR-077](../adr/ADR-077-authentication-fastapi.md)).

```text
auth   api  nestjs 4/4 · spring 4/4 · fastapi 4/4 ✓   web nextjs 4/4 · angular 4/4 ✓
       mobile rn 4/4 · flutter 4/4 ✓                     CONFORMANT
```

**Authentication est la première capability CONFORMANT comme produit** : les sept
runtimes la tiennent, les trois familles sont à parité.

Angular et Flutter étaient des clients ; FastAPI devait *être* l'autorité :
persistance, Argon2id, émission et rotation de jetons, détection de rejeu,
limitation de débit, audit métier, migrations.

### Trois défauts trouvés par la vérification réelle

Aucun n'aurait été vu sans exécuter l'application générée contre un PostgreSQL
réel.

- **La révocation de la famille était annulée par le rollback qui la motivait.**
  À la détection d'un rejeu, le confinement s'exécutait dans la transaction sur
  le point d'être annulée par l'erreur : la famille survivait au vol qui venait
  d'être détecté. Elle committe désormais dans sa propre transaction.
- **Le chemin de rejeu n'était jamais atteint** : un jeton révoqué était classé
  « inutilisable » avant d'être reconnu comme rejeu. Inconnu, expiré et révoqué
  sont maintenant trois cas distincts.
- **`EmailStr` refusait des adresses que NestJS et Spring acceptent** (`.test`,
  `.internal` — TLD à usage réservé). Un utilisateur aurait pu s'inscrire contre
  une autorité et être refusé par une autre. La validation est syntaxique, comme
  chez les deux autres, et la dépendance disparaît avec le problème.

### Deux prérequis d'outillage

- **Handler d'erreur composé, pas enregistré au démarrage.** Starlette construit
  sa pile d'exceptions *avant* l'événement de démarrage : un handler ajouté depuis
  un `lifespan` ne serait jamais consulté et un refus d'identifiants répondrait
  **500** — le défaut déjà rencontré sur Spring, ici évité par construction.
- **Cycle d'imports** : `app.platform` importait la couture, qui importe la
  capability, qui importe `app.platform`. Une couture se consomme au démarrage,
  pas à l'import.

### Spring : la mesure d'abord fausse, puis la migration

Mon premier inventaire annonçait neuf violations. **Il était incomplet** : j'avais
omis `infrastructure/` de la zone cœur. L'y ajouter en a révélé cinq de plus.
*Une règle ne mesure que ce qu'on lui donne à mesurer.*

Quatorze destinations, réparties selon le critère : les neuf `@Configuration`, la
chaîne de sécurité JWT et les limiteurs par capability passent sous `modules/` ;
`infrastructure/storage` reste au cœur — `StorageService` est un port neutre.

**Java rend le déplacement plus intrusif qu'ailleurs** : chaque fichier change de
`package`, et une classe qui était voisine cesse de l'être. Le compilateur a
trouvé trois vagues d'imports manquants que rien d'autre n'aurait signalées
(`RateLimiter`, `CorsConfig`, `GlobalExceptionHandler`), plus deux `importPath`
d'intégration encore pointés sur `core.config`. Seule migration où compiler était
indispensable, pas seulement prudent.

### Preuves

- 493/493 tests Foundation ; `auth` **CONFORMANT** sur les sept runtimes ;
- application FastAPI composée réellement générée : `ruff` propre, **32/32
  pytest** contre un PostgreSQL réel, `compileall` et `pip check` verts ;
- migration Alembic appliquée sur une base vide, puis autorité exercée **sur ce
  schéma migré** : connexion, `/me`, rotation, rejeu détecté, famille révoquée,
  audit persisté ;
- l'écart `auth/fastapi` est retiré de `parity-gaps.json` (5 restants).

### Non revendiqué

- La limitation de débit reste **en mémoire**, comme celle du baseline : elle
  prouve le mécanisme sur une instance, pas sur un déploiement multi-processus.
- La rotation n'est pas prouvée sous concurrence réelle ; la garantie repose sur
  un `UPDATE … WHERE revoked_at IS NULL` conditionnel et le test couvre le rejeu
  séquentiel.
- Aucune preuve de démarrage headless pour `fastapi-auth`.

## Mission achevée — RBAC sur FastAPI

`rbac/fastapi` est **`ready`** : quatre responsabilités, six invariants, dix
preuves ([ADR-078](../adr/ADR-078-authorization-fastapi.md)). **La parité API est
refermée sur RBAC** — les trois autorités tiennent 4/4.

Le portage lui-même n'a rien révélé. **La composition à deux capabilities, si.**

### Le défaut que seule la composition pouvait montrer

Auth et RBAC exportent tous deux `router`. Le renderer FastAPI importait sans
alias :

```python
from app.auth import router
from app.authorization import router   # écrase le premier
CAPABILITY_ROUTERS = (router, router)  # le même, deux fois
```

L'application aurait enregistré RBAC deux fois et **perdu entièrement les routes
d'authentification** — sans erreur à l'import, au démarrage ni au lint. Le seul
symptôme aurait été un 404 sur `/api/v1/auth/login` dans un projet livré.

Angular et Flutter y échappaient **par chance**, leurs symboles étant distincts.
Les trois renderers Python aliasent désormais et lèvent sur collision résiduelle.

### Deux défauts de test, révélés de la même façon

- le test de migration d'Authentication supposait posséder tout le schéma et
  échouait dès qu'une seconde capability contribuait des tables ; il parcourt
  maintenant toutes les révisions ;
- le harnais RBAC recréait une permission existante, alors que deux rôles
  accordant le même code est le cas ordinaire que le résumé doit dédupliquer.

### Deux gates dus depuis la semaine dernière

- le `golden` d'un descripteur de conformance doit exister dans `COMPOSITIONS` ;
- toute composition de `COMPOSITIONS` doit figurer dans la matrice CI.

C'est par ce trou que `nestjs-angular-auth` avait pu être nommé sans exister,
laissant passer une composition Angular qui ne compilait pas.

### Spring : la mesure d'abord fausse, puis la migration

Mon premier inventaire annonçait neuf violations. **Il était incomplet** : j'avais
omis `infrastructure/` de la zone cœur. L'y ajouter en a révélé cinq de plus.
*Une règle ne mesure que ce qu'on lui donne à mesurer.*

Quatorze destinations, réparties selon le critère : les neuf `@Configuration`, la
chaîne de sécurité JWT et les limiteurs par capability passent sous `modules/` ;
`infrastructure/storage` reste au cœur — `StorageService` est un port neutre.

**Java rend le déplacement plus intrusif qu'ailleurs** : chaque fichier change de
`package`, et une classe qui était voisine cesse de l'être. Le compilateur a
trouvé trois vagues d'imports manquants que rien d'autre n'aurait signalées
(`RateLimiter`, `CorsConfig`, `GlobalExceptionHandler`), plus deux `importPath`
d'intégration encore pointés sur `core.config`. Seule migration où compiler était
indispensable, pas seulement prudent.

### Preuves

- 497/497 tests Foundation ; `rbac/fastapi` **CONFORMANT**, parité API `OK` ;
- application composée : `ruff` propre, **40/40 pytest** sur PostgreSQL réel,
  `compileall` et `pip check` verts ;
- deux révisions Alembic enchaînées sur base vide (8 tables), puis autorisation
  exercée **sur ce schéma migré** : résumé vide, refus 403, octroi, puis **200
  avec le même jeton d'accès**, déni enregistré avec l'habilitation manquante ;
- l'écart `rbac/fastapi` est retiré de `parity-gaps.json` (4 restants).

### Non revendiqué

- **Aucune API d'administration des rôles** : créer, accorder, révoquer se fait
  hors de la capability, comme sur les deux autres autorités.
- Une lecture en base par requête gardée, sans cache — un cache rouvrirait une
  fenêtre pendant laquelle une révocation n'a pas pris effet.
- La décision n'est pas prouvée sous concurrence ; aucun démarrage headless.

## Mission achevée — zones et coutures sur les sept runtimes

[ADR-079](../adr/ADR-079-capability-zones.md) fixe trois zones et la règle qui
les départage : **la zone dépend de la nature du code, pas de qui le livre**, et
son corollaire opérant — *le cœur ne doit jamais savoir qu'une capability
existe*.

Le nom suit la famille : **API → `modules/`**, **Web et Mobile → `features/`**.

### Fait

- **Next.js : les trois capabilities ont quitté la zone cœur.** Les sept
  violations déclarées sont refermées, `layout-gaps.json` est vide.
- Le cas des clés de requête est tranché : `auth-keys.ts`, `file-keys.ts`,
  `authorization-keys.ts` sont du métier ; le cœur garde l'infrastructure de
  cache et `health-keys.ts`.

### Deux couplages cachés que seul le déplacement pouvait montrer

- **`tsconfig.test.json` excluait `src/core/auth/server`** — des modules liant
  `next/headers`, invérifiables sous `node:test`. Le code déplacé, l'exclusion
  ne portait plus et la suite compilait du code Next-only.
- **Des tests de frontière énuméraient des chemins en dur** : ils vérifiaient
  qu'aucun module client n'importe un module serveur en listant `core/auth/...`
  littéralement, et passaient donc **par vacuité** sur des fichiers devenus
  introuvables. Un test de frontière qui ne trouve plus sa frontière ne la
  vérifie plus.

### NestJS aussi

Sept répertoires métier — `auth`, `users`, `files`, `authorization`, `roles`,
`permissions`, `rbac` — vivaient à plat, mêlés à `platform`, `common`,
`database`. Ils sont sous `src/modules/`. Trois fichiers de Files logeaient dans
le cœur (`config/files.configuration.ts`, `common/errors/files-error-codes.ts`,
`audit/files-audit-events.ts`) : même critère, ils ont suivi leur domaine.

**NestJS n'a pas de `core/` unique** : sa zone cœur est l'ensemble des
répertoires que le starter possède, et FF5d les énumère plutôt que d'inventer un
répertoire que le framework n'a jamais eu.

### Ce que la règle a révélé sur Spring

En étendant FF5d à Spring — que j'avais qualifié de « net » parce qu'il avait
déjà `modules/` — la mesure a montré **neuf violations** : toutes ses classes
`@Configuration` de capability siègent dans `core/config/`. Avoir une zone métier
ne prouve pas qu'on l'utilise partout. Les neuf sont déclarés et datés ; **Spring
devient une migration non prévue**.

### FastAPI : le cas qui met le critère à l'épreuve

`app/auth` et `app/authorization` passent sous `app/modules/`, mais
**`app/persistence` reste dans le cœur** bien qu'apporté par Authentication.
C'est « la nature, pas le livreur » appliqué au cas qui le teste.

Cela expose une limite : FF5d vérifie qu'aucun overlay n'écrit dans le cœur, et
ne sait pas dire *« une capability contribue légitimement de l'infrastructure de
cœur »*. La zone mesurée pour FastAPI est donc celle que **le starter possède**.
Le vrai correctif n'est pas d'assouplir la règle mais de faire porter la
persistance par le baseline — l'asymétrie qu'ADR-077 déclarait déjà assumée.

### Un défaut antérieur mis au jour

`migrations/env.py` **énumère en dur** les modules de modèles à importer pour
l'autogénération Alembic, et ne voit pas ceux de RBAC. Sans effet aujourd'hui —
les révisions sont écrites à la main — mais un `alembic revision --autogenerate`
proposerait de **supprimer les tables RBAC**. Le correctif propre est une couture
de composition pour les modules de modèles, pas un import en dur de plus : auth
ne doit pas dépendre de rbac, la dépendance allant dans l'autre sens.

### React Native : le runtime qui demande le plus de jugement

Son overlay Auth contribue **beaucoup d'infrastructure** en plus du métier. La
répartition retenue :

- **métier**, sous `src/features/` — `auth`, `upload`, le pont 401
  (`with-auth-retry`), le magasin de session et ses clés, les hooks
  `useAuthedQuery`/`useAuthedMutation`, et `navigation/` dont
  `resolveAuthRedirect` prend un `AuthStatus` ;
- **cœur**, laissé en place — le port `SecureStorage` et ses adaptateurs, la
  fondation de formulaires, le client de requêtes : ils ne nomment aucun domaine.

**Un défaut d'une autre nature** est apparu : React Native compose en
**écrasant des barils du cœur** (`overwrite: true`) plutôt que par une couture.
`src/api/index.ts` importe la capability pour câbler l'adaptateur de session ;
`src/query/index.ts` ré-expose les hooks authentifiés. Les déplacer ne
corrigerait rien — ils doivent rester au cœur. Le correctif est une couture, comme
les six autres runtimes en ont une. Trois écarts déclarés et datés.

**La mesure elle-même avait un trou** : `startsWith('src/api/')` laissait passer
une entrée écrivant `src/api` **en entier**. Remplacer le répertoire est la
brèche la plus large, pas une exemption.

### Spring : la mesure d'abord fausse, puis la migration

Mon premier inventaire annonçait neuf violations. **Il était incomplet** : j'avais
omis `infrastructure/` de la zone cœur. L'y ajouter en a révélé cinq de plus.
*Une règle ne mesure que ce qu'on lui donne à mesurer.*

Quatorze destinations, réparties selon le critère : les neuf `@Configuration`, la
chaîne de sécurité JWT et les limiteurs par capability passent sous `modules/` ;
`infrastructure/storage` reste au cœur — `StorageService` est un port neutre.

**Java rend le déplacement plus intrusif qu'ailleurs** : chaque fichier change de
`package`, et une classe qui était voisine cesse de l'être. Le compilateur a
trouvé trois vagues d'imports manquants que rien d'autre n'aurait signalées
(`RateLimiter`, `CorsConfig`, `GlobalExceptionHandler`), plus deux `importPath`
d'intégration encore pointés sur `core.config`. Seule migration où compiler était
indispensable, pas seulement prudent.

### Preuves

- 497/497 tests Foundation, aucune dérive de conformance ;
- application Next.js composée (trois capabilities) : `lint` propre, `typecheck`
  propre, **457/457 tests**, `next build` réussi ;
- application NestJS composée (trois capabilities) : `lint` et `build` verts,
  **387 tests sur 52 suites** ;
- application FastAPI composée (deux capabilities) : `ruff` propre, **40/40
  pytest** sur PostgreSQL réel, `compileall` et `pip check` verts, deux révisions
  Alembic appliquées sur base vide (8 tables) ;
- application React Native composée (composition triple) : `typecheck` et `lint`
  verts, **362/362 tests** ;
- application Spring composée (trois capabilities) : `mvn verify` réussi,
  **139 tests**, Testcontainers compris.

### Les écrasements React Native sont supprimés

Trois fichiers du cœur étaient remplacés par l'overlay Auth. Ils demandaient
**trois traitements différents** — c'est ce qui rendait le diagnostic
« écrasement » insuffisant à lui seul :

- `src/api/index.ts` **n'appartenait pas au cœur** : c'est le client assemblé
  avec la session d'Auth. Il rejoint `features/auth/api-client.ts` — aucune
  couture, seulement un placement juste ;
- `query-client.ts` portait une vraie extension, « ne jamais réessayer un 401 ».
  D'où la couture **`expo.query-retry-guard`** : la politique de réessai reste au
  socle, la capability n'y ajoute qu'une exception ;
- `src/query/index.ts` ne faisait que **ré-exporter** les hooks authentifiés.
  Confort, pas contrat : supprimé sans couture, les consommateurs important
  depuis la feature qui les possède.

Une garde se formule en « arrêter le réessai », jamais en « continuer » : une
garde qui se tromperait de sens échouerait du côté sûr — un réessai de moins,
jamais une boucle.

**Les sept runtimes composent désormais par coutures.**

### Le stockage : une déclaration que j'avais mal qualifiée

J'avais déclaré `infrastructure/storage` sur Spring comme une **contribution de
cœur légitime**, à corriger en faisant porter le port par le baseline.

**NestJS a démenti cette analyse.** Son overlay Files place tout son stockage —
port, adaptateur S3, adaptateur mémoire — dans `modules/files/storage/`, sans
rien écrire dans le cœur. Le port n'est donc pas une chose que le baseline doit
porter : c'est une chose que la capability possède, et **Spring était simplement
incohérent avec son pair de famille**.

Le correctif n'était pas d'enrichir le baseline mais de déplacer. Ce que le
critère « la nature, pas le livreur » ne tranchait pas seul, la **parité de
famille** le tranchait : l'un des deux runtimes avait déjà répondu.

`layout-gaps.json` est **vide**.

Le cas FastAPI reste distinct : `app/persistence` est une infrastructure
**partagée** par plusieurs capabilities, pas un port possédé par une seule. Le
confondre avec le stockage aurait produit un mauvais correctif.

## Mission achevée — le baseline FastAPI porte la persistance

[ADR-080](../adr/ADR-080-baseline-owns-persistence.md). C'était le dernier cas
ouvert de la refonte, et le seul angle mort de mesure du dépôt.

### Ce que les faits disaient

NestJS embarque Prisma dans son baseline, Spring embarque JPA et Flyway. FastAPI
n'avait que des `Protocol`, et son starter écrivait deux fois qu'aucun provider
ne devait être imposé — en renvoyant à une « primitive persistence » qui **n'existe
pas** : la Factory modélise les primitives comme des *besoins* déclarés par une
capability, jamais comme des fournisseurs.

**La parité de famille a tranché pour la troisième fois** dans ce chantier, après
le placement des capabilities et le port de stockage de Spring.

### Ce qui bouge, et ce qui ne bouge pas

`app/persistence/`, l'outillage Alembic et la table `audit_logs` — devenue la
révision `0001_baseline` — passent au starter ; les capabilities se rebasent en
`0002_auth` et `0003_rbac`.

**L'activation reste composée** : le baseline possède le code, le hook
`persistence_lifespan` n'est branché que par la couture `fastapi.lifespan`. Une
application de base **n'ouvre jamais de pool**. C'est ce qui distingue cette
décision d'un simple ajout de dépendance.

### Le coût, énoncé

`fastapi-base` installe SQLAlchemy, asyncpg et Alembic sans les utiliser : le
lock de développement passe de 48 à 54 lignes, celui de production de 16 à 22.
NestJS et Spring paient déjà le même prix.

La position écrite du starter est **révisée**, pas contournée : les deux README
sont corrigés. Une décision qu'on contredit sans réécrire est une décision qu'on
trahit.

### Preuves

- **`fastapi-base`** : `ruff` propre, **12/12 pytest**, `compileall` vert, et
  l'application **démarre sans base de données** — `/health/ready` répond 200,
  aucun hook de persistance composé ;
- **`fastapi-rbac`** : `ruff` propre, **40/40 pytest** sur PostgreSQL réel, les
  trois révisions enchaînées `0001_baseline → 0002_auth → 0003_rbac` ;
- **FF5d : zéro violation sur les sept runtimes**, sans zone exclue de la mesure ;
  `layout-gaps.json` est vide ;
- 500/500 tests Foundation.

### Non revendiqué

- **La primitive fournisseuse n'existe toujours pas.** L'ADR choisit le baseline
  *faute* de ce mécanisme, pas contre lui ; si la Factory l'acquiert, la décision
  devra être rouverte.
- `migrations/env.py` énumère toujours en dur les modules de modèles.
- **La régénération n'existe pas.** Cette mission lève le dernier obstacle
  structurel connu, elle ne la livre pas.

## Mission achevée — le cœur ne dépend pas de la zone métier

[ADR-081](../adr/ADR-081-core-business-independence.md) pose **FF5e**, l'invariant
complémentaire qu'ADR-079 avait explicitement laissé de côté : la frontière était
tenue en écriture, jamais en dépendance.

### Ce que protège la règle

La zone métier est celle que la régénération ne touche jamais : ce qui s'y trouve
appartient à qui a reçu le projet. Un fichier du cœur qui l'importe dépend donc
de code que la Factory ne livre pas et ne maintient pas.

### Une seule violation, et c'était un rangement

Sur **313 fichiers de cœur et 877 imports**, une seule : le routeur Flutter
importait `lib/src/features/home/home_screen.dart`.

**La parité de famille a tranché, pour la cinquième fois.** React Native place son
écran d'accueil dans `app/index.tsx` — surface neutre du socle, sans contenu
métier — et ne livre rien dans `src/features/`. L'écran Flutter était le même
objet, simplement mal rangé : il passe dans `lib/src/core/navigation/`, et
`lib/src/features/` du starter est désormais vide comme chez ses pairs.

En chemin, `lib/src/app/router.dart` s'est révélé être un fichier mort ne
contenant qu'un commentaire de déménagement.

### Une seule carte des zones

FF5d et FF5e lisent la même constante. L'écrire une fois a montré qu'elle était
incomplète — `lib/src/theme/`, `src/shared/`, `src/types/`, `src/app/pages/` et
les modules racines n'étaient mesurés par personne. FF5d ne gagne aucune
violation, elle gagne de la portée.

L'exemption de couture est **lue dans le registre d'adaptateurs**, pas recopiée :
elle ne peut pas diverger de ce que la Factory génère.

### Preuves

- la règle mord **dans les deux sens et par langage** : violations forgées en
  TypeScript, Dart, Python, Java et via alias `@/` détectées ; l'import inverse
  reste muet ; la couture reste exemptée ;
- **non-vacuité gardée par un test** : échec si la règle lit moins de six
  fichiers de cœur par runtime ou moins de 500 imports — le mode de panne qui
  avait laissé passer un golden fantôme ;
- **épreuve sur le dépôt réel** : réintroduire l'import fait échouer la gate, le
  correctif la fait passer ;
- **sur applications composées** : cœur matérialisé de `nestjs-flutter-auth`,
  `triple-files`, `spring-files`, `fastapi-rbac` et `nestjs-angular-auth` généré
  puis relu — **427 fichiers de cœur composés, zéro violation**, sept runtimes ;
- 502/502 tests Foundation ; goldens Flutter verts, `analyze`, `test` et
  `build apk` compris.

### Non revendiqué

- **Les racines de routage ne sont pas mesurées** : `src/app/` sur Next.js,
  `app/` sur Expo sont des surfaces partagées, les capabilities y écrivent. Or
  `src/app/(public)/status/page.tsx` importe bien des features livrées par le
  starter — même danger, zone différente.
- **Parité web inégale** : Next.js livre des features de démonstration, Angular
  n'en livre aucune.
- Aucun mécanisme de dérogation datée pour FF5e : l'unique violation est
  corrigée, et une machinerie que rien n'utilise est du code mort.
- **La régénération n'existe toujours pas.** Cette mission referme le dernier
  invariant qui lui manquait.

## Mission achevée — les racines de routage sous la même frontière

[ADR-082](../adr/ADR-082-routing-root-import-frontier.md) referme la dernière
zone que FF5e ne mesurait pas — et **corrige le diagnostic qu'ADR-081 avait posé
la veille**.

### Le diagnostic était faux, la mesure l'a montré

ADR-081 annonçait « une troisième catégorie à nommer ». Il n'y en avait pas.

**Une seule racine de routage sur sept importait la zone métier** : Next.js,
depuis une unique page, cinq imports. La racine Expo est propre. Et ce qu'elle
importait n'était pas du métier :

- `foundation-status` s'annonce lui-même « page technique de la baseline
  Next.js » — le jumeau du `FOUNDATION_DIAGNOSTICS` de React Native ;
- `capability-sections.tsx` est **le rendu d'une couture de composition** ;
- `health` sondait `/health` alors que son transport et ses clés de requête
  étaient **déjà dans le cœur** : le même sujet était coupé en deux par la
  frontière.

C'est le critère d'ADR-079 qui n'avait pas été appliqué à Next.js. Les deux
paquets remontent dans `src/core/`.

### Ce que ça change vraiment

**`features/` est désormais vide dans les sept starters.** La zone métier cesse
d'être *surtout* du territoire capability-et-utilisateur pour l'être
**exclusivement** : ce qui s'y trouve vient d'une capability ou de l'utilisateur,
sans exception à retenir.

FF5e lit les racines de routage sous une clé distincte (`routes`), pas comme du
cœur — FF5d doit continuer d'y autoriser les pages de capability. La distinction
tient **sans règle particulière** parce que FF5e lit les *starters* : les pages
d'une capability n'y apparaissent jamais.

### Preuves

- **épreuve sur le dépôt réel** : réintroduire les cinq imports produit cinq
  violations ; le correctif les supprime ;
- **non-vacuité étendue** : un test échoue si rien n'est lu sous une racine de
  routage déclarée — la moitié la plus récente de la règle est celle qu'un
  refactor distrait laisserait tomber en silence ;
- la règle mord sur les deux racines, Next.js et Expo ;
- 503/503 Foundation ; goldens Next.js verts, baseline et composé avec
  Authentication — ce dernier exerce le test de frontière navigateur dont trois
  chemins ont changé.

### Non revendiqué

- Une capability qui écrirait une page important la zone métier d'**une autre**
  capability ne serait pas vue. Aucune ne le fait ; rien ne l'empêche.
- **La régénération n'existe toujours pas.** Cette mission ne lève plus
  d'obstacle : elle referme la dernière zone non mesurée.

## Mission achevée — la régénération

[ADR-083](../adr/ADR-083-regeneration.md). Quatre ADR consécutives se terminaient
par *la régénération n'existe pas*. Elle existe.

### L'obstacle réel n'était pas celui qu'on avait nommé

Les trois missions précédentes avaient levé des obstacles de *zone*. La mesure a
montré que le blocage était ailleurs : **`enistere.lock` enregistrait un digest
par overlay, jamais par fichier**. Les zones disent *où* les choses vont ; elles
ne disent pas *qui* a écrit le fichier qui s'y trouve aujourd'hui.

Un projet `nest-next-files` compte 1 271 fichiers, dont **220 seulement — 17 % —
en zone métier**. Les 1 051 autres appartiennent à la Factory.

### Ce qui a été livré

- **`enistere.inventory.json`** : un digest SHA-256 par fichier produit, pris en
  parcourant la sortie plutôt qu'en comptabilisant chaque écriture — une
  comptabilité aurait divergé au premier oubli. 169 KiB, fichier à part du lock.
- **`enistere regenerate <projet> [--dry-run] [--keep-conflicts]`**.
- Classification : intact → remplaçable ; modifié ou supprimé → **conflit** ;
  non inventorié → **jamais touché**.
- **Aucun mode n'écrase un conflit.** `abort` (défaut) n'écrit rien du tout ;
  `keep` applique le sûr et laisse le reste. Une régénération capable d'effacer
  ce qu'elle n'a pas écrit serait pire que pas de régénération.

### Preuves

Dix tests, tous sur un projet **modifié par son propriétaire** — sur une copie
vierge, une implémentation qui écrase tout passerait. Dont : ajouter
Authentication à un projet portant déjà du code du propriétaire, avec seconde
exécution sans effet ; retirer une capability sans toucher à ce qui a été modifié
depuis ; refus d'un projet sans inventaire.

Le golden va plus loin que la comptabilité : `nestjs-base` → travail du
propriétaire → blueprint réécrit → régénération vers `nestjs-auth`, puis **les
mêmes gates qu'un projet généré directement**.

Un défaut trouvé en chemin : la suppression laissait `src/modules/auth/` debout
et vide — le projet aurait continué d'en avoir l'air.

### Non revendiqué

- **Les dépendances ne sont pas reverrouillées** : `enistere install` reste
  l'étape suivante, explicitement.
- **Aucune fusion** : un fichier du cœur modifié reste un conflit, sans patch à
  trois voies.
- **Aucune migration de données** : retirer une capability supprime son code, pas
  ses tables.
- Un projet généré avant cette ADR ne peut pas être régénéré.
- Le golden couvre une composition, pas les vingt-sept.

## Mission achevée — une migration n'est pas du code

[ADR-084](../adr/ADR-084-regeneration-across-families.md). La mission devait
étendre la preuve de régénération au-delà d'une composition. Elle a surtout
montré qu'ADR-083 décrivait le mauvais problème.

### Ce que la mesure a montré, contre une vraie base

ADR-083 déclarait : *« retirer une capability supprime son code, pas ses tables
ni ses migrations déjà appliquées »*. Juste, et gravement incomplet.

```
alembic upgrade head    0001_baseline → 0002_auth → 0003_rbac
alembic current         0003_rbac (head)
# le propriétaire retire les capabilities, puis régénère
alembic current         ERROR  Can't locate revision identified by '0003_rbac'
alembic upgrade head    ERROR  Can't locate revision identified by '0003_rbac'
```

Le problème n'était pas les tables restantes : **la régénération supprimait les
fichiers de migration**, et un projet dont le schéma est estampillé `0003_rbac`
ne peut plus exécuter la moindre commande Alembic. Pas un résidu — un projet qui
ne migre plus, dans aucune direction.

### Décision

**Une régénération ne retire jamais un fichier de migration.** Une migration
n'est pas du code, c'est une histoire : elle dit ce qui a déjà été fait à des
bases qui ne sont pas dans ce dépôt. Le répertoire est déclaré par l'adaptateur
de cible — un fait de runtime, pas une règle de régénération.

Résultat : chaîne intacte, et au pire des tables qu'aucune capability n'utilise
plus. Désordonné plutôt que cassé. Revenir sur une migration est une migration,
et elle appartient au propriétaire.

### Preuves

- **Contre la même base réelle qui échouait** : `alembic current` → `0003_rbac
  (head)`, `upgrade head` sans erreur, `retained: 2` ;
- un test unitaire couvre le même invariant sur NestJS/Prisma ;
- **un golden de régénération par famille** : API non-JS (FastAPI), Web
  (Next.js), Mobile (Flutter) — chacun soumis aux mêmes gates qu'un projet
  généré directement, et ancré dans la CI.

### Non revendiqué

- **Tables orphelines assumées** : un projet qui retire une capability garde ses
  tables, et un projet qui n'avait jamais migré gardera tout de même les
  fichiers. La Factory ne sait pas quelles bases ont été migrées.
- **Aucune migration de retrait générée** : la Factory sait ne pas détruire, pas
  défaire.
- `migrations/env.py` énumère toujours en dur les modules de modèles.
- La régénération ne reverrouille toujours pas les dépendances.

## Mission achevée — les modules de modèles passent par une couture

[ADR-085](../adr/ADR-085-alembic-model-seam.md). La mission devait refermer le
dernier défaut nommé de la famille API. **Elle a surtout démenti la description
que trois ADR en donnaient.**

### Ce que la mesure a montré

ADR-079, ADR-080 et ADR-084 décrivaient toutes le même défaut : *« un
`--autogenerate` proposerait de supprimer les tables RBAC »*. Il a suffi de
lancer Alembic contre une vraie base pour voir que c'était faux, de deux façons.

| situation | ce qu'`--autogenerate` propose vraiment |
|---|---|
| tel que livré | **rien** |
| une capability tierce, non énumérée | **rien non plus** |
| un module énuméré retiré | `drop_table` sur `users`, `roles`, `permissions`, `refresh_tokens`, `user_roles`, `role_permissions` |

**Le défaut était latent, pas actif** : l'énumération nommait exactement les deux
seules capabilities FastAPI existantes. **Et le mode de panne n'était pas celui
décrit** : une capability non énumérée n'est pas vue comme *à supprimer*, elle
est **invisible** — son module n'étant jamais importé, ses tables ne sont pas
dans `Base.metadata`. Les suppressions n'arrivent qu'une fois les tables
réellement en base, et emportent alors aussi celles d'Authentication.

Le danger est réel ; il arrive plus tard qu'annoncé et frappe plus large.

### Ce qui a été livré

- intégration **`fastapi.model-module`** et destination générée
  `app/composition/capability_models.py`, comme pour les routeurs ;
- `env.py` importe la couture au lieu d'énumérer : la couture étant générée à
  partir des intégrations déclarées, elle ne peut pas prendre de retard sur la
  composition ;
- **FF5f — `capability-model-seam`** : une capability FastAPI qui livre un
  `models.py` doit le déclarer. La réserve que l'ADR allait énoncer est
  vérifiable par machine, donc elle appartient à une gate.

### Preuves

- **contre une vraie base** : projet composé migré, puis `alembic revision
  --autogenerate` → **zéro opération, zéro suppression** ;
- **le cas que l'énumération ne pouvait pas couvrir** : une troisième capability
  déclarée par la couture est détectée (`Detected added table 'invoices'`) ;
- FF5f éprouvée dans les deux sens ; rendu trié et dédupliqué ;
- goldens `fastapi-base`, `fastapi-rbac` et la régénération `fastapi-base →
  fastapi-auth` : verts. 518/518 Foundation.

### Non revendiqué

- **`--autogenerate` n'est toujours pas un outil de production ici** : les
  révisions restent écrites à la main. L'ADR rend l'outil honnête, pas
  obligatoire.
- FF5f lit `files/app/modules/*/models.py` : un modèle rangé ailleurs lui
  échappe.
- Les projets déjà générés gardent leur `env.py` énuméré jusqu'à régénération.

## Mission achevée — autorisation des opérations de sécurité des agents IA

Le contexte d'autorisation défensive est formalisé dans la politique opérationnelle
[`AI_SECURITY_AUTHORIZATION.md`](../governance/AI_SECURITY_AUTHORIZATION.md), référencée par
`MANDAT.md`, la source de vérité et l'instruction d'entrée `AGENTS.md`.

Le périmètre couvre la Foundation et les systèmes ou environnements explicitement contrôlés par le
mainteneur. Il exclut toute autorisation implicite sur Internet ou sur un tiers, privilégie les preuves
non destructives et ne prétend contourner aucune politique ou protection d'un fournisseur d'IA.
`SECURITY_ARCHITECTURE.md` reste l'unique source architecturale de sécurité ; aucun ADR ni changement
d'architecture n'a été nécessaire.

Preuves : link checker sur 148 fichiers, fitness functions sans finding et diff documentaire uniquement.

## Mission achevée — la régénération ne suit plus les liens du propriétaire

L'audit d'ADR-083 a démenti sa classification à quatre cas : elle ne classait
que les fichiers, pas les répertoires ni les entrées non régulières. Un lien
symbolique
propriétaire placée sur le futur module Auth laissait `regenerate` écrire 45
entrées hors du projet sans signaler de conflit.

Le parcours distingue désormais fichiers réguliers et obstructions. Une
obstruction sur un chemin Factory ou l'ancêtre d'un chemin à générer devient un
conflit ; ses descendants ne sont jamais écrits, même avec `--keep-conflicts`.
La même frontière protège les fichiers de contrôle réécrits en bloc et elle est
revérifiée avant mutation.

Preuves : 15/15 tests de régénération, 520/520 Foundation, fitness functions sans
finding et golden `nestjs-base` → `nestjs-auth` complet (154/154 tests
applicatifs, build, conformité, audit à zéro, lock reproductible). Non revendiqué :
aucune transaction multi-fichiers contre une panne I/O ou un processus local
échangeant les chemins entre deux appels système.

## Prochaine mission unique

> **RBAC sur Angular et Flutter**, les deux derniers écarts de parité déclarés
> qui restent ouverts sur une capability déjà portée ailleurs.

### Justification de l'ordre

Le socle n'a plus de défaut structurel nommé : les zones sont mesurées dans les
deux sens, la régénération existe et est prouvée sur les trois familles, et la
famille API n'a plus de couture manquante.

Ce qui reste est du **portage**, et `parity-gaps.json` en tient le compte daté.
RBAC est porté sur les trois runtimes API et sur Next.js ; Angular et Flutter
sont les deux qui manquent, et la parité de famille exige qu'ils soient
interchangeables avec leurs pairs.

### Critères de sortie

- RBAC sur Angular et Flutter, avec descripteur de conformité et golden nommé
  dans la matrice CI ;
- les écarts correspondants retirés de `parity-gaps.json`.

### Ce qui reste ouvert après cette mission

- Files sur FastAPI, Angular et Flutter ;
- transport cookie HttpOnly, limitation de débit distribuée, reste de §12.
