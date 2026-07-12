# FOUNDATION_V1_RELEASE_NOTES.md — Notes de release préparatoires

> Type : `foundation-v1-baseline`
> Statut : **DRAFT_READY_FOR_HUMAN_RELEASE_DECISION**
> Date de préparation : 2026-07-12
> Tag proposé : `foundation-v1.0.0` (**non créé**)
> GitHub Release : **non créée**

## Résumé

Enistere OS Foundation dispose d'une baseline V1 gouvernée pour le socle API/Web/UI : API Core
NestJS, Web Core Next.js et UI Kit sont `VALIDE_V1`, les packages API officiels sont avancés et
consommés, Quality Core fournit les gates/runbooks/checklists, et la branche `main` est protégée par
un ruleset actif avec CI L1-L4 verte.

Cette note prépare la release `foundation-v1-baseline`. Elle ne crée pas le tag et ne publie aucune
GitHub Release.

## Cores Impactés

| Core / package | Statut release | Preuve |
|---|---|---|
| API Core NestJS | `VALIDE_V1` | `API_CORE_V1_READINESS_REVIEW.md` |
| Web Core Next.js | `VALIDE_V1` | `WEB_CORE_V1_READINESS_REVIEW.md` |
| UI Kit | `VALIDE_V1` | `UI_KIT_V1_READINESS_REVIEW.md` |
| `@enistere/api-contracts` | `IMPLEMENTATION_AVANCEE` | build/generate/test, consommé Web |
| `@enistere/api-client-fetch` | `IMPLEMENTATION_AVANCEE` | build/test, consommé Web/Mobile |
| Quality Core | `SPECIFICATION_DOCUMENTAIRE` | `QUALITY_GATES_MATRIX.md`, runbooks, checklists |
| Cloud Core | `IMPLEMENTATION_PARTIELLE` | CI runtime/E2E/registry + staging vérifié, hors production |
| Mobile React Native | `STARTER_UI_KIT_ALIGNED` | starter avancé ; `VALIDE_V1` exclu de cette baseline |

## Changements Fonctionnels Inclus

- API Core NestJS : socle backend V1 validé, avec auth JWT/refresh, RBAC, permissions, audit, Files
  S3/MinIO, health checks, logging Pino, OpenAPI canonique et CI runtime.
- Web Core Next.js : App Router V1 validé, avec layout public/protégé, BFF Auth, session/autorisations,
  BFF Files lecture/upload/suppression/liste/admin, RHF+Zod, TanStack Query, UI Kit consommé.
- UI Kit : tokens et 19 primitives Web React validées, documentées, testées, et cohérence mobile/web
  prouvée par RN35.
- Packages API : contrats OpenAPI générés et client fetch officiel consommés par les cores clients.
- Quality Core : matrice de gates, script `quality-gates`, checklists, templates GitHub, protection de
  branche documentée/vérifiée, processus de release.
- CI/Gouvernance : `main` protégé via Rulesets, PR obligatoire, status checks stricts, CI L1-L4 verte.

## Sécurité / Gouvernance

- Aucun secret, token, URL signée ou credential ajouté aux notes.
- Aucune production déclarée.
- Aucune publication npm ou GitHub Release automatique.
- Aucun déploiement déclenché.
- Ruleset `protect-main` actif : suppression et non-fast-forward interdits, PR obligatoire,
  conversations résolues, checks requis stricts.
- Checks requis : `api-contracts`, `api-client-fetch`, `ui-kit`, `web-nextjs`, `audit`,
  `api-runtime`, `web-e2e`, `api-smoke`.
- Checks `images` verts sur la dernière CI observée, mais non requis par le ruleset actuel.

## Migrations / Breaking Changes

- Aucune migration applicative requise par cette note de release.
- Aucun changement runtime introduit par la préparation des notes.
- Aucun changement de workflow CI.
- Aucun tag créé.

## Gates Exécutés

| Gate | Résultat |
|---|---|
| `env NODE_ENV=test node cores/quality-core/scripts/quality-gates.mjs run all-safe` | PASS jusqu'au gate audit (16/17) |
| `npm audit` root hors sandbox réseau | 0 vulnérabilité |
| `git diff --check` | 0 erreur |
| `node --test cores/quality-core/scripts/quality-gates.test.mjs` | PASS |
| `node cores/quality-core/scripts/quality-gates.mjs plan docs` | PASS |
| CI `main` après PR #88 | PASS — CI, API Runtime CI, Web E2E CI, Registry CI |

Note : le gate `npm audit` du run local `all-safe` a échoué uniquement sur DNS sandbox
(`EAI_AGAIN`). Il a été relancé hors sandbox réseau et a retourné `found 0 vulnerabilities`.

## Gates Non Exécutés

| Gate | Raison |
|---|---|
| `smoke:ios` | Précondition externe : macOS/Xcode ou device iOS requis ; RN31 reste bloqué |
| `smoke:android` | Non requis pour `foundation-v1-baseline`, déjà validé précédemment sur émulateur |
| Tests Cloud staging réels | Réservés aux gates finaux `staging-candidate`, pas à cette note documentaire |
| Production deploy | Hors périmètre V1 |

## Limites Connues

- Mobile Core n'est pas promu `VALIDE_V1` dans cette baseline ; il reste `STARTER_UI_KIT_ALIGNED`.
- Cloud Core est `IMPLEMENTATION_PARTIELLE` malgré staging vérifié ; production et environnements
  protégés restent hors V1.
- Packages API restent privés/non publiés.
- Observabilité avancée, scan/signature images, couverture publiée, release automation et package
  publication restent V2/VF ou décisions futures.

## Prochaine Action

**Décision humaine : créer ou non le tag `foundation-v1.0.0` et la GitHub Release associée.**

Si validé par le mainteneur après merge de cette note :

```bash
git tag -a foundation-v1.0.0 -m "Foundation V1 baseline"
git push origin foundation-v1.0.0
```

Le billet GitHub Release doit reprendre ces notes et référencer le commit `main` correspondant.
