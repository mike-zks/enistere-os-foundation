# starter NestJS — Spécification du Core

## 1. Résumé exécutif

Le **starter NestJS** définit le socle backend TypeScript de référence pour les futures APIs Enistere.

Il doit fournir une base modulaire, sécurisée, testable et extensible pour construire des APIs modernes sans réinventer à chaque projet l'authentification, les utilisateurs, les rôles, les permissions, la validation, les erreurs, les logs, l'audit, les uploads, le cache, les notifications, la documentation OpenAPI et les health checks.

Cette spécification est le référentiel documentaire du core. Depuis la revue
`API_CORE_V1_READINESS_REVIEW.md` du 2026-07-12, l'implémentation `starters/nestjs`
est déclarée **VALIDE_V1** ; les sections ci-dessous restent les exigences et garde-fous du core,
pas une preuve automatique de nouveaux modules.

## 2. Rôle du core

Le rôle du starter NestJS est de servir de base backend réutilisable pour les projets Enistere qui nécessitent une API TypeScript.

Il doit :

- standardiser l'architecture des APIs NestJS ;
- fournir un périmètre commun de modules techniques ;
- intégrer les exigences de sécurité dès la conception ;
- faciliter l'intégration avec les cores mobile, web, cloud, IA, documentation et qualité ;
- préparer une génération future contrôlée par IA ;
- éviter les choix techniques divergents entre projets.

## 3. Objectifs du starter NestJS

- Fournir un starter API robuste, modulaire et production-ready à terme.
- Standardiser les patterns NestJS utilisés dans l'écosystème Enistere.
- Intégrer une authentification JWT avec refresh token sécurisé.
- Supporter RBAC et permissions fines.
- Standardiser la validation des entrées.
- Centraliser la gestion des erreurs et des réponses.
- Fournir des logs exploitables et des audit logs sur actions sensibles.
- Prévoir cache Redis, jobs asynchrones, upload MinIO/S3, mail, notifications et temps réel.
- Exposer une documentation OpenAPI / Swagger maintenable.
- Préparer des tests unitaires, intégration et sécurité proportionnés au risque.
- Rester générique, sans logique métier spécifique à Kivvoo, Bailo, RFashion, Vox Pulse, CIVIS ID ou tout autre projet dérivé.

## 4. Problèmes à résoudre

Le core doit éviter :

- la duplication des architectures API entre projets ;
- les implémentations auth divergentes ;
- les validations d'entrées incohérentes ;
- les erreurs non standardisées ;
- les logs inutilisables ou contenant des données sensibles ;
- les dépendances ajoutées sans justification ;
- les uploads non sécurisés ;
- les permissions codées de manière ad hoc ;
- la documentation API absente ou obsolète ;
- les tests critiques oubliés ;
- l'absence de conventions d'intégration avec mobile, web, UI, cloud, qualité et documentation.

## 5. Périmètre fonctionnel

Le starter NestJS couvre le socle technique commun suivant :

- configuration applicative ;
- connexion base de données ;
- authentification ;
- gestion des utilisateurs ;
- rôles et permissions ;
- guards, decorators et policies ;
- validation des entrées ;
- filtres d'exception ;
- intercepteurs de réponse ;
- logs applicatifs ;
- audit logs ;
- cache Redis ;
- upload fichiers MinIO/S3 ;
- mail minimal ;
- notifications minimales ;
- jobs asynchrones ;
- documentation OpenAPI / Swagger ;
- health checks ;
- conventions de tests ;
- intégration avec Deployment ;
- intégration avec starter React Native ;
- intégration avec starter Next.js ;
- intégration avec UI Kit pour les contrats consommés par les interfaces ;
- intégration avec Factory AI ;
- intégration avec Factory Quality et Documentation.

## 6. Hors périmètre

Le core ne doit pas contenir :

- logique métier propre à un produit ;
- modules e-commerce, livraison, immobilier, finance ou administration spécifiques ;
- règles de commission, paiement projet ou workflow métier ;
- secrets réels ;
- configuration production propre à un client ;
- déploiement cloud complet ;
- Docker Compose complet à cette étape ;
- code applicatif dans cette spécification ;
- choix définitif Prisma vs TypeORM sans ADR ;
- choix définitif class-validator/class-transformer vs Zod sans ADR.

## 7. Architecture cible

L'architecture cible doit rester modulaire et séparée par responsabilités.

Principes :

- les modules métier dérivés ne doivent pas polluer le core ;
- les modules techniques communs doivent être isolés ;
- les règles transversales doivent être placées dans `common/` ou `infrastructure/` selon leur nature ;
- la sécurité doit être appliquée par défaut ;
- la configuration doit être centralisée et validée ;
- les dépendances externes doivent être encapsulées ;
- les interfaces publiques doivent être documentées.

Technologies cibles possibles, sans installation à ce stade :

- NestJS ;
- TypeScript ;
- PostgreSQL ;
- Prisma ou TypeORM, à trancher par ADR ;
- Redis ;
- BullMQ ;
- MinIO/S3 ;
- Swagger/OpenAPI ;
- Passport/JWT ;
- class-validator/class-transformer ou Zod, à trancher par ADR.

## 8. Structure cible du futur starter

Structure indicative du futur starter :

```txt
starters/nestjs/
├── README.md
├── STARTER_SPECIFICATION.md
├── ARCHITECTURE.md
├── INSTALLATION.md
├── USAGE.md
├── TESTING.md
├── SECURITY.md
├── DEPENDENCIES.md
├── ROADMAP.md
├── CHANGELOG.md
├── docs/
├── examples/
├── templates/
└── starter/
    ├── src/
    │   ├── main.ts
    │   ├── app.module.ts
    │   ├── config/
    │   ├── common/
    │   │   ├── decorators/
    │   │   ├── filters/
    │   │   ├── guards/
    │   │   ├── interceptors/
    │   │   ├── pipes/
    │   │   └── utils/
    │   ├── infrastructure/
    │   │   ├── database/
    │   │   ├── cache/
    │   │   ├── queue/
    │   │   ├── storage/
    │   │   ├── mail/
    │   │   └── monitoring/
    │   └── modules/
    │       ├── auth/
    │       ├── users/
    │       ├── roles/
    │       ├── permissions/
    │       ├── uploads/
    │       ├── notifications/
    │       └── audit/
    └── test/
```

Cette structure est cible. Elle ne doit pas être créée pendant cette mission.

## 9. Modules obligatoires

Les modules et capacités obligatoires du futur starter sont :

- `ConfigModule` : configuration typée, validation d'environnement et séparation par environnement.
- `DatabaseModule` : connexion PostgreSQL et abstraction ORM.
- `AuthModule` : login, register si applicable, refresh token, logout et stratégie JWT.
- `UsersModule` : gestion utilisateur minimale et profil courant.
- `RolesModule` : définition et attribution des rôles.
- `PermissionsModule` : permissions fines et contrôles d'accès.
- `HealthModule` : health checks application, database, Redis et stockage si activés.
- `LoggerModule` : logs applicatifs standardisés.
- `CommonModule` : decorators, guards, filters, interceptors, pipes et helpers communs.
- `CacheModule Redis` : cache applicatif et support de TTL.
- `UploadModule MinIO/S3` : upload sécurisé et stockage compatible S3.
- `MailModule minimal` : abstraction d'envoi email.
- `NotificationModule minimal` : notifications internes ou sortantes.
- `AuditModule` : audit logs des actions sensibles.
- `Swagger/OpenAPI` : documentation API versionnée.
- `ExceptionFilter global` : gestion standardisée des erreurs.
- `ResponseInterceptor` : format de réponse cohérent.
- `ValidationPipe global` : validation et transformation contrôlée des entrées.

## 10. Modules optionnels

Ces modules doivent être prévus comme activables selon les besoins projet, sans être imposés par défaut :

- `PaymentModule` : paiements et webhooks de paiement.
- `MapsRoutingModule` : routing, géolocalisation et intégration OSRM si nécessaire.
- `RealtimeModule` : WebSocket, événements temps réel ou gateway.
- `SearchModule` : recherche texte ou intégration moteur de recherche.
- `MediaProcessingModule` : traitement images, vidéos ou documents.
- `WebhookModule` : exposition et consommation de webhooks.
- `ReportModule` : exports, rapports et fichiers générés.
- `AdminModule` : capacités backoffice génériques.
- `SettingsModule` : paramètres applicatifs administrables.

Chaque module optionnel doit être justifié dans le projet dérivé qui l'active.

## 11. Modules futurs

Les modules futurs peuvent inclure :

- multi-tenancy ;
- API keys pour intégrations serveur à serveur ;
- rate limiting avancé par utilisateur, IP ou tenant ;
- event bus interne ;
- observabilité avancée ;
- génération de clients OpenAPI ;
- policy engine avancé ;
- module de migration de données ;
- module d'anonymisation ou suppression de données personnelles.

Ces modules nécessiteront une validation de roadmap et, pour les choix structurants, un ADR.

## 12. Standards API

Le core doit définir des standards pour :

- versioning d'API ;
- préfixe global des routes ;
- format de réponse ;
- format d'erreur ;
- pagination ;
- filtrage ;
- tri ;
- recherche ;
- idempotence lorsque nécessaire ;
- codes HTTP ;
- messages d'erreur exploitables mais non sensibles ;
- documentation OpenAPI ;
- compatibilité avec clients mobile et web.

Les endpoints doivent rester explicites, testables et documentés.

## 13. Standards sécurité

Le core doit appliquer :

- secrets hors Git ;
- validation systématique des entrées ;
- CORS strict ;
- Helmet ;
- rate limiting sur endpoints sensibles ;
- logs sans secrets ;
- audit logs sur actions sensibles ;
- Swagger protégé en production si nécessaire ;
- stockage sécurisé des tokens ;
- permissions minimales ;
- défense en profondeur ;
- dépendances justifiées et surveillées.

## 14. Authentification

L'authentification cible repose sur :

- access token JWT court ;
- refresh token plus long mais contrôlé ;
- rotation du refresh token recommandée ;
- révocation possible ;
- logout serveur ;
- suivi de session ou device si nécessaire ;
- stratégie `JwtAuthGuard` ;
- decorator `@CurrentUser()`;
- decorator `@Public()` pour endpoints explicitement publics.

Le stockage du refresh token dépendra du client :

- web : cookie HttpOnly, Secure en production, SameSite adapté ;
- mobile : stockage sécurisé côté starter React Native.

## 15. Autorisation, rôles et permissions

Le core doit supporter :

- RBAC ;
- permissions fines ;
- guards dédiés ;
- decorators `@Roles()` et `@Permissions()`;
- `RolesGuard` ;
- `PermissionsGuard` ;
- `OwnershipGuard` si nécessaire ;
- séparation claire entre identité, rôle et permission.

Les permissions doivent éviter les règles implicites dispersées dans le code.

## 16. Gestion utilisateurs

Le `UsersModule` doit prévoir :

- modèle utilisateur minimal ;
- récupération du profil courant ;
- création utilisateur selon les besoins auth ;
- statut actif/inactif ;
- association aux rôles ;
- champs auditables ;
- conventions de suppression ou désactivation ;
- extension possible par les projets dérivés.

Le core ne doit pas imposer de profil métier spécifique.

## 17. Validation des données

Toutes les entrées doivent être validées :

- body ;
- query params ;
- route params ;
- headers pertinents ;
- fichiers uploadés ;
- payload WebSocket si temps réel activé ;
- variables d'environnement ;
- données venant d'APIs externes.

Le futur starter doit prévoir un `ValidationPipe` global.

Le choix entre `class-validator/class-transformer` et `Zod` doit être tranché par ADR si le choix devient structurant.

## 18. Gestion des erreurs

Le core doit standardiser :

- erreurs de validation ;
- erreurs d'authentification ;
- erreurs d'autorisation ;
- erreurs métier génériques ;
- erreurs infrastructure ;
- erreurs de dépendances externes ;
- erreurs upload ;
- erreurs rate limit.

Un `ExceptionFilter` global doit garantir un format stable, sans fuite de stack trace ou secret en production.

## 19. Logs et audit logs

Les logs applicatifs doivent être :

- structurés ;
- lisibles ;
- compatibles avec l'observabilité future ;
- sans secret ;
- sans token ;
- sans données personnelles inutiles.

Les audit logs doivent couvrir les actions sensibles :

- login ;
- logout ;
- refresh token ;
- changement de rôle ;
- changement de permission ;
- upload fichier ;
- suppression ou désactivation de compte ;
- accès admin ;
- modification de configuration ;
- opération critique définie par un projet dérivé.

## 20. Upload et stockage fichiers

Le `UploadModule` doit prévoir :

- intégration MinIO/S3 ;
- validation taille ;
- validation type MIME ;
- validation extension ;
- noms de fichiers sûrs ;
- séparation public/privé ;
- URLs signées si nécessaire ;
- antivirus ou scan futur si le risque le justifie ;
- audit des uploads sensibles.

Le core ne doit pas exposer directement un bucket privé sans contrôle d'accès.

## 21. Cache et Redis

Le cache Redis doit être utilisé pour :

- données fréquemment consultées ;
- rate limiting ;
- sessions ou tokens si la stratégie validée le requiert ;
- verrous courts si nécessaire ;
- jobs ou coordination selon architecture.

Le core doit définir :

- conventions de clés ;
- TTL ;
- invalidation ;
- comportement en cas d'indisponibilité Redis ;
- séparation cache et stockage durable.

## 22. Queues et jobs asynchrones

Le core doit prévoir BullMQ ou une alternative validée par ADR pour :

- emails asynchrones ;
- notifications ;
- traitements fichiers ;
- exports ;
- webhooks sortants ;
- tâches planifiées ;
- retry contrôlé.

Les jobs doivent être idempotents autant que possible et observables.

## 23. Notifications

Le `NotificationModule` minimal doit fournir :

- abstraction de notification ;
- canaux extensibles ;
- templates ou payloads standardisés ;
- journalisation des envois importants ;
- intégration future mobile push, email ou realtime.

Il ne doit pas imposer de fournisseur unique sans justification.

## 24. Email

Le `MailModule` minimal doit prévoir :

- abstraction fournisseur ;
- templates simples ;
- envoi asynchrone recommandé ;
- logs sans contenu sensible ;
- gestion des erreurs d'envoi ;
- configuration par environnement.

Les emails métier restent à la charge des projets dérivés.

## 25. Temps réel

Le temps réel est optionnel et doit être activé uniquement si nécessaire.

Le `RealtimeModule` doit prévoir :

- authentification des connexions ;
- contrôle des rooms ou channels ;
- permissions ;
- rate limiting si nécessaire ;
- logs d'événements critiques ;
- stratégie de scaling à valider avec Deployment.

## 26. Documentation OpenAPI / Swagger

Le core doit prévoir :

- Swagger/OpenAPI activable ;
- documentation des endpoints ;
- schémas DTO ;
- tags par module ;
- version d'API ;
- exemples de payload ;
- protection en production si nécessaire ;
- export OpenAPI pour clients mobile et web.

Swagger ne doit jamais exposer de secret ou endpoint interne non protégé.

La stratégie OpenAPI avancée, notamment la génération de clients typés, doit être validée par ADR si elle devient structurante pour starter React Native ou starter Next.js.

## 27. Configuration et variables d'environnement

Le core doit standardiser :

- validation des variables d'environnement ;
- séparation local, test, staging, production ;
- valeurs par défaut uniquement si sûres ;
- absence de secrets dans Git ;
- documentation des variables ;
- fichier exemple futur sans valeur réelle.

Variables typiques à prévoir plus tard :

- base de données ;
- JWT access secret ;
- JWT refresh secret ;
- Redis ;
- MinIO/S3 ;
- SMTP ou fournisseur mail ;
- CORS ;
- Swagger ;
- rate limiting.

## 28. Base de données

La base cible est PostgreSQL.

Le core doit prévoir :

- modèle utilisateur minimal ;
- tables rôles et permissions ;
- sessions ou refresh tokens selon stratégie ;
- audit logs ;
- migrations ;
- transactions pour opérations critiques ;
- index utiles ;
- conventions de nommage.

Le choix entre Prisma et TypeORM doit être décidé par ADR avant implémentation.

## 29. Migrations et seed

Le futur starter doit prévoir :

- migrations versionnées ;
- seed minimal pour rôles et permissions de base ;
- seed local non sensible ;
- séparation seed local/test/production ;
- stratégie rollback ou correction documentée ;
- interdiction de seed contenant des secrets réels.

## 30. Tests attendus

Le core doit prévoir :

- tests unitaires ;
- tests d'intégration ;
- tests auth ;
- tests permissions ;
- tests validation DTO ;
- tests upload ;
- tests erreurs ;
- tests services critiques ;
- tests guards ;
- tests interceptors ;
- tests filters ;
- tests health checks ;
- tests configuration.

Les modules critiques doivent avoir une couverture renforcée.

## 31. Qualité et lint

Le futur starter doit prévoir :

- TypeScript strict recommandé ;
- lint ;
- format ;
- conventions de nommage ;
- séparation modules/services/controllers ;
- absence de logique métier dans les couches transverses ;
- erreurs typées si possible ;
- documentation des commandes qualité ;
- CI/CD future avec checks obligatoires.

## 32. Observabilité et health checks

Le `HealthModule` doit prévoir :

- endpoint health simple ;
- vérification database ;
- vérification Redis si activé ;
- vérification stockage MinIO/S3 si activé ;
- readiness/liveness si le cloud cible le nécessite ;
- logs compatibles monitoring ;
- métriques futures si validées.

L'observabilité avancée sera coordonnée avec Deployment et Factory Quality.

## 33. Sécurité des dépendances

Toute dépendance doit être justifiée.

Règles :

- aucune dépendance gadget ;
- pas de doublon fonctionnel ;
- analyse maintenance, licence et sécurité ;
- dépendances critiques documentées ;
- ADR pour ORM, validation structurante, auth majeure, queue, stratégie OpenAPI avancée, observabilité avancée ou stockage si nécessaire ;
- audit régulier futur ;
- stratégie de mise à jour documentée.

## 34. Intégration avec Deployment

Le starter NestJS doit s'intégrer avec Deployment pour :

- PostgreSQL ;
- Redis ;
- MinIO/S3 ;
- variables d'environnement ;
- secrets ;
- reverse proxy ;
- CORS ;
- logs ;
- health checks ;
- CI/CD ;
- backups ;
- monitoring.

Le core ne doit pas définir seul la stratégie cloud production.

## 35. Intégration avec starter React Native

Le core doit fournir une API compatible mobile :

- auth JWT utilisable par mobile ;
- refresh token compatible stockage sécurisé ;
- endpoints stables ;
- erreurs exploitables côté mobile ;
- upload fichier adapté ;
- pagination ;
- OpenAPI exploitable pour génération de client si validée ;
- conventions offline/cache si nécessaires.

## 36. Intégration avec starter Next.js

Le core doit fournir une API compatible web :

- refresh token en cookie HttpOnly si stratégie web retenue ;
- CORS strict ;
- protection CSRF si nécessaire selon stratégie d'auth ;
- endpoints dashboard/backoffice ;
- erreurs standardisées ;
- OpenAPI exploitable ;
- rôles et permissions adaptés aux interfaces admin.

## 37. Intégration avec Factory AI

Le starter NestJS doit être exploitable par IA pour :

- générer des modules cadrés ;
- relire sécurité, dépendances et tests ;
- documenter les endpoints ;
- proposer des tests ;
- détecter incohérences ;
- préparer ADR.

L'IA ne doit pas :

- ajouter de dépendance sans justification ;
- générer un module critique sans revue ;
- manipuler de secret ;
- décider seule d'un choix ORM, validation, auth ou cloud.

## 38. Intégration avec UI Kit, Factory Quality et Documentation

Le starter NestJS doit aussi s'intégrer avec les cores transversaux suivants :

- `ui-kit` : fournir des contrats API, erreurs, états et métadonnées exploitables par les interfaces web et mobile.
- `quality-core` : appliquer les standards de tests, lint, revue, couverture critique et validation CI/CD.
- `docs-core` : maintenir une documentation claire, des guides, des ADR, des checklists et des runbooks liés au core.

Ces intégrations doivent rester documentaires et contractuelles tant que les cores concernés ne sont pas implémentés.

## 39. Documentation obligatoire du core

À terme, le core devra contenir :

- `README.md` ;
- `STARTER_SPECIFICATION.md` ;
- `ARCHITECTURE.md` ;
- `INSTALLATION.md` ;
- `USAGE.md` ;
- `TESTING.md` ;
- `SECURITY.md` ;
- `DEPENDENCIES.md` ;
- `ROADMAP.md` ;
- `CHANGELOG.md` ;
- guides dans `docs/` si nécessaire ;
- exemples dans `examples/` si nécessaire.

## 40. Roadmap du core

### V0 : spécification et cadrage

- Créer `STARTER_SPECIFICATION.md`.
- Identifier les ADR nécessaires.
- Valider le périmètre V1.

### V1 : starter API minimal

- Créer structure NestJS.
- Ajouter configuration.
- Ajouter database.
- Ajouter auth JWT et refresh token.
- Ajouter users, roles et permissions.
- Ajouter validation globale.
- Ajouter erreurs standardisées.
- Ajouter Swagger/OpenAPI.
- Ajouter health checks.
- Ajouter tests critiques.

### V2 : industrialisation, tests, CI/CD

- Renforcer tests unitaires et intégration.
- Ajouter qualité, lint, format, build.
- Ajouter CI/CD.
- Documenter installation, usage, sécurité et dépendances.
- Ajouter cache Redis et upload MinIO/S3 stabilisés.

### V3 : modules avancés

- Ajouter queues.
- Ajouter notifications avancées.
- Ajouter realtime optionnel.
- Ajouter webhooks.
- Ajouter reporting ou search si validé.
- Ajouter observabilité avancée.

### VF : API Core complet production-ready

- Stabiliser sécurité.
- Stabiliser monitoring.
- Stabiliser documentation.
- Stabiliser release et versioning.
- Fournir exemples complets.
- Maintenir compatibilité avec projets dérivés.

## 41. Critères d'acceptation V1

La V1 sera acceptable si :

- le starter NestJS démarre localement ;
- la configuration est validée ;
- la connexion PostgreSQL fonctionne ;
- l'auth JWT fonctionne ;
- le refresh token est sécurisé, révocable et testé ;
- users, roles et permissions sont exploitables ;
- `ValidationPipe` global est actif ;
- les erreurs sont standardisées ;
- les logs sont lisibles et sans secrets ;
- Swagger/OpenAPI est disponible et protégé en production si activé ;
- les health checks fonctionnent ;
- les tests critiques passent ;
- la documentation minimale existe ;
- aucune dépendance critique n'est non justifiée.

## 42. Critères d'acceptation version finale

La version finale sera acceptable si :

- le core est production-ready ;
- les modules obligatoires sont stables ;
- les modules optionnels sont documentés ;
- la sécurité est validée ;
- les dépendances sont auditées ;
- les tests couvrent les zones critiques ;
- l'observabilité est exploitable ;
- l'intégration Deployment est claire ;
- l'intégration starter React Native est claire ;
- l'intégration starter Next.js est claire ;
- l'intégration UI Kit, Factory Quality et Documentation est claire ;
- l'OpenAPI est maintenable ;
- les ADR structurants sont présents ;
- les projets dérivés peuvent l'utiliser sans logique métier imposée.

## 43. Risques

- Surdimensionner le core avant les besoins réels.
- Mélanger fondation technique et logique métier projet.
- Ajouter trop de dépendances.
- Trancher ORM ou validation sans ADR.
- Sous-estimer la sécurité des refresh tokens.
- Exposer Swagger ou health checks de façon trop large.
- Créer des permissions trop complexes.
- Produire une documentation non maintenue.
- Laisser les tests critiques incomplets.
- Rendre Deployment implicitement dépendant de choix API non validés.
- Oublier les contrats nécessaires aux interfaces UI ou aux workflows de documentation et qualité.

## 44. Anti-patterns interdits

- Code métier projet dans le core.
- Secrets dans Git.
- JWT longue durée sans contrôle.
- Refresh token stocké sans sécurité.
- Swagger public en production sans validation.
- Upload sans validation.
- Logs contenant tokens, mots de passe ou données sensibles inutiles.
- Dépendance ajoutée par confort sans justification.
- ORM choisi sans ADR.
- Validation choisie sans ADR si le choix devient structurant.
- Queue, génération OpenAPI ou observabilité avancée choisie sans ADR si le choix devient structurant.
- Guards ou permissions contournables.
- Erreurs exposant stack trace ou détails internes en production.
- Génération IA massive sans revue humaine.

## 45. Checklist de validation

- [ ] Le périmètre du core est clair.
- [ ] Le hors périmètre est explicite.
- [ ] Les modules obligatoires sont listés.
- [ ] Les modules optionnels sont séparés.
- [ ] Les choix Prisma vs TypeORM et class-validator vs Zod sont renvoyés à ADR.
- [ ] Les exigences JWT, refresh token, RBAC et permissions sont couvertes.
- [ ] Les exigences validation, erreurs, logs et audit sont couvertes.
- [ ] Les exigences upload, Redis, queues, mail et notifications sont couvertes.
- [ ] Les intégrations Cloud, Mobile, Web, UI Kit, IA, Quality et Docs sont décrites.
- [ ] Les tests attendus sont définis.
- [ ] Les critères d'acceptation V1 sont définis.
- [ ] Les risques sont identifiés.
- [ ] Aucune logique métier projet n'est incluse.
- [ ] Aucun code applicatif n'est généré.

## 46. Conclusion

Le starter NestJS est le premier core prioritaire de la fondation. Il doit devenir le socle backend TypeScript standard pour les projets Enistere, tout en restant générique, sécurisé, documenté et extensible.

Cette spécification cadre le périmètre final attendu, mais ne remplace pas les futures décisions d'architecture. Les choix structurants, notamment ORM, validation, stratégie de génération OpenAPI, queue et certains aspects cloud, devront être validés par ADR avant implémentation.
