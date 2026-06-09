# `core/auth` — cadrage (vide)

Emplacement réservé à l'**authentification** du Web Core. **Aucun code à ce stade.**

Volontairement **absent** (et hors périmètre des missions actuelles) :

- BFF Auth, cookies `HttpOnly`, protection CSRF ;
- login / refresh / logout, middleware d'authentification ;
- OAuth, MFA ; **aucun token stocké**.

## ⚠️ Frontière à respecter

Le **client API public** (`core/api/public/`, introduit pour les endpoints Health) **ne doit pas
devenir** le client authentifié. La future intégration Auth utilisera :

- un **BFF** (Route Handlers serveur) + **cookies `HttpOnly`** (ADR-005) ;
- un **client serveur authentifié dédié** (jamais le singleton public, qui est sans session) ;
- une protection **CSRF** et un flux refresh côté serveur.

> Ne rien ajouter ici sans mission dédiée.
