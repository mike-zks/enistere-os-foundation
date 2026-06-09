# ADR-001 — Organisation Git monorepo hybride

## 1. Titre

Organisation Git monorepo hybride pour Enistere OS Foundation.

## 2. Statut

Validé.

## 3. Date

2026-05-30.

## 4. Contexte

Enistere OS Foundation est une fondation interne qui centralise la stratégie, les standards, les cores, les prompts IA, les templates, les outils, les exemples, la documentation et la gouvernance technique.

La fondation doit servir plusieurs projets dérivés : APIs, applications mobiles, applications web, dashboards, plateformes SaaS, marketplaces, plateformes immobilières, services IA et outils internes.

Les documents de Phase 0 définissent déjà une organisation Git hybride :

- un repository principal pour `enistere-os-foundation` ;
- des repositories séparés pour les projets dérivés.

Cette ADR formalise cette décision avant toute génération de starter technique.

## 5. Problème

Il faut choisir une organisation Git capable de :

- préserver la cohérence de la fondation ;
- centraliser les standards et les prompts IA ;
- éviter de mélanger les projets métier avec la fondation ;
- isoler les secrets et cycles de release des projets dérivés ;
- permettre à Codex, Claude Code ou tout agent IA de travailler avec un périmètre clair ;
- limiter la duplication et la divergence entre cores.

Sans décision formelle, les futurs starters risquent d'être générés avec des conventions Git incompatibles ou implicites.

## 6. Options étudiées

### Option A — Monorepo unique pour tout

Un seul repository contient :

- Enistere OS Foundation ;
- tous les cores ;
- tous les projets dérivés ;
- toutes les applications réelles ;
- toutes les configurations projet.

Avantages :

- visibilité complète dans un seul dépôt ;
- mutualisation simple des standards ;
- recherche globale facilitée.

Inconvénients :

- mélange de la fondation et du métier ;
- risques de secrets projet dans le repository de fondation ;
- bruit important dans l'historique Git ;
- cycles de release difficiles à isoler ;
- périmètres IA plus risqués ;
- gouvernance plus lourde.

### Option B — Multi-repos complets

Chaque core et chaque projet possède son propre repository.

Avantages :

- isolation forte ;
- cycles de release indépendants ;
- permissions Git fines par repository ;
- historique par domaine.

Inconvénients :

- cohérence de la fondation plus difficile ;
- duplication des standards ;
- prompts IA dispersés ;
- documentation stratégique fragmentée ;
- synchronisation entre cores plus coûteuse ;
- onboarding plus complexe.

### Option C — Stratégie hybride retenue

Un monorepo pour Enistere OS Foundation et des repositories séparés pour les projets dérivés.

Le monorepo `enistere-os-foundation` contient :

```txt
strategy/
docs/
cores/
prompts/
tools/
templates/
examples/
.github/
```

Les projets dérivés restent dans des repositories séparés, par exemple :

```txt
kivvoo-api
kivvoo-mobile
bailo-web
bailo-api
vox-pulse-api
civis-id-platform
```

## 7. Décision

Enistere OS Foundation utilise **l'Option C — stratégie hybride** :

```txt
Monorepo pour Enistere OS Foundation
+
Repositories séparés pour les projets dérivés
```

La fondation reste centralisée dans `enistere-os-foundation`.

Les projets réels restent indépendants et documentent leur relation à la fondation via un fichier `foundation.md`.

## 8. Raisons de la décision

Cette stratégie est retenue car elle permet :

- cohérence de la fondation ;
- centralisation des standards ;
- gestion unifiée des prompts IA ;
- meilleure traçabilité des documents stratégiques ;
- séparation claire des projets métiers ;
- secrets isolés par projet ;
- cycles de release indépendants pour les projets dérivés ;
- limitation du bruit dans la fondation ;
- meilleure compatibilité avec Codex et Claude Code.

Elle équilibre centralisation des règles communes et autonomie des produits réels.

## 9. Conséquences positives

- Les cores évoluent dans un référentiel commun.
- Les standards, prompts IA, templates et ADR restent alignés.
- Les revues transversales sont plus simples.
- Les projets dérivés peuvent évoluer à leur rythme.
- Les secrets et configurations métier restent hors fondation.
- Les agents IA disposent d'un contexte stable et versionné.
- Les contributions à la fondation sont plus faciles à tracer.

## 10. Conséquences négatives

- Les projets dérivés doivent gérer leur synchronisation avec la fondation.
- Des améliorations génériques peuvent rester bloquées dans un projet si elles ne sont pas remontées.
- La version de fondation utilisée par chaque projet doit être documentée.
- Il faut maintenir des changelogs côté fondation et côté projets.
- Certaines décisions transverses peuvent nécessiter des mises à jour coordonnées.

## 11. Risques

- Duplication possible entre fondation et projets dérivés.
- Divergence si les projets ne documentent pas leur version de fondation.
- Absence ou négligence du fichier `foundation.md` dans les projets dérivés.
- Améliorations génériques non remontées vers la fondation.
- Changelogs non maintenus.
- Prompts IA ou règles locales divergeant des standards de la fondation.

## 12. Alternatives rejetées

### Option A rejetée

Le monorepo unique pour tout est rejeté car il mélange la fondation et les produits réels. Il augmente le risque de bruit, de secrets accidentels, de cycles de release confus et de périmètres IA trop larges.

### Option B rejetée

Le multi-repos complet est rejeté car il fragmente les cores, les standards, les prompts IA et la documentation stratégique. Il rendrait la cohérence globale plus coûteuse à maintenir.

## 13. Impact sur les cores

Tous les cores restent dans `cores/` au sein du monorepo de fondation :

- `api-nestjs`
- `cloud`
- `mobile-react-native`
- `web-nextjs`
- `ui-kit`
- futurs cores prioritaires ou secondaires

Chaque core peut être versionné, documenté et revu dans le même référentiel.

Les cores ne doivent pas contenir de logique métier projet.

## 14. Impact sur les projets dérivés

Les projets dérivés restent dans leurs propres repositories.

Chaque projet dérivé doit documenter son lien avec la fondation dans un fichier :

```txt
foundation.md
```

Ce fichier doit préciser au minimum :

- repository source de la fondation ;
- cores utilisés ;
- version ou commit de référence ;
- modules activés ;
- adaptations projet ;
- écarts assumés ;
- améliorations génériques à remonter.

## 15. Impact sur Codex / Claude Code / IA

La stratégie hybride améliore l'utilisation des agents IA :

- le monorepo de fondation fournit un contexte stable ;
- les prompts IA sont versionnés dans `prompts/` ;
- les tâches peuvent être limitées à un core ou un dossier ;
- les projets dérivés peuvent être analysés séparément ;
- l'IA ne doit pas propager automatiquement une modification projet vers la fondation ;
- toute amélioration générique proposée par l'IA doit passer par revue humaine et PR.

L'IA reste un assistant, pas un décideur.

## 16. Règles d'application

- Toute décision structurante de la fondation doit être documentée par ADR.
- Les cores de fondation restent dans `cores/`.
- Les projets réels ne doivent pas être ajoutés dans le monorepo de fondation.
- Les projets dérivés doivent conserver leurs secrets hors fondation.
- Toute modification significative passe par Pull Request.
- Les changements transverses doivent mettre à jour la documentation et le changelog.
- Les projets dérivés doivent maintenir un `foundation.md`.
- Les améliorations génériques découvertes dans un projet doivent être proposées à la fondation.
- Les prompts IA structurants restent versionnés dans `prompts/`.

## 17. Conditions de révision future

Cette décision pourra être revue si :

- la fondation devient trop volumineuse pour un monorepo ;
- certains cores nécessitent des cycles de release totalement indépendants ;
- les contraintes d'accès ou de sécurité imposent une séparation par repository ;
- les projets dérivés ne parviennent pas à synchroniser correctement la fondation ;
- une stratégie de package interne rend plus pertinente une séparation progressive ;
- les outils IA ou CI/CD imposent une autre organisation.

Toute révision devra être documentée dans une nouvelle ADR.

## 18. Conclusion

La stratégie hybride est retenue comme organisation Git officielle d'Enistere OS Foundation.

Elle permet de centraliser la fondation, les cores, les standards, les prompts IA et la documentation, tout en gardant les projets métier séparés, sécurisés et indépendants dans leurs propres repositories.

