# ADR-055 — Politique de composition des capabilities (graphe de dépendances à source unique)

- Statut : Validé
- Date : 2026-07-24
- Décideur : Owner Foundation

## Contexte

Les capabilities sont des **modules qui se greffent à `base`**, et certaines dépendent d'autres :
`auth → base`, `rbac → base, auth`, `files → base, auth, rbac`. Le besoin exprimé : une **politique
cohérente** pour ce greffage, en particulier pour les capabilities liées.

Analyse directe du dépôt (2026-07-24) — le modèle **est déjà** un graphe déclaratif :

| Champ manifeste (`capability.json`, schéma v2) | Rôle | État |
|---|---|---|
| `requires` | dépendances explicites | déclaré sur les 4 capabilities, validé par FF3 |
| `conflicts` | incompatibilités | supporté, **non utilisé** |
| `provides` | ce que la capability expose | supporté |
| `targets` | support par runtime (`status` + `mode`) | utilisé |

Le fitness function FF3 (`capability-closure`) valide déjà la **closure structurelle** : chaque `requires`
pointe vers une capability connue, et aucune capability ne peut à la fois `requires` et `conflicts` la même.

**L'écart réel** : la closure d'exécution `validateCapabilityDependencies`
(`factory/engine/capabilities.mjs`) enforce les dépendances **codées en dur** :

```js
if (selected.includes('rbac') && !selected.includes('auth')) issues.push('rbac requires auth');
if (selected.includes('files') && !selected.includes('auth')) issues.push('files requires auth');
if (selected.includes('files') && !selected.includes('rbac')) issues.push('files requires rbac');
```

C'est une **duplication de décision** (mandat §8.1) : la politique de dépendance a **deux sources** — le
`requires` déclaré (structurellement validé) **et** cet enforcement en dur. Ajouter une capability oblige à
éditer le moteur, et les deux peuvent **diverger**.

Une idée a été examinée : **fusionner les capabilities liées** (ex. `auth + rbac` en une capability
composite « access »). Elle est **rejetée** (voir Alternatives) car elle détruit des compositions réelles.

## Décision

Adopter une **politique de composition à capabilities atomiques et graphe de dépendances à source unique** :

1. **Capabilities atomiques** — une capability = une responsabilité, **sélectionnable indépendamment**.
   Jamais de capability composite qui en enferme une autre.
2. **Le graphe `requires` déclaré est la source unique** de la politique de dépendance. La closure de
   sélection **et** l'ordre d'application des overlays en **dérivent** (tri topologique). L'enforcement codé
   en dur est **supprimé**.
3. **Auto-closure à la frontière d'entrée** : sélectionner une capability inclut ses `requires` transitifs,
   de façon **déterministe et tracée** — le plan indique explicitement quelles capabilities ont été ajoutées
   par closure (pas d'inclusion silencieuse, DX §14).
4. **`conflicts` activé** : deux capabilities en conflit → refus **actionnable** (ou migration, spec §46).
5. **Isolation (spec §44)** : une capability ne modifie pas directement une autre ; les couplages passent par
   **événements**. L'**infra d'audit est un invariant de base** ([ADR-056](ADR-056-base-contract-per-family.md)),
   pas une capability isolée ; **chaque capability déclare ses propres événements d'audit** dans son overlay —
   c'est la raison du découplage `FileService ↔ audit` réalisé en Phase 1 de la modularisation `files` Spring
   (ADR-054) : l'overlay émet ses événements au lieu de dépendre du module audit.
6. **Aucun mécanisme de regroupement nouveau** (ni bundles, ni capabilities fusionnées) : le besoin de
   « pack » est couvert par **l'auto-closure + les profils existants** (presets d'entrée, mandat §3).

### Catalogue des capabilities considérées

Le graphe et la politique doivent absorber l'ajout d'une capability **sans toucher au moteur**.

**Implémentées** (source de vérité actuelle) :

| Capability | `requires` | Responsabilité |
|---|---|---|
| `base` | — | socle obligatoire (bootstrap, config, erreurs, validation, health, logging, correlationId, OpenAPI, migrations) |
| `auth` | base | authentification (identité, sessions, tokens) |
| `rbac` | base, auth | autorisation (rôles/permissions) |
| `files` | base, auth, rbac | stockage objet |

**Invariants de base** (pas des capabilities — [ADR-056](ADR-056-base-contract-per-family.md)) : l'**infra
d'audit** et le **rate-limiting** sont des invariants de la base API ; les capabilities y contribuent leurs
**événements** / **limites** via overlay.

**Planifiées** (déjà déclarées `planned` dans les starters) : `observability` avancée (métriques, tracing —
l'observabilité minimale est déjà un invariant de base, ADR-049).

**Horizon** (design, **non engagé** — l'ordre §9 gouverne la séquence) : gestion de comptes/utilisateurs,
notifications, jobs/scheduler, feature-flags, i18n, webhooks, recherche, api-keys/service-auth,
multi-tenant, billing.

## Migration (programme ordonné, phasé)

Aucune suppression dans cet ADR — chaque étape est une mission dédiée validée séparément.

| Étape | Contenu | Preuve |
|---|---|---|
| 1 | **Dériver** `validateCapabilityDependencies` du `requires` déclaré (tri topologique + détection de cycle) ; **supprimer** les branches codées en dur | `factory:test` : **mêmes refus qu'aujourd'hui**, désormais issus du graphe ; test de dérivation |
| 2 | **Auto-closure tracée** dans le plan (capabilities ajoutées par closure signalées explicitement) | test de closure + golden |
| 3 | **Activer `conflicts`** (refus actionnable) | test de conflit |
| 4 | **Fitness function** de garde : cohérence `requires` ↔ matrice ↔ enforcement dérivé, aucune double source | `factory:test` |

**Non destructif** : le comportement observable de refus reste **identique** (les mêmes sélections invalides
sont refusées) ; seule **l'origine** de la règle change (le graphe déclaré au lieu du code en dur).

## Conséquences positives

- **Une seule source** pour la politique de dépendance (§8.1) ; ajouter une capability = éditer **son
  manifeste**, jamais le moteur ;
- **composabilité préservée** : `auth` sans `rbac` reste possible (profils `*-auth` déjà `ready`), granularité
  par target conservée (`rbac` = `not-applicable` sur React Native) ;
- **extensibilité** : le catalogue peut grandir sans modification du moteur ;
- couplages inter-capabilities canalisés par événements → l'infra d'audit est un **invariant de base**
  alimenté par les événements des capabilities ([ADR-056](ADR-056-base-contract-per-family.md)).

## Coûts et risques

- La dérivation topologique doit **refuser les cycles** et rester **déterministe** (ordre stable).
- L'auto-closure doit rester **tracée** : jamais d'inclusion silencieuse d'une capability non demandée sans
  l'annoncer dans le plan (DX §14).

## Périmètre

Inclus (décision + plan) : la politique de composition et l'ordre d'implémentation.
**Aucune implémentation dans cet ADR.**

Exclus : l'implémentation des étapes (missions ultérieures) ; les capabilities du catalogue « horizon » ;
la continuité **ADR-054** (dédoublage Spring, étapes 2-4) qui reste la mission d'homogénéisation en cours.

## Alternatives rejetées

- **Fusionner les capabilities liées** (`auth + rbac` = composite « access ») : détruit les compositions
  **auth-only déjà `ready`** (`nestjs-auth`, `spring-auth`, `nest-next-auth`, `triple-auth`), casse la
  granularité par target (`rbac` est `not-applicable` sur React Native alors qu'`auth` y est `ready`),
  granularité plus grossière — à contre-courant du modèle overlay modulaire.
- **Bundles** (presets nommés de capabilities, ex. `security = auth + rbac`) : mécanisme **supplémentaire non
  nécessaire** — l'auto-closure et les profils couvrent déjà le besoin (§8.2 simplicité). Réintroductible plus
  tard **comme preset d'entrée pur** si un besoin ergonomique mesuré apparaît, jamais comme représentation
  interne fusionnée.
- **Statu quo** (closure codée en dur) : duplication de décision, dérive possible, moteur à éditer à chaque
  nouvelle capability.

## Tests

Test de dérivation topologique (mêmes refus qu'aujourd'hui à partir du graphe déclaré) ; test de cycle refusé ;
test d'auto-closure tracée ; fitness function de source unique. `factory:test` reste vert à chaque étape.

## Rollback

Cet ADR est une décision documentaire (référence). L'implémentation ultérieure est `git revert`-able par étape,
le modèle cible restant la référence.

## Suite

Implémentation en **mission dédiée** (étape 1 : dériver la closure du graphe `requires`), à **séquencer** avec
la continuité ADR-054 (dédoublage Spring, étapes 2-4). La prochaine action unique — implémenter ADR-055 étape 1
**ou** poursuivre ADR-054 étape 2 (repointer la CI Spring) — reste à trancher avec l'owner.
