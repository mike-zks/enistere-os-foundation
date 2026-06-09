# 07_SECURITY.md

# Enistere OS Foundation — Stratégie de Sécurité

## 1. Résumé exécutif

Ce document définit les standards de sécurité applicables à Enistere OS Foundation.

La sécurité doit être intégrée dès la conception de chaque core, module, composant, script, pipeline, API, application mobile, application web ou infrastructure cloud.

Enistere OS Foundation doit appliquer une approche :

```txt
Security by Design
Security by Default
Defense in Depth
Least Privilege
Zero Trust autant que possible
```

L’objectif est de construire une fondation capable de servir des projets sérieux, notamment :

* e-commerce ;
* livraison ;
* marketplace ;
* immobilier ;
* finance ;
* administration ;
* KYC ;
* SaaS ;
* backoffice métier ;
* applications mobiles grand public ;
* applications mobiles professionnelles ;
* plateformes IA.

---

## 2. Objectifs de sécurité

Les objectifs principaux sont :

```txt
- protéger les utilisateurs
- protéger les données
- protéger les secrets
- sécuriser les APIs
- sécuriser les applications mobiles
- sécuriser les applications web
- sécuriser l’infrastructure cloud
- sécuriser les uploads
- sécuriser les logs
- sécuriser les dépendances
- sécuriser les pipelines CI/CD
- encadrer l’usage de l’IA
```

La sécurité doit être considérée comme une responsabilité transversale, pas comme une fonctionnalité secondaire.

---

## 3. Principes fondamentaux

## 3.1 Sécurité par défaut

Chaque core doit intégrer des paramètres sûrs par défaut.

Exemples :

```txt
- validation des entrées activée
- CORS restreint
- rate limiting activable
- secrets hors Git
- logs sensibles masqués
- headers de sécurité activés
- permissions minimales
- stockage sécurisé des tokens
```

---

## 3.2 Principe du moindre privilège

Un utilisateur, service, token, conteneur ou script ne doit avoir que les droits nécessaires à son rôle.

Exemples :

```txt
- un utilisateur buyer ne peut pas accéder aux routes admin
- un livreur ne peut pas modifier les paramètres financiers
- un service upload ne doit pas accéder aux secrets CI/CD
- une clé API publique ne doit jamais avoir des droits d’administration
```

---

## 3.3 Défense en profondeur

Ne jamais dépendre d’une seule barrière de sécurité.

Exemple pour une route sensible :

```txt
JWT valide
+ rôle requis
+ permission spécifique
+ validation DTO
+ audit log
+ rate limiting
```

---

## 3.4 Validation systématique

Toutes les données entrantes doivent être validées.

Sources concernées :

```txt
- body HTTP
- query params
- route params
- headers
- fichiers uploadés
- payload WebSocket
- variables d’environnement
- données venant d’APIs externes
- données générées par IA
```

---

## 3.5 Traçabilité

Les actions sensibles doivent être journalisées.

Exemples :

```txt
- login
- logout
- refresh token
- changement mot de passe
- changement rôle
- validation payout
- upload fichier
- suppression compte
- accès admin
- modification configuration
```

---

## 4. Classification des données

Les données doivent être classées par niveau de sensibilité.

## 4.1 Données publiques

Exemples :

```txt
- nom public d’un produit
- image publique d’un article
- description publique
- contenu marketing
```

Protection minimale :

```txt
- intégrité
- disponibilité
```

---

## 4.2 Données internes

Exemples :

```txt
- logs techniques
- métriques internes
- configurations non sensibles
- statuts de jobs
```

Protection :

```txt
- accès limité
- logs contrôlés
- non-exposition publique
```

---

## 4.3 Données sensibles

Exemples :

```txt
- email
- téléphone
- adresse
- localisation
- historique commandes
- documents d’identité
- informations de paiement
- tokens
- données de profil
```

Protection :

```txt
- accès strict
- chiffrement si nécessaire
- masquage logs
- audit
- minimisation
```

---

## 4.4 Secrets

Exemples :

```txt
- JWT secret
- database password
- access keys MinIO/S3
- API keys
- OAuth secrets
- webhook secrets
- private keys
- tokens CI/CD
```

Protection :

```txt
- jamais dans Git
- jamais dans logs
- rotation possible
- stockage dans secrets manager ou variables sécurisées
- accès limité
```

---

## 5. Standards d’authentification

## 5.1 API Core

L’API Core doit supporter une stratégie robuste basée sur :

```txt
- access token court
- refresh token long mais contrôlé
- révocation possible
- rotation refresh token recommandée
- device/session tracking si nécessaire
- logout serveur
```

---

## 5.2 Access Token

Recommandation :

```txt
- durée courte
- envoyé dans Authorization: Bearer
- utilisé uniquement pour accéder aux ressources
- jamais stocké durablement côté web si possible
```

Durée indicative :

```txt
15 minutes à 1 heure selon le contexte
```

---

## 5.3 Refresh Token

Le refresh token est plus sensible.

Web :

```txt
- stocker en cookie HttpOnly
- Secure en production
- SameSite Lax ou Strict selon besoin
- rotation recommandée
```

Mobile :

```txt
- stocker dans SecureStore ou Keychain
- jamais dans AsyncStorage simple
- jamais dans MMKV non chiffré si sensible
```

---

## 5.4 Stratégie recommandée par plateforme

```txt
Web :
- access token en mémoire ou session contrôlée
- refresh token en cookie HttpOnly Secure SameSite

Mobile :
- access token en mémoire
- refresh token dans SecureStore/Keychain
- refresh automatique contrôlé

API :
- vérification JWT
- vérification session si refresh token
- blacklist ou token version si nécessaire
```

---

## 5.5 Mot de passe

Standards :

```txt
- hash avec bcrypt, argon2 ou équivalent robuste
- jamais stocker en clair
- politique de complexité raisonnable
- protection contre brute force
- reset token expirant
- reset token à usage unique
```

---

## 5.6 Multi-rôles

Un utilisateur peut avoir plusieurs rôles selon les projets.

Exemples :

```txt
buyer
seller
delivery_person
admin
super_admin
manager
agent
owner
```

La sécurité doit distinguer :

```txt
role = profil global
permission = action précise autorisée
scope = contexte d’application ou ressource
```

---

## 6. Autorisation

## 6.1 RBAC

Le modèle RBAC doit être supporté par défaut.

Exemples :

```txt
admin peut gérer les utilisateurs
seller peut gérer ses produits
delivery_person peut voir ses livraisons
buyer peut voir ses commandes
```

---

## 6.2 Permissions fines

Les permissions doivent être utilisées pour les actions sensibles.

Exemples :

```txt
users.read
users.create
users.update
users.delete
orders.read
orders.assign
payouts.verify
settings.update
files.upload
admin.access
```

---

## 6.3 Ownership check

Pour les ressources personnelles, il faut vérifier le propriétaire.

Exemple :

```txt
Un vendeur ne peut modifier que ses propres produits.
Un livreur ne peut voir que ses livraisons assignées.
Un client ne peut voir que ses propres commandes.
```

---

## 6.4 Guards et decorators

API Core NestJS doit prévoir :

```txt
@CurrentUser()
@Roles()
@Permissions()
@Public()
JwtAuthGuard
RolesGuard
PermissionsGuard
OwnershipGuard si nécessaire
```

Spring Boot doit prévoir l’équivalent :

```txt
SecurityFilterChain
Method Security
@PreAuthorize
CurrentUserProvider
PermissionEvaluator
```

---

## 7. Sécurité API

## 7.1 Validation des entrées

Toutes les entrées doivent être validées.

NestJS :

```txt
ValidationPipe
DTO
class-validator ou Zod selon stratégie
whitelist
forbidNonWhitelisted
transform
```

Spring Boot :

```txt
Jakarta Bean Validation
@Valid
DTO séparés
Exception handler
```

---

## 7.2 Standard de réponse d’erreur

Ne jamais exposer :

```txt
- stack trace en production
- SQL brut
- chemins serveur sensibles
- secrets
- tokens
- détails internes inutiles
```

Réponse recommandée :

```json
{
  "success": false,
  "statusCode": 400,
  "message": "Validation failed",
  "errorCode": "VALIDATION_ERROR",
  "details": []
}
```

---

## 7.3 CORS

CORS doit être strict.

Règles :

```txt
- jamais "*" en production avec credentials
- whitelist domaines autorisés
- configuration par environnement
- méthodes limitées
- headers contrôlés
```

---

## 7.4 Rate limiting

Le rate limiting doit être activable sur :

```txt
- login
- register
- forgot password
- OTP
- upload
- endpoints publics
- webhooks
- recherche intensive
```

---

## 7.5 API Key

Certaines APIs peuvent nécessiter une API key.

Usage :

```txt
- apps mobiles
- partenaires
- services internes
- webhooks
```

Règles :

```txt
- ne remplace pas l’auth utilisateur
- doit être révocable
- doit être associée à un client
- doit avoir des scopes
- doit être journalisée
```

---

## 7.6 Webhooks

Les webhooks doivent être protégés par :

```txt
- signature HMAC si possible
- secret par provider
- vérification timestamp
- protection replay attack
- logs d’événements
- idempotence
```

---

## 8. Sécurité Web

## 8.1 Cookies

Cookies sensibles :

```txt
HttpOnly
Secure en production
SameSite Lax ou Strict
path limité
expiration contrôlée
```

---

## 8.2 XSS

Mesures :

```txt
- éviter dangerouslySetInnerHTML
- sanitiser HTML si nécessaire
- CSP
- validation des données
- encodage sortie
- dépendances UI fiables
```

---

## 8.3 CSRF

Si cookies utilisés :

```txt
- SameSite
- CSRF token si nécessaire
- vérification origin/referer pour actions sensibles
```

---

## 8.4 CSP

Content Security Policy recommandée pour les apps web.

Objectif :

```txt
- limiter scripts
- limiter images
- limiter styles
- limiter connexions externes
- réduire impact XSS
```

---

## 8.5 Protection des routes

Web Core doit prévoir :

```txt
- middleware auth
- guards côté client
- guards côté serveur si possible
- redirection login
- vérification rôles/permissions
```

---

## 9. Sécurité Mobile

## 9.1 Stockage sécurisé

Interdit pour données sensibles :

```txt
AsyncStorage simple
local file non chiffré
logs
state persisted non sécurisé
```

Recommandé :

```txt
expo-secure-store
react-native-keychain
Keychain iOS
Keystore Android
```

---

## 9.2 Tokens mobile

Règles :

```txt
- access token en mémoire si possible
- refresh token dans stockage sécurisé
- logout supprime les tokens
- refresh contrôlé
- expiration bien gérée
```

---

## 9.3 Protection des builds

Règles :

```txt
- ne pas hardcoder les secrets
- variables publiques Expo uniquement pour valeurs non sensibles
- vérifier EXPO_PUBLIC_*
- distinguer dev/staging/prod
- signer correctement les builds
```

Important :

```txt
Toute variable EXPO_PUBLIC_* est exposée côté client.
Elle ne doit jamais contenir de secret.
```

---

## 9.4 Logs mobile

Ne jamais logger :

```txt
- access token
- refresh token
- mot de passe
- OTP
- documents personnels
- données bancaires
- clés API sensibles
```

---

## 9.5 Sécurité réseau mobile

Recommandations :

```txt
- HTTPS obligatoire en production
- certificate pinning pour projets très sensibles
- timeout API
- retry contrôlé
- gestion offline propre
```

---

## 10. Sécurité Cloud

## 10.1 Accès serveur

Règles :

```txt
- SSH par clé
- désactiver login root si possible
- limiter utilisateurs sudo
- firewall actif
- ports minimaux ouverts
- fail2ban
- mises à jour sécurité
```

---

## 10.2 Ports exposés

Par défaut, seuls ces ports doivent être publics :

```txt
80
443
SSH port contrôlé
```

Les autres services doivent rester internes :

```txt
PostgreSQL
Redis
MinIO interne si non public
OSRM
Prometheus
Grafana sauf accès sécurisé
```

---

## 10.3 Traefik

Traefik doit gérer :

```txt
- reverse proxy
- SSL
- routage domaines
- middlewares sécurité
- dashboard sécurisé
- redirections HTTPS
```

Le dashboard Traefik ne doit jamais être exposé sans protection.

---

## 10.4 PostgreSQL

Règles :

```txt
- mot de passe fort
- accès réseau limité
- volume persistant
- backups
- utilisateur applicatif dédié
- pas de superuser pour application
```

---

## 10.5 Redis

Règles :

```txt
- pas d’exposition publique
- mot de passe si nécessaire
- réseau Docker interne
- persistance selon usage
- séparation cache/queue si besoin avancé
```

---

## 10.6 MinIO/S3

Règles :

```txt
- clés fortes
- buckets privés par défaut
- policies minimales
- URLs signées si accès temporaire
- validation côté API
- séparation buckets si nécessaire
```

---

## 10.7 OSRM

OSRM doit être considéré comme un service interne.

Règles :

```txt
- pas d’exposition publique directe sauf besoin justifié
- accès via API Routing Service
- monitoring santé
- rate limiting côté API si exposé
- stratégie fallback
```

---

## 10.8 Monitoring

Grafana, Prometheus et Loki doivent être protégés.

Règles :

```txt
- authentification
- accès restreint
- pas de logs sensibles
- rétention contrôlée
- dashboards non publics
```

---

## 11. Secrets Management

## 11.1 Règles générales

Interdictions :

```txt
- secret dans Git
- secret dans README
- secret dans logs
- secret dans prompt IA
- secret dans capture d’écran
- secret dans issue publique
```

---

## 11.2 Fichiers .env

Chaque core doit fournir :

```txt
.env.example
```

Mais jamais :

```txt
.env réel
.env.production réel
.env.local avec secrets
```

Le `.gitignore` doit exclure :

```txt
.env
.env.*
!.env.example
```

---

## 11.3 Rotation

Les secrets critiques doivent pouvoir être changés.

Exemples :

```txt
JWT_SECRET
DATABASE_PASSWORD
MINIO_SECRET_KEY
API_KEYS
WEBHOOK_SECRET
CI_DEPLOY_TOKEN
```

---

## 12. Sécurité des uploads

## 12.1 Validation obligatoire

Tout upload doit vérifier :

```txt
- taille maximale
- MIME type
- extension
- nom fichier
- nombre de fichiers
- permissions utilisateur
- type de ressource
```

---

## 12.2 Renommage fichier

Ne jamais faire confiance au nom original.

Recommandation :

```txt
uuid + extension validée
```

---

## 12.3 Stockage

Règles :

```txt
- bucket privé par défaut
- chemin structuré
- URLs signées si nécessaire
- pas d’exécution de fichier uploadé
- séparation images/documents si utile
```

---

## 12.4 Images

Pour les images :

```txt
- vérifier format
- compresser si nécessaire
- générer thumbnail si nécessaire
- supprimer metadata EXIF sensible si nécessaire
```

---

## 12.5 Documents sensibles

Pour documents sensibles :

```txt
- accès strict
- audit log
- durée de conservation maîtrisée
- suppression possible
- pas d’URL publique permanente
```

---

## 13. Sécurité des logs

## 13.1 Données interdites dans les logs

```txt
- mots de passe
- tokens
- refresh tokens
- OTP
- clés API
- documents personnels
- données bancaires
- secrets
- cookies sensibles
```

---

## 13.2 Logs utiles

Les logs doivent contenir :

```txt
- request id
- user id si applicable
- action
- statut
- durée
- endpoint
- erreur normalisée
```

---

## 13.3 Audit logs

Les actions sensibles doivent produire des audit logs.

Exemples :

```txt
- changement rôle
- validation payout
- suppression utilisateur
- modification paramètres
- accès document sensible
- changement mot de passe
```

---

## 14. Sécurité des dépendances

La sécurité des dépendances est définie dans :

```txt
06_DEPENDENCY_STRATEGY.md
```

Rappels :

```txt
- dépendances maintenues
- licences acceptables
- audit régulier
- vulnérabilités critiques traitées rapidement
- images Docker versionnées
- pas de latest en production
```

---

## 15. Sécurité CI/CD

## 15.1 GitHub Actions

Règles :

```txt
- secrets dans GitHub Secrets
- environnements protégés
- reviewers pour production
- permissions minimales
- pas d’affichage secrets
- branches protégées
```

---

## 15.2 Registry

Règles :

```txt
- images taguées
- pas de latest seul en production
- accès limité
- scan images si possible
```

---

## 15.3 Déploiement

Règles :

```txt
- déploiement production contrôlé
- rollback possible
- logs de déploiement
- health check post-déploiement
- backup avant migration critique
```

---

## 16. Sécurité IA

## 16.1 Données interdites dans les prompts

Ne jamais envoyer à une IA :

```txt
- secrets
- clés API
- mots de passe
- tokens
- fichiers .env
- données personnelles sensibles
- dumps base de données
- informations confidentielles client
```

---

## 16.2 Usage autorisé

L’IA peut aider à :

```txt
- générer du code non sensible
- relire architecture
- proposer tests
- documenter
- identifier risques
- analyser logs anonymisés
```

---

## 16.3 Revue obligatoire

Toute génération IA touchant à la sécurité doit être relue humainement.

Exemples :

```txt
- auth
- refresh token
- permissions
- cloud
- secrets
- CI/CD
- uploads
- paiement
```

---

## 17. Sécurité des données personnelles

## 17.1 Minimisation

Ne collecter que ce qui est nécessaire.

Exemples :

```txt
- ne pas demander document identité si non nécessaire
- ne pas stocker localisation plus longtemps que nécessaire
- éviter données sensibles inutiles dans logs
```

---

## 17.2 Conservation

Chaque projet doit définir :

```txt
- durée de conservation
- politique suppression
- export si nécessaire
- anonymisation si nécessaire
```

---

## 17.3 Accès

Les données personnelles doivent être accessibles uniquement aux utilisateurs ou rôles autorisés.

---

## 18. Sécurité géolocalisation

Pour les projets avec tracking :

```txt
- consentement utilisateur selon contexte
- tracking uniquement quand nécessaire
- arrêt tracking après livraison
- accès limité aux rôles autorisés
- historique maîtrisé
- pas d’exposition publique
```

---

## 19. Sécurité paiement

La fondation ne doit pas manipuler directement des données sensibles de carte bancaire sauf conformité spécifique.

Règles :

```txt
- préférer providers certifiés
- ne pas stocker cartes
- protéger webhooks
- auditer transactions
- idempotence paiement
- logs sans données sensibles
```

---

## 20. Sécurité par core

## 20.1 API Core NestJS

Doit intégrer :

```txt
- validation globale
- exception filter
- auth guards
- roles guards
- permissions guards
- rate limiting
- helmet
- CORS strict
- audit logs
- Swagger protégé si nécessaire
```

---

## 20.2 API Core Spring Boot

Doit intégrer :

```txt
- Spring Security
- validation DTO
- exception handler
- method security
- audit logs
- CORS strict
- OpenAPI protégé si nécessaire
```

---

## 20.3 Mobile Core React Native

Doit intégrer :

```txt
- secure storage
- token handling
- API timeout
- logout sécurisé
- non-log des tokens
- env publics maîtrisés
```

---

## 20.4 Mobile Core Flutter

Doit intégrer :

```txt
- secure storage
- token handling
- API timeout
- logout sécurisé
- non-log des tokens
- séparation environnements
```

---

## 20.5 Web Core Next.js

Doit intégrer :

```txt
- auth middleware
- cookies sécurisés
- CSP
- CSRF selon stratégie
- protection routes
- validation formulaire
```

---

## 20.6 Web Core Angular

Doit intégrer :

```txt
- route guards
- HTTP interceptors
- token handling
- validation formulaire
- protection routes
- CSP côté hébergement
```

---

## 20.7 Cloud Core

Doit intégrer :

```txt
- firewall
- Traefik sécurisé
- services internes non exposés
- volumes protégés
- backups
- monitoring sécurisé
- secrets hors Git
```

---

## 20.8 UI Kit

Doit intégrer :

```txt
- accessibilité
- composants sûrs
- pas d’injection HTML dangereuse
- gestion propre états erreur/loading
```

---

## 20.9 IA Core

Doit intégrer :

```txt
- prompts sans secrets
- anonymisation
- limites d’usage
- revue humaine
- traçabilité
```

---

## 21. Checklists sécurité

## 21.1 Checklist API

```txt
- [ ] Auth configurée
- [ ] RBAC ou permissions configurés
- [ ] Validation entrées activée
- [ ] CORS strict
- [ ] Rate limiting sur endpoints sensibles
- [ ] Erreurs standardisées
- [ ] Logs sans secrets
- [ ] Audit logs actions sensibles
- [ ] Swagger sécurisé si production
- [ ] Tests sécurité critiques
```

---

## 21.2 Checklist Mobile

```txt
- [ ] Tokens stockés correctement
- [ ] Refresh token en stockage sécurisé
- [ ] Aucun secret dans EXPO_PUBLIC_*
- [ ] Logout supprime les tokens
- [ ] Logs sensibles absents
- [ ] HTTPS utilisé en production
- [ ] Permissions natives justifiées
```

---

## 21.3 Checklist Web

```txt
- [ ] Cookies sécurisés
- [ ] Routes protégées
- [ ] CSP définie
- [ ] CSRF traité si cookies
- [ ] Formulaires validés
- [ ] Pas de données sensibles en localStorage
- [ ] Headers sécurité activés
```

---

## 21.4 Checklist Cloud

```txt
- [ ] Firewall actif
- [ ] SSH par clé
- [ ] Ports minimaux exposés
- [ ] Traefik dashboard protégé
- [ ] PostgreSQL non public
- [ ] Redis non public
- [ ] OSRM non public direct
- [ ] MinIO sécurisé
- [ ] Backups configurés
- [ ] Monitoring protégé
- [ ] Aucun secret dans Git
```

---

## 21.5 Checklist Upload

```txt
- [ ] Taille maximale définie
- [ ] MIME type vérifié
- [ ] Extension vérifiée
- [ ] Nom fichier régénéré
- [ ] Permissions vérifiées
- [ ] Bucket privé
- [ ] URL signée si nécessaire
- [ ] Logs sans fichier sensible
```

---

## 21.6 Checklist IA

```txt
- [ ] Aucun secret dans le prompt
- [ ] Données anonymisées si nécessaire
- [ ] Résultat relu humainement
- [ ] Prompt versionné
- [ ] Limites documentées
```

---

## 22. Incident security response

Chaque incident sécurité doit suivre un processus.

```txt
1. Identifier
2. Isoler
3. Évaluer impact
4. Corriger
5. Tourner les secrets si nécessaire
6. Déployer correctif
7. Documenter
8. Prévenir si obligation
9. Ajouter prévention
```

Exemples d’incidents :

```txt
- secret exposé
- token compromis
- accès non autorisé
- faille upload
- base exposée
- vulnérabilité critique
- mauvaise configuration cloud
```

---

## 23. Security gates avant release

Avant une release importante :

```txt
- [ ] Pas de secret dans Git
- [ ] Audit dépendances exécuté
- [ ] Tests auth critiques OK
- [ ] Tests permissions OK
- [ ] Upload sécurisé
- [ ] CORS vérifié
- [ ] Logs vérifiés
- [ ] Variables environnement documentées
- [ ] Docker services sécurisés
- [ ] Documentation sécurité à jour
```

---

## 24. Anti-patterns interdits

Sont interdits :

```txt
- stocker un refresh token dans AsyncStorage
- mettre un secret dans EXPO_PUBLIC_*
- exposer PostgreSQL publiquement
- exposer Redis publiquement
- exposer OSRM directement sans contrôle
- utiliser CORS "*" en production avec credentials
- logger un token
- commiter un fichier .env
- laisser Swagger admin public sans contrôle
- accepter tous les uploads sans validation
- laisser l’IA manipuler des secrets
- utiliser une API key comme seule sécurité utilisateur
```

---

## 25. Conclusion

La sécurité d’Enistere OS Foundation doit être transversale, systématique et vérifiable.

Chaque core doit intégrer la sécurité dès la conception.

Le principe à retenir est :

```txt
Un module n’est pas prêt tant qu’il n’est pas sécurisé, testé et documenté.
```

Ce document doit être appliqué à toutes les décisions, implémentations et releases d’Enistere OS Foundation.
