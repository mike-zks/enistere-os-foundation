# V3_ENTRY_DECISION.md — Entrée gouvernée en V3 multi-framework

> Date : 2026-07-13
> Décision : **ouvrir la séquence V3 par Mobile Core Flutter, en commençant par ADR-034**
> Statut : **cadrage uniquement — aucun starter généré**

## 1. Contexte lu

- `strategy/04_ROADMAP_GLOBAL.md` §14→§17 — V3 extension multi-framework.
- `docs/adr/ADR_BACKLOG.md` §6 — ADR futurs.
- `docs/project-status/FOUNDATION_CURRENT_STATE.md`.
- `docs/project-status/IMPLEMENTATION_MATRIX.md`.
- `docs/project-status/NEXT_ACTIONS.md`.
- `docs/project-status/SESSION_HANDOFF.md`.

## 2. État avant décision

La V1 prioritaire est validée :

- API Core NestJS : `VALIDE_V1`.
- Web Core Next.js : `VALIDE_V1`.
- Mobile Core React Native : `VALIDE_V1`.
- UI Kit : `VALIDE_V1`.
- Cloud Core : `VALIDE_V1`.
- Docs Core : `VALIDE_V1`.
- Quality Core : `VALIDE_V1`.

Les cores V3 restent vides au moment de cette décision d'entrée V3 :

| Core | Statut | Blocage actuel |
|---|---|---|
| Mobile Core Flutter | `DOSSIER_SEULEMENT` | spécification absente + ADR-034 non rédigé à cette date |
| API Core Spring Boot | `DOSSIER_SEULEMENT` | spécification absente |
| Web Core Angular | `DOSSIER_SEULEMENT` | spécification absente + ADR-035 non rédigé |

## 3. Options considérées

### Option A — Démarrer directement un starter Flutter

Rejetée. La roadmap V3 et l'ADR backlog indiquent qu'ADR-034 doit cadrer le choix
Flutter UI avant toute implémentation. Générer un starter sans cette décision créerait
un choix implicite.

### Option B — Démarrer API Core Spring Boot

Reportée. Le core Spring Boot est pertinent pour des projets enterprise, mais il duplique
beaucoup de surface déjà validée dans API Core NestJS. Il demande une spécification complète
avant tout code.

### Option C — Démarrer Web Core Angular

Reportée. Web Angular dépend d'ADR-035 (Angular Material vs PrimeNG) avant de choisir la
surface UI. Commencer ici ajouterait une deuxième décision UI non tranchée en parallèle.

### Option D — Ouvrir V3 par Mobile Core Flutter, mais uniquement avec ADR-034 ✅

Retenue. C'est le premier core listé en roadmap §14/§15, et il a un ADR explicite dans le
backlog. La prochaine mission doit donc rédiger et valider ADR-034 avant toute spécification
ou starter Flutter.

## 4. Décision

La prochaine mission unique est :

**ADR-034 — Flutter UI : Material 3 vs composants maison.**

Périmètre attendu :

- décision UI Flutter pour le futur Mobile Core Flutter ;
- alignement avec UI Kit tokens (ADR-008) et Mobile RN (ADR-010) ;
- impact accessibilité, theming, maintenance, dépendances et cohérence multi-framework ;
- aucune génération de starter Flutter ;
- aucun changement runtime.

## 5. Frontières

Interdits pour la prochaine mission :

- ne pas créer de projet Flutter ;
- ne pas ajouter de dépendance Dart/Flutter ;
- ne pas modifier les cores V1 validés ;
- ne pas décider Web Angular (ADR-035) dans ADR-034 ;
- ne pas démarrer API Spring Boot ;
- ne pas déclarer Mobile Flutter implémenté.

## 6. Effet de statut

Aucun core ne change de statut.

Cette décision marque seulement le passage du pilotage post-V1 vers la séquence V3
gouvernée. Les cores V3 restent `DOSSIER_SEULEMENT`.

## 7. Prochaine action recommandée

**V3 ADR 034 — Flutter UI stack decision.**

Livrer `docs/adr/ADR-034-flutter-ui-material3-vs-custom.md`, mettre à jour
`ADR_BACKLOG.md`, `DECISIONS_REGISTER.md`, `NEXT_ACTIONS.md`, `IMPLEMENTATION_MATRIX.md`,
`FOUNDATION_CURRENT_STATE.md`, `SESSION_HANDOFF.md` et `CHANGELOG.md`.
