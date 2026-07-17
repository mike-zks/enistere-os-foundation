# Developer Quickstart

> Parcours court pour verifier un clone local et comprendre les points d'entree sans lire toute la
> gouvernance. Ce document ne remplace pas `CONTRIBUTOR_ONBOARDING.md` pour une mission de code.

## Objectif

En 15 minutes, un developpeur doit pouvoir :

1. verifier l'etat Git ;
2. lire les sources de verite minimales ;
3. lancer un gate documentaire ;
4. lancer un exemple consommateur de package ;
5. savoir quelle mission est autorisee ensuite.

## Pre-requis

- Node.js 24 ;
- npm ;
- Git ;
- acces au repository.

Les stacks optionnelles restent par core : Docker pour les gates runtime/API, Flutter pour `mobile-flutter`,
Android SDK pour les smoke mobiles, Java 21 pour `api-spring`, Chrome/Chromium pour Angular/Web E2E.

## Parcours 15 minutes

### 1. Verifier le clone

```bash
git status --short --branch
```

Attendu : branche connue, pas de modifications inattendues.

### 2. Lire le minimum utile

Lire dans cet ordre :

1. [`../project-status/SESSION_HANDOFF.md`](../project-status/SESSION_HANDOFF.md) ;
2. [`../project-status/FOUNDATION_CURRENT_STATE.md`](../project-status/FOUNDATION_CURRENT_STATE.md) ;
3. [`../project-status/NEXT_ACTIONS.md`](../project-status/NEXT_ACTIONS.md).

Pour comprendre la logique globale, lire ensuite :

- [`../../strategy/04_ROADMAP_GLOBAL.md`](../../strategy/04_ROADMAP_GLOBAL.md) ;
- [`CONTRIBUTOR_ONBOARDING.md`](./CONTRIBUTOR_ONBOARDING.md).

### 3. Lancer le gate documentaire rapide

```bash
node cores/quality-core/scripts/quality-gates.mjs run docs
```

Ce gate verifie les espaces blancs Git et les liens Markdown internes.

### 4. Lancer le premier exemple consommateur

```bash
npm run example:api-client-node
```

Cet exemple :

- build `@enistere/api-contracts` ;
- build `@enistere/api-client-fetch` ;
- execute `examples/api-client-node/smoke.mjs` ;
- prouve un appel public `/health` sans `Authorization` ;
- prouve un appel authentifie `/auth/me` via `InMemorySessionAdapter`.

Il ne contacte aucun backend et ne logge aucun token.

### 5. Voir les gates disponibles

```bash
node cores/quality-core/scripts/quality-gates.mjs list
node cores/quality-core/scripts/quality-gates.mjs plan all-safe
```

`all-safe` exclut volontairement les gates qui demandent une infrastructure externe ou un device :
Cloud/staging, Android/iOS smoke, E2E Playwright complet selon contexte, et e2e API local avec services.

### 6. Choisir une mission

La mission active doit venir de [`../project-status/NEXT_ACTIONS.md`](../project-status/NEXT_ACTIONS.md)
ou etre explicitement arbitree par le pilote.

Avant de coder, lire aussi :

- le `CORE_SPECIFICATION.md` du core concerne ;
- les ADR applicables ;
- [`../checklists/PR_QUALITY_CHECKLIST.md`](../checklists/PR_QUALITY_CHECKLIST.md).

## Anti-patterns

- Ne pas publier de package pendant un quickstart.
- Ne pas lancer de test serveur reel sans decision explicite.
- Ne pas supposer qu'un rapport historique decrit l'etat courant.
- Ne pas modifier plusieurs cores pour "tester l'ensemble".
- Ne pas ajouter de dependance pour simplifier un exemple.

## Sortie attendue

Un clone est considere pret pour contribuer si les commandes suivantes passent :

```bash
git status --short --branch
node cores/quality-core/scripts/quality-gates.mjs run docs
npm run example:api-client-node
```

Pour une mission reelle, appliquer ensuite les gates du core cible selon
[`../../cores/quality-core/QUALITY_GATES_MATRIX.md`](../../cores/quality-core/QUALITY_GATES_MATRIX.md).
