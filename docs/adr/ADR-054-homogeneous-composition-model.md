# ADR-054 — Modèle de composition homogène des runtimes (source unique)

- Statut : Validé
- Date : 2026-07-23
- Décideur : Owner Foundation

## Contexte

Les 6 runtimes suivent aujourd'hui **deux modèles de composition différents** — une hétérogénéité qui est
elle-même une dette d'architecture (`git status` révèle un `base/` chez 3 runtimes seulement) :

- **NestJS / Next.js / React Native** (modular, **source unique**) : `starters/<runtime>/` **EST** la base
  modulaire ; les capabilities sont des **overlays déclaratifs** (`capabilities/<cap>/targets/<runtime>/`) ;
  l'application complète est **produite par composition**. Aucune app complète écrite à la main.
- **Spring / Angular / Flutter** (bundled-origine, **double représentation**) : un sous-dossier
  `starters/<runtime>/base/` (la base modulaire générée, via `composition.baseSource`) **et** un top-level
  `src/`/`lib/` = **app complète écrite à la main** (auth/rbac/files bundlés), testée directement en CI
  (`api-spring-verify`, `web-angular`).

La double représentation viole le principe « aucune représentation interne concurrente » (mandat §8.1) : les
deux copies **dérivent**. C'est déjà arrivé — après [ADR-048](ADR-048-canonical-api-error-contract.md), le
`base/` Spring émet l'enveloppe d'erreur canonique tandis que le `src/` complet émet encore l'ancienne forme
`{status, code, errors}` : l'app de référence Spring **contredit** le contrat d'erreur canonique.

Analyse directe (2026-07-23) — nature des diffs `base/` ↔ `src|lib` complet :

| Runtime | Diffs | Nature |
|---|---|---|
| Angular | `app.config` (base : log+error ; complet : +auth+refresh), routes, home | par design (base ⊆ complet) |
| Flutter | `dio_client`/`dio_provider` (base sans auth ; complet avec auth/refresh), routes, home | par design (base ⊆ complet) |
| Spring | `OpenApiConfig` (description) | légitime |
| **Spring** | **`ApiError` + `GlobalExceptionHandler`** | **contradiction** (ancien vs canonique) |

## Décision

**Homogénéiser les 6 runtimes sur le modèle modular à source unique** (celui de Nest/Next/RN) :

1. `starters/<runtime>/` (la racine) est **la seule** base modulaire du runtime (`src`/`lib`).
2. Les capabilities sont **toujours** des overlays déclaratifs (`capabilities/<cap>/targets/<runtime>/`).
3. **L'application complète est toujours produite par composition** (base + overlays), **jamais** maintenue à
   la main en double.
4. **Conséquence structurelle** : **aucun sous-dossier `base/`** sur aucun runtime, **aucune app complète
   dédoublée**. Pour Spring/Angular/Flutter, le contenu de `base/` **remonte à la racine** et le `src/`/`lib/`
   complet dédoublé est **supprimé**.

## Migration (programme ordonné, phasé, avec bloqueurs)

Par runtime bundled (Spring, puis Angular, puis Flutter) :

| Étape | Contenu | Bloqueur / preuve |
|---|---|---|
| 1 | **Compléter les overlays** de capabilities (auth/rbac/**files**) pour que `base + overlays` reproduise ce que l'app complète couvre | `files` = `planned` sur Spring/Angular/Flutter → à modulariser |
| 2 | Repointer la **CI** (`api-spring-verify`, `web-angular`, flutter) sur une **composition générée** (base+overlays) au lieu de l'app complète écrite à la main | golden de la composition complète vert |
| 3 | **Supprimer** l'app complète dédoublée ; promouvoir `base/` → racine du runtime ; retirer `composition.baseSource` | goldens `<runtime>-*` verts après remontée |
| 4 | **Fitness function** de garde : aucun `base/` résiduel + aucune double représentation (et, pendant la migration, cohérence du contrat d'erreur `base/` ↔ complet) | `factory:test` |

**Interim** : tant que l'app complète Spring existe, sa **contradiction d'erreur** (étape 0) est réconciliée
sur l'enveloppe plate canonique — ou disparaît avec elle à l'étape 3, selon l'ordre retenu.

## Conséquences positives

- **une seule représentation par runtime** (§8.1), homogène sur les 6 ; **zéro dérive** possible ;
- modèle mental unique (« le produit = la composition ») ; suppression de la maintenance en double ;
- la parité runtime devient structurellement vraie, pas seulement mesurée.

## Coûts et risques

- Programme **multi-PR**, partiellement **bloqué** par la modularisation de `files` (Spring/Angular/Flutter) ;
- déplacer la CI de l'app écrite à la main vers une composition générée doit préserver la couverture (goldens).

## Périmètre

Inclus (décision + plan) : le modèle cible et l'ordre de migration. **Aucune suppression dans cet ADR** —
chaque phase est une mission dédiée validée séparément.

Exclus : l'implémentation des phases (missions ultérieures) ; le renommage `starters/` → `runtimes/`
(orthogonal) ; les capabilities elles-mêmes au-delà de leur modularisation.

## Alternatives rejetées

- **`base/` pour tout le monde** (extraire aussi un `base/` chez Nest/Next/RN) : ajoute de la structure sans
  supprimer la double représentation Spring/Angular/Flutter ; ne résout pas la dérive.
- **Statu quo + garde-fou seul** : accepte la double maintenance ; contraire au §8.1.
- **Réconcilier Spring uniquement** : corrige un symptôme, laisse l'hétérogénéité et la dérive future.

## Tests

Par phase : goldens de la composition concernée verts ; `factory:test` ; fitness function de source unique.

## Rollback

Chaque phase est `git revert`-able indépendamment ; le modèle cible (cet ADR) reste la référence.

## Suite

Phase 1 (première mission) : **modulariser `files` puis compléter les overlays Spring**, condition de la
suppression de l'app Spring dédoublée. Ordre proposé : Spring → Angular → Flutter.
