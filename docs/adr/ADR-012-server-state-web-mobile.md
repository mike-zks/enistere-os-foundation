# ADR-012 — Server state web/mobile

## 1. Titre

Stratégie de gestion du server state Web et Mobile pour Enistere OS Foundation.

## 2. Statut

Validé.

## 3. Date

2026-05-30.

## 4. Contexte

Enistere OS Foundation doit standardiser la gestion des données serveur pour le Web Core Next.js, le Mobile Core React Native, les futurs projets web et les futures applications mobiles.

Le server state désigne les données provenant de l'API :

- listes ;
- détails ;
- profils ;
- paramètres ;
- commandes ;
- transactions ;
- notifications ;
- données paginées ;
- données filtrées ;
- données chargées depuis API Core.

L'ADR-011 a validé `fetch` avec wrappers Enistere comme base HTTP officielle. Cette ADR définit la couche de gestion des données serveur qui consomme ces wrappers.

## 5. Problème

Les données serveur ne doivent pas être gérées comme un simple état local.

Sans décision formelle, les projets risquent de :

- dupliquer les données API dans Zustand ou un store global ;
- multiplier les appels API dans les composants ;
- gérer manuellement loading, error et success ;
- oublier l'invalidation après mutation ;
- créer des query keys incohérentes ;
- cacher trop longtemps des données sensibles ;
- mal gérer les erreurs 401 / 403 ;
- diverger entre web et mobile ;
- rendre les tests et revues plus coûteux.

Il faut donc une stratégie commune pour requêtes, mutations, cache, invalidation, retries, pagination et synchronisation.

## 6. Options étudiées

### Option A — TanStack Query comme standard Web/Mobile

Utiliser TanStack Query pour requêtes, mutations, cache, invalidation, retries, pagination et synchronisation.

Avantages :

- stratégie cohérente web/mobile ;
- cache contrôlé ;
- invalidation explicite après mutations ;
- gestion native des états loading, error et success ;
- support pagination et infinite queries si nécessaire ;
- séparation claire avec l'état local ;
- compatibilité avec les wrappers HTTP ADR-011 ;
- bonne testabilité ;
- compatibilité future avec OpenAPI.

Inconvénients :

- nécessite des conventions de query keys ;
- stale time et cache time doivent être cadrés ;
- mauvais usage possible si les données sensibles sont cachées trop longtemps ;
- discipline nécessaire pour ne pas dupliquer les données dans Zustand.

### Option B — Zustand ou store global pour tout

Utiliser Zustand ou un store global pour gérer à la fois état local et données serveur.

Avantages :

- modèle mental simple au démarrage ;
- contrôle manuel total ;
- utile pour l'état UI local ou session non serveur.

Inconvénients :

- duplication du backend dans le client ;
- invalidation et synchronisation manuelles ;
- retries et états réseau à reconstruire ;
- pagination plus coûteuse ;
- risque élevé de données obsolètes ;
- séparation server state / local state peu claire.

### Option C — Gestion manuelle avec useEffect/useState

Gérer les appels API directement dans les composants avec `useEffect` et `useState`.

Avantages :

- aucune abstraction initiale ;
- compréhensible pour des cas isolés ;
- peu de structure au départ.

Inconvénients :

- duplication massive ;
- erreurs difficiles à normaliser ;
- loading/error/success réimplémentés partout ;
- invalidation absente ou fragile ;
- tests plus lourds ;
- fort risque de bugs de race condition ;
- incompatibilité avec une fondation réutilisable.

### Option D — Stratégie différente par plateforme

Utiliser une stratégie pour le web et une autre pour mobile.

Avantages :

- adaptation locale aux contraintes de chaque plateforme ;
- liberté d'expérimenter.

Inconvénients :

- divergence entre Web Core Next.js et Mobile Core React Native ;
- partage de conventions plus difficile ;
- prompts IA moins fiables ;
- documentation du UI Kit et des états UI plus complexe ;
- montée en compétence et maintenance plus coûteuses.

## 7. Décision

Enistere OS Foundation retient **l'Option A — TanStack Query comme standard Web/Mobile**.

La décision officielle est :

```txt
Enistere OS Foundation adopte TanStack Query comme stratégie standard V1 pour la gestion du server state côté Web et Mobile.
```

Précisions obligatoires :

```txt
TanStack Query gère les données serveur.
Zustand ou un store local léger gère uniquement l'état local non serveur.
Les données serveur ne doivent pas être dupliquées inutilement dans le state local.
```

Les wrappers HTTP définis par ADR-011 restent responsables des appels réseau, des erreurs normalisées, des timeouts, des retries bas niveau et de la sécurité du transport.

## 8. Raisons de la décision

Cette stratégie est retenue car elle permet :

- gestion cohérente du server state web/mobile ;
- cache contrôlé ;
- invalidation après mutations ;
- retries encadrés ;
- gestion loading/error/success ;
- pagination et infinite queries si nécessaire ;
- compatibilité avec les wrappers `fetch` Enistere ;
- meilleure testabilité ;
- réduction des duplications ;
- séparation claire entre données serveur et état local ;
- compatibilité avec OpenAPI futur ;
- meilleure expérience utilisateur sur mobile et web.

Elle évite que chaque feature réinvente la gestion des données serveur.

## 9. Conséquences positives

- Les requêtes et mutations suivent des conventions communes.
- Les états UI peuvent se brancher sur une source stable.
- Les données serveur restent dans un cache prévu pour cet usage.
- Les mutations peuvent invalider ou mettre à jour explicitement le cache.
- Les projets web et mobile partagent les mêmes principes.
- Zustand reste simple et limité à l'état local.
- La compatibilité avec un futur client OpenAPI généré reste possible.

## 10. Conséquences négatives

- Les équipes doivent apprendre et respecter les conventions TanStack Query.
- Les query keys doivent être définies et maintenues.
- Les paramètres de stale time et cache time doivent être documentés par usage.
- Le logout doit nettoyer ou invalider correctement le cache.
- Une mauvaise configuration peut provoquer des refetchs excessifs ou du cache trop durable.

## 11. Risques

- Query keys incohérentes entre features.
- Données serveur dupliquées dans Zustand.
- Cache conservant trop longtemps des données sensibles.
- Refetch agressif sur données sensibles ou coûteuses.
- Retries trop nombreux sur erreurs 401 / 403.
- Cache non vidé au logout.
- Mutations sans invalidation.
- Gestion offline activée trop tôt sans stratégie de conflit.
- Erreurs API affichées sans normalisation.

## 12. Alternatives rejetées

### Option B rejetée

Zustand ou un store global pour tout est rejeté car cela transforme le client en miroir fragile du backend. Zustand reste accepté pour l'état local UI, session non serveur ou préférences locales.

### Option C rejetée

La gestion manuelle avec `useEffect` / `useState` est rejetée comme stratégie générale car elle duplique la logique réseau, cache, loading, erreurs et invalidation dans les composants.

### Option D rejetée

Une stratégie différente par plateforme est rejetée pour V1 car elle augmente la divergence entre web et mobile et complexifie les standards de fondation.

## 13. Impact sur Mobile Core React Native

Le Mobile Core React Native devra utiliser TanStack Query pour :

- données serveur ;
- listes et détails ;
- mutations ;
- cache API ;
- invalidation ;
- pagination ;
- retries contrôlés ;
- gestion loading/error/success ;
- intégration avec les wrappers HTTP ADR-011.

Zustand reste limité à l'état local simple : UI, préférences non sensibles, état temporaire d'écran ou session non serveur selon stratégie auth validée.

Le cache devra être nettoyé au logout et configuré prudemment pour les données sensibles.

## 14. Impact sur Web Core Next.js

Le Web Core Next.js devra utiliser TanStack Query pour le server state côté client lorsque la donnée est consommée par des composants interactifs.

La stratégie devra rester compatible avec :

- appels serveur/client selon architecture Next.js ;
- App Router ;
- routing protégé ;
- mutations ;
- pagination ;
- invalidation ;
- états UI du UI Kit ;
- stratégie auth/session future ;
- wrappers HTTP ADR-011.

Les choix server-side spécifiques de Next.js ne doivent pas provoquer une duplication non maîtrisée du cache client.

## 15. Impact sur API Core NestJS

L'API Core NestJS devra fournir des contrats favorables à TanStack Query :

- réponses JSON cohérentes ;
- erreurs normalisées ;
- codes HTTP explicites ;
- pagination standardisée ;
- filtres documentés ;
- mutations prévisibles ;
- endpoints d'auth distinguant clairement 401 et 403 ;
- OpenAPI maintenable pour un futur typage client.

L'API reste responsable de la validation, des permissions et de la source de vérité des données.

## 16. Impact sur client HTTP ADR-011

TanStack Query ne remplace pas le client HTTP.

Les responsabilités sont séparées :

- ADR-011 : transport HTTP, erreurs réseau, timeout, headers, upload, sécurité transport ;
- ADR-012 : cache serveur, query keys, mutations, invalidation, état loading/error/success.

Les fonctions utilisées par TanStack Query doivent appeler les wrappers HTTP Enistere et retourner des réponses typées ou normalisées.

## 17. Impact sur auth/session

La stratégie auth/session devra définir les comportements exacts de session expirée, refresh token et logout.

En attendant :

- les erreurs 401 / 403 doivent être traitées clairement ;
- le cache doit être vidé ou invalidé au logout ;
- les tokens ne doivent pas être stockés dans TanStack Query ;
- les retries doivent être limités sur erreurs auth ;
- les données sensibles ne doivent pas rester en cache indéfiniment ;
- les permissions utilisateur doivent être respectées dans les données affichées.

L'ADR-004 et l'ADR-005 préciseront les choix auth/session et cookies/CSRF.

## 18. Impact sur UI Kit

Le UI Kit devra prévoir des composants et patterns compatibles avec les états issus de TanStack Query :

- loading ;
- empty ;
- error ;
- success ;
- disabled ;
- refreshing ;
- unauthorized ;
- forbidden ;
- retry action si pertinent.

Les messages d'erreur doivent rester propres, accessibles et sans fuite d'information sensible.

## 19. Impact sur offline futur

L'offline reste optionnel ou avancé.

TanStack Query peut servir de base pour certains scénarios de cache lecture, mais la synchronisation offline complète nécessite une ADR ou spécification dédiée.

À reporter hors V1 si non indispensable :

- persistance de cache ;
- mutations offline ;
- résolution de conflits ;
- synchronisation différée ;
- stockage local chiffré pour données sensibles ;
- règles de purge.

L'ADR-029 traitera la stratégie offline mobile si elle devient prioritaire.

## 20. Impact sur IA / Codex / Claude Code

Les agents IA doivent appliquer cette ADR lors de la génération ou revue de features web/mobile.

Ils doivent :

- utiliser TanStack Query pour les données serveur ;
- éviter les appels API dispersés dans les composants ;
- éviter de stocker les données serveur dans Zustand ;
- définir ou vérifier des query keys cohérentes ;
- vérifier l'invalidation après mutation ;
- connecter les états loading/error/empty/success au UI Kit ;
- signaler les caches sensibles trop persistants ;
- respecter les wrappers HTTP ADR-011 ;
- ne pas activer l'offline avancé sans décision dédiée.

L'IA assiste la génération et la revue, mais ne décide pas seule des durées de cache sensibles ou des stratégies offline.

## 21. Règles d'application

- Les features ne doivent pas gérer les données serveur directement avec `useEffect` / `useState` sauf exception justifiée.
- Chaque domaine fonctionnel doit définir ses query keys.
- Les mutations doivent invalider ou mettre à jour le cache de façon explicite.
- Zustand ne doit pas devenir un miroir du backend.
- Le cache doit être nettoyé au logout.
- Les erreurs doivent être normalisées via le client HTTP ADR-011.
- Les états loading/error/empty/success doivent être connectés au UI Kit.
- Le comportement offline doit rester optionnel ou avancé.
- Les données sensibles doivent avoir une stratégie de cache prudente.
- Les retries doivent être limités, notamment sur 401 / 403.
- Le refetch doit être contrôlé selon le type de donnée.
- Stale time et cache time doivent être cadrés selon l'usage.
- Les tokens ne doivent jamais être stockés dans le cache TanStack Query.

## 22. Conditions de révision future

Cette décision pourra être revue si :

- TanStack Query ne répond plus aux besoins Web ou Mobile ;
- une stratégie OpenAPI générée impose une autre couche de cache ;
- Next.js évolue vers un modèle server state incompatible avec cette approche ;
- les besoins offline deviennent structurants ;
- une contrainte sécurité impose une gestion de cache différente ;
- les projets dérivés accumulent des exceptions justifiées ;
- une autre solution devient clairement plus adaptée aux objectifs Enistere.

Toute révision devra préserver la séparation entre données serveur, transport HTTP et état local.

## 23. Conclusion

Enistere OS Foundation adopte TanStack Query comme standard V1 pour la gestion du server state côté Web et Mobile.

Zustand ou un store local léger reste réservé à l'état local non serveur. Les wrappers HTTP ADR-011 restent responsables des appels réseau. Les données serveur ne doivent pas être dupliquées inutilement dans le state local.
