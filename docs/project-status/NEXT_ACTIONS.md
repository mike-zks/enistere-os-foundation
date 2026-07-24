# Prochaine action

## Action unique

**Décision structurante actée : homogénéiser le modèle de composition des 6 runtimes**
([ADR-054](../adr/ADR-054-homogeneous-composition-model.md)) — modèle modular à **source unique** (racine =
base modulaire + overlays ; app complète toujours **composée**, jamais dédoublée ; **aucun `base/` nulle
part**). Aujourd'hui Spring/Angular/Flutter maintiennent une **app complète en double** (`src/`/`lib/`) qui
dérive de leur `base/` — la contradiction du contrat d'erreur Spring (`src/` complet ancien vs `base/`
canonique) en est le symptôme actif.

**Prochaine action unique : Interim ADR-054 — réconcilier la contradiction du contrat d'erreur Spring**
(`starters/spring/src` complet → enveloppe plate canonique : `ApiError` + `GlobalExceptionHandler` + entry
point sécurité + tests `$.status`→`$.statusCode` / `$.code`→`$.errorCode`), vérifié par `mvnw verify`. C'est
le seul écart **logique actif** ; il est **non bloqué** (indépendant de la modularisation `files`).

Puis migration ADR-054 (ordre Spring → Angular → Flutter) : (1) modulariser `files` + compléter les overlays ;
(2) repointer la CI sur une composition générée ; (3) supprimer l'app dédoublée, remonter `base/` à la racine ;
(4) fitness function de garde « source unique ».

Dette suivie : parité des contrats **générés** (Angular/Flutter → `@enistere/api-contracts`, audit P0) ; a11y ;
capabilities Web/Mobile (Phase 3).

## Cadrage gouvernance

Selon [`ARCHITECTURE_GOVERNANCE.md`](../governance/ARCHITECTURE_GOVERNANCE.md) et la
[Definition of Ready](../governance/DEFINITION_OF_READY.md), commencer par une analyse directe du dépôt après
merge (ne pas supposer les contrats Web suffisants), et aucune readiness sans preuve exécutable
([Definition of Done](../governance/DEFINITION_OF_DONE.md)).

## Dette suivie — missions d'upgrade dédiées

Deux advisories CVE-2026 sans correctif upstream sont couvertes par des exceptions documentées
(`factory/quality/audit-exceptions.json`, échéance 2026-10-31, revue forcée par le gate `audit-check`).
Elles se lèvent **hors du chemin critique** de l'action ci-dessus, chacune selon
[`DEPENDENCY_POLICY.md`](../governance/DEPENDENCY_POLICY.md) (matrice de compatibilité, tests, preuve golden) :

1. **Upgrade Next** — jusqu'à un Next promouvant `sharp` ≥ 0.35.0 → lève les exceptions `sharp` / `next` ;
2. **Upgrade Angular CLI** — jusqu'à ce que la chaîne `@angular/cli` → `@modelcontextprotocol/sdk` tire
   `@hono/node-server` ≥ 2.0.5 → lève la chaîne hono.

## Interdictions temporaires

- nouvelle capability ;
- nouveau runtime ;
- nouvelle topologie ;
- promotion de profil ;
- extension du Domain Compiler ;
- microservices.
