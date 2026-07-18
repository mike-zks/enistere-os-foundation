# PROJECT_FACTORY2_BLUEPRINT_TEMPLATES_REPORT.md

## 1. Mission

**Project Factory 2 — Derived project blueprint templates**

Objectif : fournir les templates documentaires standards pour initialiser un projet derive avant toute
generation ou copie de core.

## 2. Alignement strategy

Documents strategy relus avant implementation :

- `strategy/02_GOVERNANCE.md` — documentation obligatoire, decisions tracables, securite par defaut ;
- `strategy/03_ARCHITECTURE_TARGET.md` — projets derives independants, repositories separes, Foundation
  comme socle ;
- `strategy/05_EXECUTION_CHAIN.md` — aucune generation massive sans cadrage, validation, tests et docs ;
- `strategy/08_STANDARDS.md` — structure, secrets exclus du Git, README, tests, changelog, documentation.

## 3. Livrables

Templates ajoutes dans `docs/project-factory/templates/` :

- `FUNCTIONAL_BRIEF.template.md` ;
- `TECHNICAL_BLUEPRINT.template.md` ;
- `STACK_DECISION.template.md` ;
- `SECURITY_NOTES.template.md` ;
- `RELEASE_PLAN.template.md`.

`docs/project-factory/DERIVED_PROJECT_PROCESS.md` reference maintenant ces templates comme sorties
documentaires minimales.

## 4. Garde-fous

- Les templates ne contiennent aucun secret.
- Les templates demandent explicitement de documenter les donnees sensibles, les roles, les permissions,
  les contrats API, les gates, les variables d'environnement et les ecarts Foundation.
- Les profils API + mobile restent couverts via le blueprint technique et la decision de stack.
- Toute divergence significative doit etre documentee par ADR de projet derive.

## 5. Hors perimetre

- Aucun generateur CLI.
- Aucun template runtime.
- Aucun exemple derive cree.
- Aucun workflow.
- Aucune dependance.
- Aucun changement dans les cores applicatifs.

## 6. Verification attendue

```bash
node cores/quality-core/scripts/quality-gates.mjs run docs
git diff --check
```

## 7. Prochaine action recommandee

**Project Factory 3 — First derived example skeleton**

Objectif : creer un premier squelette documentaire d'exemple derive sous `examples/derived/`, sans runtime
applicatif, en instanciant les templates pour un profil prioritaire (`spring-angular` ou `nestjs-next`).

