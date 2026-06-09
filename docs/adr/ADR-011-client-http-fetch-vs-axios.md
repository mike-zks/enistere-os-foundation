# ADR-011 — Client HTTP : fetch vs Axios

## 1. Titre

Stratégie Client HTTP Web et Mobile pour Enistere OS Foundation.

## 2. Statut

Validé.

## 3. Date

2026-05-30.

## 4. Contexte

Enistere OS Foundation doit fournir une stratégie HTTP commune pour le Web Core Next.js, le Mobile Core React Native et leurs projets dérivés.

Les clients web et mobile doivent consommer les APIs exposées par l'API Core NestJS, notamment :

- appels JSON ;
- authentification ;
- refresh token ;
- erreurs API normalisées ;
- upload multipart ;
- pagination ;
- mutations ;
- compatibilité future avec OpenAPI ;
- intégration avec TanStack Query ou une stratégie server state validée.

Les spécifications existantes demandent déjà une vigilance forte sur les uploads multipart en React Native : `fetch + FormData` doit être privilégié et le header `Content-Type: multipart/form-data` ne doit pas être forcé manuellement si cela casse le boundary.

Cette ADR choisit la stratégie HTTP officielle sans créer de client réel, de package, de code ou de dépendance.

## 5. Problème

Sans décision formelle, les projets pourraient mélanger `fetch`, Axios ou d'autres clients HTTP dans les features.

Cela créerait :

- duplication de la logique HTTP ;
- erreurs API incohérentes ;
- refresh token implémenté plusieurs fois ;
- retries non contrôlés ;
- timeouts absents ;
- logs contenant des données sensibles ;
- uploads React Native instables ;
- typage dispersé ;
- intégration OpenAPI plus coûteuse ;
- difficulté de test et de revue IA.

Il faut donc définir une stratégie commune, simple, testable et compatible Web / React Native.

## 6. Options étudiées

### Option A — Axios comme client HTTP unique

Utiliser Axios partout : Web, Mobile, JSON, upload et refresh token.

Avantages :

- API développeur connue ;
- intercepteurs intégrés ;
- gestion historique des erreurs et timeouts ;
- écosystème riche.

Inconvénients :

- dépendance obligatoire supplémentaire ;
- comportement multipart parfois problématique en React Native ;
- risque de forcer des conventions Axios dans tous les cores ;
- upload mobile plus fragile si les headers multipart sont mal gérés ;
- moins aligné avec les APIs natives modernes ;
- peut masquer des décisions de wrapper qui doivent rester explicites.

### Option B — fetch natif avec wrappers Enistere

Utiliser `fetch` comme base commune, avec une couche wrapper Enistere pour normaliser erreurs, auth, timeout, typage, retries et uploads.

Avantages :

- meilleure compatibilité Web / React Native ;
- réduction des dépendances obligatoires ;
- maîtrise explicite du comportement HTTP ;
- meilleure maîtrise des uploads multipart en React Native ;
- wrappers testables ;
- compatibilité avec TanStack Query ;
- compatibilité future avec un client OpenAPI généré ;
- contrôle centralisé des erreurs et logs ;
- possibilité d'autoriser Axios par exception documentée.

Inconvénients :

- nécessité de construire une couche wrapper propre ;
- certains mécanismes doivent être implémentés explicitement : timeout, retries, erreurs ;
- discipline nécessaire pour éviter les appels `fetch` directs dans les features ;
- refresh token à cadrer avec l'ADR auth/session.

### Option C — Mix libre par projet

Chaque projet choisit librement entre `fetch`, Axios ou autre client HTTP.

Avantages :

- liberté maximale ;
- adaptation locale rapide ;
- faible gouvernance initiale.

Inconvénients :

- incohérence forte entre projets ;
- duplication de logique ;
- erreurs API non standardisées ;
- risque sécurité plus élevé ;
- upload, refresh et retries divergents ;
- maintenance plus coûteuse ;
- génération OpenAPI future moins prévisible.

### Option D — Client généré OpenAPI uniquement

Utiliser uniquement un client généré depuis OpenAPI, sans wrapper manuel.

Avantages :

- typage potentiellement fort ;
- contrats API alignés avec la documentation ;
- réduction de certains appels manuels ;
- industrialisation intéressante à terme.

Inconvénients :

- dépend d'une stratégie OpenAPI encore à valider ;
- ne couvre pas forcément les besoins spécifiques d'auth, refresh, upload, logs et retries ;
- peut produire un client trop rigide pour V1 ;
- nécessite une qualité OpenAPI stable dès le départ ;
- ne remplace pas une politique de transport et de sécurité.

## 7. Décision

Enistere OS Foundation retient **l'Option B — fetch natif avec wrappers Enistere**.

La décision officielle est :

```txt
Enistere OS Foundation adopte fetch comme base HTTP officielle pour Web et React Native, encapsulé dans des wrappers applicatifs Enistere.

Axios n'est pas interdit, mais il n'est pas la base standard V1. Il peut être utilisé uniquement si un projet le justifie explicitement.
```

Pour les uploads multipart en React Native :

```txt
Les uploads multipart/form-data doivent utiliser fetch + FormData par défaut en React Native.

Il ne faut pas forcer manuellement le header Content-Type multipart/form-data lorsque cela casse le boundary.
```

La stratégie V1 utilise donc `fetch` comme socle. Les wrappers Enistere normalisent l'expérience développeur. La génération OpenAPI reste une évolution future possible. Axios reste autorisé par exception documentée.

## 8. Raisons de la décision

Cette stratégie est retenue car elle permet :

- meilleure compatibilité Web / React Native ;
- meilleure maîtrise des uploads multipart en React Native ;
- réduction des dépendances obligatoires ;
- contrôle centralisé des erreurs API ;
- wrappers testables ;
- compatibilité avec TanStack Query ;
- compatibilité future avec OpenAPI ;
- meilleure sécurité sur tokens et logs ;
- liberté d'utiliser Axios si un projet a un besoin spécifique.

Elle évite de verrouiller toute la fondation sur une dépendance HTTP externe dès V1.

## 9. Conséquences positives

- Les appels API passent par une couche commune.
- Les erreurs API peuvent être normalisées pour Web et Mobile.
- Les uploads multipart React Native sont cadrés explicitement.
- Les timeouts et retries peuvent être testés dans une couche unique.
- Les tokens restent fournis par la couche auth/session, pas stockés dans le client HTTP.
- Les hooks TanStack Query peuvent consommer des fonctions API prévisibles.
- Un futur client OpenAPI généré pourra s'intégrer derrière ou à côté des wrappers.

## 10. Conséquences négatives

- Il faudra maintenir les wrappers Enistere.
- Les projets ne pourront pas utiliser Axios par habitude sans justification.
- Les comportements de timeout, retry et refresh devront être soigneusement cadrés.
- Les features devront respecter la discipline de ne pas appeler `fetch` directement partout.
- La stratégie OpenAPI future devra être intégrée sans dupliquer le transport.

## 11. Risques

- Wrapper trop complexe.
- Duplication de logique HTTP dans les features.
- Refresh token mal géré ou déclenché en boucle.
- Retries infinis ou trop agressifs.
- Logs contenant des tokens ou données sensibles.
- Envoi de headers sensibles à des domaines non autorisés.
- Upload multipart React Native cassé par headers manuels incorrects.
- Erreurs critiques masquées silencieusement.
- Incompatibilité future avec un client OpenAPI généré si la couche wrapper est mal conçue.

## 12. Alternatives rejetées

### Option A rejetée comme standard V1

Axios n'est pas retenu comme client unique car il ajouterait une dépendance obligatoire et peut complexifier les uploads multipart en React Native. Il reste autorisé si un projet documente un besoin spécifique.

### Option C rejetée

Le mix libre par projet est rejeté car il créerait une forte divergence entre Web, Mobile et projets dérivés.

### Option D rejetée comme stratégie unique V1

Le client OpenAPI généré uniquement est rejeté pour V1 car la stratégie OpenAPI avancée reste à formaliser. La génération de clients typés reste une évolution future possible.

## 13. Impact sur Mobile Core React Native

Le Mobile Core React Native devra prévoir :

- un wrapper API basé sur `fetch` ;
- un wrapper upload spécialisé si nécessaire ;
- `fetch + FormData` pour les uploads multipart ;
- gestion claire des erreurs réseau et API ;
- timeout ou abort via `AbortController` si disponible et validé ;
- refresh token piloté par la couche auth/session ;
- intégration avec TanStack Query ;
- absence de logs contenant tokens ou données sensibles.

Axios ne doit pas être utilisé pour les uploads multipart React Native sans justification explicite et tests sur les boundaries.

## 14. Impact sur Web Core Next.js

Le Web Core Next.js devra prévoir :

- appels JSON via wrapper `fetch` ;
- séparation entre appels serveur et client si nécessaire ;
- gestion des cookies ou headers selon l'ADR auth/session ;
- erreurs API normalisées ;
- timeouts et retries limités ;
- compatibilité avec TanStack Query ou stratégie server state validée ;
- compatibilité avec un futur client OpenAPI généré ;
- absence de secrets dans le bundle client.

Le wrapper web ne doit pas contourner les règles de sécurité applicables aux cookies, CSRF, CORS et variables publiques.

## 15. Impact sur API Core NestJS

L'API Core NestJS devra exposer des contrats compatibles avec les wrappers clients :

- format d'erreur standard ;
- codes HTTP cohérents ;
- réponses JSON typables ;
- endpoints d'auth et refresh explicites ;
- endpoints upload compatibles multipart ;
- documentation OpenAPI maintenable ;
- pagination et mutations documentées ;
- erreurs 401 / 403 distinguées.

L'API reste responsable de la validation backend et de la sécurité serveur.

## 16. Impact sur upload fichiers

La stratégie upload est explicitement cadrée :

- Web et Mobile doivent utiliser une fonction spécialisée pour les uploads.
- React Native doit privilégier `fetch + FormData`.
- Le header `Content-Type: multipart/form-data` ne doit pas être forcé manuellement si cela casse le boundary.
- La taille maximale, les types autorisés et les erreurs doivent être gérés avec l'API Core UploadModule.
- Les URLs signées, si retenues plus tard, devront être intégrées sans exposer de secret.
- Les erreurs réseau et serveur doivent être normalisées.

L'ADR-007 devra détailler les contrats de fichiers et la stratégie MinIO/S3.

## 17. Impact sur auth/session

Le client HTTP ne doit pas stocker les tokens lui-même.

La couche auth/session devra fournir les tokens ou mécanismes nécessaires :

- access token si la stratégie retenue l'utilise côté client ;
- cookies HttpOnly si la stratégie web les retient ;
- refresh token en stockage sécurisé mobile ;
- logout et invalidation session ;
- gestion d'expiration claire ;
- traitement 401 / 403 sans boucle infinie.

Le refresh automatique doit être encadré, limité et observable. Les erreurs critiques ne doivent pas être masquées.

## 18. Impact sur OpenAPI futur

La génération OpenAPI reste une évolution future possible.

Le wrapper `fetch` doit être conçu pour pouvoir :

- consommer un client généré ;
- être remplacé partiellement par un client généré ;
- normaliser les erreurs même avec un client généré ;
- conserver la politique de timeout, retry, logs et sécurité ;
- éviter la duplication entre client généré et fonctions manuelles.

L'ADR-016 devra traiter la stratégie OpenAPI et génération de clients typés.

## 19. Impact sur IA / Codex / Claude Code

Les agents IA doivent appliquer cette ADR lors de la génération ou revue de clients API.

Ils doivent :

- privilégier `fetch` via wrappers Enistere ;
- éviter les appels `fetch` dispersés dans les features ;
- utiliser `fetch + FormData` pour l'upload multipart React Native ;
- ne pas forcer le header multipart si cela casse le boundary ;
- ne pas introduire Axios sans justification explicite ;
- signaler les logs sensibles ;
- vérifier la gestion 401 / 403, timeout et retries ;
- maintenir la compatibilité avec TanStack Query et OpenAPI futur.

L'IA assiste l'implémentation et la revue, mais ne décide pas seule d'une exception Axios.

## 20. Règles d'application

- Les appels API doivent passer par un wrapper central.
- Les uploads doivent passer par une fonction spécialisée.
- Les features ne doivent pas appeler `fetch` directement partout.
- Les erreurs API doivent être normalisées.
- Les timeouts doivent être prévus.
- Les retries doivent être limités.
- Les mutations doivent rester compatibles avec TanStack Query.
- Les tokens doivent être fournis par la couche auth/session, pas codés dans le client HTTP.
- Axios doit être justifié si utilisé.
- L'upload React Native doit privilégier `fetch + FormData`.
- Les logs ne doivent jamais contenir access token, refresh token ou données sensibles.
- Les headers sensibles ne doivent pas être envoyés à des domaines non autorisés.
- HTTPS est obligatoire en production.
- Les erreurs critiques ne doivent pas être masquées silencieusement.

## 21. Conditions de révision future

Cette décision pourra être revue si :

- Axios devient nécessaire pour un besoin transverse démontré ;
- la génération OpenAPI devient la source principale des clients ;
- les wrappers `fetch` deviennent trop complexes à maintenir ;
- React Native ou Next.js modifient fortement leurs pratiques HTTP recommandées ;
- des contraintes de sécurité imposent une autre stratégie ;
- des projets dérivés accumulent des exceptions Axios justifiées ;
- l'ADR auth/session impose une mécanique incompatible avec cette stratégie.

Toute révision devra préserver la sécurité des tokens, la compatibilité Web / Mobile et la cohérence des erreurs API.

## 22. Conclusion

Enistere OS Foundation adopte `fetch` comme socle HTTP officiel pour Web et React Native, encapsulé dans des wrappers Enistere.

Axios reste possible par exception documentée, mais n'est pas la base standard V1. Les uploads multipart React Native doivent privilégier `fetch + FormData`, avec une vigilance explicite sur les headers et le boundary.
