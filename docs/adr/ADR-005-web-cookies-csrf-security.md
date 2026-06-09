# ADR-005 — Sécurité cookies web et CSRF

## 1. Titre

Stratégie de sécurité des cookies web et de protection CSRF.

## 2. Statut

Validé.

## 3. Date

2026-05-30.

## 4. Contexte

ADR-004 a validé une stratégie auth/session multi-client basée sur un access token JWT court et un refresh token révocable.

Pour le Web Core Next.js, cette stratégie peut s'appuyer sur des cookies sécurisés pour le refresh ou la session web. Cette décision améliore la protection contre le vol de token via JavaScript, mais introduit des exigences fortes de protection CSRF, CORS, SameSite, domaines, logout et séparation des environnements.

Cette ADR formalise la stratégie cookies web et CSRF pour :

- Web Core Next.js ;
- API Core NestJS ;
- refresh/session web ;
- routes protégées ;
- actions sensibles ;
- logout ;
- déploiement Cloud Core ;
- documentation sécurité.

Cette ADR ne crée aucun code Next.js, middleware, guard, module CSRF, composant, package ou dépendance.

## 5. Problème

Les cookies sécurisés réduisent certains risques XSS sur les tokens, mais ne suffisent pas à protéger les actions web.

Une mauvaise stratégie peut entraîner :

- tokens sensibles stockés dans `localStorage` ;
- cookies envoyés automatiquement sans protection CSRF ;
- cookies trop larges sur les sous-domaines ;
- absence de `Secure` en production ;
- `SameSite` oublié ou mal adapté ;
- CORS trop permissif avec credentials ;
- logout laissant un cookie actif ;
- confusion entre sécurité web et sécurité API ;
- erreurs d'auth trop détaillées.

Il faut donc cadrer précisément les règles de cookies et CSRF avant de générer les flows web.

## 6. Options étudiées

### Option A — Tokens stockés en localStorage

Stocker access token ou refresh token dans `localStorage` côté web.

Avantages :

- implémentation simple ;
- facile à lire côté client ;
- pas de complexité CSRF liée aux cookies ;
- compatible avec beaucoup de clients HTTP.

Inconvénients :

- exposition forte au vol de token via XSS ;
- persistance risquée ;
- logout parfois incomplet ;
- mauvaise conformité avec les standards sécurité Enistere ;
- pratique interdite pour les tokens sensibles.

### Option B — Cookies HttpOnly Secure SameSite avec protection CSRF

Utiliser des cookies sécurisés pour refresh/session web, avec stratégie CSRF explicite.

Avantages :

- meilleure protection contre le vol de token via XSS ;
- cohérence avec ADR-004 ;
- meilleure sécurité pour refresh/session web ;
- compatible avec Next.js et API Core NestJS ;
- gouvernance claire des cookies ;
- séparation nette avec la stratégie mobile.

Inconvénients :

- CSRF à traiter explicitement ;
- configuration CORS/credentials plus délicate ;
- domaines, path, durée et SameSite à documenter par environnement ;
- tests de sécurité nécessaires ;
- logout doit supprimer cookie et invalider serveur.

### Option C — Session uniquement côté serveur

Utiliser une session serveur classique sans stratégie token multi-client.

Avantages :

- modèle web classique ;
- révocation centralisée ;
- cookies de session possibles ;
- contrôle serveur fort.

Inconvénients :

- moins aligné avec ADR-004 multi-client ;
- moins naturel pour mobile ;
- nécessite quand même cookies et CSRF ;
- complexité de stockage session ;
- ne répond pas seul au besoin API/mobile.

### Option D — Mix libre selon projet

Chaque projet choisit librement `localStorage`, cookies ou session serveur.

Avantages :

- flexibilité locale ;
- adaptation rapide à des contraintes projet ;
- faible gouvernance initiale.

Inconvénients :

- incohérence forte entre projets ;
- risques sécurité variables ;
- prompts IA moins fiables ;
- tests et documentation plus coûteux ;
- localStorage peut réapparaître pour des tokens sensibles ;
- CORS et CSRF deviennent difficiles à auditer.

## 7. Décision

Enistere OS Foundation retient **l'Option B — Cookies HttpOnly Secure SameSite avec protection CSRF**.

La décision officielle est :

```txt
Enistere OS Foundation adopte une stratégie web sécurisée basée sur :

- cookies sensibles en HttpOnly ;
- cookies Secure en production ;
- SameSite configuré selon le contexte ;
- absence de stockage de tokens sensibles dans localStorage ;
- protection CSRF explicite si cookies utilisés pour refresh/session ;
- vérification Origin / Referer sur actions sensibles si applicable ;
- CORS strict côté API ;
- HTTPS obligatoire en production.
```

Précisions obligatoires :

```txt
Les tokens sensibles ne doivent pas être stockés dans localStorage.
Les cookies doivent être sécurisés selon l'environnement.
La protection CSRF est obligatoire si des cookies sont utilisés pour authentifier ou rafraîchir une session.
```

Les cookies ne remplacent pas la sécurité côté API. Ils ne doivent pas contenir de données sensibles lisibles côté client. Les actions sensibles doivent être protégées contre CSRF. Les décisions précises de durée, domaine, sous-domaine et SameSite doivent être documentées par environnement.

## 8. Raisons de la décision

Cette stratégie est retenue car elle permet :

- meilleure protection contre le vol de token via XSS ;
- cohérence avec ADR-004 auth/session ;
- meilleure sécurité pour refresh/session web ;
- séparation claire entre web et mobile ;
- compatibilité avec Next.js ;
- compatibilité avec API Core NestJS ;
- meilleure gouvernance sécurité ;
- réduction des pratiques risquées comme `localStorage` ;
- contrôles adaptés aux environnements local, staging et production.

Elle impose aussi de traiter CSRF comme un sujet explicite, au lieu de supposer que `HttpOnly` suffit.

## 9. Comparaison des options

| Critère | Option A localStorage | Option B cookies sécurisés + CSRF | Option C session serveur | Option D mix libre |
|---|---|---|---|---|
| Sécurité XSS | Faible pour tokens sensibles | Meilleure avec HttpOnly | Bonne si cookie HttpOnly | Variable |
| Sécurité CSRF | Peu concernée si header Bearer | À traiter explicitement | À traiter explicitement | Variable |
| Complexité | Faible | Moyenne | Moyenne à élevée | Faible localement, élevée globalement |
| Compatibilité Next.js | Simple | Bonne | Bonne | Variable |
| Compatibilité API | Simple | Bonne avec CORS/credentials cadrés | Plus stateful | Variable |
| Compatibilité mobile | Non applicable web | Séparée du mobile | Moins adaptée mobile | Variable |
| Logout | Suppression locale | Suppression cookie + invalidation serveur | Invalidation serveur | Variable |
| Refresh session | Simple mais risqué | Cadré et sécurisé | Cadré côté serveur | Variable |
| Expérience utilisateur | Bonne | Bonne | Bonne | Variable |
| Testabilité | Simple mais risquée | Bonne avec tests sécurité | Bonne | Difficile à standardiser |
| Déploiement | Simple | Demande HTTPS/domaines/CORS | Demande stockage session | Variable |
| CORS | Plus simple | Strict avec credentials si besoin | Strict avec credentials | Risque de dérive |
| Multi-domaines | Risqué si tokens exposés | À documenter précisément | À documenter précisément | Risqué |

## 10. Stratégie cookies web

Les cookies sensibles doivent être configurés avec prudence.

Règles cibles :

- `HttpOnly` pour les cookies sensibles ;
- `Secure` obligatoire en production ;
- `SameSite` défini explicitement ;
- domaine et path documentés ;
- durée documentée ;
- aucune donnée sensible lisible côté client ;
- suppression au logout ;
- rotation ou remplacement si refresh token rotatif ;
- séparation local/staging/production.

Les cookies doivent servir la stratégie auth/session, pas transporter des données métier sensibles.

## 11. Stratégie SameSite

`SameSite` doit être choisi selon le contexte.

Principes :

- `Strict` à privilégier lorsque l'expérience utilisateur le permet ;
- `Lax` acceptable pour des flows web standards si compatible ;
- `None` uniquement si nécessaire, avec `Secure` obligatoire ;
- choix documenté par environnement et domaine ;
- impact sur OAuth/provider externe futur à évaluer si activé.

Le choix `SameSite` ne remplace pas une stratégie CSRF explicite pour les actions sensibles.

## 12. Stratégie CSRF

La protection CSRF est obligatoire si des cookies sont utilisés pour authentifier ou rafraîchir une session.

La stratégie pourra combiner selon les besoins :

- `SameSite` adapté ;
- token CSRF si nécessaire ;
- double submit cookie si retenu ;
- vérification `Origin` / `Referer` ;
- restriction CORS ;
- limitation des méthodes sensibles ;
- validation backend des actions critiques.

Les actions sensibles doivent être protégées même si les cookies sont `HttpOnly`.

## 13. Stratégie Origin / Referer

La vérification `Origin` / `Referer` doit être envisagée pour les actions sensibles.

Règles cibles :

- liste d'origines autorisées par environnement ;
- rejet des origines inattendues si applicable ;
- traitement prudent des absences de header selon contexte ;
- logs de sécurité sans cookies ni tokens ;
- tests sur endpoints sensibles.

Cette vérification complète CSRF, elle ne remplace pas toutes les autres protections.

## 14. Stratégie CORS

CORS doit être strict côté API.

Règles cibles :

- pas de `*` en production ;
- origines autorisées explicites ;
- credentials autorisés uniquement si nécessaire ;
- méthodes et headers limités ;
- séparation local/staging/production ;
- compatibilité web sans bloquer mobile ;
- aucun header sensible envoyé à des domaines non autorisés.

CORS n'est pas une protection CSRF complète, mais une partie de la surface de sécurité web.

## 15. Stratégie logout web

Le logout web doit :

- supprimer le cookie côté navigateur ;
- invalider la session ou le refresh token côté serveur si possible ;
- vider ou invalider le cache TanStack Query ;
- ramener l'utilisateur à un état non authentifié ;
- éviter de conserver un cookie actif après logout ;
- produire un audit log côté API si pertinent.

Un logout uniquement visuel ou uniquement client est insuffisant.

## 16. Stratégie environnements

Les environnements doivent être distingués.

À documenter pour chaque environnement :

- domaine ;
- sous-domaines ;
- path cookies ;
- durée cookies ;
- `Secure` ;
- `SameSite` ;
- stratégie CSRF ;
- origines CORS ;
- HTTPS ;
- secrets et clés hors Git.

Local peut nécessiter des adaptations, mais ne doit pas normaliser des pratiques faibles en staging ou production.

## 17. Sécurité et audit

La stratégie doit couvrir :

- XSS ;
- CSRF ;
- cookies `HttpOnly` ;
- cookies `Secure` ;
- `SameSite` ;
- CORS ;
- `Origin` / `Referer` ;
- HTTPS ;
- sous-domaines ;
- logout ;
- refresh session ;
- rotation refresh token ;
- révocation ;
- logs sans cookies/tokens ;
- tests de sécurité sur routes sensibles.

Les erreurs d'auth ne doivent pas exposer de détails sensibles.

## 18. Conséquences positives

- Tokens sensibles non exposés à JavaScript via `localStorage`.
- Stratégie web cohérente avec ADR-004.
- CSRF traité explicitement.
- CORS, domaines et environnements mieux gouvernés.
- Logout web plus fiable.
- Meilleure base pour routes protégées Next.js.
- Audit sécurité plus simple.

## 19. Conséquences négatives

- Configuration plus complexe que `localStorage`.
- Tests CSRF, cookies, CORS et logout nécessaires.
- Les environnements doivent être documentés précisément.
- Les intégrations multi-domaines exigent plus de rigueur.
- Certains flows externes futurs pourront nécessiter une révision `SameSite`.

## 20. Risques

- Croire que `HttpOnly` protège contre CSRF.
- Oublier `SameSite`.
- Oublier `Secure` en production.
- Utiliser `localStorage` pour tokens sensibles.
- Mal configurer les domaines de cookies.
- Exposer les cookies sur trop de sous-domaines.
- CORS trop permissif.
- Absence de vérification `Origin` / `Referer` sur actions sensibles.
- Erreurs de logout laissant un cookie actif.
- Confusion entre 401 et 403.
- Mauvaise séparation dev/staging/prod.
- Logs contenant cookies ou tokens.

## 21. Alternatives rejetées

### Option A rejetée

Le stockage de tokens sensibles dans `localStorage` est rejeté car il expose trop fortement les tokens au vol via XSS.

### Option C rejetée comme stratégie unique

La session serveur classique uniquement est rejetée comme stratégie globale car elle ne couvre pas proprement la stratégie multi-client définie par ADR-004.

### Option D rejetée

Le mix libre par projet est rejeté car il créerait une surface de sécurité incohérente et difficile à auditer.

## 22. Impact sur Web Core Next.js

Le Web Core Next.js devra prévoir :

- absence de tokens sensibles dans `localStorage` ;
- refresh/session via cookies sécurisés si retenu ;
- routes protégées côté serveur autant que possible ;
- gestion logout supprimant cookie et état client ;
- UI d'erreur sans détails sensibles ;
- intégration avec le client HTTP ADR-011 ;
- nettoyage du cache ADR-012 au logout ;
- documentation des environnements.

## 23. Impact sur API Core NestJS

L'API Core NestJS devra prévoir :

- émission/suppression des cookies si elle en est responsable ;
- validation des sessions ou refresh tokens ;
- CORS strict ;
- protection CSRF si cookies utilisés ;
- vérification `Origin` / `Referer` si applicable ;
- endpoints logout et refresh sécurisés ;
- erreurs 401 / 403 cohérentes ;
- audit logs sur actions sensibles ;
- logs sans cookies ni tokens.

## 24. Impact sur Cloud Core

Le Cloud Core devra soutenir cette stratégie par :

- HTTPS obligatoire en production ;
- reverse proxy correctement configuré ;
- redirection HTTP vers HTTPS ;
- domaines et sous-domaines documentés ;
- headers de sécurité cohérents ;
- CORS compatible avec les domaines exposés ;
- logs d'infrastructure sans secrets ;
- séparation local/staging/production.

## 25. Impact sur ADR-004 Auth/session

ADR-004 définit la stratégie auth/session globale.

ADR-005 précise la partie web :

- cookies HttpOnly ;
- Secure ;
- SameSite ;
- CSRF ;
- Origin / Referer ;
- CORS ;
- suppression cookie au logout.

ADR-005 ne change pas la décision access token court + refresh token révocable.

## 26. Impact sur ADR-011 Client HTTP

Le client HTTP devra :

- respecter la stratégie cookies/credentials si utilisée ;
- ne pas stocker de tokens sensibles ;
- ne pas contourner CSRF ;
- distinguer 401 et 403 ;
- éviter les refresh infinis ;
- ne pas envoyer de headers sensibles à des domaines non autorisés ;
- ne jamais logger cookies ou tokens.

## 27. Impact sur ADR-012 Server State

TanStack Query devra :

- vider ou invalider le cache au logout ;
- limiter les retries sur 401 / 403 ;
- ne pas stocker de tokens dans le cache ;
- éviter les données sensibles en cache durable ;
- refléter clairement les états unauthorized/forbidden ;
- rester cohérent avec la suppression des cookies/session.

## 28. Impact sur IA / Codex / Claude Code

Les agents IA doivent appliquer cette ADR lors de toute génération ou revue web/auth.

Ils doivent :

- refuser le stockage de tokens sensibles dans `localStorage` ;
- utiliser cookies `HttpOnly` pour données sensibles si stratégie cookie retenue ;
- signaler tout cookie auth sans CSRF ;
- vérifier `Secure`, `SameSite`, domaine, path et durée ;
- signaler CORS trop permissif ;
- prévoir logout supprimant cookie et invalidant serveur si possible ;
- ne créer aucun middleware, guard ou module CSRF hors mission explicite.

L'IA assiste la génération et la revue, mais ne décide pas seule des paramètres cookies par environnement.

## 29. Règles d'application

- `localStorage` interdit pour les tokens sensibles.
- Cookies sensibles en `HttpOnly`.
- `Secure` obligatoire en production.
- `SameSite` défini explicitement.
- Domaine et path des cookies documentés.
- Durée des cookies documentée.
- CSRF obligatoire si cookies utilisés pour refresh/session.
- `Origin` / `Referer` vérifiés sur actions sensibles si applicable.
- CORS strict côté API.
- Logout doit supprimer le cookie et invalider la session côté serveur si possible.
- Les erreurs auth ne doivent pas exposer de détails sensibles.
- Les environnements local/staging/prod doivent être différenciés.
- Les secrets de signature restent hors Git.
- Les logs ne doivent pas contenir cookies ou tokens.
- HTTPS obligatoire en production.

## 30. Conditions de révision future

Cette décision pourra être revue si :

- un provider externe impose une autre stratégie cookie ;
- des contraintes multi-domaines rendent `SameSite` insuffisant ;
- un incident sécurité révèle une faiblesse CSRF ;
- les navigateurs changent fortement leur gestion des cookies ;
- les projets dérivés accumulent des exceptions justifiées ;
- l'architecture web évolue vers une stratégie sans cookies auth.

Toute révision devra préserver l'interdiction de `localStorage` pour tokens sensibles et une protection explicite contre CSRF si cookies utilisés.

## 31. Conclusion

Enistere OS Foundation adopte une stratégie web basée sur des cookies sensibles `HttpOnly`, `Secure` en production, `SameSite` explicite, CORS strict et protection CSRF obligatoire lorsque les cookies servent à authentifier ou rafraîchir une session.

Cette stratégie complète ADR-004 et sécurise le Web Core Next.js sans modifier la stratégie mobile.
