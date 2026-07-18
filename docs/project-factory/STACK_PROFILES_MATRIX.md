# Stack Profiles Matrix

> Matrice officielle de composition des cores pour projets derives Enistere OS Foundation.
> Statut : **SPECIFICATION_DOCUMENTAIRE**.
> Date : 2026-07-18.

## 1. Legende

| Symbole | Sens |
|---|---|
| `DIRECT` | Compatible V1 sans decision supplementaire majeure |
| `ADAPT` | Compatible avec adaptation documentee |
| `DEFER` | Possible plus tard, non recommande pour V1 |
| `NO` | Non recommande |

## 2. Profils principaux

| Profil | API | Web | Mobile | UI | Cloud | Statut V1 | Usage recommande |
|---|---|---|---|---|---|---|---|
| `nestjs-next` | NestJS | Next.js | Aucun | UI Kit React | Cloud V1 | `DIRECT` | SaaS TypeScript, portail web, BFF securise |
| `spring-angular` | Spring Boot | Angular | Aucun | Angular Material + tokens | Cloud V1 | `DIRECT` | Back-office entreprise, SI Java, intranet |
| `nestjs-react-native` | NestJS | Aucun | React Native | Tokens UI Kit alignes RN | Cloud V1 | `DIRECT` | App mobile-first TypeScript |
| `spring-flutter` | Spring Boot | Aucun | Flutter | Material 3 + tokens Enistere | Cloud V1 | `DIRECT` | App mobile-first Java/Flutter |
| `nestjs-angular-react-native` | NestJS | Angular | React Native | Angular Material + tokens RN | Cloud V1 | `ADAPT` | Plateforme API TS + web entreprise + mobile RN |
| `spring-next-flutter` | Spring Boot | Next.js | Flutter | UI Kit React + Material 3 | Cloud V1 | `ADAPT` | Plateforme hybride Java + web React + mobile Flutter |
| `nestjs-next-react-native` | NestJS | Next.js | React Native | UI Kit React + tokens RN | Cloud V1 | `DIRECT` | Fullstack TypeScript web + mobile |
| `spring-angular-flutter` | Spring Boot | Angular | Flutter | Angular Material + Material 3 | Cloud V1 | `DIRECT` | Fullstack entreprise Java + Angular + Flutter |
| `api-only-nestjs` | NestJS | Aucun | Aucun | Aucun | Cloud V1 optionnel | `DIRECT` | API publique/interne TypeScript |
| `api-only-spring` | Spring Boot | Aucun | Aucun | Aucun | Cloud V1 optionnel | `DIRECT` | API Java enterprise |
| `web-only-next` | API externe | Next.js | Aucun | UI Kit React | Selon API | `ADAPT` | Frontend Next sur API existante |
| `web-only-angular` | API externe | Angular | Aucun | Angular Material | Selon API | `ADAPT` | Frontend Angular sur API existante |
| `mobile-only-react-native` | API externe | Aucun | React Native | Tokens RN | Selon API | `ADAPT` | App RN sur backend existant |
| `mobile-only-flutter` | API externe | Aucun | Flutter | Material 3 tokens | Selon API | `ADAPT` | App Flutter sur backend existant |

## 3. Profils API + mobile

Les profils API + mobile sont des profils V1 legitimes. Un projet peut demarrer sans web si le produit est
mobile-first.

| Profil | Compatibilite | Auth/session | Client API | Fichiers/upload | Limites |
|---|---|---|---|---|---|
| `nestjs-react-native` | `DIRECT` | Bearer access token en memoire + refresh token SecureStore seam RN | `@enistere/api-client-fetch` via tarball GitHub Release | RN upload primitives + API Files NestJS | Store natif prefs delegue au projet derive ; iOS smoke a executer sur macOS/device |
| `nestjs-flutter` | `ADAPT` | Bearer + SecureStorage Flutter | Dio client Flutter ; contrat OpenAPI a aligner manuellement ou via generation future | Flutter upload service + API Files NestJS | Pas de client Dart genere officiel V1 |
| `spring-react-native` | `ADAPT` | Bearer + refresh coalescent RN | `@enistere/api-client-fetch` possible si OpenAPI Spring reste compatible | RN upload primitives + Spring Files | Verifier compatibilite OpenAPI Spring -> contracts TS |
| `spring-flutter` | `DIRECT` | Bearer + RefreshInterceptor Flutter + SecureStorage | Dio client Flutter | Flutter upload service + Spring Files | iOS smoke a executer sur macOS/device |

## 4. Compatibilite des API Cores

| Dimension | API NestJS | API Spring Boot |
|---|---|---|
| Statut | `VALIDE_V1` | `VALIDE_V1` |
| Auth/RBAC | Oui | Oui |
| Refresh token | Oui | Oui |
| Files/upload/download | Oui | Oui |
| Audit | Oui | Oui |
| OpenAPI | Canonique pour packages TS actuels | Present, compatibilite TS a verifier par mission dediee |
| Client TypeScript officiel | Oui, via `@enistere/api-client-fetch` | `ADAPT` tant que le contrat Spring n'est pas declare source compatible |
| Client Dart officiel | Non | Non |
| Usage recommande | Fullstack TypeScript, Web Next, RN | Java enterprise, Angular, Flutter |

## 5. Compatibilite Web

| Web Core | API recommandee | Compatibilite | Notes |
|---|---|---|---|
| Next.js | NestJS | `DIRECT` | BFF Auth/Files, UI Kit React, packages TS deja prouves |
| Next.js | Spring Boot | `ADAPT` | Necessite verifier contrat OpenAPI et adapter le client BFF si besoin |
| Angular | Spring Boot | `DIRECT` | HttpClient, Material, auth/routing/forms/upload/permissions V1 |
| Angular | NestJS | `ADAPT` | Possible via HTTP direct ; verifier formes DTO/erreurs |

## 6. Compatibilite mobile

| Mobile Core | API recommandee | Compatibilite | Notes |
|---|---|---|---|
| React Native | NestJS | `DIRECT` | Client fetch officiel, auth/session RN, upload RN |
| React Native | Spring Boot | `ADAPT` | Possible si contrat Spring est compatible avec packages TS |
| Flutter | Spring Boot | `DIRECT` | Dio, SecureStorage, RefreshInterceptor, upload Flutter |
| Flutter | NestJS | `ADAPT` | Possible via Dio ; pas de client Dart genere officiel V1 |

## 7. Feature matrix

| Feature | NestJS | Spring | Next.js | Angular | React Native | Flutter |
|---|---|---|---|---|---|---|
| Auth login/session | Oui | Oui | Oui BFF | Oui | Oui | Oui |
| Refresh 401 | Oui | Oui | Oui cote BFF/client | Oui | Oui | Oui |
| RBAC/permissions | Oui | Oui | Oui UX + API autorite | Oui UX + API autorite | Primitives | Primitives |
| Files upload | Oui | Oui | Oui | Oui | Oui | Oui |
| Download URL signee | Oui | Oui | Oui | A integrer si besoin | A integrer si besoin | A integrer si besoin |
| Audit | Oui | Oui | Via API | Via API | Non runtime | Non runtime |
| Rate limiting | Via infra/API | Oui | Via API | Via API | Via API | Via API |
| UI states | N/A | N/A | Oui | Oui | Oui | Oui |
| Forms validation | DTO API | DTO API | RHF + Zod | Reactive Forms | RHF + Zod | Form widgets |
| Secure storage | N/A | N/A | Cookies HttpOnly | A definir web | Seam + delegation native | flutter_secure_storage |
| Telemetry primitives | N/A | N/A | Non V1 | Non V1 | Oui primitives | Non V1 |
| i18n primitives | N/A | N/A | Non V1 | Non V1 | Oui primitives | Non V1 |

## 8. Gates par profil

| Profil | Gates minimaux |
|---|---|
| `nestjs-next` | `quality-gates packages`, `quality-gates ui-kit`, `quality-gates web`, API Nest tests/e2e selon environnement, web-e2e si stack reelle disponible |
| `spring-angular` | `api-spring`, `web-angular`, `quality-gates docs`, `npm audit`/Maven verify |
| `nestjs-react-native` | API Nest tests/e2e, `mobile-static`, smoke Android si device/emulator disponible |
| `spring-flutter` | `api-spring`, `flutter test`, `flutter analyze`, smoke Android si emulator disponible |
| `nestjs-next-react-native` | Gates `nestjs-next` + `mobile-static` + smoke Android |
| `spring-angular-flutter` | Gates `spring-angular` + Flutter headless + smoke Android |

## 9. Recommandations de choix

| Contexte projet | Profil recommande |
|---|---|
| Equipe TypeScript fullstack | `nestjs-next` ou `nestjs-next-react-native` |
| SI Java / gouvernance entreprise | `spring-angular` ou `spring-angular-flutter` |
| Produit mobile-first TypeScript | `nestjs-react-native` |
| Produit mobile-first Flutter | `spring-flutter` |
| Back-office interne | `spring-angular` |
| SaaS web moderne | `nestjs-next` |
| API seule pour integrations | `api-only-nestjs` ou `api-only-spring` |

## 10. Decisions ouvertes

Les sujets suivants restent a traiter avant un generateur complet :

- source canonique OpenAPI par projet derive ;
- generation client Dart ;
- compatibilite formelle Spring OpenAPI -> `@enistere/api-contracts` ;
- publication npm registry GitHub Packages ;
- templates de bootstrap ;
- choix de copie vs dependance externe par core ;
- gestion des versions Foundation dans un projet derive.

