# CORE_STATUS_REVIEW_CHECKLIST.md — Checklist revue de statut d'un core

> Référence : `factory/quality/QUALITY_GATES_MATRIX.md`, `specification active`.
> Dernière mise à jour : 2026-07-11 (Factory Quality 1).

## Quand utiliser cette checklist

Avant de commencer une revue officielle du statut d'un core (ex. décider si un core peut passer
de `IMPLEMENTATION_AVANCEE` à `VALIDE_V1`, ou de `SPECIFICATION_DOCUMENTAIRE` à
`IMPLEMENTATION_PARTIELLE`, etc.).

---

## Étape 1 — Contexte obligatoire à lire avant la revue

- [ ] `strategy/04_ROADMAP_GLOBAL.md` — section dédiée au core
- [ ] `cores/<nom>/specification active` — critères de validation V1 (section §XX)
- [ ] `docs/project-status/IMPLEMENTATION_MATRIX.md` — statut courant + dernière preuve
- [ ] `docs/project-status/FOUNDATION_CURRENT_STATE.md` — état global
- [ ] `docs/project-status/NEXT_ACTIONS.md` — dépendances et actions en cours
- [ ] `docs/project-status/SESSION_HANDOFF.md` — historique récent
- [ ] `CHANGELOG.md` — entrées récentes du core
- [ ] ADR liés au core (voir `docs/adr/ADR_BACKLOG.md` et `docs/project-status/DECISIONS_REGISTER.md`)

---

## Étape 2 — Vérification des critères de la spécification

Pour chaque critère de validation défini dans la `specification active` du core :

- [ ] Critère 1 : __________________________________________________ ✅ / ❌ / ⚠️
- [ ] Critère 2 : __________________________________________________ ✅ / ❌ / ⚠️
- [ ] Critère 3 : __________________________________________________ ✅ / ❌ / ⚠️
- [ ] Critère 4 : __________________________________________________ ✅ / ❌ / ⚠️
- [ ] Critère 5 : __________________________________________________ ✅ / ❌ / ⚠️

> Remplacer par les critères réels de la spécification du core visé.
> Si un critère est ❌ ou ⚠️, documenter le gap et décider s'il est bloquant.

---

## Étape 3 — Gates de vérification locale

Exécuter les gates appropriés selon la `QUALITY_GATES_MATRIX.md` :

- [ ] typecheck
- [ ] lint
- [ ] tests (nombre : _______ / _______ verts)
- [ ] build
- [ ] audit root (0 vuln)
- [ ] gate spécifique au core (tokens:check / generate:check / openapi:check / expo-doctor / …)
- [ ] `git diff --check`

---

## Étape 4 — Identification des gaps bloquants vs non bloquants

| Gap identifié | Bloquant VALIDE_V1 ? | Justification |
|---|---|---|
| ________________________________ | oui / non | _________________________ |
| ________________________________ | oui / non | _________________________ |
| ________________________________ | oui / non | _________________________ |

> Un gap est **non bloquant** s'il est couvert par un ADR qui le réassigne à un autre core
> (ex. ADR-010 pour les composants RN dans le UI Kit) ou s'il est explicitement différé dans
> la spécification.

---

## Étape 5 — Décision de promotion

- [ ] Tous les critères bloquants sont ✅
- [ ] Les gaps non bloquants sont documentés et justifiés
- [ ] Le statut proposé est cohérent avec la hiérarchie : `DOSSIER_SEULEMENT` →
  `SPECIFICATION_DOCUMENTAIRE` → `IMPLEMENTATION_PARTIELLE` → `IMPLEMENTATION_AVANCEE` →
  `VALIDE_V1`

**Décision** : Promouvoir à `_______________________` / Maintenir à `_______________________`

**Justification** : ________________________________________________________________

---

## Étape 6 — Rapport de revue

- [ ] Rédiger le rapport dans `docs/project-status/<CORE>_V1_READINESS_REVIEW.md`
- [ ] Sections minimales du rapport :
  - Synthèse (statut proposé, date)
  - Critères de validation (liste + résultat)
  - Gaps non bloquants (liste + justification)
  - Vérifications exécutées (commandes + résultats)
  - Décision finale et justification

---

## Étape 7 — Mise à jour project-status

- [ ] `docs/project-status/IMPLEMENTATION_MATRIX.md` — nouveau statut + preuve + date
- [ ] `docs/project-status/FOUNDATION_CURRENT_STATE.md` — §1 table + §3 arbre
- [ ] `docs/project-status/NEXT_ACTIONS.md` — action réalisée + prochaine action
- [ ] `docs/project-status/SESSION_HANDOFF.md` — §3 état réel + §8 dernière étape
- [ ] `CHANGELOG.md` — entrée dans `[Unreleased]`

---

## Étape 8 — PR et merge

- [ ] Branche dédiée à la revue (ex. `ui-kit-valide-v1-review`, `web-core-valide-v1-review`)
- [ ] PR avec titre clair incluant le core et le nouveau statut
- [ ] PR description contenant la justification et les preuves clés
- [ ] CI verte (`ci.yml` L1 minimum)
- [ ] Merge après revue

---

## Rappels de gouvernance

- Aucune promotion sans rapport de revue versionné dans `docs/project-status/`.
- Les statuts intermédiaires (`STARTER_UI_KIT_ALIGNED`, `CADRAGE_OPERATIONNEL`, etc.) sont
  valides quand un core est dans un état spécifique documenté mais non couvert par les labels
  standards.
- La source de vérité est le code et les tests, pas la documentation.
- Un ADR validé prime sur un choix ouvert dans une spécification.
- Voir `docs/project-status/FOUNDATION_CURRENT_STATE.md` §2 pour la hiérarchie de confiance.
