# ADR-003 — Validation API : class-validator/class-transformer vs Zod

## 1. Titre

Stratégie de validation API pour le API Core NestJS.

## 2. Statut

Validé.

## 3. Date

2026-05-30.

## 4. Contexte

Le API Core NestJS doit standardiser la validation des données entrantes avant leur traitement par les services applicatifs.

Ce choix impacte :

- DTO ;
- `ValidationPipe` global ;
- contrats API ;
- Swagger/OpenAPI ;
- erreurs de validation ;
- tests d'intégration ;
- sécurité API ;
- expérience développeur ;
- cohérence avec les clients Web/Mobile.

ADR-002 a retenu Prisma comme ORM principal V1. Cette décision impose de maintenir une séparation claire entre modèles de persistance Prisma, DTO publics et contrats API.

Les clients Web et Mobile peuvent utiliser Zod pour la validation UX côté formulaire, mais cette validation ne remplace jamais la validation backend.

## 5. Problème

Sans stratégie officielle de validation API, les modules NestJS peuvent diverger :

- DTO hétérogènes ;
- pipes différents selon module ;
- erreurs de validation incohérentes ;
- Swagger/OpenAPI incomplet ;
- validations manuelles dispersées ;
- champs inattendus acceptés silencieusement ;
- confusion entre validation frontend et validation backend ;
- duplication incontrôlée entre DTO, schémas client et modèles Prisma.

Il faut une stratégie V1 simple, native à NestJS, lisible et compatible avec la génération documentaire API.

## 6. Options étudiées

### Option A — class-validator + class-transformer comme standard V1

Utiliser DTO classes, decorators, `ValidationPipe` global, transformation contrôlée et intégration naturelle NestJS.

Avantages :

- intégration naturelle avec NestJS ;
- DTO lisibles et standards ;
- compatibilité directe avec `ValidationPipe` global ;
- bonne compatibilité Swagger/OpenAPI ;
- erreurs de validation centralisables ;
- expérience familière pour les développeurs NestJS ;
- conventions simples à générer avec Codex / Claude Code ;
- séparation claire entre DTO publics et modèles Prisma.

Inconvénients :

- decorators parfois mal utilisés ;
- transformation implicite dangereuse si mal configurée ;
- typage runtime moins explicite qu'un schéma Zod ;
- validation imbriquée à cadrer strictement ;
- messages d'erreur à normaliser.

### Option B — Zod comme standard principal

Utiliser des schémas Zod comme source de validation API principale.

Avantages :

- schémas explicites ;
- bonne inférence TypeScript ;
- usage cohérent possible avec les clients Web/Mobile ;
- validation fonctionnelle claire ;
- utile pour configuration ou cas hors DTO NestJS.

Inconvénients :

- intégration NestJS moins native ;
- Swagger/OpenAPI demande une stratégie complémentaire ;
- risque de duplication avec DTO classes ;
- conventions moins standards pour un starter NestJS classique ;
- peut créer une divergence avec `ValidationPipe` global ;
- migration documentaire et génération IA plus complexes en V1.

### Option C — Mix libre par module

Chaque module choisit librement `class-validator` ou Zod.

Avantages :

- flexibilité locale ;
- adaptation aux préférences d'équipe ;
- Zod possible là où il est pratique.

Inconvénients :

- incohérence forte entre modules ;
- erreurs de validation difficiles à standardiser ;
- Swagger/OpenAPI moins prévisible ;
- maintenance plus coûteuse ;
- prompts IA moins fiables ;
- risque de conventions contradictoires dans le starter.

### Option D — Validation manuelle

Valider manuellement les entrées dans les services ou controllers.

Avantages :

- contrôle complet ;
- aucun framework de validation imposé ;
- possible pour cas très spécifiques.

Inconvénients :

- duplication massive ;
- validation oubliée facilement ;
- erreurs incohérentes ;
- tests plus lourds ;
- sécurité plus fragile ;
- incompatibilité avec une fondation générique maintenable.

## 7. Décision

Enistere OS Foundation retient **l'Option A — class-validator + class-transformer comme standard V1**.

La décision officielle est :

```txt
Enistere OS Foundation adopte class-validator + class-transformer comme stratégie standard V1 pour la validation des DTO du API Core NestJS.
```

Précisions obligatoires :

```txt
class-validator + class-transformer sont le standard API Core NestJS V1.
Zod est autorisé uniquement pour des cas ciblés et documentés.
Le mix libre par module est interdit pour éviter l'incohérence.
```

Zod peut rester autorisé par exception documentée pour :

- validation fonctionnelle hors DTO NestJS ;
- validation partagée côté client si un projet le justifie ;
- parsing de configuration ;
- cas avancés nécessitant un schéma indépendant des decorators.

Cette ADR ne crée aucun DTO, pipe, schéma Zod, code NestJS ou dépendance.

## 8. Raisons de la décision

Cette stratégie est retenue car elle permet :

- intégration naturelle avec NestJS ;
- DTO lisibles et standards ;
- compatibilité avec `ValidationPipe` global ;
- meilleure compatibilité Swagger/OpenAPI ;
- cohérence des erreurs de validation ;
- meilleure expérience pour les développeurs NestJS ;
- conventions plus simples à générer avec Codex / Claude Code ;
- séparation claire entre DTO publics et modèles Prisma ;
- validation centralisée avant entrée dans les services ;
- réduction des validations manuelles dispersées.

Elle privilégie la cohérence du starter API V1 plutôt qu'une flexibilité module par module.

## 9. Comparaison class-validator/class-transformer vs Zod

| Critère | class-validator/class-transformer | Zod |
|---|---|---|
| Intégration NestJS | Native avec DTO classes et ValidationPipe | Possible, mais moins native |
| Lisibilité DTO | Forte pour conventions NestJS classiques | Forte côté schémas fonctionnels |
| Typage TypeScript | Bon via classes DTO | Excellent via inférence de schémas |
| Swagger/OpenAPI | Très compatible avec DTO decorators | Nécessite stratégie complémentaire |
| Transformation payloads | Supportée via class-transformer, à contrôler | Parsing explicite via schéma |
| Validation imbriquée | Possible, mais exige decorators corrects | Naturelle via schémas composés |
| Messages d'erreur | À normaliser | À normaliser aussi |
| Testabilité | Bonne avec DTO et endpoints | Bonne avec schémas isolés |
| Maintenabilité | Forte si conventions DTO respectées | Forte si schémas partagés bien gouvernés |
| Apprentissage | Familier aux développeurs NestJS | Familier aux stacks front modernes |
| Clients Web/Mobile | Backend reste source de vérité | Cohérence possible avec clients, mais duplication à surveiller |
| Génération IA | Très prévisible pour starter NestJS | Prévisible mais demande conventions custom |
| Risque de duplication | DTO vs modèles Prisma à surveiller | Schémas Zod vs DTO/OpenAPI à surveiller |
| Cohérence long terme | Bonne pour API NestJS V1 | Bonne si stratégie globale Zod est assumée plus tard |

Zod reste pertinent dans l'écosystème Enistere, notamment côté Web/Mobile et pour certains cas fonctionnels. Il n'est pas retenu comme standard principal de validation des DTO API NestJS V1.

## 10. Conséquences positives

- Le starter API NestJS a une stratégie de validation claire.
- Les DTO restent lisibles et alignés avec les conventions NestJS.
- `ValidationPipe` global devient le point d'entrée standard.
- Swagger/OpenAPI peut s'appuyer sur les DTO.
- Les erreurs de validation peuvent être normalisées.
- Les services reçoivent des données déjà validées.
- Les agents IA disposent d'une convention stable.

## 11. Conséquences négatives

- La fondation accepte une stratégie basée sur decorators pour V1.
- Zod ne peut pas être utilisé librement comme alternative module par module.
- Les validations imbriquées demandent une discipline stricte.
- Les messages d'erreur par défaut devront être adaptés.
- Les DTO peuvent devenir trop proches des modèles Prisma si la séparation n'est pas surveillée.

## 12. Risques

- Decorators mal utilisés.
- Transformation implicite dangereuse si mal configurée.
- DTO trop proches des modèles Prisma.
- Messages d'erreur peu clairs.
- Validation insuffisante des objets imbriqués.
- Absence de `whitelist` / `forbidNonWhitelisted`.
- Incohérence si Zod est utilisé librement dans certains modules.
- Confusion entre validation client et validation backend.
- Validation backend oubliée parce que le client valide déjà.
- Détails sensibles exposés dans les erreurs de validation.

## 13. Alternatives rejetées

### Option B rejetée comme standard principal V1

Zod n'est pas retenu comme standard principal des DTO API NestJS V1 car son intégration Swagger/OpenAPI et NestJS demanderait une stratégie complémentaire plus coûteuse pour le starter initial.

### Option C rejetée

Le mix libre par module est rejeté car il créerait une incohérence durable dans les DTO, les erreurs, la documentation API et les tests.

### Option D rejetée

La validation manuelle est rejetée comme stratégie générale car elle fragilise la sécurité, augmente la duplication et rend les conventions API difficiles à maintenir.

## 14. Impact sur API Core NestJS

Le API Core NestJS devra prévoir :

- `ValidationPipe` global obligatoire ;
- DTO classes pour les entrées publiques ;
- transformation contrôlée ;
- erreurs de validation normalisées ;
- séparation entre DTO, services et modèles Prisma ;
- tests de validation sur endpoints critiques ;
- validation des paramètres de route, query params, body et metadata upload.

La validation doit intervenir avant l'entrée dans les services applicatifs.

## 15. Impact sur Prisma / ADR-002

ADR-002 retient Prisma comme ORM principal V1.

Cette ADR impose que :

- les modèles Prisma ne deviennent pas des DTO publics ;
- les DTO/API contracts restent séparés du modèle de persistance ;
- les transformations entre DTO et modèle de persistance soient explicites ;
- les types générés par Prisma ne remplacent pas la validation des entrées ;
- les erreurs Prisma ne soient pas exposées directement comme erreurs API publiques.

Cette séparation limite le couplage entre API publique et base de données.

## 16. Impact sur Swagger/OpenAPI

La stratégie retenue doit améliorer la documentation OpenAPI :

- DTO documentables ;
- schémas d'entrée cohérents ;
- erreurs de validation standardisées ;
- compatibilité avec export OpenAPI futur ;
- meilleure lisibilité pour clients Web/Mobile.

La stratégie OpenAPI avancée et la génération de clients typés restent couvertes par ADR-016.

## 17. Impact sur Web Core Next.js

Le Web Core Next.js peut continuer à utiliser Zod pour la validation UX côté formulaire.

Mais :

- la validation backend reste obligatoire ;
- les erreurs API de validation doivent être consommables par les formulaires ;
- les schémas client ne doivent pas être considérés comme source de vérité sécurité ;
- les contrats publics API doivent rester cohérents avec OpenAPI ;
- les wrappers HTTP ADR-011 doivent transmettre les erreurs normalisées.

## 18. Impact sur Mobile Core React Native

Le Mobile Core React Native peut continuer à utiliser Zod pour la validation UX côté formulaire.

Mais :

- la validation backend reste obligatoire ;
- les erreurs de validation API doivent être affichables proprement ;
- les uploads, metadata et permissions doivent être validés côté API ;
- la validation client ne doit pas masquer les erreurs serveur ;
- les données sensibles ne doivent pas fuiter dans les messages d'erreur.

## 19. Impact sur sécurité API

La stratégie de validation doit renforcer la sécurité API :

- rejeter les champs inattendus ;
- éviter la pollution de payload ;
- ne pas accepter silencieusement des données inconnues ;
- ne pas exposer de détails sensibles dans les erreurs ;
- valider les fichiers et metadata côté backend ;
- valider pagination, filtres et paramètres de requête ;
- valider UUID, emails, téléphones, montants et dates selon contexte ;
- ne jamais faire confiance à la validation frontend.

La validation doit être complétée par l'autorisation, les permissions et les règles métier lorsque nécessaire.

## 20. Impact sur IA / Codex / Claude Code

Les agents IA doivent appliquer cette ADR lors de la génération ou revue du API Core NestJS.

Ils doivent :

- utiliser `class-validator` et `class-transformer` pour les DTO API V1 ;
- prévoir un `ValidationPipe` global ;
- ne pas introduire Zod comme alternative libre dans un module ;
- distinguer DTO publics, modèles Prisma et types API ;
- signaler les DTO exposant trop directement la persistance ;
- vérifier `whitelist`, `forbidNonWhitelisted` et transformation contrôlée ;
- signaler les validations imbriquées manquantes ;
- ne pas générer de code ou dépendance hors mission explicite.

L'IA assiste la génération et la revue, mais ne décide pas seule d'une exception Zod.

## 21. Règles d'application

- `ValidationPipe` global obligatoire dans le starter API NestJS.
- `whitelist` activé.
- `forbidNonWhitelisted` recommandé.
- `transform` contrôlé.
- DTO publics séparés des modèles Prisma.
- Validation backend obligatoire même si les clients Web/Mobile valident aussi.
- Erreurs de validation normalisées.
- Tests de validation pour les endpoints critiques.
- Zod interdit comme alternative libre module par module.
- Zod autorisé uniquement par exception documentée.
- Les DTO doivent rester simples, lisibles et documentés.
- Les validations complexes doivent être explicitement testées.
- Les fichiers, metadata, query params, filtres et pagination doivent être validés côté backend.
- Les erreurs ne doivent pas exposer de détails sensibles.

## 22. Conditions de révision future

Cette décision pourra être revue si :

- Zod devient nécessaire comme source de vérité partagée backend/frontend ;
- la stratégie OpenAPI évolue vers des schémas générés depuis une autre source ;
- `class-validator` / `class-transformer` ne répondent plus aux besoins de validation ;
- les validations imbriquées deviennent trop coûteuses à maintenir ;
- les projets dérivés accumulent des exceptions Zod justifiées ;
- une nouvelle solution devient plus adaptée à NestJS, OpenAPI et clients typés.

Toute révision devra préserver la validation backend obligatoire, la séparation DTO/persistance et la sécurité des entrées.

## 23. Conclusion

Enistere OS Foundation adopte `class-validator` et `class-transformer` comme stratégie standard V1 pour la validation des DTO du API Core NestJS.

Zod reste autorisé uniquement pour des cas ciblés et documentés. Le mix libre par module est interdit afin de préserver la cohérence du starter API, des erreurs de validation, de Swagger/OpenAPI et des futurs clients Web/Mobile.
