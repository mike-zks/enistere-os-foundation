# ADR-004 — Stratégie auth/session multi-client

## 1. Titre

Stratégie d'authentification et de gestion de session multi-client.

## 2. Statut

Validé.

## 3. Date

2026-05-30.

## 4. Contexte

Enistere OS Foundation doit fournir une stratégie d'authentification commune pour plusieurs types de clients :

- API Core NestJS ;
- Web Core Next.js ;
- Mobile Core React Native ;
- futurs clients Angular ;
- futurs clients Flutter ;
- projets dérivés web et mobiles.

Cette stratégie doit couvrir l'émission, l'utilisation, le stockage, le rafraîchissement, la révocation et l'invalidation des sessions.

Elle doit aussi rester compatible avec :

- ADR-011 sur le client HTTP ;
- ADR-012 sur le server state ;
- ADR-005 sur cookies web et CSRF ;
- ADR-006 sur RBAC et permissions fines ;
- les exigences de sécurité de la Phase 0.

Cette ADR ne crée aucun module Auth, guard, middleware, hook, composant login, schéma Prisma ou dépendance.

## 5. Problème

Une stratégie auth/session incohérente créerait des risques critiques :

- access tokens trop longs ;
- refresh tokens mal stockés ;
- logout uniquement local ;
- sessions impossibles à révoquer ;
- boucles infinies de refresh ;
- erreurs 401 / 403 confondues ;
- cookies web sans protection CSRF ;
- tokens exposés dans les logs ;
- permissions mélangées à l'authentification ;
- comportements différents entre web et mobile.

Il faut une stratégie multi-client claire avant de générer le starter API, les flows Web et les flows Mobile.

## 6. Options étudiées

### Option A — JWT access token long sans refresh token

Utiliser un JWT longue durée, stocké côté client, sans refresh token.

Avantages :

- mise en place simple ;
- peu d'endpoints auth ;
- pas de logique de refresh ;
- faible complexité initiale.

Inconvénients :

- session longue et difficile à révoquer ;
- fuite d'access token plus dangereuse ;
- logout serveur limité ;
- mauvaise adaptation aux clients multiples ;
- sécurité insuffisante pour une fondation réutilisable.

### Option B — Access token court + refresh token révocable

Utiliser un access token JWT court et un refresh token plus long, révocable et stocké selon les contraintes du client.

Avantages :

- réduction du risque en cas de fuite d'access token ;
- révocation possible ;
- logout serveur possible ;
- rotation refresh token possible ;
- bonne compatibilité web et mobile ;
- meilleure auditabilité ;
- séparation plus claire entre authentification, session et autorisation.

Inconvénients :

- complexité plus élevée ;
- stockage refresh token à sécuriser par client ;
- rotation et révocation à tester ;
- risque de boucle de refresh si mal implémenté ;
- cookies web et CSRF à cadrer séparément.

### Option C — Session serveur classique uniquement

Utiliser une session centralisée côté serveur, avec identifiant de session côté client.

Avantages :

- révocation centralisée ;
- modèle classique pour applications web ;
- contrôle serveur fort ;
- session state explicite.

Inconvénients :

- moins naturel pour clients mobiles et APIs multi-clients ;
- complexité de scalabilité et stockage session ;
- moins adapté à certains usages API stateless ;
- nécessite une stratégie cookies/CSRF forte côté web ;
- expérience mobile plus contrainte.

### Option D — Auth provider externe obligatoire

Déléguer toute l'authentification à un provider externe dès V1.

Avantages :

- fonctions avancées possibles ;
- délégation d'une partie de la sécurité ;
- SSO et social login plus accessibles ;
- conformité potentiellement facilitée selon provider.

Inconvénients :

- dépendance forte dès V1 ;
- coût et lock-in ;
- complexité d'intégration multi-projets ;
- moins adapté à une fondation interne générique ;
- ne supprime pas le besoin de gérer sessions applicatives, permissions et audit.

## 7. Décision

Enistere OS Foundation retient **l'Option B — Access token court + refresh token révocable**.

La décision officielle est :

```txt
Enistere OS Foundation adopte une stratégie auth/session multi-client basée sur :

- access token JWT court ;
- refresh token révocable ;
- rotation contrôlée des refresh tokens ;
- stockage adapté par type de client ;
- API Core NestJS comme autorité d'authentification ;
- séparation claire entre authentification, autorisation et session.
```

Précisions obligatoires :

```txt
L'API Core NestJS est l'autorité principale.
Le Web et le Mobile adaptent le stockage selon leurs contraintes.
Les providers externes peuvent être ajoutés plus tard, mais ne sont pas obligatoires en V1.
```

## 8. Raisons de la décision

Cette stratégie est retenue car elle permet :

- compatibilité web et mobile ;
- réduction du risque en cas de fuite d'access token ;
- révocation des sessions ;
- logout fiable ;
- rotation des refresh tokens ;
- meilleure sécurité multi-client ;
- intégration avec RBAC et permissions ;
- compatibilité avec les wrappers HTTP ADR-011 ;
- compatibilité avec TanStack Query ADR-012 ;
- meilleure expérience utilisateur ;
- meilleure auditabilité.

Elle équilibre sécurité, ergonomie utilisateur et maintenabilité pour une fondation multi-client.

## 9. Comparaison des options

| Critère | Option A JWT long | Option B access court + refresh | Option C session serveur | Option D provider externe |
|---|---|---|---|---|
| Sécurité | Faible à moyenne | Forte si bien implémentée | Forte côté serveur | Variable selon provider |
| Complexité | Faible | Moyenne | Moyenne à élevée | Moyenne à élevée |
| Compatibilité mobile | Simple mais risquée | Bonne | Moins naturelle | Bonne si SDK adapté |
| Compatibilité web | Simple mais risquée | Bonne | Très bonne | Bonne |
| Logout | Principalement local | Local + serveur | Serveur | Selon provider |
| Révocation | Difficile | Prévue | Prévue | Selon provider |
| Rotation | Non applicable | Recommandée | Non applicable ou session renewal | Selon provider |
| Expérience utilisateur | Simple | Bonne | Bonne web, variable mobile | Bonne si intégrée |
| Intégration API | Simple | Bonne | Plus stateful | Dépend du provider |
| Stockage tokens | Risqué si long | Adapté par client | Cookie/session id | Selon provider |
| Testabilité | Simple mais moins sûre | Bonne avec conventions | Bonne mais infra session | Dépend intégration |
| Auditabilité | Limitée | Bonne | Bonne | Dépend provider |
| Évolutivité future | Limitée | Bonne | Bonne web | Bonne mais lock-in |

## 10. Stratégie access token

L'access token doit être un JWT de courte durée.

Règles cibles :

- durée courte ;
- contenu minimal ;
- aucune donnée sensible inutile ;
- validation côté API ;
- signature avec secret ou clé hors Git ;
- usage pour authentifier les requêtes API ;
- renouvellement via refresh token contrôlé ;
- non-stockage dans `localStorage`.

L'access token ne doit pas être considéré comme une session durable.

## 11. Stratégie refresh token

Le refresh token est plus sensible que l'access token.

Règles cibles :

- durée contrôlée ;
- révocation possible ;
- rotation recommandée ;
- stockage adapté au client ;
- invalidation au logout si possible ;
- détection ou traitement de réutilisation suspecte si la stratégie l'implémente ;
- audit des refresh sensibles ;
- absence totale dans les logs.

Le refresh token ne doit jamais être stocké dans un stockage non sécurisé.

## 12. Stratégie session web

Pour le Web :

- refresh/session via cookie HttpOnly Secure SameSite si la stratégie cookie est retenue ;
- access token non stocké en `localStorage` ;
- protection contre CSRF si cookies utilisés ;
- routes protégées côté serveur autant que possible ;
- suppression du cookie/session au logout ;
- CORS strict côté API ;
- erreurs d'auth génériques côté UI.

Les détails cookies, SameSite, CSRF token et credentials seront cadrés par ADR-005.

## 13. Stratégie session mobile

Pour le Mobile :

- access token en mémoire si possible ;
- refresh token dans stockage sécurisé ;
- logout supprimant les tokens ;
- gestion expiration et refresh contrôlé ;
- restauration de session encadrée ;
- absence de refresh token dans AsyncStorage ou stockage non chiffré ;
- pas de log de tokens ;
- comportement offline documenté si activé plus tard.

Le choix détaillé SecureStore vs Keychain reste couvert par ADR-015.

## 14. Stratégie logout

Le logout doit être fiable côté client et côté serveur.

Règles cibles :

- suppression locale des tokens ou cookies ;
- invalidation serveur de la session ou du refresh token si possible ;
- nettoyage ou invalidation du cache TanStack Query ;
- retour à un état non authentifié ;
- audit log côté API pour logout sensible ;
- absence de réutilisation du refresh token après logout.

Un logout uniquement local est insuffisant dès que la révocation serveur est disponible.

## 15. Stratégie révocation

La révocation doit permettre de neutraliser une session ou un refresh token.

Cas à couvrir :

- logout ;
- suspicion de compromission ;
- changement de mot de passe ;
- suppression ou désactivation utilisateur ;
- rotation de secrets ;
- retrait d'accès administrateur ;
- invalidation manuelle par support/admin si un projet le prévoit.

La révocation doit être testable et documentée.

## 16. Stratégie rotation refresh token

La rotation des refresh tokens est recommandée.

Principes :

- un refresh réussi peut émettre un nouveau refresh token ;
- l'ancien refresh token doit être invalidé selon stratégie retenue ;
- une réutilisation suspecte doit être traitée comme un risque de compromission ;
- les rotations doivent être auditées ;
- les boucles de refresh doivent être empêchées côté client HTTP ;
- les erreurs doivent rester génériques.

La rotation exacte sera détaillée lors de l'implémentation AuthModule, sans changer cette décision.

## 17. Gestion 401 / 403

Les erreurs 401 et 403 doivent être distinguées.

- `401 Unauthorized` : utilisateur non authentifié, token absent, expiré ou invalide.
- `403 Forbidden` : utilisateur authentifié mais accès interdit.

Règles cibles :

- le client HTTP ADR-011 peut déclencher un refresh contrôlé sur certains 401 ;
- aucun refresh infini ;
- pas de refresh automatique sur 403 ;
- les messages UI ne doivent pas exposer de détails sensibles ;
- TanStack Query ADR-012 doit limiter les retries sur erreurs auth ;
- les logs ne doivent pas contenir les tokens.

## 18. Sécurité et audit

La stratégie doit couvrir :

- durée courte des access tokens ;
- durée contrôlée des refresh tokens ;
- rotation et révocation ;
- stockage sécurisé selon client ;
- protection contre vol de token ;
- protection contre réutilisation de refresh token ;
- audit logs sur login, logout, refresh et révocation ;
- rate limiting sur login et refresh ;
- erreurs génériques sur login ;
- HTTPS obligatoire en production ;
- CORS strict ;
- séparation des environnements ;
- gestion des sessions compromises.

Les secrets JWT, clés et configurations sensibles doivent rester hors Git.

## 19. Conséquences positives

- Stratégie auth cohérente entre API, Web et Mobile.
- Réduction du risque lié à la fuite d'un access token.
- Sessions révocables et logout plus fiable.
- Préparation claire pour RBAC et permissions.
- Meilleure compatibilité avec les wrappers HTTP.
- Meilleure gestion du cache au logout.
- Auditabilité renforcée sur les actions sensibles.
- Providers externes possibles plus tard sans être imposés en V1.

## 20. Conséquences négatives

- Implémentation plus complexe qu'un JWT longue durée.
- Besoin de persister ou suivre les refresh tokens/sessions côté API.
- Tests plus nombreux sur refresh, logout, révocation et rotation.
- Cookies web et CSRF nécessitent une ADR dédiée.
- Stockage mobile sécurisé nécessite une décision dédiée.
- Les clients doivent gérer correctement expiration et session expirée.

## 21. Risques

- Refresh token mal stocké.
- Access token stocké dans `localStorage`.
- Absence de révocation.
- Refresh token réutilisable indéfiniment.
- Boucle infinie de refresh.
- Logout côté client sans invalidation serveur.
- Cookies sans protection CSRF.
- Sessions non nettoyées.
- Logs contenant tokens.
- Erreurs d'auth trop détaillées.
- Mauvaise séparation auth, session et permissions.
- CORS trop permissif avec credentials.
- Secrets JWT committés accidentellement.

## 22. Alternatives rejetées

### Option A rejetée

Le JWT longue durée sans refresh token est rejeté car il rend la révocation difficile et augmente fortement l'impact d'une fuite de token.

### Option C rejetée comme stratégie unique

La session serveur classique uniquement est rejetée comme stratégie principale car elle est moins naturelle pour les clients mobiles et APIs multi-clients. Certains mécanismes session côté serveur peuvent toutefois compléter la stratégie retenue.

### Option D rejetée comme obligation V1

Un provider externe obligatoire est rejeté en V1 afin de préserver l'indépendance de la fondation. Des providers externes pourront être ajoutés plus tard si un projet le justifie.

## 23. Impact sur API Core NestJS

L'API Core NestJS devient l'autorité principale d'authentification.

Elle devra prévoir :

- émission access token et refresh token ;
- validation des tokens ;
- révocation ;
- rotation refresh token ;
- invalidation logout ;
- audit logs des actions sensibles ;
- rate limiting sur login et refresh ;
- endpoints auth documentés ;
- compatibilité future RBAC/permissions.

Les secrets JWT et clés doivent rester hors Git.

## 24. Impact sur Web Core Next.js

Le Web Core Next.js devra prévoir :

- flow login/logout/session expirée ;
- routes protégées côté serveur autant que possible ;
- access token non stocké en `localStorage` ;
- refresh/session via cookie HttpOnly Secure SameSite si la stratégie cookie est retenue ;
- gestion CSRF si cookies utilisés ;
- intégration avec le client HTTP ADR-011 ;
- nettoyage du cache ADR-012 au logout ;
- UI d'erreur auth sans fuite d'information.

Les détails cookies/CSRF seront traités dans ADR-005.

## 25. Impact sur Mobile Core React Native

Le Mobile Core React Native devra prévoir :

- auth flow ;
- protected routes ;
- access token en mémoire si possible ;
- refresh token en stockage sécurisé ;
- refresh contrôlé ;
- logout supprimant les tokens ;
- gestion session expirée ;
- nettoyage du cache ADR-012 au logout ;
- absence de token dans logs ou stockage non sécurisé.

Le choix précis du stockage sécurisé mobile sera traité dans ADR-015.

## 26. Impact sur Cloud Core

Le Cloud Core devra soutenir cette stratégie par :

- HTTPS obligatoire en production ;
- CORS strict côté exposition API ;
- secrets hors Git ;
- séparation des environnements ;
- logs sans secrets ;
- monitoring des endpoints auth si nécessaire ;
- rate limiting ou protections réseau complémentaires ;
- backups si les sessions/refresh tokens sont persistés en base.

Les services persistants comme PostgreSQL doivent rester non publics.

## 27. Impact sur ADR-011 Client HTTP

Le client HTTP doit :

- recevoir les tokens ou mécanismes auth depuis la couche session ;
- ne pas stocker lui-même les tokens ;
- gérer certains 401 avec refresh contrôlé ;
- éviter les boucles infinies ;
- ne jamais logger les tokens ;
- ne pas envoyer de headers sensibles vers des domaines non autorisés ;
- distinguer 401 et 403.

ADR-011 reste responsable du transport, pas de la politique auth.

## 28. Impact sur ADR-012 Server State

TanStack Query doit :

- vider ou invalider le cache au logout ;
- limiter les retries sur 401 / 403 ;
- éviter le cache indéfini de données sensibles ;
- refléter l'état session expirée ;
- ne jamais stocker les tokens dans le cache ;
- respecter les permissions utilisateur dans les données affichées.

ADR-012 reste responsable du cache serveur côté client, pas de l'émission des tokens.

## 29. Impact sur ADR-005 Cookies/CSRF

ADR-005 devra détailler :

- usage exact des cookies HttpOnly ;
- SameSite ;
- Secure ;
- stratégie CSRF ;
- credentials ;
- interaction CORS ;
- logout et suppression cookie ;
- protections web spécifiques.

Cette ADR-004 décide la stratégie auth globale, mais laisse les détails cookies/CSRF à ADR-005.

## 30. Impact sur ADR-006 RBAC/Permissions

ADR-006 devra détailler :

- modèle RBAC ;
- permissions fines ;
- guards ;
- visibilité UI ;
- conventions backend/frontend ;
- audit des actions sensibles ;
- gestion des rôles administratifs.

Cette ADR sépare explicitement authentification, session et autorisation.

## 31. Impact sur IA / Codex / Claude Code

Les agents IA doivent appliquer cette ADR lors de toute génération ou revue auth.

Ils doivent :

- utiliser access token court + refresh token révocable ;
- ne pas proposer de JWT longue durée sans contrôle ;
- ne pas stocker de token sensible dans `localStorage` ;
- prévoir logout local et invalidation serveur si possible ;
- distinguer 401 et 403 ;
- ne pas logger les tokens ;
- signaler tout cookie auth sans réflexion CSRF ;
- ne pas mélanger RBAC/permissions avec la stratégie session ;
- ne créer aucun code auth hors mission explicite.

L'IA assiste l'exécution et la revue, mais ne décide pas seule des durées de tokens ou de la politique de révocation.

## 32. Règles d'application

- Access token court.
- Refresh token révocable.
- Rotation refresh token recommandée.
- Logout doit invalider la session côté serveur si possible.
- Access token ne doit pas être stocké dans `localStorage`.
- Refresh token mobile doit utiliser un stockage sécurisé.
- Secrets et clés JWT hors Git.
- Tokens jamais loggés.
- 401 et 403 doivent être distingués.
- Le client HTTP ADR-011 doit gérer l'expiration de session de manière contrôlée.
- TanStack Query ADR-012 doit vider ou invalider le cache au logout.
- RBAC/permissions doivent être traités séparément dans ADR-006.
- Cookies web et CSRF doivent être détaillés dans ADR-005.
- HTTPS obligatoire en production.
- CORS strict.
- Rate limiting sur login et refresh.
- Erreurs de login génériques.

## 33. Conditions de révision future

Cette décision pourra être revue si :

- un provider externe devient nécessaire pour la majorité des projets ;
- les exigences SSO ou conformité imposent une autre architecture ;
- la stratégie refresh token devient trop coûteuse à maintenir ;
- les clients mobiles ou web imposent des contraintes nouvelles ;
- les incidents sécurité révèlent une faiblesse de la stratégie ;
- les projets dérivés accumulent des exceptions justifiées ;
- une stratégie session serveur devient plus adaptée à l'ensemble de la fondation.

Toute révision devra préserver la sécurité des tokens, la révocation, le logout fiable et la séparation authentification / autorisation.

## 34. Conclusion

Enistere OS Foundation adopte une stratégie auth/session multi-client basée sur un access token JWT court et un refresh token révocable avec rotation contrôlée.

L'API Core NestJS est l'autorité principale. Le Web et le Mobile adaptent le stockage selon leurs contraintes. Les cookies/CSRF, RBAC/permissions et stockage mobile sécurisé seront détaillés par ADR dédiées.
