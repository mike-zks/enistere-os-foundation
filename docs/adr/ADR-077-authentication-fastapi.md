# ADR-077 — FastAPI devient une autorité d'authentification

- Statut : Validé et implémenté
- Date : 2026-07-29
- Décideur : Owner Foundation
- Complète : ADR-068, ADR-074, ADR-076

## Contexte

FastAPI était `unsupported` sur les trois capabilities. C'était le dernier écart
d'Authentication, et le plus coûteux : Angular et Flutter étaient des **clients**
— ils consomment une autorité. FastAPI devait en **être** une. Huit invariants
`AUTH-AUTHORITY-*` au lieu de six côté client, plus la persistance, le hachage,
l'émission et la rotation de jetons, la détection de rejeu, la limitation de
débit et l'audit métier.

Comme pour Angular et Flutter, le blocage n'était pas la logique — elle existe
déjà deux fois — mais l'**absence de tout point de composition** :
`integrationKinds: {}, composition: []`. Troisième occurrence du même manque.

## Décision

### 1. Trois coutures, dont une que les deux autres runtimes n'exigeaient pas

`fastapi.router`, `fastapi.lifespan`, `fastapi.exception-handler`.

La troisième n'est pas une commodité. Starlette **construit sa pile de
middlewares — dont le middleware d'exceptions — avant d'émettre l'événement de
démarrage**. Un handler enregistré depuis un hook de cycle de vie ne serait
jamais consulté, et l'erreur métier d'une capability retomberait dans le filet
`Exception` du baseline : **un refus d'identifiants répondrait 500**. C'est
exactement le défaut trouvé et corrigé sur Spring, ici évité par construction.

Les hooks de cycle de vie sont entrés dans un `AsyncExitStack` : un hook qui
échoue au démarrage ne doit pas laisser ouverts ceux déjà entrés.

### 2. La persistance est apportée par la capability, parce que le baseline le dit

Le starter FastAPI documente sa position à deux endroits : *« La base ne choisit
aucun provider de données »* et *« Une primitive persistence fournit l'adapter
`MigrationPort`, ses migrations versionnées et sa transaction »*. Cette décision
n'a pas été rouverte.

Elle a une conséquence qu'il faut énoncer : NestJS et Spring reçoivent
`audit_logs` de **leur baseline**, qui a choisi un ORM. Le baseline FastAPI ne
pouvant pas le faire, la première capability qui a besoin de persister la crée.
`app/persistence/` est donc tenu **séparé** de `app/auth/` et ne sait rien des
utilisateurs ni des sessions : le jour où une deuxième capability en a besoin, ou
où le baseline choisit un provider, ce paquet se déplace au lieu d'être démêlé.

### 3. Les refresh sont opaques, pas des JWT

Un refresh n'est présenté qu'à cette autorité : il ne transporte aucune
revendication digne d'être lue. Étant opaque, il **ne peut pas être accepté sur
la seule foi d'une signature** — chaque usage est une lecture en base, ce qui est
précisément ce qui rend la révocation et la détection de rejeu possibles.

Conséquence assumée : il n'y a **pas** de secret de signature du refresh. Ce que
la seconde clé protège est l'empreinte HMAC-SHA256 sous laquelle il est persisté.
Un dump volé ne peut pas être rapproché d'empreintes calculées hors ligne sans
voler aussi cette clé.

### 4. Le jeton d'accès épingle son algorithme

`algorithms=["HS256"]`, jamais celui que l'en-tête annonce. Accepter l'annonce
est ce qui permet un jeton `alg: none`. Le type est vérifié en plus de la
signature, et `/me` relit la base : une signature valide ne suffit pas quand le
compte a été désactivé après l'émission.

### 5. Le temps de réponse ne doit pas énumérer les comptes

Une adresse inconnue répondrait en microsecondes, une adresse connue en dizaines
de millisecondes. Le corps dit `AUTH_INVALID_CREDENTIALS` dans les deux cas ;
l'horloge, elle, répondrait à la question. Une vérification est donc dépensée
contre un hachage factice lorsque l'identité n'existe pas.

## Trois défauts trouvés par la vérification réelle

Aucun des trois n'aurait été vu sans exécuter l'application générée contre un
PostgreSQL réel.

### La révocation de la famille était annulée par le rollback qui la motivait

À la détection d'un rejeu, la révocation de toutes les sessions de l'identité
était exécutée **dans la transaction sur le point d'être annulée** par l'erreur.
Le confinement disparaissait avec le refus : la famille survivait au vol qui
venait d'être détecté. Elle committe désormais dans sa propre transaction.

### Le chemin de rejeu n'était jamais atteint

Un jeton révoqué était classé « inutilisable » avant d'être reconnu comme rejeu,
si bien que la détection ne se déclenchait que sur une course. Inconnu, expiré et
**révoqué** sont maintenant trois cas distincts : seul le troisième est un
rejeu — quelqu'un détient encore une copie d'un jeton déjà dépensé.

### `EmailStr` refusait des adresses que les deux autres autorités acceptent

`email-validator` rejette les TLD à usage réservé — `.test`, `.internal`. Un
utilisateur aurait pu s'inscrire contre NestJS ou Spring et être refusé par
FastAPI **à la validation**, avant même toute vérification. Trois runtimes d'une
même famille ne peuvent pas diverger sur qui a le droit d'exister. La validation
est désormais syntaxique, comme `@IsEmail` et `@Email` le font — et la dépendance
disparaît avec le problème.

## Deux prérequis d'outillage

**Un gestionnaire de dépendances Python.** L'adapter n'en déclarait aucun et
retombait sur `npm`. Le starter installe depuis des locks entièrement épinglés :
un overlay doit donc déclarer la **clôture transitive** qu'il ajoute, en trois
sections — `all`, `runtime` et `direct`, pour que `requirements.txt` reste
lisible au lieu de devenir un second lock. La fusion normalise les noms selon
PEP 503 et trie comme `pip` : un test vérifie que fusionner *rien* dans les locks
réels les rend octet pour octet.

**Un cycle d'imports.** `app.platform` importait la couture de cycle de vie, qui
importe la capability, qui importe `app.platform`. Une couture se consomme au
**démarrage**, pas à l'import : la règle vaut pour tout module du baseline qu'une
capability importe.

## Conséquences

### Acquis

* `auth/fastapi` est `ready` : quatre responsabilités, huit invariants, onze
  preuves.
* **Authentication est CONFORMANT sur les sept runtimes** — la première
  capability à l'être. Les trois familles sont à parité.
* Les coutures FastAPI et le gestionnaire `pub`/`python` bénéficient à toute
  capability future.
* `require_user` est exporté : RBAC et Files protégeront leurs routes sans
  réimplémenter la lecture de jeton.

### Assumé

* **La limitation de débit est en mémoire**, comme celle du baseline, et le
  starter le dit déjà : elle prouve le mécanisme sur une instance. Un déploiement
  multi-processus doit la remplacer par un adapter partagé — sinon un attaquant
  face à quatre workers dispose de quatre fois le budget.
* Le paquet `app/persistence/` est apporté par `auth`. C'est une asymétrie
  assumée avec NestJS et Spring, imposée par le refus — documenté — du baseline
  de choisir un provider.

### Non revendiqué

* **RBAC et Files restent `unsupported` sur FastAPI** ; deux écarts de parité API
  demeurent déclarés et datés.
* Aucune preuve de démarrage headless n'est revendiquée pour `fastapi-auth` : le
  golden exerce les gates, pas un boot complet sous uvicorn.
* La rotation n'est pas prouvée sous concurrence réelle (deux requêtes
  simultanées). La garantie repose sur un `UPDATE … WHERE revoked_at IS NULL`
  conditionnel, dont la correction est celle de PostgreSQL ; le test couvre le
  rejeu séquentiel.

## Alternatives écartées

* **Mettre la persistance dans le baseline FastAPI**, pour l'aligner sur NestJS
  et Spring. Rouvrirait une décision écrite deux fois dans le starter, et
  imposerait une base de données à `fastapi-base`, qui n'en a pas besoin.
* **Des refresh JWT**, par symétrie de mécanisme avec les deux autres autorités.
  La garantie compte, pas le mécanisme : un jeton opaque ne peut pas être accepté
  sans lecture en base, ce qui est strictement plus fort.
* **Garder `EmailStr`.** Confort de validation contre une divergence de contrat
  entre runtimes d'une même famille.
* **Enregistrer le handler d'erreur depuis le `lifespan`.** Ne fonctionne pas, et
  échouerait en silence : un 500 au lieu d'un 401.

## Tests

```bash
npm run factory:test                      # 493
npm run factory:capability-conformance    # auth CONFORMANT sur 7 runtimes
node factory/quality/scripts/golden-runtime.mjs fastapi-auth
```

Application FastAPI composée réellement générée : `ruff` propre, **32/32
pytest** contre un PostgreSQL réel, `compileall` et `pip check` verts. La
migration Alembic a été appliquée sur une base vide, puis l'autorité exercée
**sur ce schéma migré** : connexion, `/me`, rotation, rejeu détecté, famille
révoquée, audit persisté.

## Rollback

Révoquer le commit ramène `auth/fastapi` à `unsupported` et rouvre l'écart de
parité API. Les coutures de composition et le gestionnaire de dépendances Python
sont indépendants de la capability et peuvent rester.
