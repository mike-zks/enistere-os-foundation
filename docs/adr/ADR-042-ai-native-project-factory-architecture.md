# ADR-042 — Enistere OS Foundation devient une Project Factory AI-native

- Statut : Validé
- Date : 2026-07-18
- Décideur : Owner Foundation

## Contexte

La structure historique mélange starters applicatifs et fonctions transverses sous `cores/`. Elle crée
des recouvrements entre `docs/` et Documentation, entre prompts/AI/Quality, et traite le Cloud ou le design
system comme des applications indépendantes. Elle ne fournit aucun générateur dans `tools/` et ne prouve
pas encore la finalité industrielle de la Foundation.

## Décision

La Foundation devient une usine de projets pilotée par un blueprint neutre et une CLI `enistere`.

- six starters indépendants : NestJS, Spring Boot, Next.js, Angular, React Native, Flutter ;
- Factory : génération déterministe, orchestration IA, policies et templates ;
- capability packs : responsabilités transverses sélectionnables ;
- deployment packs : local et staging générés avec le projet ;
- packages : contrats, clients et design system versionnés ;
- une seule couche documentaire centrale.

Les agents locaux proposent et exécutent uniquement après validation humaine. Ils ne détiennent aucune
autorité de release et ne modifient jamais directement `main`.

## Blueprint

Le blueprint neutre est la source de vérité pour la topologie, les stacks, le domaine CRUD, les rôles,
les capacités, les environnements et les gates. Une API est obligatoire ; Web et Mobile sont optionnels.
Le socle `base` est obligatoire, les autres capacités sont sélectionnables.

## Compatibilité

La migration change les chemins du monorepo mais préserve les noms de packages, les contrats OpenAPI et
les comportements publics V1. Toute rupture future suit SemVer et fournit un guide de migration.

## Conséquences

- `cores/` disparaît après migration ;
- Cloud, AI, Quality, Docs et UI Kit ne portent plus le statut de core ;
- les workflows et gates utilisent les nouveaux chemins ;
- une capacité n'est développée que si elle répond à un blueprint, un projet golden ou un besoin projet ;
- `foundation-v2.0.0` exige une génération hors dépôt et un smoke réel.

## Alternatives rejetées

- conserver la taxonomie actuelle et ajouter seulement des documents de composition ;
- créer un second dépôt V2 et archiver la Foundation ;
- laisser un backend framework devenir la source canonique de tous les contrats ;
- rendre l'IA obligatoire pour toute génération.
