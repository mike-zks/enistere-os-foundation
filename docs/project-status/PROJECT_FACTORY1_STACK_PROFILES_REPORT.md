# PROJECT_FACTORY1_STACK_PROFILES_REPORT.md

## 1. Mission

**Project Factory 1 — Stack Profiles Matrix**

Objectif : cadrer la composition flexible des cores pour projets derives et documenter les profils
API/Web/Mobile utilisables a partir des cores V1.

## 2. Livrables

- [`../project-factory/DERIVED_PROJECT_PROCESS.md`](../project-factory/DERIVED_PROJECT_PROCESS.md) :
  processus idee -> brief fonctionnel -> blueprint technique -> profil stack -> bootstrap.
- [`../project-factory/STACK_PROFILES_MATRIX.md`](../project-factory/STACK_PROFILES_MATRIX.md) :
  matrice complete des profils, compatibilites, gates, usages recommandes et limites.

## 3. Points structurants

- Les projets derives peuvent combiner les cores de facon flexible.
- Les profils **API + mobile** sont explicitement reconnus comme profils V1 legitimes.
- `nestjs-react-native` et `spring-flutter` sont les profils API + mobile les plus directs.
- `spring-react-native` et `nestjs-flutter` sont possibles mais classes `ADAPT` tant que la compatibilite
  contractuelle et les clients generes ne sont pas industrialises.
- Le Project Factory vise une ergonomie proche de JHipster, mais avec une gouvernance Enistere :
  cores validés, ADR, gates, documentation fonctionnelle/technique et ecarts explicites.

## 4. Hors perimetre

- Aucun generateur CLI.
- Aucun template de projet derive.
- Aucun runtime modifie.
- Aucune dependance.
- Aucun workflow.
- Aucun exemple derive bout-en-bout.
- Aucune publication npm registry.

## 5. Verification documentaire

Les documents sont purement documentaires. Les gates attendus sont :

```bash
node cores/quality-core/scripts/quality-gates.mjs run docs
git diff --check
```

## 6. Prochaine action recommandee

**Project Factory 2 — Derived project blueprint templates**

Objectif : ajouter les templates documentaires standards pour initialiser un projet derive :

- `FUNCTIONAL_BRIEF.md` ;
- `TECHNICAL_BLUEPRINT.md` ;
- `STACK_DECISION.md` ;
- `SECURITY_NOTES.md` ;
- `RELEASE_PLAN.md`.

