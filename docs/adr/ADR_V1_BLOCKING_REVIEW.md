# Revue finale des ADR bloquants V1

## 1. Résumé exécutif

La revue finale des 15 ADR bloquants V1 valide la cohérence globale des décisions structurantes avant génération des starters techniques.

Les décisions couvrent les domaines critiques suivants :

- organisation Git ;
- API Core NestJS ;
- Web Core Next.js ;
- Mobile Core React Native ;
- Deployment ;
- UI Kit ;
- sécurité transversale ;
- CI/CD ;
- registry images ;
- usage futur de l'IA.

Aucune contradiction bloquante n'a été détectée entre les ADR. Les décisions sont alignées avec les 5 `specification active` prioritaires et avec les documents `strategy/`.

Recommandation : **le démarrage des starters V1 peut commencer**, sous réserve de respecter la checklist avant génération de code et de conserver les ADR non bloquants comme backlog de stabilisation.

## 2. Objectif de la revue

Cette revue a pour objectifs :

- vérifier la cohérence globale des 15 ADR bloquants V1 ;
- identifier les contradictions éventuelles ;
- valider l'alignement avec les cores prioritaires ;
- valider l'alignement avec les documents stratégiques ;
- vérifier les dépendances entre décisions ;
- clarifier les risques restants ;
- déterminer si les starters V1 peuvent être générés.

Cette revue ne modifie aucun ADR existant, aucun `specification active`, aucun document `strategy/` et ne crée aucun code.

## 3. Documents analysés

Documents stratégiques :

- `strategy/01_VISION_FINAL.md`
- `strategy/02_GOVERNANCE.md`
- `strategy/03_ARCHITECTURE_TARGET.md`
- `strategy/04_ROADMAP_GLOBAL.md`
- `strategy/05_EXECUTION_CHAIN.md`
- `strategy/06_DEPENDENCY_STRATEGY.md`
- `strategy/07_SECURITY.md`
- `strategy/08_STANDARDS.md`
- `strategy/09_GIT_STRATEGY.md`
- `strategy/10_AI_STRATEGY.md`

Cores prioritaires :

- `starters/nestjs/STARTER_SPECIFICATION.md`
- `deployment/DEPLOYMENT_SPECIFICATION.md`
- `starters/react-native/STARTER_SPECIFICATION.md`
- `starters/nextjs/STARTER_SPECIFICATION.md`
- `packages/ui-kit/PACKAGE_SPECIFICATION.md`

Backlog ADR :

- `docs/adr/ADR_BACKLOG.md`

ADR bloquants V1 :

- `docs/adr/ADR-001-git-monorepo-hybrid.md`
- `docs/adr/ADR-002-orm-api-nestjs-prisma-vs-typeorm.md`
- `docs/adr/ADR-003-validation-api-class-validator-vs-zod.md`
- `docs/adr/ADR-004-auth-session-multi-client.md`
- `docs/adr/ADR-005-web-cookies-csrf-security.md`
- `docs/adr/ADR-006-rbac-permissions-fines.md`
- `docs/adr/ADR-007-upload-minio-s3-file-contracts.md`
- `docs/adr/ADR-008-design-tokens-ui-kit.md`
- `docs/adr/ADR-009-stack-ui-web.md`
- `docs/adr/ADR-010-stack-ui-react-native.md`
- `docs/adr/ADR-011-client-http-fetch-vs-axios.md`
- `docs/adr/ADR-012-server-state-web-mobile.md`
- `docs/adr/ADR-013-ci-cd-v1.md`
- `docs/adr/ADR-014-registry-images.md`
- `docs/adr/ADR-015-secure-mobile-storage.md`

## 4. Liste des 15 ADR bloquants V1

| ADR | Décision principale | Statut |
|---|---|---|
| ADR-001 | Monorepo fondation + repositories séparés pour projets dérivés | Validé |
| ADR-002 | Prisma comme ORM principal API NestJS V1 | Validé |
| ADR-003 | class-validator + class-transformer comme validation API V1 | Validé |
| ADR-004 | Access token court + refresh token révocable | Validé |
| ADR-005 | Cookies HttpOnly Secure SameSite + protection CSRF web | Validé |
| ADR-006 | RBAC + permissions fines | Validé |
| ADR-007 | MinIO/S3 compatible avec API comme autorité fichiers | Validé |
| ADR-008 | Design tokens agnostiques centralisés | Validé |
| ADR-009 | Tailwind CSS + Radix UI + shadcn/ui pour Web UI | Validé |
| ADR-010 | Tokens + ThemeProvider + composants contrôlés pour React Native | Validé |
| ADR-011 | fetch avec wrappers Enistere comme client HTTP V1 | Validé |
| ADR-012 | TanStack Query comme standard server state Web/Mobile | Validé |
| ADR-013 | GitHub Actions comme CI/CD V1 | Validé |
| ADR-014 | GitHub Container Registry comme registry images V1 | Validé |
| ADR-015 | SecureStore V1 Expo, Keychain si besoin avancé | Validé |

## 5. Cohérence globale

Les ADR forment un socle V1 cohérent.

Points validés :

- ADR-001 donne le cadre Git et isole les projets dérivés.
- ADR-002 et ADR-003 stabilisent le socle API avant génération NestJS.
- ADR-004, ADR-005, ADR-006 et ADR-015 couvrent auth, session, cookies, CSRF, RBAC et stockage mobile.
- ADR-007 relie API, Cloud, Web, Mobile et UI Kit autour des fichiers.
- ADR-008, ADR-009 et ADR-010 stabilisent le système UI sans uniformité forcée.
- ADR-011 et ADR-012 standardisent transport HTTP et server state.
- ADR-013 et ADR-014 cadrent CI/CD et registry sans créer d'infrastructure prématurée.

La logique générale est progressive : cadrage documentaire, génération de starters, validation qualité, puis industrialisation.

## 6. Cohérence par core

### API Core NestJS

Décisions cohérentes :

- ADR-002 retient Prisma comme ORM V1.
- ADR-003 retient `class-validator` + `class-transformer` pour les DTO.
- ADR-004 définit access token court et refresh token révocable.
- ADR-006 définit RBAC + permissions fines.
- ADR-007 place l'API comme autorité pour upload, validation, metadata, permissions et URLs signées.
- ADR-011 évite que le client HTTP stocke les tokens.
- ADR-013 prévoit lint, tests, build et checks qualité futurs.

Points validés :

- séparation DTO / modèles Prisma ;
- validation backend obligatoire ;
- refresh token révocable ;
- permissions serveur comme autorité finale ;
- upload MinIO/S3 contrôlé par l'API ;
- tests auth, permissions, validation et upload à prévoir dès V1.

### Web Core Next.js

Décisions cohérentes :

- ADR-004 définit la stratégie session multi-client.
- ADR-005 interdit `localStorage` pour tokens sensibles et impose cookies sécurisés + CSRF si cookies utilisés.
- ADR-008 fournit les tokens UI.
- ADR-009 retient Tailwind CSS, Radix UI et shadcn/ui sous contrôle des tokens.
- ADR-011 retient `fetch` avec wrappers.
- ADR-012 retient TanStack Query pour le server state client.

Points validés :

- cookies `HttpOnly`, `Secure`, `SameSite` à documenter par environnement ;
- CSRF obligatoire si cookies utilisés pour session ou refresh ;
- wrappers HTTP compatibles CORS, cookies et erreurs normalisées ;
- routes protégées alignées avec RBAC ;
- dashboards/backoffices non indexables à cadrer dans le starter ;
- UI alignée avec tokens et accessibilité.

### Mobile Core React Native

Décisions cohérentes :

- ADR-004 définit access token court et refresh token révocable.
- ADR-010 retient tokens + ThemeProvider comme base UI mobile.
- ADR-011 retient `fetch` et `fetch + FormData` pour multipart React Native.
- ADR-012 retient TanStack Query pour le server state.
- ADR-015 définit SecureStore V1 Expo et Keychain en option avancée.
- ADR-007 cadre upload via API et MinIO/S3.

Points validés :

- access token en mémoire autant que possible ;
- refresh token dans SecureStore ou Keychain ;
- aucun token dans AsyncStorage, MMKV non validé, logs ou cache TanStack Query ;
- cache TanStack Query nettoyé au logout ;
- upload mobile avec `fetch + FormData` sans forcer le header multipart si cela casse le boundary ;
- offline avancé non activé sans ADR futur.

### Deployment

Décisions cohérentes :

- ADR-007 retient MinIO/S3 compatible pour les fichiers.
- ADR-013 retient GitHub Actions pour CI/CD V1.
- ADR-014 retient GHCR pour les images Docker.
- ADR-005 impose HTTPS, CORS strict et cookies sécurisés côté web si applicable.
- La spécification Deployment prévoit Traefik, environnements, secrets, MinIO, registry et CI/CD de manière progressive.

Points validés :

- buckets privés par défaut ;
- secrets hors Git ;
- registry GHCR avec tags explicites ;
- production non basée uniquement sur `latest` ;
- environnements protégés avant production ;
- déploiements avancés hors V1.

### UI Kit

Décisions cohérentes :

- ADR-008 fait des design tokens la source de vérité.
- ADR-009 adapte la stack web autour de Tailwind, Radix UI et shadcn/ui.
- ADR-010 adapte la stack mobile autour de tokens, ThemeProvider et composants contrôlés.
- Les specs Web/Mobile consomment le UI Kit sans imposer une implémentation identique partout.

Points validés :

- tokens communs ;
- adaptation par plateforme ;
- accessibilité intégrée ;
- dark/light mode via tokens ;
- composants futurs documentés ;
- styles isolés hors tokens interdits.

## 7. Cohérence sécurité transversale

La sécurité transversale est cohérente.

Points validés :

- secrets hors Git dans tous les ADR concernés ;
- tokens jamais loggés ;
- access token court ;
- refresh token révocable ;
- cookies web sécurisés et CSRF explicite ;
- CORS strict ;
- SecureStore / Keychain pour secrets mobiles ;
- API comme autorité RBAC et permissions ;
- validation backend obligatoire ;
- upload contrôlé par API ;
- buckets privés par défaut ;
- registry sans secrets dans images ;
- CI/CD avec permissions minimales ;
- logs, artefacts et crash reports sans données sensibles ;
- IA interdite de manipuler des secrets réels.

Point de vigilance : les durées exactes de tokens, cookies, cache et URLs signées restent à définir dans les starters ou runbooks projet, sans contredire les ADR.

## 8. Contradictions détectées

Aucune contradiction bloquante n'a été détectée.

Contrôles spécifiques :

- ADR-011 et ADR-007 sont cohérents : `fetch + FormData` est la règle pour l'upload React Native, avec API comme autorité fichier.
- ADR-004 et ADR-005 sont cohérents : refresh/session web peut utiliser cookies sécurisés, avec CSRF obligatoire.
- ADR-012 et ADR-015 sont cohérents : TanStack Query gère les données serveur, mais ne stocke jamais les tokens et doit être nettoyé au logout.
- ADR-008 et ADR-009 sont cohérents : Tailwind/shadcn/Radix ne remplacent pas les tokens Enistere.
- ADR-013 et ADR-014 sont cohérents : GitHub Actions publiera vers GHCR quand les workflows existeront.
- ADR-002 et ADR-003 sont cohérents : Prisma gère la persistance, les DTO validés restent séparés des modèles Prisma.

Observation non bloquante : certains documents `strategy/` mentionnent encore des choix comme “Prisma ou TypeORM” ou “class-validator ou Zod” parce qu'ils précèdent les ADR. Ce n'est pas une contradiction bloquante : les ADR V1 tranchent maintenant ces choix.

## 9. Risques restants

Risques résiduels avant implémentation V1 :

- dérive entre DTO publics, types Prisma et contrats API ;
- granularité RBAC/permissions trop fine dès le starter ;
- cookies web mal configurés par environnement ;
- refresh token mobile mal nettoyé au logout ;
- cache TanStack Query trop persistant sur données sensibles ;
- URLs signées trop longues ou loggées ;
- usage accidentel de `latest` en production ;
- workflows CI/CD trop ambitieux créés trop tôt ;
- absence de tests suffisants malgré un starter généré ;
- documentation des exceptions non maintenue dans les projets dérivés.

Ces risques ne bloquent pas le démarrage des starters V1, mais doivent être transformés en critères de revue et tests dès la génération.

## 10. ADR non bloquants recommandés ensuite

ADR importants à traiter après démarrage ou avant industrialisation avancée :

- ADR-016 — OpenAPI et génération de clients typés ;
- ADR-017 — Queue/jobs : BullMQ vs alternative ;
- ADR-018 — Monitoring avancé ;
- ADR-019 — Crash/error reporting mobile et web ;
- ADR-020 — Documentation visuelle UI Kit ;
- ADR-021 — Tests E2E : Playwright vs Cypress ;
- ADR-022 — Tests visuels UI Kit ;
- ADR-023 — Stratégie i18n web/UI ;
- ADR-024 — Librairie d'icônes UI Kit ;
- ADR-025 — Documentation et runbooks cores.

ADR futurs à garder en backlog :

- OSRM et fallback routing ;
- maps mobile ;
- maps web ;
- offline mobile avancé ;
- sauvegardes externalisées et chiffrement ;
- blue/green, canary et orchestration ;
- charts ;
- carousel ;
- Flutter UI ;
- Angular UI ;
- observabilité distribuée ;
- feature flags ;
- analytics produit.

Ces ADR ne sont pas requis pour générer les starters V1 minimaux, si les fonctionnalités correspondantes restent désactivées ou documentaires.

## 11. Recommandation sur le démarrage des starters V1

Recommandation : **validé pour démarrer les starters V1**.

Conditions :

- générer uniquement le starter demandé à chaque mission ;
- respecter strictement les ADR applicables ;
- ne pas ajouter de dépendance non prévue sans justification ;
- ne pas créer de secrets ;
- ne pas activer de déploiement production ;
- créer des tests proportionnés au starter ;
- maintenir changelog, README et documentation du core ;
- signaler toute décision nouvelle nécessitant ADR.

## 12. Ordre recommandé d'implémentation

Ordre recommandé :

1. **API Core NestJS**
2. **UI Kit minimal**
3. **Web Core Next.js**
4. **Mobile Core React Native**
5. **Deployment minimal**

Justification :

- API Core NestJS fixe les contrats backend, auth, validation, permissions et upload.
- UI Kit minimal fixe les tokens et composants de base nécessaires aux clients.
- Web Core Next.js peut consommer API et UI Kit rapidement.
- Mobile Core React Native peut ensuite appliquer auth mobile, stockage sécurisé et upload.
- Deployment minimal doit être généré avant déploiement réel, mais peut rester local/documenté tant que les starters ne sont pas stabilisés.

Variante acceptable : démarrer UI Kit minimal en parallèle de l'API si les missions restent strictement séparées et sans dépendance circulaire.

## 13. Checklist avant génération de code

Avant chaque génération de starter :

- [ ] Identifier le core ciblé.
- [ ] Relire son `specification active`.
- [ ] Relire les ADR applicables.
- [ ] Définir le périmètre autorisé de la mission.
- [ ] Interdire explicitement les fichiers hors périmètre.
- [ ] Ne créer aucun secret.
- [ ] Ne créer aucune dépendance non justifiée.
- [ ] Prévoir README / documentation du starter.
- [ ] Prévoir tests adaptés au risque.
- [ ] Prévoir lint / typecheck si outillage créé.
- [ ] Vérifier sécurité tokens, logs et variables publiques.
- [ ] Vérifier séparation local/dev/staging/prod si applicable.
- [ ] Mettre à jour `CHANGELOG.md`.
- [ ] Signaler toute nouvelle décision structurante à transformer en ADR.

Checklist spécifique API :

- [ ] DTO séparés des modèles Prisma.
- [ ] ValidationPipe global prévu.
- [ ] Auth/session conforme ADR-004.
- [ ] RBAC/permissions conformes ADR-006.
- [ ] Upload conforme ADR-007 si inclus.

Checklist spécifique Web :

- [ ] Aucun token sensible dans `localStorage`.
- [ ] Cookies/CSRF conformes ADR-005 si cookies utilisés.
- [ ] UI conforme ADR-008 et ADR-009.
- [ ] Server state conforme ADR-012.

Checklist spécifique Mobile :

- [ ] Refresh token dans SecureStore/Keychain.
- [ ] Aucun token dans AsyncStorage/MMKV non validé.
- [ ] Cache nettoyé au logout.
- [ ] Upload `fetch + FormData`.

Checklist spécifique Cloud :

- [ ] Secrets hors Git.
- [ ] Services non publics par défaut.
- [ ] Images taguées explicitement si Docker activé.
- [ ] GHCR conforme ADR-014 si registry utilisée.

## 14. Conclusion

Les 15 ADR bloquants V1 constituent un socle cohérent pour démarrer les starters techniques.

Aucune contradiction bloquante n'a été détectée. Les risques restants sont maîtrisables par une génération progressive, des tests ciblés, une documentation stricte et le respect des ADR applicables.

La prochaine étape recommandée est la génération contrôlée du **starter API Core NestJS V1 minimal**, sans déploiement, sans secret réel et sans fonctionnalité métier spécifique.
