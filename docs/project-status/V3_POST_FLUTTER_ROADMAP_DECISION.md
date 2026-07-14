# V3_POST_FLUTTER_ROADMAP_DECISION.md — Suite V3 apres Mobile Core Flutter V1

> Date : 2026-07-14
> Decision : **continuer V3 par API Core Spring Boot 1 — Core specification**
> Statut : **cadrage uniquement — aucun starter Spring genere**

## 1. Contexte lu

- `strategy/04_ROADMAP_GLOBAL.md` §14→§17 — V3 extension multi-framework.
- `docs/project-status/V3_ENTRY_DECISION.md` — entree V3 par Mobile Core Flutter.
- `docs/project-status/MOBILE_FLUTTER_V1_FINAL_READINESS_DECISION.md` — Mobile Core Flutter `VALIDE_V1`.
- `docs/project-status/FOUNDATION_CURRENT_STATE.md`.
- `docs/project-status/IMPLEMENTATION_MATRIX.md`.
- `docs/project-status/NEXT_ACTIONS.md`.
- `docs/project-status/SESSION_HANDOFF.md`.

## 2. Etat au moment de la decision

Les cores principaux et Flutter V3 sont maintenant stabilises en V1 :

- API Core NestJS : `VALIDE_V1`.
- Web Core Next.js : `VALIDE_V1`.
- Mobile Core React Native : `VALIDE_V1`.
- Mobile Core Flutter : `VALIDE_V1`.
- UI Kit : `VALIDE_V1`.
- Cloud Core : `VALIDE_V1`.
- Docs Core : `VALIDE_V1`.
- Quality Core : `VALIDE_V1`.

Les cores encore vides sont :

| Core | Statut | Observation |
|---|---|---|
| API Core Spring Boot | `DOSSIER_SEULEMENT` | prochain core V3 dans la roadmap §16 ; specification absente |
| Web Core Angular | `DOSSIER_SEULEMENT` | necessite ADR-035 avant choix UI Angular |
| AI Core | `DOSSIER_SEULEMENT` | hors sequence V3 §14 ; a cadrer plus tard |

## 3. Options considerees

### Option A — Continuer Flutter V2

Reportee. Flutter a atteint `VALIDE_V1`. Les ameliorations restantes (Freezed/Json Serializable, logger redaction,
PreferenceStore seam avance, CI Flutter plus large, build release) sont utiles, mais elles etendent un core deja valide
au lieu d'ouvrir le prochain core V3 encore vide.

### Option B — Ouvrir Web Core Angular

Reportee. La roadmap V3 place Angular apres Spring Boot, et le core Angular depend d'ADR-035
(Angular Material vs PrimeNG) avant tout starter ou choix de composants.

### Option C — Ouvrir AI Core

Reportee. `ai-core` n'est pas liste dans la sequence V3 §14. Il demande un cadrage specifique (strategie IA,
securite, donnees, couts, provider, observabilite) avant toute specification.

### Option D — Continuer V3 par API Core Spring Boot 1 ✅

Retenue. API Core Spring Boot est le prochain core de la roadmap V3 (§16), n'a pas de dependance ADR bloquante
equivalente a Flutter ADR-034 ou Angular ADR-035, et doit commencer par une specification documentaire avant
toute generation de starter.

## 4. Decision

La prochaine mission unique est :

**API Core Spring Boot 1 — Core specification.**

Objectif : creer `cores/api-spring/CORE_SPECIFICATION.md` et `cores/api-spring/README.md` en alignement avec :

- `strategy/04_ROADMAP_GLOBAL.md` §16 ;
- `strategy/02_GOVERNANCE.md`, `03_ARCHITECTURE_TARGET.md`, `06_DEPENDENCY_STRATEGY.md`, `07_SECURITY.md`,
  `08_STANDARDS.md` ;
- API Core NestJS `VALIDE_V1` comme reference fonctionnelle, sans copier son implementation ;
- ADR applicables : auth/JWT, RBAC, OpenAPI, fichiers, logs, tests, CI, secrets.

## 5. Frontieres

Interdits pour la prochaine mission :

- ne pas creer de projet Spring Boot ;
- ne pas ajouter Gradle/Maven, dependances Java ou fichiers runtime ;
- ne pas modifier API Core NestJS, Web, Mobile, Cloud, UI Kit ou packages ;
- ne pas redefinir les contrats OpenAPI existants ;
- ne pas demarrer Web Angular ni rediger ADR-035 dans cette mission ;
- ne pas declarer API Spring implemente.

## 6. Effet de statut

Cette decision ne change pas le statut d'API Spring Boot.

L'effet attendu de la prochaine mission sera :

| Core | Avant | Apres attendu |
|---|---|---|
| API Core Spring Boot | `DOSSIER_SEULEMENT` | `SPECIFICATION_DOCUMENTAIRE` |

## 7. Prochaine action recommandee

**API Core Spring Boot 1 — Core specification.**

Livrer uniquement la specification et la documentation de demarrage, puis mettre a jour
`FOUNDATION_CURRENT_STATE.md`, `IMPLEMENTATION_MATRIX.md`, `NEXT_ACTIONS.md`, `SESSION_HANDOFF.md` et
`CHANGELOG.md`.
