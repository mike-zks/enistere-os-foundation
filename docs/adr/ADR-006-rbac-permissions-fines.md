# ADR-006 — RBAC et permissions fines

## 1. Titre

Stratégie d'autorisation RBAC et permissions fines.

## 2. Statut

Validé.

## 3. Date

2026-05-30.

## 4. Contexte

Enistere OS Foundation doit fournir une stratégie d'autorisation réutilisable pour plusieurs types de projets : APIs, dashboards, backoffices, portails clients, applications mobiles, SaaS et outils internes.

ADR-004 a séparé l'authentification, la session et l'autorisation. Cette ADR définit la stratégie d'autorisation pour :

- API Core NestJS ;
- Web Core Next.js ;
- Mobile Core React Native ;
- futurs clients Angular / Flutter ;
- `UsersModule` ;
- `RolesModule` ;
- `PermissionsModule` ;
- guards, decorators et policies futurs ;
- UI conditionnelle ;
- audit logs ;
- tests de permissions.

Cette ADR ne crée aucun code NestJS, guard, decorator, modèle Prisma, schéma de base de données, composant UI, package ou dépendance.

## 5. Problème

Une stratégie d'autorisation mal cadrée provoque rapidement :

- rôles trop nombreux ;
- permissions incohérentes ;
- logique d'accès dispersée dans les controllers ;
- endpoints non protégés alors que l'UI masque les boutons ;
- confusion entre authentification et autorisation ;
- erreurs 401 / 403 incohérentes ;
- absence d'audit sur actions sensibles ;
- tests de permissions incomplets ;
- divergence entre projets dérivés.

Il faut donc une stratégie stable, générique et extensible sans imposer de logique métier spécifique.

## 6. Options étudiées

### Option A — RBAC simple uniquement

Utiliser uniquement des rôles comme `admin`, `user`, `manager`, `seller`, `delivery` ou équivalent.

Avantages :

- simple à comprendre ;
- rapide à implémenter ;
- adapté aux petits projets ;
- lisible côté UI.

Inconvénients :

- peu précis pour les actions sensibles ;
- explosion possible du nombre de rôles ;
- difficile à adapter aux besoins métier fins ;
- faible auditabilité des droits réels ;
- risque de donner trop de privilèges.

### Option B — Permissions fines uniquement

Utiliser uniquement des permissions action/ressource sans rôles structurants.

Avantages :

- contrôle très précis ;
- bonne granularité ;
- évolutif pour actions sensibles ;
- permissions testables directement.

Inconvénients :

- complexité élevée dès V1 ;
- administration plus difficile ;
- compréhension moins directe pour les utilisateurs ;
- risque de trop nombreuses permissions ;
- configuration initiale plus lourde.

### Option C — RBAC + permissions fines

Utiliser les rôles comme base de regroupement, puis des permissions fines pour les actions précises.

Avantages :

- simplicité initiale ;
- extensibilité métier ;
- sécurité plus précise ;
- compatibilité avec plusieurs types de projets ;
- meilleure auditabilité ;
- protection fine des endpoints sensibles ;
- cohérence API, web et mobile ;
- tests de permissions plus explicites.

Inconvénients :

- nécessite des conventions de nommage ;
- risque de granularité excessive ;
- guards/policies à cadrer ;
- documentation des permissions obligatoire ;
- administration plus riche que du RBAC simple.

### Option D — Autorisation libre par projet

Chaque projet dérivé définit librement sa stratégie d'autorisation.

Avantages :

- flexibilité maximale ;
- adaptation locale rapide ;
- faible gouvernance initiale.

Inconvénients :

- forte divergence entre projets ;
- sécurité difficile à auditer ;
- prompts IA moins fiables ;
- réutilisation faible ;
- duplication des patterns ;
- erreurs 401 / 403 et UI conditionnelle incohérentes.

## 7. Décision

Enistere OS Foundation retient **l'Option C — RBAC + permissions fines**.

La décision officielle est :

```txt
Enistere OS Foundation adopte une stratégie d'autorisation basée sur RBAC + permissions fines.

RBAC fournit les rôles globaux.
Les permissions fines contrôlent les actions précises sur les ressources.
L'API Core NestJS reste l'autorité principale pour l'évaluation des droits.
```

Distinction obligatoire :

```txt
Authentification :
- Qui est l'utilisateur ?

Autorisation :
- Qu'a-t-il le droit de faire ?

Rôles :
- Regroupements de responsabilités.

Permissions :
- Actions précises autorisées ou refusées.
```

RBAC est la base V1. Les permissions fines deviennent le mécanisme standard pour les actions sensibles. Les projets dérivés peuvent ajouter leurs rôles et permissions métier sans casser le socle.

## 8. Raisons de la décision

Cette stratégie est retenue car elle permet :

- simplicité initiale ;
- extensibilité métier ;
- sécurité plus précise ;
- compatibilité avec plusieurs types de projets ;
- séparation claire auth/session et autorisation ;
- meilleure auditabilité ;
- meilleure protection des endpoints sensibles ;
- cohérence entre API, web et mobile ;
- affichage UI conditionnel plus fiable ;
- tests de permissions plus explicites ;
- meilleure génération contrôlée par Codex / Claude Code.

Elle évite à la fois le RBAC trop grossier et les permissions fines trop lourdes sans regroupement.

## 9. Comparaison des options

| Critère | Option A RBAC simple | Option B permissions seules | Option C RBAC + permissions | Option D libre par projet |
|---|---|---|---|---|
| Simplicité | Forte | Faible à moyenne | Moyenne | Variable |
| Sécurité | Moyenne | Forte si bien gérée | Forte | Variable |
| Maintenabilité | Bonne au début | Complexe | Bonne avec conventions | Faible globalement |
| Scalabilité | Limitée | Forte | Forte | Variable |
| Lisibilité | Forte | Moyenne | Bonne | Variable |
| Auditabilité | Moyenne | Forte | Forte | Faible globalement |
| Compatibilité API | Bonne | Bonne | Très bonne | Variable |
| Compatibilité web/mobile | Bonne mais limitée | Complexe | Bonne | Variable |
| Projets dérivés | Risque d'explosion rôles | Risque de complexité | Extensible | Divergent |
| Testabilité | Moyenne | Forte | Forte | Variable |
| Complexité | Faible | Élevée | Maîtrisée | Variable |
| Risques d'erreur | Rôles trop larges | Permissions trop fines | Granularité à cadrer | Élevés |
| Évolutivité | Moyenne | Forte | Forte | Faible au niveau fondation |

## 10. Modèle conceptuel RBAC + permissions

Le modèle conceptuel attendu est générique et ne crée aucun schéma réel.

Entités conceptuelles :

- `User` : utilisateur authentifié.
- `Role` : regroupement de responsabilités.
- `Permission` : action précise autorisée sur une ressource.
- `UserRole` : association entre utilisateur et rôle.
- `RolePermission` : association entre rôle et permission.
- `DirectUserPermission` : permission directe éventuelle, réservée aux besoins futurs ou exceptions documentées.
- `Resource` : domaine ou ressource protégée.
- `Action` : action autorisée ou refusée.
- `Scope` : périmètre éventuel, par exemple global, organisation, tenant ou ressource spécifique si un projet le nécessite.

Exemples génériques de permissions :

```txt
users.read
users.create
users.update
users.delete
roles.manage
permissions.manage
files.upload
files.delete
settings.read
settings.update
audit.read
```

Aucune permission métier spécifique à un projet dérivé ne doit être ajoutée dans la fondation.

## 11. Stratégie rôles

Les rôles servent à regrouper des permissions.

Principes :

- rôles simples en V1 ;
- rôles documentés ;
- rôles orientés responsabilités, pas écrans UI ;
- évitement des rôles trop nombreux ;
- possibilité pour les projets dérivés d'ajouter leurs rôles métier ;
- séparation claire des rôles administratifs et utilisateurs standard.

Les rôles ne doivent pas remplacer toute la logique fine de permissions.

## 12. Stratégie permissions

Les permissions contrôlent les actions précises sur les ressources.

Principes :

- nommage stable ;
- format lisible de type `resource.action` ;
- permissions documentées ;
- permissions critiques testées ;
- permissions sensibles auditées ;
- granularité raisonnable en V1 ;
- extension possible par projet dérivé via convention documentée.

Les permissions ne doivent pas devenir trop granulaires avant que le besoin soit réel.

## 13. Stratégie guards/policies

Les endpoints sensibles doivent être protégés par guards, policies ou mécanismes équivalents.

Principes :

- deny by default ;
- vérification serveur obligatoire ;
- logique d'autorisation centralisée autant que possible ;
- pas de règles implicites dispersées dans les controllers ;
- validation des paramètres avant vérification métier ;
- tests de non-régression permissions ;
- distinction claire entre auth guard et permissions guard.

Les policies peuvent être introduites lorsque la logique dépend du contexte métier ou de la ressource.

## 14. Stratégie UI conditionnelle

Les clients Web et Mobile peuvent utiliser les rôles et permissions pour adapter l'interface.

Règles :

- masquer ou afficher des actions selon les droits ;
- afficher des états unauthorized/forbidden cohérents ;
- ne jamais considérer l'UI comme barrière de sécurité finale ;
- maintenir la cohérence avec l'API ;
- prévoir des tests UI sur permissions critiques si nécessaire.

Une UI cachée sans endpoint protégé est un anti-pattern critique.

## 15. Stratégie audit logs

Les actions sensibles doivent produire des audit logs.

Exemples génériques :

- gestion d'utilisateurs ;
- attribution ou retrait de rôles ;
- gestion de permissions ;
- accès admin ;
- suppression de fichiers ;
- changement de paramètres ;
- consultation d'audit logs.

Les audit logs doivent éviter de stocker des secrets ou données sensibles inutiles.

## 16. Stratégie erreurs 401 / 403

Les erreurs doivent rester cohérentes :

- `401 Unauthorized` : utilisateur non authentifié.
- `403 Forbidden` : utilisateur authentifié mais non autorisé.

Règles :

- ne pas masquer un défaut de permission en erreur générique si cela nuit à l'UX ;
- ne pas révéler d'informations sensibles dans les messages ;
- éviter les retries inutiles sur 403 ;
- connecter les états UI unauthorized/forbidden au UI Kit ;
- aligner API, Web et Mobile.

## 17. Conséquences positives

- Autorisation plus précise que du RBAC simple.
- Rôles compréhensibles et permissions testables.
- Meilleure protection des endpoints sensibles.
- UI conditionnelle plus fiable.
- Auditabilité renforcée.
- Projets dérivés capables d'étendre sans casser le socle.
- Meilleure séparation entre auth/session et autorisation.
- Standards plus faciles à appliquer par les agents IA.

## 18. Conséquences négatives

- Modèle plus riche que des rôles simples.
- Documentation des permissions obligatoire.
- Tests de permissions nécessaires.
- Risque de sur-granularité.
- Administration des rôles/permissions à cadrer.
- Les petits projets devront parfois limiter volontairement la granularité.

## 19. Risques

- Rôles trop nombreux.
- Permissions trop granulaires dès V1.
- Logique de permissions dispersée dans les controllers.
- Décisions d'accès uniquement côté frontend.
- UI cachée mais endpoint non protégé.
- Confusion entre 401 et 403.
- Absence d'audit sur actions sensibles.
- Permissions non testées.
- Surcomplexité pour petits projets.
- Divergence entre projets dérivés.
- Permissions métier ajoutées dans la fondation au lieu des projets.

## 20. Alternatives rejetées

### Option A rejetée comme stratégie suffisante

Le RBAC simple uniquement est rejeté car il devient vite trop grossier pour protéger les actions sensibles.

### Option B rejetée comme stratégie V1 seule

Les permissions fines seules sont rejetées car elles ajoutent trop de complexité sans rôles structurants pour regrouper les responsabilités.

### Option D rejetée

L'autorisation libre par projet est rejetée car elle créerait une divergence forte et rendrait la sécurité difficile à auditer au niveau fondation.

## 21. Impact sur API Core NestJS

Le API Core NestJS devra prévoir :

- `RolesModule` ;
- `PermissionsModule` ;
- guards ou policies ;
- decorators éventuels ;
- seed minimal de rôles/permissions de base si validé ;
- audit logs sur actions sensibles ;
- tests de permissions ;
- distinction 401 / 403 ;
- validation des paramètres avant vérification métier.

L'API reste l'autorité finale pour l'évaluation des droits.

## 22. Impact sur Web Core Next.js

Le Web Core Next.js devra prévoir :

- UI conditionnelle selon rôles/permissions ;
- routes protégées ;
- états unauthorized/forbidden ;
- gestion claire des erreurs 401 / 403 ;
- aucune confiance exclusive dans le frontend ;
- tests permissions UI si nécessaire ;
- alignement avec les permissions exposées par l'API.

Les dashboards et backoffices devront respecter cette stratégie.

## 23. Impact sur Mobile Core React Native

Le Mobile Core React Native devra prévoir :

- UI conditionnelle selon droits ;
- protected routes ;
- états unauthorized/forbidden ;
- absence de décision d'accès uniquement mobile ;
- cohérence avec l'API ;
- gestion propre des erreurs permissions.

Les permissions natives mobile restent un sujet différent des permissions applicatives RBAC.

## 24. Impact sur ADR-004 Auth/session

ADR-004 définit l'authentification et la session.

ADR-006 définit l'autorisation.

La séparation est obligatoire :

- auth/session : qui est l'utilisateur et quelle session est active ;
- RBAC/permissions : ce que l'utilisateur a le droit de faire.

Un utilisateur authentifié peut recevoir un `403` s'il n'a pas la permission nécessaire.

## 25. Impact sur ADR-011 Client HTTP

Le client HTTP devra :

- transmettre les erreurs 401 / 403 de manière normalisée ;
- ne pas déclencher de refresh automatique sur 403 ;
- ne pas masquer les erreurs d'autorisation ;
- éviter les retries inutiles sur 403 ;
- ne pas exposer de détails sensibles dans les logs.

ADR-011 ne décide pas des permissions, il transporte les réponses API.

## 26. Impact sur ADR-012 Server State

TanStack Query devra :

- respecter les permissions utilisateur dans les données affichées ;
- invalider ou nettoyer le cache au changement de session ;
- éviter de conserver des données accessibles à un ancien rôle ;
- limiter les retries sur 403 ;
- connecter les états forbidden au UI Kit.

Les permissions peuvent influencer les query keys ou invalidations si un projet le justifie.

## 27. Impact sur IA / Codex / Claude Code

Les agents IA doivent appliquer cette ADR lors de la génération ou revue d'authz.

Ils doivent :

- distinguer authentification et autorisation ;
- utiliser RBAC + permissions fines comme stratégie standard ;
- ne pas créer de permissions métier spécifiques dans la fondation ;
- éviter les décisions d'accès uniquement côté UI ;
- signaler les endpoints sensibles sans guard/policy ;
- distinguer 401 et 403 ;
- demander des tests pour permissions critiques ;
- signaler l'absence d'audit sur actions sensibles ;
- ne créer aucun code, guard, decorator ou modèle hors mission explicite.

L'IA assiste l'exécution et la revue, mais ne décide pas seule de la granularité finale des permissions métier.

## 28. Règles d'application

- L'API est l'autorité finale des permissions.
- Le frontend peut masquer ou afficher l'UI selon les droits, mais ne doit jamais être l'unique barrière.
- `401` signifie non authentifié.
- `403` signifie authentifié mais non autorisé.
- Les endpoints sensibles doivent être protégés par guards/policies.
- Les permissions doivent être nommées de manière stable.
- Les rôles doivent regrouper des permissions, pas remplacer toute la logique fine.
- Les permissions doivent être documentées.
- Les actions sensibles doivent produire des audit logs.
- Les permissions critiques doivent être testées.
- Les projets dérivés peuvent étendre les permissions via convention documentée.
- Deny by default.
- Least privilege.
- Séparation admin/user.
- Validation des paramètres avant vérification métier.
- Pas de permissions métier spécifiques dans la fondation.

## 29. Conditions de révision future

Cette décision pourra être revue si :

- la granularité devient trop lourde pour la majorité des projets ;
- un modèle ABAC ou policy engine devient nécessaire ;
- les projets dérivés accumulent des exceptions justifiées ;
- les besoins multi-tenant imposent des scopes plus avancés ;
- la gestion directe de permissions utilisateur devient indispensable ;
- les tests ou audits révèlent des failles de modèle.

Toute révision devra préserver deny by default, least privilege et l'autorité finale de l'API.

## 30. Conclusion

Enistere OS Foundation adopte RBAC + permissions fines comme stratégie officielle d'autorisation.

Les rôles regroupent les responsabilités, les permissions contrôlent les actions précises sur les ressources, et l'API Core NestJS reste l'autorité finale. Les projets dérivés peuvent étendre le modèle sans casser le socle générique de la fondation.
