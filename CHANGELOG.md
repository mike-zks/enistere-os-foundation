# Changelog

Les changements détaillés sont disponibles dans Git et les GitHub Releases.

## Unreleased

### Architecture Reset V2 — adoption du corpus documentaire

- Adoption du corpus documentaire Enistere Foundation V2 comme base canonique : `docs/strategy/`,
  `docs/architecture/`, `docs/specifications/`, `docs/governance/`, `docs/roadmap/`.
- `docs/governance/SOURCE_OF_TRUTH.md` devient la référence officielle d'autorité documentaire.
- Ajout d'[ADR-044](docs/adr/ADR-044-enistere-foundation-v2-architecture-reset.md) : l'unité centrale
  d'Enistere devient le système défini par un blueprint, non le starter autonome. ADR-042 est supersédé.
- Portage des règles opérationnelles actives sans équivalent dans le corpus vers
  `docs/governance/{DEPENDENCY_POLICY,ENGINEERING_STANDARDS,GIT_STRATEGY}.md` et la section
  « Invariants applicables » de `docs/architecture/SECURITY_ARCHITECTURE.md`.
- Suppression de l'ancienne architecture documentaire concurrente : dossier `strategy/`, matrices de
  profils dupliquées, guide et checklist de statut de core, rapports V1 et note de session. L'historique
  reste disponible via Git, le tag `foundation-v1.0.0` et les GitHub Releases.
- Phase déclarée : `ARCHITECTURE_RESET_V2`. Action unique : auditer les écarts entre l'architecture V2
  adoptée et l'implémentation actuelle.
- Aucun changement de code, de schéma, de manifeste, de dépendance ou de workflow.

### Capability Packs 2 — RBAC Spring autonome

- Ajout de l'overlay RBAC Spring au-dessus de `base + auth`, sans modification du payload Auth.
- Ajout des rôles, permissions et associations par migration Flyway V2, sans seed ni attribution implicite.
- Ajout du résumé `/api/v1/auth/me/authorization` et du bean Method Security `rbacAuthorization` ;
  les décisions consultent PostgreSQL et aucun droit n'est placé dans le JWT.
- Promotion de `spring-rbac` à `ready` via le golden runtime `spring-auth-rbac`.

### Capability Packs 2 — Auth Spring autonome

- Ajout de l'overlay Maven Auth Spring : session persistée, refresh rotatif, JWT, configuration par environnement et migration Auth dédiée.
- Suppression des dépendances implicites vers RBAC et Audit ; `/me` reste limité à l'identité Auth.
- Ajout du golden `spring-auth`, de sa matrice CI et des assertions d'absence RBAC/Audit/Files.

### Project Factory R8A-3 — baselines Angular et Flutter modulaires

- Extraction des bases Angular et Flutter sans Auth, RBAC, Files ni session métier.
- Les six starters déclarent désormais `composition.model: modular` avec une `baseSource` explicite.
- Les 19 profils générables base-only sont exacts et golden-proven ; aucun profil `supported`
  ne masque encore une copie baseline excessive.

### Factory Composition Engine 2A — contrat d’adapters et opérations déclaratives

- Les targets utilisent un registre d’adapters versionnés ; leurs versions sont verrouillées dans
  le plan de génération.
- Les overlays peuvent déclarer leurs opérations et sont refusés si l’adapter ne les supporte pas.

### Project Factory R8A-2 — Spring base modulaire

- Extraction de `starters/spring/base` : le profil `spring-base` ne copie plus les modules Auth,
  RBAC ou Files du baseline historique.
- Le moteur résout `composition.baseSource` et conserve le workspace/lock généré cohérent pour
  les sources modulaires imbriquées.
- Goldens structurels et `./mvnw test` du starter Spring base vérifient l'absence des dépendances
  et surfaces métier non sélectionnées. `spring-base`, `spring-next-base` et
  `spring-react-native-base` sont promus `ready`; Angular/Flutter restent `supported`.

### Project Factory 4 (R7) — matrice des profils et combinaisons supportées

- Nouveau registre `factory/engine/profiles.mjs` : un **profil** est une composition nommée
  `{api, web?, mobile?, capabilities}`. 26 profils déclarés, dont 19 générables.
- Trois statuts explicites : `ready` (composable **et** prouvé par un golden runtime), `supported`
  (composable selon la matrice, sans preuve runtime) et `planned` (non composable, génération
  refusée). Aucun `ready` n'est attribué sans overlay et golden.
- Chaque statut déclaré est **recalculé depuis la matrice réelle** des capabilities et comparé par
  `factory/test/profiles.test.mjs` : un profil qui surestime la réalité fait échouer la suite.
- **L'API est un invariant**, pas un paramètre : `stack.api` reste obligatoire et aucun profil sans
  API n'existe. Toute demande « web-only » ou « mobile-only » (`angular-only-base`,
  `flutter-only-base`, `nextjs-only-base`, `react-native-only-base`, et tout nom introduit par un
  starter Web ou Mobile) est refusée avec un message rappelant l'invariant et proposant les profils
  API correspondants — toujours des profils réellement enregistrés.
- Blueprint : champ optionnel `profile`. Le blueprint est validé contre le profil déclaré (dérive de
  stack, dérive de capabilities, profil `planned`) avec un message explicite.
- CLI : `enistere profiles` et `enistere profile <name>` ; `enistere plan` nomme le profil
  correspondant et affiche les capabilities et les gates attendus par application générée.
- Les 18 combinaisons de stacks restent une grandeur distincte des profils : plusieurs profils
  partagent une combinaison, et de nombreuses combinaisons n'en portent aucun.
- Documentation : `docs/project-status/PROFILE_MATRIX.md`, matrice et séquence R7 mises à jour.

#### 4B — couverture des goldens triples

- Deux profils `ready` ajoutés pour les compositions triples déjà prouvées :
  `nestjs-next-react-native-auth` (golden `triple-auth`) et `nestjs-next-react-native-rbac`
  (golden `triple-auth-rbac`). Ils **réutilisent exactement** ces compositions : aucun renderer,
  overlay, capability ni comportement runtime nouveau.
- Les dix goldens adossent désormais un profil `ready`, chacun sur un golden distinct, dont
  `nestjs-next-files` pour `nest-next-files` et `nestjs-next-react-native-files` pour `triple-files`.
- La documentation ne peut plus dériver du registre : trois tests croisent `PROFILE_MATRIX.md` et
  `profiles.mjs` (tout profil enregistré est documenté, tout profil documenté est enregistré, et les
  compteurs annoncés sont ceux du registre).
- La vérification « une suggestion pointe toujours vers un profil enregistré » couvre désormais tous
  les noms sans API que la CLI peut rencontrer, pas seulement les quatre noms canoniques.
- Aucune promotion automatique : les profils `supported` le restent tant qu'aucun golden ne les
  prouve.

### Capability Packs 1C — extraction Files (NestJS + Next.js + React Native)

- `files` passe à `ready`/`overlay` sur la verticale TypeScript, avec dépendance explicite
  `base + auth + rbac` et refus de génération si une dépendance manque.
- Overlay NestJS : modèle Prisma/migration, upload multipart, métadonnées, URL signée, suppression,
  quarantaine, quotas et réconciliation S3/MinIO.
- Overlay Next.js : BFF, routes, hooks, vues protégées et navigation ajoutée par registre, sans
  remplacement du shell Auth/RBAC.
- Overlay React Native : navigation et action d'upload ajoutées par seam ; RBAC reste
  `not-applicable` et aucune surface d'autorisation n'est injectée sur mobile.
- Contrat OpenAPI généré depuis l'application composée ; snapshots centraux interdits, registres
  de navigation ordonnés et validés.
- Environnement e2e composé : l'overlay Files remplace `test/setup-e2e.ts` par un sur-ensemble
  strict de la variante Auth, ajoutant les variables S3 et `FILES_ORPHAN_MIN_AGE_SECONDS=1`
  (la valeur de production, 86400 s, rendait la réconciliation intestable).
- Goldens runtime ajoutés : `nestjs-files`, `nest-next-files`, `triple-files`.
- Non-régression Files V1 documentée dans `docs/project-status/FILES_V1_NON_REGRESSION.md`.

### Capability Packs 1B — extraction RBAC (NestJS + Next.js)

- `rbac` passe à `ready`/`overlay` sur **NestJS** et **Next.js**, avec dépendance explicite
  `requires: ["base", "auth"]` refusée par le moteur si Auth manque. Files reste `planned`.
- **Nouveau statut `not-applicable`** (React Native pour RBAC) : documenté, testé, non bloquant et
  n'injectant aucune surface — la composition triple `base + auth + rbac` reste générable et le
  mobile reste sur `base + auth`.
- **Ordre des guards globaux déterministe** : l'intégration `nestjs.global-guard` porte un `order`
  obligatoire (authentification 10 → rôles 20 → permissions 30) ; doublons et rangs ambigus refusés.
- **Composition Prisma déclarative stricte** : `nestjs.prisma-schema` accumule enums, modèles et
  extensions dans un modèle intermédiaire puis rend le schéma une fois ; aucune analyse ou mutation
  textuelle. Migration RBAC dédiée ordonnée après Auth.
- Endpoint `GET /auth/me/authorization` restauré à l'identique (`auth_getAuthorization`, DTO public
  inchangé) par un contrôleur **propre à RBAC** : le contrôleur d'Auth n'est pas modifié.
- Surface web RBAC restaurée (BFF, client same-origin réutilisant `bffGet`, clé de cache dérivée de
  `authKeys.all` donc purgée au logout, hook et vue) : affichage conditionnel uniquement, l'API
  reste l'autorité.
- Seed structurel gouverné via `nestjs.prisma-seed` et registre ordonné ; page de statut Next.js
  étendue via `nextjs.status-section`. Les orchestrateurs/shells centraux restent stables.
- Snapshots OpenAPI retirés des overlays : contrat généré depuis l'application composée, opérations
  attendues déclarées par capability et reproductibilité byte-identique vérifiée en golden runtime.
- Politique d'overwrite fermée : fichiers centraux impossibles à copier/remplacer, allowlist réduite
  et justifiée pour les variantes exclusives.
- Goldens runtime étendus : `nestjs-auth-rbac`, `nest-next-auth-rbac`, `triple-auth-rbac`.
- Non-régression RBAC V1 documentée (`docs/project-status/RBAC_V1_NON_REGRESSION.md`).

### Capability Packs 1A-R — reproductibilité et preuve runtime des compositions Auth

- **Finalisation explicite des dépendances** : `enistere generate <blueprint> <out> --install` et
  `enistere install <projet>` résolvent le lock racine **sans script lifecycle**
  (`npm install --package-lock-only --ignore-scripts`), installent via `npm ci`, puis enregistrent
  `dependenciesLocked`, `lockDigest` (sha256) et `lockfileVersion` dans `enistere.lock`. Une génération
  sans finalisation est explicitement marquée `dependenciesLocked: false`.
- **`enistere verify <projet>`** (chemin de répertoire) recalcule le digest du lock et détecte toute
  modification, absence ou incohérence de l'état déclaré.
- **`npm audit` sur les quatre goldens**, par exceptions documentées et scopées
  (`factory/quality/audit-exceptions.json` : package, portée, justification, échéance). Aucune
  désactivation globale : les advisories Expo/RN préexistants (cause racine unique `uuid`, modérés,
  outillage de build) sont tolérés uniquement pour les compositions React Native et expirent le
  2026-10-31 ; toute autre vulnérabilité fait échouer le gate.
- **Déterminisme du lock** vérifié par golden (même blueprint + même Foundation → même digest) et par
  la suite de tests réseau `dependencies-install.test.mjs` (lockfiles byte-identiques).

- **Stratégie de lockfile déterministe** : le projet généré devient un workspace npm unifié. Le
  `package.json` racine déclare toutes les applications npm (`apps/api`, `apps/web`, `apps/mobile`) et
  `packages/*` comme membres ; les `@enistere/*` sont résolus via la portée `*` (jamais `file:`/`link:`).
  La fusion de dépendances ne supprime plus aucun lockfile ; un unique `package-lock.json` racine
  (écrit par `npm install`) fait autorité et `npm ci` réinstalle de façon reproductible. Corrige le
  bug 1A où la fusion de dépendances supprimait le lockfile, rendant `npm ci` impossible.
- **CI obligatoire `Factory Golden Runtime`** : pour `nestjs-base`, `nestjs-auth`, `nest-next-auth` et
  `triple-auth`, génère le projet, prouve l'installation reproductible et exécute les gates réels de
  chaque application (NestJS : prisma/lint/tests/e2e Auth/openapi/build ; Next.js :
  typecheck/lint/tests/build ; React Native : typecheck/lint/tests/doctor/`expo export`).
- **Découplage Auth ↔ RBAC (Next.js)** : la surface d'autorisation (résumé rôles/permissions) est
  retirée de l'overlay Auth (elle relève de RBAC), rendant `base+auth` propre au typecheck/build.
- **README de projet généré** dérivé du blueprint et du plan (stack, capabilities, prérequis,
  installation `npm install`/`npm ci`, variables d'env, infra, migrations, démarrage, tests, limites,
  provenance/lock).
- **Non-régression Auth V1** documentée et prouvée (`docs/project-status/AUTH_V1_NON_REGRESSION.md`) :
  aucune garantie Auth historique perdue ; suppression de la dépendance Auth → RBAC et d'une variable
  d'environnement requise mais morte (`JWT_REFRESH_SECRET`).

### Capability Packs 1A — extraction Auth (NestJS + Next.js + React Native)

- Moteur d'overlays déclaratifs (`factory/engine/overlay.mjs`, `overlay.schema.json`) : le
  moteur Factory est l'unique interpréteur (copies de fichiers, fusion de dépendances, variables
  d'environnement, intégrations centrales connues, commandes de vérification). Aucun script, hook,
  eval ni commande libre depuis un manifeste. Échec sur conflit de fichiers non déclaré, opération
  ou intégration inconnue, conflit de version de dépendance et chemin non sûr.
- `auth` passe à `ready`/`overlay` uniquement sur `nestjs`, `nextjs` et `react-native` ; Spring,
  Angular, Flutter, RBAC et Files restent `planned`. `generate` continue de refuser RBAC et Files.
- Baselines `base` réellement minimales : chaque starter compile/démarre et se teste sans Auth,
  via des points d'intégration générés (composition NestJS, providers Next.js/Expo, nav publique).
- Auth NestJS ne dépend plus de RBAC : `AuthModule` n'importe plus `AuthorizationModule`/Roles/
  Permissions. Configuration Auth auto-validée par namespace (`registerAs`), sans couplage à la
  configuration de la baseline.
- `generationMode` devient `modular-overlay` et `bundledFeaturesMayExceedSelection=false` pour les
  compositions dont toutes les targets sélectionnées sont modulaires ; `enistere.lock` inscrit les
  versions et digests des overlays appliqués.
- Contrat OpenAPI canonique complet figé dans `packages/api-contracts/contract/` : les clients
  restent typés contre la surface composée, indépendamment de la baseline générée.
- Goldens `base`/`base+auth` vérifiés pour les trois verticales (absence dans base, présence dans
  base+auth, aucune capability RBAC/Files injectée).

### Foundation V2 consolidation

- Taxonomie AI/Quality/Deployment aplatie : ces surfaces ne sont plus présentées comme des cores.
- Strategy et project-status réduits à des sources V2 décisionnelles.
- Rapports de micro-missions supprimés des sources actives ; Git reste l'archive.
- Préparation du contrat Starter/Capability V2 et des overlays réels.

## Foundation V2 architecture — 2026-07-18

- Project Factory déterministe et CLI `enistere`.
- Six starters indépendants, packages partagés et packs de deployment.
- Blueprint/lock, matrice de stacks et orchestration locale Codex/Claude/Gemini.
- ADR-042 validé.

## Foundation V1 — 2026-07-12

Baseline publiée sous le tag `foundation-v1.0.0`.
Voir `docs/project-status/FOUNDATION_V1_RELEASE_NOTES.md`.
