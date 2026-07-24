# ADR-056 — Contrat de base par famille (base = plancher d'invariants)

- Statut : Validé
- Date : 2026-07-24
- Décideur : Owner Foundation

## Contexte

La **base** d'un runtime doit être le **plancher d'invariants** de sa famille — mesuré idiomatiquement
(mandat §8.4 : parité = même contrat, pas même code) — et **rien d'autre**. Aujourd'hui les bases des 6
runtimes ont été construites indépendamment et ont **divergé** ; « homogène » n'est vrai que *par intention*,
pas de façon mesurée.

Le contrat existe déjà partiellement : les **invariants de conformité** (`factory/conformance/platform-contract.mjs`)
et [`PLATFORM_CONTRACT.md`](../specifications/PLATFORM_CONTRACT.md).

| Famille | Invariants du contrat | Homogénéité réelle (scan direct, 2026-07-24) |
|---|---|---|
| **API** (8) | config-validated, error-canonical, correlation-id, health, openapi, migrations, base-security, observability | ⚠️ base Nest = `audit, bootstrap, common, composition, config, database, health` (+ `common/throttling`) ; base Spring = `common, config, health`. Nest a **audit + throttling**, Spring **non** — et **ni l'un ni l'autre n'est un invariant** du contrat. |
| **WEB** (9) | routing, typed-config, typed-api-access, ui-states, error-handling, accessibility, observability, tests, build | ✅ quasi-homogène : Next (`core/{api,config,query}`, app router) ↔ Angular (`core/{config,errors,interceptors,server-state}`, pages) ; taxonomie différente mais **acceptable** (§8.4). À confirmer par l'évaluateur. |
| **MOBILE** (8) | navigation, typed-config, typed-api-access, ui-states, error-handling, observability, tests, build | 🔴 divergence majeure : base RN ≈ **25 modules** (`biometrics, notifications, offline, consent, crash-reporting, analytics, i18n, permissions, linking, clipboard, preferences, retry, telemetry`…) vs base Flutter ≈ **7** (`api, config, navigation, states, theme, home`). RN embarque des features **type-capability** ; Flutter a la base minimale. |

`observability` est **déjà** un invariant des 3 familles ([ADR-049](ADR-049-api-observability-convergence.md)
pour l'API-minimale). Les deux vrais manques du contrat API sont **audit** et **rate-limiting**.

## Décision

1. **La base d'un runtime = exactement le contrat d'invariants de sa famille** — ni **moins** (aucun invariant
   manquant), ni **plus** (aucune feature optionnelle bundlée). La conformité le **mesure** par famille.
2. **Tout ce qui n'est pas un invariant est une capability/overlay** (§8.5). Réaffirme le modèle single-source
   d'[ADR-054](ADR-054-homogeneous-composition-model.md).
3. **Le contrat API est complété de deux invariants de sécurité** :
   - **`rate-limiting`** — protection anti-abus ; le **mécanisme** est en base, les limites par endpoint sont
     de la **config** (posées par les overlays qui les utilisent) ;
   - **`audit-trail`** — l'**infra** (service + sink) est en **base** ; **chaque capability déclare ses propres
     événements d'audit** via son overlay, sans dépendre des autres capabilities (couplage par **événements**,
     cohérent avec [ADR-055](ADR-055-capability-composition-policy.md) §5).

   Justification : mandat **§11** (invariants API) et **§12** (audit + moindre privilège = responsabilités
   sécurité) ; et **c'est déjà la référence NestJS** — `starters/nestjs/src/audit/` + `src/common/throttling/`
   en base, `capabilities/{auth,rbac,files}/targets/nestjs/…/*-audit-events.ts` et `auth-throttler.guard.ts`
   dans les overlays. Spring est simplement en retard.
4. **Les invariants sont propres à la famille** :
   - `observability` : les **3 familles** ;
   - `audit-trail` + `rate-limiting` : **famille API** uniquement — un frontend ne rate-limit pas et ne tient
     pas de journal d'audit **serveur** ;
   - `accessibility` : WEB (un invariant a11y mobile est une évolution distincte, hors périmètre ici).
5. **Reconnaissance de la dette mobile** : la base RN sur-remplie vs la base Flutter minimale est le **même
   vice** que le doublon Spring — des éléments **non-invariants** logés dans la base. Sa résolution (extraire
   les extras RN en capabilities et les offrir à Flutter en overlays, **ou** promouvoir certains en invariants
   mobiles) est une **mission d'homogénéité dédiée**, séquencée **après** l'API. **Aucune extraction dans cet
   ADR** — seulement la reconnaissance et le principe (§1–2) qui la gouvernera.

## Migration (programme ordonné, phasé)

Aucune modification de code dans cet ADR — chaque étape est une mission validée séparément.

| Étape | Contenu | Preuve / bloqueur |
|---|---|---|
| 1 | Ajouter `rate-limiting` + `audit-trail` aux invariants du **contrat API** (`platform-contract.mjs`), mesurés sur **Nest et Spring** | évaluateur : Nest `compliant` (déjà), Spring `non-compliant` tant que non porté |
| 2 | **Porter la base Spring** à parité : audit-infra + mécanisme de throttling en `starters/spring/base/`, événements/usage par overlay (miroir Nest) | `golden-runtime spring-*` vert (mvnw verify) |
| 3 | *(débloque [ADR-054](ADR-054-homogeneous-composition-model.md) A)* repointer la CI → supprimer le doublon Spring → fitness « source unique » | goldens verts |
| 4 | **Mission mobile** : réconcilier base RN/Flutter selon le principe §1–2 (analyse dédiée) | — |
| 5 | Vérifier la parité contractuelle **WEB** Next/Angular | évaluateur |

## Relation avec les ADR

- **[ADR-054](ADR-054-homogeneous-composition-model.md)** (composition homogène) : ADR-056 en est le
  **corollaire côté contenu** — ADR-054 dit *comment* on compose (single-source), ADR-056 dit *ce que la base
  doit contenir* (le contrat). La mission A d'ADR-054 (dédoublage Spring) **dépend de l'étape 2** ci-dessus.
- **[ADR-055](ADR-055-capability-composition-policy.md)** (politique capabilities) : ADR-056 **précise** son §5
  — l'**infra d'audit est un invariant de base**, pas une capability isolée ; **chaque capability contribue ses
  événements d'audit**. Le reste d'ADR-055 (atomicité, graphe `requires` à source unique, auto-closure) est
  **inchangé**.

## Conséquences positives

- **Homogénéité structurelle et mesurée** par famille, plus seulement constatée ;
- la base devient un **contrat exécutable** → une fitness function peut refuser une base **incomplète** *ou*
  **sur-remplie** ;
- **sécurité par défaut** (audit + rate-limiting) sur toute la famille API (§12) ;
- **désambiguïse base vs capability** pour toutes les prochaines features.

## Coûts et risques

- Élargir le contrat API **oblige à porter Spring** (mission réelle, mais bornée et **guidée par NestJS**) ;
- la **dette mobile est importante** — d'où son séquencement en mission dédiée, hors de cet ADR ;
- **risque de sur-inflation** du contrat : n'y placer que des invariants **réellement universels à la famille**
  (audit / rate-limiting / observability le sont ; biometrics / notifications ne le sont pas → capabilities).

## Périmètre

Inclus : le principe (base = contrat de famille) ; la **complétion du contrat API** (`audit-trail` +
`rate-limiting`) ; la reconnaissance de la dette mobile et le principe qui la gouverne.

Exclus : toute implémentation (missions ultérieures) ; l'extraction des modules RN (mission mobile dédiée) ;
un invariant a11y mobile ; la taxonomie/nommage des dossiers de base (idiomatiques par runtime).

## Alternatives rejetées

- **Base = tout ce que le runtime le plus riche embarque** (aligner Flutter sur RN, garder l'app complète
  Spring) : gonfle la base de features optionnelles, casse la composabilité, **reproduit le vice**.
- **Laisser les bases diverger** (homogénéité « par intention » seulement) : dérive non mesurée — exactement
  ce que cet ADR corrige.
- **`audit` / `rate-limiting` en capabilities isolées** (au lieu d'invariants de base) : contredit la référence
  NestJS (infra en base) et forcerait une couture d'événements séparée alors qu'elle **existe déjà** via base.

## Tests

Nouveaux invariants `rate-limiting` + `audit-trail` dans l'évaluateur, `compliant` sur Nest **et** Spring ;
`golden-runtime spring-*` vert après le port ; fitness function « base = contrat de famille » (ni incomplète ni
sur-remplie) à terme ; `factory:test` vert à chaque étape.

## Rollback

ADR documentaire (référence). Chaque étape d'implémentation est `git revert`-able indépendamment ; le contrat
(les invariants) est versionné dans `factory/conformance/platform-contract.mjs`.

## Suite

Étapes 1-2 (prochaine mission) : **compléter le contrat API** (audit-trail + rate-limiting) puis **porter la
base Spring** à parité NestJS, preuve golden verte — ce qui **débloque** la mission A d'ADR-054. Puis mobile,
puis vérification Web.
