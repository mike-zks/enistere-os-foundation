# FOUNDATION_V1_BASELINE_READINESS_REVIEW.md — Revue de readiness Foundation V1 baseline

> Date : 2026-07-12. Revue transverse gouvernée, sans tag, sans release GitHub, sans déploiement.

## 1. Verdict

**Décision de revue : `READY_FOR_RELEASE_DECISION`.**

Le périmètre `foundation-v1-baseline` défini dans
`factory/quality/core/RELEASE_PROCESS_RUNBOOK.md` §3.1 est **prêt pour une décision humaine de
release**. Cette revue ne crée pas la release : elle assemble les preuves et confirme que les
préconditions techniques et documentaires sont satisfaites.

## 2. Périmètre Inclus

| Élément | Statut | Preuve |
|---|---|---|
| API Core NestJS | `VALIDE_V1` | `API_CORE_V1_READINESS_REVIEW.md`, CI `api-runtime` |
| Web Core Next.js | `VALIDE_V1` | `WEB_CORE_V1_READINESS_REVIEW.md`, CI `web-e2e` |
| UI Kit | `VALIDE_V1` | `UI_KIT_V1_READINESS_REVIEW.md`, RN35 alignment |
| `@enistere/api-contracts` | `IMPLEMENTATION_AVANCEE` | build/generate/test, consommé Web |
| `@enistere/api-client-fetch` | `IMPLEMENTATION_AVANCEE` | build/test, consommé Web/Mobile |
| Quality Core | `SPECIFICATION_DOCUMENTAIRE` | gates matrix, checklists, runbooks, templates |
| CI/ruleset | actif | `protect-main`, CI L1-L4 verte sur `main` |

## 3. Exclusions explicites

- **Mobile Core React Native `VALIDE_V1`** : exclu de `foundation-v1-baseline` par le runbook ;
  RN31 reste bloqué sans macOS/Xcode pour le smoke iOS.
- **Production** : hors périmètre V1.
- **Staging-candidate** : non déclenché ici ; les tests Cloud réels restent des gates finaux
  spécifiques, pas un prérequis à chaque revue documentaire.
- **Publication npm / registry public packages** : non requise pour cette baseline ; packages privés
  intégrés localement.
- **Tag Git / GitHub Release** : non créés par cette revue.

## 4. Gates locaux

| Gate | Résultat |
|---|---|
| `env NODE_ENV=test node factory/quality/core/scripts/quality-gates.mjs run all-safe` | PASS 16/17 jusqu'au gate `npm audit` |
| `npm audit` root hors sandbox réseau | PASS — 0 vulnérabilité |
| `git diff --check` | PASS |
| `git log origin/main..HEAD --oneline` | vide |

Note : une première exécution `all-safe` sans `NODE_ENV=test` a échoué sur les tests UI Kit car
l'environnement local exposait `NODE_ENV=production`, ce qui force le build React production et casse
`React.act` dans Testing Library. La relance avec `NODE_ENV=test` a validé UI Kit, Web et packages. Le
dernier gate `npm audit` a ensuite échoué uniquement sur DNS sandbox (`EAI_AGAIN`) ; l'audit root
relancé hors sandbox a retourné `0 vulnerabilities`.

## 5. CI sur `main`

Dernier commit vérifié : `84dd5e7` (`docs(api): promote api core to valide v1`, PR #87).

| Workflow | Conclusion |
|---|---|
| CI | success |
| API Runtime CI | success |
| Web E2E CI | success |
| Registry CI | success |

Checks observés verts sur PR #87 puis sur `main` : `api-contracts`, `api-client-fetch`, `ui-kit`,
`web-nextjs`, `audit`, `api-runtime`, `web-e2e`, `api-smoke`, `images (api-nestjs, ...)`,
`images (web-nextjs, ...)`.

## 6. Protection de Branche

Ruleset GitHub vérifié :

- Nom : `protect-main`
- ID : `17522775`
- Enforcement : `active`
- Cible : `~DEFAULT_BRANCH`
- Règles : suppression interdite, non-fast-forward interdit, PR obligatoire, conversations résolues
  obligatoires, status checks stricts
- Checks requis : `api-contracts`, `api-client-fetch`, `ui-kit`, `web-nextjs`, `audit`,
  `api-runtime`, `web-e2e`, `api-smoke`

Les deux checks `images` restent non requis par le ruleset, mais ils sont verts sur le dernier run.

## 7. Limites Non Bloquantes

- Les docs de statut restent très volumineuses et conservent des sections historiques ; la source de
  vérité reste la matrice et les rapports de readiness récents.
- La baseline n'est pas une promesse de production-ready ni un `staging-candidate`.
- Mobile dispose d'un starter solide, mais le statut `VALIDE_V1` mobile attend toujours la preuve iOS.
- Observabilité avancée, environnements protégés, scan/signature images, publication packages et
  release automation restent V2/VF ou décisions futures.

## 8. Prochaine Action Recommandée

**Foundation V1 Release Notes 1 — préparer les notes de release `foundation-v1-baseline`**, sans
créer de tag ni de release GitHub. La création du tag `foundation-v1.0.0` doit rester une action
humaine explicite après validation des notes.
