# ADR-039 — Stratégie de hachage des mots de passe : Argon2id vs bcrypt

## 1. Titre

Choix de l'algorithme de hachage des mots de passe pour le API Core NestJS V1.

## 2. Statut

Validé.

## 3. Date

2026-06-08.

## 4. Contexte

Le API Core NestJS est l'autorité d'authentification d'Enistere OS Foundation (ADR-004). L'étape Auth 1 a livré les fondations de persistance :

- modèle Prisma `User` avec un champ `passwordHash` ;
- modèle Prisma `RefreshSession` (révocable, support de rotation) ;
- migration initiale réelle ;
- `UsersModule` interne, séparation `PublicUser` / `AuthUser` ;
- structure minimale `AuthModule` ;
- bootstrap applicatif centralisé.

`UsersService` reçoit volontairement un `passwordHash` **déjà produit** : aucune logique de hachage n'y est implémentée. L'emplacement du futur service de hachage a été fixé dans le domaine Auth (`src/auth/`).

`docs/architecture/SECURITY_ARCHITECTURE.md` autorise « bcrypt, argon2 ou équivalent robuste » sans imposer l'un des deux. Le `README` de l'AuthModule signale explicitement qu'une décision formelle est requise **avant Auth 2** (implémentation du login et du hachage). Cette ADR tranche ce choix.

Le backlog ADR (`docs/adr/ADR_BACKLOG.md`) réserve déjà l'identifiant `ADR-016` à « OpenAPI et génération de clients typés ». Le prochain identifiant disponible est `ADR-039`, retenu pour cette décision.

Cette ADR ne crée aucun code NestJS, n'ajoute aucune dépendance et ne modifie ni le schéma Prisma ni les spécifications de core.

## 5. Problème

Sans décision formelle, l'implémentation Auth 2 risquerait :

- un choix d'algorithme implicite et non documenté ;
- des paramètres de hachage dispersés dans le code ;
- des appels directs à la bibliothèque de hachage dans les controllers ou `UsersService` ;
- une absence de stratégie de mise à niveau (rehash) ;
- des paramètres trop faibles (sécurité insuffisante) ou trop élevés (risque de déni de service au login) ;
- une confusion entre hachage (à sens unique) et chiffrement (réversible) ;
- une fuite de mot de passe ou de hash dans les logs ou les tests.

Il faut un standard unique, moderne, paramétrable et testable, ainsi qu'une abstraction applicative claire.

## 6. Options étudiées

### Option A — Argon2id

Utiliser Argon2id (variante hybride résistante aux attaques côté canal auxiliaire et aux attaques temps-mémoire) avec des paramètres centralisés et configurables.

Avantages :

- lauréat du Password Hashing Competition, recommandé par l'OWASP pour les nouveaux développements ;
- coût mémoire configurable, qui pénalise fortement les attaques GPU/ASIC massivement parallèles ;
- résistance moderne aux attaques par force brute ;
- paramètres séparés (mémoire, temps, parallélisme) permettant un réglage fin.

Inconvénients :

- dépendance native ou binaire selon la bibliothèque retenue ;
- empreinte mémoire par opération à maîtriser sur l'environnement cible ;
- nécessite un benchmark pour fixer des paramètres adaptés ;
- vigilance sur la construction en image conteneur (compilation native ou binaires prébuilts).

### Option B — bcrypt

Utiliser bcrypt avec un nombre de rounds (cost factor) défini et centralisé.

Avantages :

- très mature, largement déployé et éprouvé ;
- intégration Node.js simple et bien documentée ;
- bibliothèques disponibles avec binaires prébuilts ;
- faible empreinte mémoire.

Inconvénients :

- pas de coût mémoire paramétrable : moins résistant aux attaques massivement parallèles que Argon2id ;
- limite historique de longueur d'entrée (~72 octets) à gérer explicitement ;
- considéré comme un choix de compatibilité plutôt que comme le meilleur standard pour un nouveau développement.

### Option C — Support obligatoire des deux algorithmes dès V1

Permettre la création de nouveaux hashes Argon2id ou bcrypt selon les modules ou projets.

Avantages :

- flexibilité apparente ;
- compatibilité immédiate avec d'anciens systèmes.

Inconvénients :

- complexité inutile dès V1 ;
- surface de configuration et de tests doublée ;
- risque d'incohérence entre modules ;
- aucune valeur immédiate par rapport à un standard unique pour les nouveaux hashes.

### Option D — Algorithme libre par projet

Chaque projet dérivé choisit librement son algorithme.

Avantages :

- adaptation locale ;
- liberté d'équipe.

Inconvénients :

- divergence durable entre projets ;
- revue de sécurité plus difficile ;
- conventions IA instables ;
- contraire à l'objectif d'une fondation cohérente et réutilisable.

## 7. Comparaison Argon2id / bcrypt

| Critère | Argon2id | bcrypt |
|---|---|---|
| Résistance force brute | Forte, ajustable par mémoire et temps | Bonne, ajustable par rounds |
| Coût mémoire | Configurable (clé contre attaques parallèles) | Faible et non configurable |
| Coût CPU | Configurable (temps + parallélisme) | Configurable (rounds) |
| Résistance attaques parallèles (GPU/ASIC) | Forte grâce au coût mémoire | Plus limitée |
| Maturité | Mature (PHC 2015), recommandé OWASP | Très mature et éprouvé |
| Intégration Node.js | Bonne (`argon2`, `@node-rs/argon2`) | Très bonne (`bcrypt`, `bcryptjs`) |
| Compatibilité NestJS | Bonne via service injectable | Bonne via service injectable |
| Expérience développeur | Bonne, API claire | Très familière |
| Maintenance | Active | Active |
| Performance serveur | Bonne si paramètres mesurés | Bonne, faible mémoire |
| Déploiement conteneur | Vigilance : compilation native ou binaires prébuilts | Simple, binaires prébuilts courants |
| Compatibilité tests | Bonne, valeurs fictives | Bonne, valeurs fictives |
| Migration future | Rehash au login, `needsRehash` | Possible, mais cible = Argon2id |
| Disponibilité bibliothèques | Plusieurs implémentations maintenues | Plusieurs implémentations maintenues |
| Risques opérationnels | Paramètres mal réglés, mémoire au login | Limite 72 octets, résistance parallèle moindre |

bcrypt reste une solution robuste et mature, mais Argon2id offre une meilleure résistance moderne grâce au coût mémoire paramétrable, ce qui le rend plus adapté comme standard d'un nouveau starter.

## 8. Décision

Enistere OS Foundation retient **l'Option A — Argon2id comme standard V1**.

La décision officielle est :

```txt
Enistere OS Foundation adopte Argon2id comme algorithme standard V1 de hachage des mots de passe pour le API Core NestJS.
```

Précisions obligatoires :

```txt
- Tous les nouveaux mots de passe sont hachés avec Argon2id.
- Le mot de passe en clair ne doit jamais être persisté ni journalisé.
- Le hash est conservé uniquement dans User.passwordHash.
- Les paramètres Argon2id sont centralisés.
- La vérification doit utiliser la fonction fournie par la bibliothèque retenue.
- Le système doit permettre une évolution future des paramètres.
- bcrypt peut être supporté plus tard uniquement pour une migration de hashes existants.
```

bcrypt reste :

- une alternative de compatibilité ;
- une solution possible pour la migration d'anciens systèmes ;
- une exception devant être documentée.

bcrypt ne doit pas devenir le standard principal du nouveau starter.

Le choix de la **bibliothèque** Argon2id (par exemple `argon2` natif vs `@node-rs/argon2` à binaires prébuilts) sera confirmé lors d'Auth 2, en tenant compte de la contrainte de construction en image conteneur (voir §12 et §21). Cette ADR fixe l'algorithme, pas la bibliothèque.

## 9. Raisons

Argon2id est retenu car :

- il est recommandé pour les nouveaux développements et conçu contre les attaques temps-mémoire ;
- son coût mémoire configurable pénalise les attaques massivement parallèles ;
- ses paramètres séparés (mémoire, temps, parallélisme) permettent un réglage adapté aux ressources ;
- il s'intègre proprement derrière une abstraction applicative unique ;
- il offre une meilleure cohérence de sécurité entre les projets dérivés ;
- la mise à niveau future des paramètres est gérable via `needsRehash` et un rehash au login.

## 10. Principes de paramétrage

L'ADR ne fige aucune valeur comme universellement optimale. Les paramètres Argon2id doivent être **centralisés** (un seul point de configuration, exposé via la configuration applicative) et couvrir :

- coût mémoire (`memoryCost`) ;
- coût temporel (`timeCost` / itérations) ;
- parallélisme (`parallelism`) ;
- longueur du hash en sortie si configurable (`hashLength`) ;
- longueur du sel si configurable (généralement gérée par la bibliothèque).

Règles de paramétrage :

- les valeurs initiales doivent être compatibles avec les ressources minimales prévues pour l'API ;
- elles doivent être **mesurées par benchmark sur l'environnement cible**, pas reprises telles quelles d'une machine de développement puissante ;
- elles doivent préserver un temps d'authentification acceptable sous charge ;
- elles doivent pouvoir évoluer sans modifier tous les modules (un seul point de configuration) ;
- elles doivent rester alignées sur les recommandations en vigueur (par exemple OWASP Password Storage Cheat Sheet) au moment de la stabilisation.

À titre **indicatif et non contraignant**, les recommandations publiques actuelles pour Argon2id se situent autour d'un coût mémoire de l'ordre de plusieurs dizaines de Mio, d'un faible nombre d'itérations et d'un parallélisme bas. Ces ordres de grandeur ne sont qu'un point de départ : ils **doivent être validés par benchmark** avant toute stabilisation des paramètres de production (voir §12).

## 11. Stratégie `PasswordHasher`

L'ADR impose une **abstraction applicative unique**, par exemple `PasswordHasher`, placée dans le domaine Auth (`src/auth/`).

Responsabilités futures :

- `hash(plainPassword): Promise<string>` ;
- `verify(hash, plainPassword): Promise<boolean>` ;
- éventuellement `needsRehash(hash): boolean` pour la mise à niveau des paramètres.

Règles :

- aucun appel direct à la bibliothèque Argon2 dans les controllers ;
- aucun appel de hachage dispersé dans `UsersService` (qui continue de recevoir un `passwordHash` déjà produit) ;
- le hachage appartient au domaine Auth ;
- le service ne doit jamais journaliser le mot de passe, le hash ou leur contenu ;
- la vérification doit passer par l'API de la bibliothèque (jamais de comparaison manuelle d'octets) ;
- les paramètres sont injectés depuis la configuration centralisée, pas codés en dur dans le service ;
- les tests doivent utiliser des valeurs fictives.

Cette abstraction n'est **pas** implémentée dans cette mission ; elle sera créée en Auth 2.

## 12. Stratégie de benchmark

Avant de stabiliser les paramètres de production :

- exécuter un benchmark sur un environnement représentatif de la cible (conteneur, ressources allouées réelles), pas sur une machine de développement surdimensionnée ;
- mesurer le temps moyen et la mémoire par opération `hash` et `verify` ;
- viser un compromis explicite entre sécurité et latence de login acceptable sous charge ;
- vérifier le comportement en cas de pics de login simultanés (mémoire totale = `memoryCost` × concurrence) ;
- documenter les paramètres retenus et la date/contexte du benchmark ;
- ré-évaluer périodiquement les paramètres avec l'évolution du matériel et des recommandations.

Le résultat du benchmark conditionne les valeurs finales ; aucune valeur ne doit être figée en production sans cette mesure.

## 13. Stratégie de rehash / migration future

Stratégie de mise à niveau (future, non implémentée dans cette mission) :

```txt
1. Vérifier le mot de passe avec le hash existant.
2. Détecter si les paramètres ou l'algorithme sont obsolètes.
3. Recalculer un hash Argon2id conforme lors d'un login réussi.
4. Remplacer l'ancien hash de manière atomique.
```

Précisions :

- la détection d'obsolescence s'appuie sur `needsRehash` (paramètres) et sur l'identification de l'algorithme encodé dans le hash ;
- le rehash n'a lieu qu'après une vérification réussie, et n'expose jamais le mot de passe au-delà du périmètre de vérification ;
- bcrypt n'est envisagé que comme **source** lors d'une migration de hashes existants vers Argon2id, jamais comme cible pour de nouveaux hashes ;
- la migration ne doit pas bloquer le login en cas d'échec du rehash (le login reste valide, le rehash est best-effort et journalisé sans secret).

## 14. Sécurité

Exigences minimales :

- jamais de mot de passe en clair en base ;
- jamais de mot de passe ni de hash dans les logs (à aucun niveau) ;
- jamais de retour de `passwordHash` dans une API publique (`PublicUser` ne le contient pas ; `AuthUser` est réservé à l'usage interne d'authentification) ;
- comparaison uniquement via l'API de vérification de la bibliothèque (résistante au timing) ;
- pas de comparaison manuelle de hashes ;
- paramètres centralisés ;
- erreurs de login génériques (`AUTH_INVALID_CREDENTIALS`), sans révéler si l'email existe ;
- rate limiting à prévoir sur le login (ADR-004 §18) ;
- protection contre les entrées excessivement longues (borne supérieure de longueur de mot de passe) pour éviter un coût de hachage abusif ;
- secrets applicatifs (clés JWT, etc.) strictement séparés du hash de mot de passe ;
- aucun chiffrement réversible du mot de passe (le hachage est à sens unique).

## 15. Conséquences positives

- standard moderne et recommandé pour les nouveaux développements ;
- coût mémoire configurable, renforçant la résistance aux attaques parallèles ;
- service de hachage centralisé et testable ;
- évolution des paramètres possible sans refonte des modules ;
- meilleure cohérence de sécurité entre projets dérivés ;
- préparation claire de la migration/rehash future.

## 16. Conséquences négatives

- dépendance supplémentaire à ajouter en Auth 2 (bibliothèque Argon2id) ;
- coût mémoire par opération supérieur à bcrypt ;
- besoin d'un benchmark avant stabilisation des paramètres ;
- éventuelles contraintes de compilation native ou de choix d'image Docker ;
- nécessité de surveiller la charge mémoire/CPU sur le login.

## 17. Risques

- paramètres Argon2id trop faibles (sécurité insuffisante) ;
- paramètres trop élevés provoquant un déni de service au login ;
- valeurs de paramètres dispersées dans le code au lieu d'être centralisées ;
- benchmarks réalisés uniquement sur une machine de développement puissante, non représentative ;
- dépendance native difficile à construire dans certains environnements/images ;
- fuite de mots de passe ou de hashes dans les logs ou les tests ;
- exposition involontaire de `passwordHash` via une API publique ;
- support simultané inutile de plusieurs algorithmes (complexité) ;
- migration non préparée (hashes hérités non pris en charge) ;
- confusion entre hachage (à sens unique) et chiffrement (réversible).

## 18. Alternatives rejetées

### Option B rejetée comme standard principal

bcrypt n'est pas retenu comme standard principal du nouveau starter car il ne propose pas de coût mémoire configurable et résiste moins bien aux attaques massivement parallèles. Il reste autorisé comme alternative de compatibilité et comme source de migration de hashes existants, par exception documentée.

### Option C rejetée

Le support obligatoire des deux algorithmes dès V1 est rejeté car il double la surface de configuration et de tests sans valeur immédiate. Un seul algorithme standard pour les nouveaux hashes est préférable.

### Option D rejetée

L'algorithme libre par projet est rejeté car il créerait une divergence durable et rendrait la revue de sécurité et la génération IA incohérentes, à l'encontre de l'objectif de fondation cohérente.

## 19. Impact sur API Core NestJS

- le hachage relève du domaine Auth, derrière l'abstraction `PasswordHasher` ;
- `UsersService` continue de recevoir un `passwordHash` déjà produit ; aucune logique de hachage n'y est introduite ;
- les paramètres Argon2id sont exposés via la configuration applicative centralisée et validés (cohérent avec ADR-003 sur la validation d'environnement) ;
- le `passwordHash` est persisté uniquement dans `User.passwordHash` (ADR-002, schéma déjà en place) et n'est jamais exposé publiquement.

## 20. Impact sur Auth 2

Auth 2 devra :

- ajouter la bibliothèque Argon2id retenue (dépendance à justifier) ;
- implémenter `PasswordHasher` (`hash`, `verify`, et `needsRehash` si pertinent) ;
- centraliser les paramètres et exécuter le benchmark (§12) avant stabilisation ;
- brancher la vérification dans `AuthService.validateCredentials` avec erreur générique `AUTH_INVALID_CREDENTIALS` ;
- prévoir le rate limiting et la borne de longueur de mot de passe sur le login.

Cette ADR lève le point bloquant « Argon2id vs bcrypt » signalé dans `src/auth/README.md`.

## 21. Impact sur déploiement et conteneurs

- la bibliothèque Argon2id peut impliquer une compilation native ; privilégier une bibliothèque à **binaires prébuilts** ou prévoir les outils de build dans l'image ;
- vérifier la compatibilité avec l'image de base (par exemple Alpine/musl vs glibc) ;
- dimensionner la mémoire du conteneur en tenant compte de `memoryCost` × concurrence de login ;
- documenter dans le futur cadrage cloud/CI l'impact build et les ressources ;
- ne pas exposer les paramètres comme secrets (ce ne sont pas des secrets), mais les garder centralisés et versionnés via configuration.

Cette ADR ne crée ni Dockerfile, ni image, ni configuration CI.

## 22. Impact sur tests

- tests unitaires du futur `PasswordHasher` : `hash` produit un hash vérifiable, `verify` accepte le bon mot de passe et rejette un mauvais, `needsRehash` détecte des paramètres obsolètes ;
- utiliser exclusivement des valeurs fictives ; ne jamais journaliser mot de passe ou hash dans les tests ;
- pour limiter le coût des tests, autoriser des paramètres réduits **uniquement en environnement de test**, sans impacter les paramètres de production ;
- les tests d'authentification doivent vérifier l'erreur générique sans fuite d'information.

## 23. Impact sur projets dérivés

- Argon2id est le standard pour tout nouveau projet utilisant le API Core NestJS ;
- bcrypt n'est autorisé que par exception documentée, principalement pour migrer des hashes existants ;
- les projets ne doivent pas exposer `passwordHash` ni journaliser de secret ;
- les paramètres restent centralisés et ajustables par environnement.

## 24. Impact sur IA / Codex / Claude Code

Les agents IA doivent :

- utiliser Argon2id pour tout nouveau hachage de mot de passe ;
- ne pas proposer bcrypt comme standard principal d'un nouveau starter ;
- ne jamais générer de code journalisant mot de passe ou hash ;
- ne jamais exposer `passwordHash` dans une API publique ;
- centraliser les paramètres et passer par l'abstraction `PasswordHasher` ;
- ne pas figer de paramètres « optimaux » sans signaler le besoin de benchmark ;
- ne pas implémenter le hachage hors d'une mission explicite (Auth 2) ;
- ne pas ajouter de dépendance sans justification.

## 25. Règles d'application

- Argon2id est le standard V1 de hachage des mots de passe du API Core NestJS.
- Tous les nouveaux mots de passe sont hachés avec Argon2id.
- Le mot de passe en clair n'est jamais persisté ni journalisé.
- Le hash est conservé uniquement dans `User.passwordHash`.
- Les paramètres Argon2id sont centralisés et configurables.
- La vérification utilise l'API de la bibliothèque retenue ; pas de comparaison manuelle.
- Le hachage passe par une abstraction unique `PasswordHasher` dans le domaine Auth.
- Les paramètres de production sont fixés après benchmark sur l'environnement cible.
- bcrypt n'est autorisé que par exception documentée, pour migrer des hashes existants.
- La politique de mot de passe (longueurs, compromission, MFA, reset) est traitée séparément et ne relève pas de cette ADR.

## 26. Conditions de révision

Cette décision pourra être revue si :

- une faiblesse cryptographique d'Argon2id est démontrée ;
- les recommandations publiques (OWASP, normes) évoluent significativement ;
- les contraintes de build/conteneur rendent la bibliothèque Argon2id trop coûteuse à maintenir ;
- les contraintes de performance au login deviennent bloquantes malgré le réglage ;
- un standard plus adapté émerge pour la majorité des projets ;
- les projets dérivés accumulent des exceptions justifiées.

Toute révision devra préserver l'interdiction du stockage en clair, l'usage d'un hachage à sens unique robuste, la centralisation des paramètres et l'abstraction `PasswordHasher`.

## 27. Conclusion

Enistere OS Foundation adopte Argon2id comme algorithme standard V1 de hachage des mots de passe du API Core NestJS. bcrypt reste une alternative de compatibilité et une source possible de migration, sans devenir le standard principal. Les paramètres sont centralisés, configurables et fixés après benchmark sur l'environnement cible, et le hachage est encapsulé dans une abstraction applicative unique `PasswordHasher`. Cette décision lève le point bloquant identifié avant Auth 2 et prépare une mise à niveau future maîtrisée.
