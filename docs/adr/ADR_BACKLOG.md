# Backlog ADR — Revue globale des 5 cores prioritaires

## 1. Introduction

Ce backlog ADR consolide les décisions structurantes identifiées après la revue globale des cinq cores prioritaires d'Enistere OS Foundation :

- `api-nestjs`
- `cloud`
- `mobile-react-native`
- `web-nextjs`
- `ui-kit`

Il ne tranche aucune décision. Il sert à préparer les ADR individuels nécessaires avant l'implémentation des starters réels.

> Note de cohérence — 2026-06-13 : ce backlog reste la liste des **ADR à rédiger**
> ou déjà validés. Certaines briques préparatoires ont depuis été livrées dans les
> starters, notamment dans `mobile-react-native` (logger/redaction RN 8, analytics
> primitives RN 13, offline/connectivité RN 3/RN 16, feature flags/config RN 17,
> gate biométrique local RN 18 — gate d'UX, jamais un substitut à l'auth serveur ;
> crash/error-reporting RN 19 — primitive préparatoire qui **ne décide pas ADR-019**,
> sans SDK réel/réseau/persistance ; préférences non sensibles RN 20 — seam
> MMKV/AsyncStorage **sans store natif réel**, données non sensibles uniquement,
> ne décide aucun choix de stockage natif — ADR-015 §15/§16 ; consentement
> télémétrie / privacy gate RN 21 — primitive préparatoire **default-deny** qui
> **ne décide pas ADR-038**, sans SDK/réseau/UI/identifiant/PII, ne câble pas
> analytics/crash ; environnement / métadonnées app RN 22 — contexte **coarse et
> NON identifiant** (allow-list, version majeure, aucun device/installation id),
> **ne décide ni ADR-038/ADR-019/ADR-018**, sans `expo-device`/`expo-application`
> réel, ne collecte rien automatiquement).
> Ces briques **ne remplacent pas** les ADR futurs : elles restent génériques,
> sans SDK réel, sans persistance, sans réseau externe et sans choix produit.
> Les lignes concernées sont annotées pour éviter de confondre "primitive de
> fondation" et "décision stratégique".

## 2. Objectif du backlog ADR

Le backlog ADR a pour objectifs :

- lister les décisions d'architecture nécessaires ;
- identifier les décisions bloquantes avant V1 ;
- éviter les choix implicites dans les starters ;
- réduire les contradictions entre cores ;
- cadrer les dépendances critiques ;
- préparer une séquence de rédaction des ADR.

## 3. Méthode de priorisation

Les ADR sont classés selon trois niveaux :

- **Bloquant V1** : décision indispensable avant de générer le code réel d'un core V1.
- **Important non bloquant V1** : décision utile mais pouvant être prise après un starter minimal si le périmètre reste limité.
- **Futur** : décision liée aux versions V2, V3 ou VF.

Critères utilisés :

- impact sécurité ;
- impact architecture ;
- impact dépendances ;
- impact multi-core ;
- risque de migration ;
- coût de correction tardive ;
- alignement avec la roadmap globale.

## 4. ADR bloquants avant implémentation V1

Ces ADR doivent être traités avant de générer les starters V1 réels.

| ID proposé | Titre | Priorité | Cores impactés | Bloquant V1 | Statut | Commentaire |
|---|---|---|---|---|---|---|
| ADR-001 | Organisation Git monorepo hybride | Haute | Tous | Oui | Validé | Formaliser la stratégie déjà retenue par la Phase 0 avant les premiers starters. |
| ADR-002 | ORM API NestJS : Prisma vs TypeORM | Haute | api-nestjs | Oui | Validé | Décision structurante pour modèles, migrations, tests et seed. |
| ADR-003 | Validation API : class-validator/class-transformer vs Zod | Haute | api-nestjs, web-nextjs, mobile-react-native | Oui | Validé | Éviter une divergence forte entre DTO backend et schémas front/mobile. |
| ADR-004 | Stratégie auth/session multi-client | Haute | api-nestjs, web-nextjs, mobile-react-native | Oui | Validé | Définir access token, refresh token, cookies web, secure storage mobile, logout et invalidation. |
| ADR-005 | Sécurité cookies web et CSRF | Haute | api-nestjs, web-nextjs | Oui | Validé | Nécessaire si le web utilise cookies HttpOnly pour refresh/session. |
| ADR-006 | RBAC et permissions fines | Haute | api-nestjs, web-nextjs, mobile-react-native, ui-kit | Oui | Validé | Définir modèle, granularité, conventions UI et responsabilités backend/frontend. |
| ADR-007 | Upload MinIO/S3 et contrats fichiers | Haute | api-nestjs, cloud, web-nextjs, mobile-react-native, ui-kit | Oui | Validé | Cadrer stockage, URLs signées, validation, taille, types, erreurs et sécurité. |
| ADR-008 | Design tokens UI Kit | Haute | ui-kit, web-nextjs, mobile-react-native | Oui | Validé | Base commune des interfaces, indispensable avant composants réels. |
| ADR-009 | Stack UI Web : Tailwind, shadcn/ui, Radix UI | Haute | ui-kit, web-nextjs | Oui | Validé | À décider avant le starter Web Core Next.js et les composants web. |
| ADR-010 | Stack UI React Native : StyleSheet/ThemeProvider vs NativeWind | Haute | ui-kit, mobile-react-native | Oui | Validé | À décider avant composants mobiles et intégration tokens. |
| ADR-011 | Client HTTP : fetch vs Axios | Haute | web-nextjs, mobile-react-native, api-nestjs | Oui | Validé | Doit confirmer JSON, refresh, erreurs, upload et wrappers. |
| ADR-012 | Server state web/mobile | Haute | web-nextjs, mobile-react-native | Oui | Validé | Confirmer TanStack Query, stratégie server-side web et séparation avec Zustand. |
| ADR-013 | CI/CD V1 | Haute | cloud, api-nestjs, web-nextjs, mobile-react-native | Oui | Validé | Définir niveau minimal de build/test/deploy sans surcomplexifier. |
| ADR-014 | Registry images | Haute | cloud, api-nestjs, web-nextjs | Oui | Validé | Choisir GHCR, registry privé ou autre avant publication d'images. |
| ADR-015 | Stockage mobile sécurisé | Haute | mobile-react-native, api-nestjs | Oui | Validé | Confirmer SecureStore vs Keychain selon Expo/build et stratégie tokens. |
| ADR-039 | Hachage des mots de passe : Argon2id vs bcrypt | Haute | api-nestjs | Oui | Validé | Standard Argon2id ; requis avant Auth 2 (login/hashing). bcrypt = exception de compatibilité/migration. |

## 5. ADR importants mais non bloquants V1

Ces ADR peuvent suivre un starter minimal si les fonctionnalités concernées restent désactivées ou documentaires.

| ID proposé | Titre | Priorité | Cores impactés | Bloquant V1 | Statut | Commentaire |
|---|---|---|---|---|---|---|
| ADR-016 | OpenAPI et génération de clients typés | Moyenne | api-nestjs, web-nextjs, mobile-react-native | Non | Validé | Contrat OpenAPI canonique versionné ; `openapi-typescript` (types) + `openapi-fetch` (client Fetch) + wrappers Enistere ; hooks TanStack Query maintenus dans les cores ; Orval en repli ; adaptateur Angular et générateur Dart décidés par preuve. |
| ADR-017 | Queue/jobs : BullMQ vs alternative | Moyenne | api-nestjs, cloud | Non | À rédiger | Bloquant seulement si jobs V1 deviennent critiques. |
| ADR-018 | Monitoring avancé | Moyenne | cloud, api-nestjs, web-nextjs, mobile-react-native | Non | À rédiger | Prometheus/Grafana/Loki/Sentry ou alternatives à cadrer. Les primitives de logs/redaction mobile RN 8 et API ADR-040 ne décident pas du backend de monitoring. |
| ADR-019 | Crash/error reporting mobile et web | Moyenne | mobile-react-native, web-nextjs, quality-core futur | Non | À rédiger | Sentry ou alternative. Peut attendre avant production. Les primitives analytics/logs mobiles ne branchent aucun crash reporter. **Mobile RN 19 livre seulement des primitives génériques de crash/error-reporting (modèle rédigé/borné + adapter seam + placeholder + service best-effort), sans SDK réel/réseau/persistance ni crash handler global — RN 19 ne décide pas cet ADR.** |
| ADR-020 | Documentation visuelle UI Kit | Moyenne | ui-kit, docs-core futur, quality-core futur | Non | À rédiger | Storybook, Ladle, documentation statique ou alternative. |
| ADR-021 | Tests E2E : Playwright vs Cypress | Moyenne | web-nextjs, quality-core futur | Non | À rédiger | À trancher avant E2E structuré. |
| ADR-022 | Tests visuels UI Kit | Moyenne | ui-kit, web-nextjs, mobile-react-native, quality-core futur | Non | À rédiger | À cadrer avant régression visuelle systématique. |
| ADR-023 | Stratégie i18n web/UI | Moyenne | web-nextjs, ui-kit | Non | À rédiger | Activable selon projets publics ou multilingues. |
| ADR-024 | Librairie d'icônes UI Kit | Moyenne | ui-kit, web-nextjs, mobile-react-native | Non | À rédiger | Structurant pour cohérence web/mobile. |
| ADR-025 | Documentation et runbooks cores | Moyenne | Tous, docs-core futur | Non | À rédiger | Standardiser README, guides, runbooks et checklists. |
| ADR-040 | Stratégie de logging structuré API Core NestJS | Haute | api-nestjs, cloud | Non | Validé | Recommandé avant release V1 (revue d'étape). Pino moteur officiel ; `nestjs-pino` sous preuve NestJS 11, repli Pino direct ; JSON stdout/stderr, collecte/Loki côté Cloud Core ; AuditLog séparé. Le starter fonctionne déjà sans, d'où non bloquant avant génération. |

## 6. ADR futurs

Ces ADR concernent les versions avancées V2, V3 ou VF.

| ID proposé | Titre | Priorité | Cores impactés | Bloquant V1 | Statut | Commentaire |
|---|---|---|---|---|---|---|
| ADR-026 | OSRM et fallback routing Mapbox/Google | Future | cloud, api-nestjs, mobile-react-native, web-nextjs | Non | À rédiger | Critique pour projets maps/tracking, pas pour starter minimal. |
| ADR-027 | Maps mobile : react-native-maps vs MapLibre | Future | mobile-react-native, ui-kit, cloud | Non | À rédiger | À traiter avant module maps mobile. |
| ADR-028 | Maps web | Future | web-nextjs, ui-kit, cloud | Non | À rédiger | MapLibre ou autre solution selon besoins web. |
| ADR-029 | Stratégie offline mobile | Future | mobile-react-native, api-nestjs | Non | À rédiger | Synchronisation, conflits, stockage local et sécurité. RN 3/RN 16 livrent seulement queue mémoire + connectivité générique, sans persistance ni sync. |
| ADR-030 | Sauvegardes externalisées et chiffrement | Future | cloud | Non | À rédiger | À traiter avant production critique. |
| ADR-031 | Déploiement avancé : blue/green, canary, orchestration | Future | cloud, web-nextjs, api-nestjs | Non | À rédiger | À traiter après stabilisation CI/CD. |
| ADR-032 | Charts web et UI Kit | Future | web-nextjs, ui-kit | Non | À rédiger | Recharts ou alternative si dashboards avancés. |
| ADR-033 | Carousel UI | Future | ui-kit, mobile-react-native, web-nextjs | Non | À rédiger | À traiter si composant structurant. |
| ADR-034 | Flutter UI : Material 3 vs composants maison | Future | ui-kit, mobile-flutter | Non | À rédiger | À traiter avant Mobile Core Flutter. |
| ADR-035 | Angular UI : Angular Material vs PrimeNG | Future | ui-kit, web-angular | Non | À rédiger | À traiter avant Web Core Angular. |
| ADR-036 | Observabilité distribuée et tracing | Future | cloud, api-nestjs, web-nextjs | Non | À rédiger | Après monitoring de base. |
| ADR-037 | Feature flags | Future | web-nextjs, mobile-react-native, api-nestjs | Non | À rédiger | Utile pour SaaS et rollout progressif. RN 17 livre seulement des primitives config/flags locales génériques, sans remote-config, réseau, persistance ni ciblage utilisateur. |
| ADR-038 | Analytics produit | Future | web-nextjs, mobile-react-native, ui-kit | Non | À rédiger | À cadrer avec confidentialité, consentement et coûts. RN 13 livre seulement un modèle d'événements/redaction + adapter placeholder, sans SDK réel, transport ni identify. **RN 21 livre seulement un gate de consentement générique (default-deny, persistance déléguée aux préférences RN 20), sans SDK/réseau/UI/identifiant/PII — RN 21 ne décide pas cet ADR et ne choisit aucun SDK, coût, politique privacy ou UI de consentement.** |

## 7. Tableau synthétique des ADR

| ID proposé | Titre | Priorité | Cores impactés | Bloquant V1 | Statut | Commentaire |
|---|---|---|---|---|---|---|
| ADR-001 | Organisation Git monorepo hybride | Haute | Tous | Oui | Validé | Base de contribution et versioning. |
| ADR-002 | ORM API NestJS : Prisma vs TypeORM | Haute | api-nestjs | Oui | Validé | Impact modèle, migrations, tests. |
| ADR-003 | Validation API : class-validator/class-transformer vs Zod | Haute | api-nestjs, web-nextjs, mobile-react-native | Oui | Validé | Cohérence validation backend/front. |
| ADR-004 | Stratégie auth/session multi-client | Haute | api-nestjs, web-nextjs, mobile-react-native | Oui | Validé | Tokens, cookies, secure storage. |
| ADR-005 | Sécurité cookies web et CSRF | Haute | api-nestjs, web-nextjs | Oui | Validé | Requis si cookies web. |
| ADR-006 | RBAC et permissions fines | Haute | api-nestjs, web-nextjs, mobile-react-native, ui-kit | Oui | Validé | Backend et visibilité UI. |
| ADR-007 | Upload MinIO/S3 et contrats fichiers | Haute | api-nestjs, cloud, web-nextjs, mobile-react-native, ui-kit | Oui | Validé | Upload transverse. |
| ADR-008 | Design tokens UI Kit | Haute | ui-kit, web-nextjs, mobile-react-native | Oui | Validé | Socle UI. |
| ADR-009 | Stack UI Web | Haute | ui-kit, web-nextjs | Oui | Validé | Tailwind/shadcn/Radix. |
| ADR-010 | Stack UI React Native | Haute | ui-kit, mobile-react-native | Oui | Validé | ThemeProvider/NativeWind. |
| ADR-011 | Client HTTP : fetch vs Axios | Haute | web-nextjs, mobile-react-native, api-nestjs | Oui | Validé | JSON, upload, refresh. |
| ADR-012 | Server state web/mobile | Haute | web-nextjs, mobile-react-native | Oui | Validé | TanStack Query/server-side/Zustand. |
| ADR-013 | CI/CD V1 | Haute | cloud, api-nestjs, web-nextjs, mobile-react-native | Oui | Validé | Build/test/deploy minimal. |
| ADR-014 | Registry images | Haute | cloud, api-nestjs, web-nextjs | Oui | Validé | Images applicatives. |
| ADR-015 | Stockage mobile sécurisé | Haute | mobile-react-native, api-nestjs | Oui | Validé | SecureStore/Keychain. |
| ADR-016 | OpenAPI et clients typés | Moyenne | api-nestjs, web-nextjs, mobile-react-native | Non | Validé | Contrat canonique + `openapi-typescript`/`openapi-fetch` + wrappers ; TanStack Query séparé. |
| ADR-017 | Queue/jobs | Moyenne | api-nestjs, cloud | Non | À rédiger | BullMQ ou alternative. |
| ADR-018 | Monitoring avancé | Moyenne | cloud, api-nestjs, web-nextjs, mobile-react-native | Non | À rédiger | Prometheus/Grafana/Loki/Sentry ; non couvert par les primitives de logs/redaction. |
| ADR-019 | Crash/error reporting | Moyenne | mobile-react-native, web-nextjs | Non | À rédiger | Sentry ou alternative ; aucun crash reporter réel dans les cores (RN 19 = primitives génériques préparatoires, ne décide pas cet ADR). |
| ADR-020 | Documentation visuelle UI Kit | Moyenne | ui-kit, docs-core futur | Non | À rédiger | Storybook/Ladle/static docs. |
| ADR-021 | Tests E2E | Moyenne | web-nextjs, quality-core futur | Non | À rédiger | Playwright vs Cypress. |
| ADR-022 | Tests visuels UI Kit | Moyenne | ui-kit, quality-core futur | Non | À rédiger | Régression visuelle. |
| ADR-023 | Stratégie i18n web/UI | Moyenne | web-nextjs, ui-kit | Non | À rédiger | Multilingue si besoin. |
| ADR-024 | Librairie d'icônes UI Kit | Moyenne | ui-kit, web-nextjs, mobile-react-native | Non | À rédiger | Cohérence iconographique. |
| ADR-025 | Documentation et runbooks cores | Moyenne | Tous, docs-core futur | Non | À rédiger | Standard documentation. |
| ADR-026 | OSRM et fallback routing | Future | cloud, api-nestjs, mobile-react-native, web-nextjs | Non | À rédiger | Routing avancé. |
| ADR-027 | Maps mobile | Future | mobile-react-native, ui-kit, cloud | Non | À rédiger | react-native-maps vs MapLibre. |
| ADR-028 | Maps web | Future | web-nextjs, ui-kit, cloud | Non | À rédiger | MapLibre ou autre. |
| ADR-029 | Stratégie offline mobile | Future | mobile-react-native, api-nestjs | Non | À rédiger | Sync et conflits ; RN 3/RN 16 restent préparatoires. |
| ADR-030 | Backups externalisés | Future | cloud | Non | À rédiger | Chiffrement, rétention. |
| ADR-031 | Déploiement avancé | Future | cloud, web-nextjs, api-nestjs | Non | À rédiger | Blue/green, canary. |
| ADR-032 | Charts web/UI Kit | Future | web-nextjs, ui-kit | Non | À rédiger | Recharts ou alternative. |
| ADR-033 | Carousel UI | Future | ui-kit, mobile-react-native, web-nextjs | Non | À rédiger | Librairie et accessibilité. |
| ADR-034 | Flutter UI | Future | ui-kit, mobile-flutter | Non | À rédiger | Material 3 ou maison. |
| ADR-035 | Angular UI | Future | ui-kit, web-angular | Non | À rédiger | Angular Material vs PrimeNG. |
| ADR-036 | Observabilité distribuée | Future | cloud, api-nestjs, web-nextjs | Non | À rédiger | Tracing futur. |
| ADR-037 | Feature flags | Future | web-nextjs, mobile-react-native, api-nestjs | Non | À rédiger | Rollout progressif ; RN 17 ne décide pas d'un remote-config réel. |
| ADR-038 | Analytics produit | Future | web-nextjs, mobile-react-native, ui-kit | Non | À rédiger | Confidentialité/consentement/coûts ; RN 13 ne décide pas d'un SDK réel ; RN 21 = gate de consentement générique préparatoire (ne décide pas cet ADR). |
| ADR-039 | Hachage mots de passe : Argon2id vs bcrypt | Haute | api-nestjs | Oui | Validé | Standard Argon2id ; requis avant Auth 2. |
| ADR-040 | Stratégie de logging structuré API Core NestJS | Haute | api-nestjs, cloud | Non | Validé | Pino (moteur officiel) ; `nestjs-pino` sous preuve NestJS 11, repli Pino direct ; JSON stdout/stderr, Loki/Grafana côté Cloud Core ; AuditLog séparé. Recommandé avant release V1. |

## 8. Ordre recommandé de traitement

Ordre recommandé avant l'implémentation V1 :

1. ADR-001 — Organisation Git monorepo hybride
2. ADR-008 — Design tokens UI Kit
3. ADR-009 — Stack UI Web
4. ADR-010 — Stack UI React Native
5. ADR-004 — Stratégie auth/session multi-client
6. ADR-005 — Sécurité cookies web et CSRF
7. ADR-015 — Stockage mobile sécurisé
8. ADR-006 — RBAC et permissions fines
9. ADR-002 — ORM API NestJS
10. ADR-003 — Validation API
11. ADR-011 — Client HTTP
12. ADR-012 — Server state web/mobile
13. ADR-007 — Upload MinIO/S3
14. ADR-013 — CI/CD V1
15. ADR-014 — Registry images

Ensuite traiter les ADR importants non bloquants selon le premier starter généré.

## 9. Risques si ADR ignorés

Ignorer ces ADR peut entraîner :

- migrations coûteuses après génération des starters ;
- divergence entre web, mobile et API ;
- stockage de tokens non sécurisé ;
- cookies web mal protégés ;
- règles RBAC incohérentes ;
- upload non compatible entre clients et API ;
- dépendances UI difficiles à remplacer ;
- CI/CD ou registry non reproductibles ;
- monitoring et logs non exploitables ;
- documentation incomplète ;
- dette technique créée dès V1.

## 10. Conclusion

Les cinq cores prioritaires restent gouvernés par les ADR validés et par ce backlog. Les ADR bloquants V1 ont été rédigés ou remplacés par des décisions validées (`ADR-001` à `ADR-016`, puis `ADR-039` et `ADR-040`). Les ADR `017` à `038` restent à rédiger lorsqu'un projet ou un core franchit le seuil correspondant : backend de monitoring, crash reporting réel, offline sync, feature flags distants, analytics produit, maps, etc. Les primitives préparatoires déjà livrées dans les starters ne doivent pas être interprétées comme ces décisions stratégiques.
