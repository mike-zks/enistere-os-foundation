# ADR-002 — ORM API NestJS : Prisma vs TypeORM

## 1. Titre

Choix de l'ORM principal pour le API Core NestJS.

## 2. Statut

Validé.

## 3. Date

2026-05-30.

## 4. Contexte

Le API Core NestJS d'Enistere OS Foundation doit fournir une base backend générique, modulaire, testable et réutilisable pour les projets dérivés.

Le choix de l'ORM impacte directement :

- `DatabaseModule` ;
- modèles de données ;
- migrations ;
- seeds ;
- transactions ;
- repositories ou couches d'accès aux données ;
- tests d'intégration ;
- conventions backend ;
- maintenabilité des projets dérivés.

La base relationnelle cible est PostgreSQL. Le Deployment prévoit PostgreSQL comme service interne non public, avec utilisateurs applicatifs dédiés, volumes persistants, backups et migrations pilotées par les cores applicatifs.

Cette ADR formalise le choix ORM avant toute génération de code NestJS, schéma, migration ou seed.

## 5. Problème

Sans décision ORM, le futur starter API NestJS risque de mélanger des conventions incompatibles :

- modèles de persistance divergents ;
- migrations non standardisées ;
- seeds difficiles à maintenir ;
- transactions traitées différemment selon les modules ;
- tests d'intégration hétérogènes ;
- conventions IA instables pour générer ou relire du code backend ;
- dette de migration si le choix est changé après implémentation.

Il faut choisir une solution claire pour V1, sans chercher à supporter plusieurs ORM en parallèle dans la fondation.

## 6. Options étudiées

### Option A — Prisma comme ORM principal

Utiliser Prisma pour le modèle de données, les migrations, les seeds et l'accès base typé.

Avantages :

- schéma de données lisible et centralisé ;
- typage TypeScript fort ;
- client généré typé ;
- migrations intégrées ;
- bonne expérience développeur ;
- bonne compatibilité PostgreSQL ;
- seeds et tests d'intégration cadrables ;
- génération et revue IA plus prévisibles ;
- documentation plus simple pour un starter générique.

Inconvénients :

- génération de client à gérer ;
- manière spécifique de modéliser les données ;
- certaines requêtes complexes peuvent demander une attention particulière ;
- risque de lock-in sur l'écosystème Prisma ;
- nécessité de conventions claires pour transactions et migrations.

### Option B — TypeORM comme ORM principal

Utiliser TypeORM avec entités, repositories, decorators, migrations et intégration NestJS classique.

Avantages :

- alternative mature ;
- intégration historique avec NestJS ;
- modèle orienté entités et decorators familier ;
- repositories connus ;
- bonne capacité à gérer des modèles complexes ;
- contrôle fin possible sur certaines requêtes.

Inconvénients :

- typage moins guidé qu'un client généré dédié ;
- entités mélangées au code applicatif si mal structurées ;
- migrations et synchronisation à gouverner strictement ;
- conventions plus faciles à disperser ;
- génération IA potentiellement moins homogène ;
- risque de fuite d'entités de persistance vers les contrats API.

### Option C — SQL brut / Query Builder

Utiliser SQL brut, Knex ou un query builder léger pour garder un contrôle maximal.

Avantages :

- contrôle précis des requêtes ;
- performance explicite ;
- faible abstraction ;
- adapté à certains cas complexes ou optimisés.

Inconvénients :

- productivité plus faible pour un starter générique ;
- typage à construire séparément ;
- migrations et seeds à cadrer avec d'autres outils ;
- plus grande charge de maintenance ;
- risque de duplication SQL ;
- moins adapté à la génération IA contrôlée en V1.

### Option D — Abstraction ORM interchangeable

Créer une couche permettant de changer facilement d'ORM selon projet.

Avantages :

- flexibilité théorique ;
- possibilité d'adapter l'ORM à chaque projet ;
- réduction apparente du lock-in.

Inconvénients :

- complexité élevée dès V1 ;
- abstraction souvent imparfaite ;
- duplication des conventions ;
- tests plus lourds ;
- documentation plus complexe ;
- risque de supporter deux ORM sans vraie valeur immédiate ;
- ralentit la génération du starter API.

## 7. Décision

Enistere OS Foundation retient **l'Option A — Prisma comme ORM principal V1**.

La décision officielle est :

```txt
Enistere OS Foundation adopte Prisma comme ORM principal pour le API Core NestJS V1.
```

Précisions obligatoires :

```txt
Prisma est le standard API Core NestJS V1.
TypeORM peut rester autorisé par exception dans un projet dérivé si le besoin est justifié.
La fondation ne doit pas chercher à supporter plusieurs ORM en même temps dans V1.
```

Cette ADR ne crée aucun schéma Prisma, module Database, migration, seed ou dépendance.

## 8. Raisons de la décision

Prisma est retenu pour V1 principalement pour :

- lisibilité du modèle de données ;
- migrations intégrées ;
- typage TypeScript fort ;
- productivité ;
- expérience développeur ;
- génération de client typé ;
- bonne compatibilité PostgreSQL ;
- facilité d'usage avec Codex / Claude Code ;
- cohérence pour des starters génériques.

Cette stratégie réduit la complexité du starter API NestJS et rend les conventions backend plus faciles à documenter, relire et réutiliser.

## 9. Comparaison Prisma vs TypeORM

| Critère | Prisma | TypeORM |
|---|---|---|
| Intégration NestJS | Nécessite un module d'intégration propre, simple à cadrer | Intégration historique et familière |
| Courbe d'apprentissage | Schéma central lisible, client généré | Entités, repositories et decorators à maîtriser |
| Typage TypeScript | Fort via client généré | Correct, mais plus dépendant des entités et patterns |
| Migrations | Intégrées et cadrables | Disponibles, mais gouvernance plus manuelle |
| Transactions | Supportées, conventions à documenter | Supportées, souvent via manager/query runner |
| Relations | Lisibles dans le schéma, requêtes typées | Naturelles via entités, attention aux chargements |
| Performance | Bonne si requêtes relues et optimisées | Bonne avec contrôle fin possible |
| Tests | Client typé utile pour intégration | Patterns connus, mais mocks parfois dispersés |
| Maintenabilité | Forte lisibilité du schéma central | Bonne si architecture disciplinée |
| Lisibilité | Modèle de données explicite | Modèle réparti dans les entités |
| Compatibilité PostgreSQL | Bonne | Bonne |
| Support long terme | Écosystème actif | Écosystème mature |
| Génération IA | Très favorable grâce au schéma et au typage | Possible, mais plus dépendant des conventions locales |
| Lock-in | Présent via schéma/client Prisma | Présent via decorators et API TypeORM |
| Projets complexes | Possible, avec attention aux requêtes avancées | Mature pour modèles entité/repository complexes |

TypeORM est reconnu comme une alternative mature, mais Prisma est plus adapté au standard V1 de la fondation pour un starter générique, typé et lisible.

## 10. Conséquences positives

- Le futur `DatabaseModule` dispose d'une direction claire.
- Le modèle de données est centralisé et lisible.
- Les migrations et seeds peuvent suivre des conventions standardisées.
- Les tests d'intégration peuvent s'appuyer sur un client typé.
- La documentation backend devient plus simple.
- Les projets dérivés partent d'un socle cohérent.
- Les agents IA ont un contexte plus déterministe pour générer ou relire l'accès DB.

## 11. Conséquences négatives

- La fondation accepte le lock-in Prisma pour V1.
- Les projets ayant déjà une expertise TypeORM devront justifier une exception.
- Les requêtes complexes devront être relues avec attention.
- La génération du client Prisma devra être intégrée dans les futures commandes projet.
- Les conventions transactions, seeds et migrations devront être documentées avant implémentation.

## 12. Risques

- Prisma introduit une génération de client à gérer.
- Prisma impose une manière spécifique de modéliser.
- Migrations mal relues ou appliquées trop vite.
- Requêtes complexes sous-estimées.
- Problèmes de performance masqués par l'abstraction.
- Conventions transactions insuffisantes.
- Conventions seeds insuffisantes.
- Duplication entre DTO, modèles Prisma et types API.
- Exposition directe des modèles Prisma dans les contrats API publics.
- Exceptions TypeORM non documentées dans des projets dérivés.

## 13. Alternatives rejetées

### Option B rejetée comme standard principal V1

TypeORM est mature et reste une option valable dans certains contextes, mais il n'est pas retenu comme standard principal V1 car Prisma apporte une meilleure lisibilité du schéma, un typage plus direct et une meilleure cohérence pour un starter générique.

### Option C rejetée

SQL brut ou query builder n'est pas retenu comme stratégie principale car le coût de productivité, typage, documentation et maintenance serait trop élevé pour une fondation V1.

### Option D rejetée

Une abstraction ORM interchangeable est rejetée pour V1 car elle ajouterait de la complexité sans valeur immédiate. La fondation ne doit pas supporter plusieurs ORM en parallèle dans la première version du API Core NestJS.

## 14. Impact sur API Core NestJS

Le API Core NestJS devra prévoir :

- `DatabaseModule` orienté Prisma ;
- conventions d'initialisation et de fermeture du client ;
- séparation entre modèle de persistance et contrats API ;
- accès DB via services, repositories ou couches applicatives définies ;
- transactions documentées pour les opérations critiques ;
- tests d'intégration avec PostgreSQL ;
- stratégie claire pour migrations et seeds.

Les modèles Prisma ne doivent pas devenir les DTO publics de l'API.

## 15. Impact sur Deployment

Le Deployment reste responsable de l'infrastructure PostgreSQL :

- PostgreSQL non public ;
- utilisateur applicatif non superuser ;
- volumes persistants ;
- backups ;
- restore ;
- health checks ;
- sécurité serveur.

Les migrations restent pilotées par l'API Core ou les projets applicatifs, pas par le Deployment directement.

## 16. Impact sur migrations et seeds

Les migrations devront être :

- versionnées ;
- relues ;
- testées sur environnement contrôlé avant production ;
- compatibles avec PostgreSQL ;
- accompagnées de stratégie rollback ou restore si nécessaire.

Les seeds devront être :

- séparés des données réelles ;
- adaptés aux environnements local/test ;
- sans secret réel ;
- limités aux données minimales nécessaires, par exemple rôles et permissions de base si validés.

## 17. Impact sur tests

Les tests devront couvrir :

- services utilisant la base ;
- transactions critiques ;
- migrations ;
- seeds ;
- contraintes relationnelles ;
- erreurs DB importantes ;
- comportements de rollback ;
- accès aux données sensibles selon permissions.

Les requêtes critiques devront être testées en intégration avec PostgreSQL lorsque le risque le justifie.

## 18. Impact sur projets dérivés

Les projets dérivés utilisant le API Core NestJS devront considérer Prisma comme standard.

Ils pourront demander une exception TypeORM uniquement si :

- le besoin est documenté ;
- les impacts sur migrations, tests, conventions et maintenance sont assumés ;
- l'écart est indiqué dans leur documentation projet ;
- la fondation n'est pas obligée de supporter simultanément les deux ORM.

Les projets dérivés ne doivent pas exposer directement les modèles Prisma dans leurs contrats publics.

## 19. Impact sur IA / Codex / Claude Code

Les agents IA doivent appliquer cette ADR lors de la génération ou revue du API Core NestJS.

Ils doivent :

- utiliser Prisma comme choix ORM V1 ;
- ne pas générer TypeORM sans exception documentée ;
- ne pas créer de schéma, migration ou seed hors mission explicite ;
- signaler les modèles Prisma exposés comme DTO publics ;
- demander une revue humaine des migrations ;
- distinguer DTO, contrats API et modèles de persistance ;
- signaler les requêtes critiques non testées ;
- ne pas décider seuls d'une exception ORM.

L'IA assiste la génération et la revue, mais ne décide pas seule d'un changement ORM.

## 20. Règles d'application

- Prisma devient le standard V1 du API Core NestJS.
- Le schéma Prisma doit rester clair, documenté et relu.
- Les migrations doivent être versionnées.
- Les seeds doivent être séparés des données réelles.
- Les transactions doivent être documentées.
- Les modèles Prisma ne doivent pas être exposés directement comme DTO publics.
- Les DTO/API contracts doivent rester séparés du modèle de persistance.
- Les accès DB doivent passer par services/repositories ou couches applicatives définies.
- Les requêtes critiques doivent être testées.
- Les migrations doivent être testées sur environnement contrôlé avant production.
- TypeORM ne doit être utilisé que par exception documentée.
- Les secrets et données réelles ne doivent jamais être placés dans des seeds.
- Les migrations critiques doivent être coordonnées avec les backups et restore Deployment.

## 21. Conditions de révision future

Cette décision pourra être revue si :

- Prisma ne répond plus aux besoins de projets complexes ;
- des limitations de performance ou de requêtes deviennent bloquantes ;
- TypeORM ou une autre solution devient plus adaptée à la majorité des projets ;
- la fondation doit supporter un style d'architecture incompatible avec Prisma ;
- les projets dérivés accumulent des exceptions ORM justifiées ;
- les contraintes de migration ou de transaction deviennent trop coûteuses ;
- l'écosystème Prisma évolue défavorablement.

Toute révision devra être documentée par une nouvelle ADR ou par une mise à jour formelle de celle-ci.

## 22. Conclusion

Enistere OS Foundation adopte Prisma comme ORM principal du API Core NestJS V1.

TypeORM reste une alternative mature autorisée uniquement par exception documentée dans un projet dérivé. La fondation ne supportera pas plusieurs ORM en parallèle dans V1 afin de préserver la simplicité, la cohérence, la testabilité et la maintenabilité du starter API.
