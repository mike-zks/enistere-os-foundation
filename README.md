# Enistere OS Foundation

Enistere OS Foundation est une usine de projets AI-native. Un blueprint neutre choisit une API,
éventuellement un Web et un Mobile, des capacités et des environnements. La CLI `enistere` produit
un monorepo dérivé gouverné, sans faire d'un framework la source de vérité.

## Architecture V2

- `starters/` : six starters indépendants (`nestjs`, `spring`, `nextjs`, `angular`, `react-native`, `flutter`).
- `factory/` : CLI, moteur déterministe, orchestration d'agents locaux, policies et templates.
- `capabilities/` : contrats transverses (`base` est prêt ; les overlays `auth`, `rbac` et `files` sont en extraction).
- `deployment/` : packs d'exécution local et staging intégrés aux projets générés.
- `packages/` : artefacts partagés conservant leurs noms publics (`api-contracts`, `api-client-fetch`, `ui-kit`).
- `strategy/` : direction et règles durables.
- `docs/` : ADR, guides, décisions et rapports. Il n'existe plus de Docs Core séparé.

Cloud, IA et Quality ne sont pas des applications à combiner avec un projet. Le Cloud fournit des
deployment packs, l'IA orchestre la Factory sous approbation humaine, et Quality impose les gates.

## Démarrage

```bash
npm install
npm run factory:test
npm run enistere -- doctor
npm run enistere -- init /tmp/enistere.yaml sample-app
npm run enistere -- plan /tmp/enistere.yaml
npm run enistere -- generate /tmp/enistere.yaml /tmp/sample-app
```

Le fichier `enistere.yaml` utilise actuellement le sous-ensemble YAML compatible JSON. La génération
crée un `enistere.lock`, matérialise les starters et packages sélectionnés, émet le contrat CRUD neutre
et ajoute les packs Compose local/staging. `designSystem` vaut `true` par défaut et peut être désactivé.
Le mode transitoire `baseline-copy` peut inclure des fonctionnalités de la baseline V1 au-delà de la
sélection ; `plan` le déclare et `generate` refuse toute capability qui n'est pas encore `ready`.

## Profils

Une API est obligatoire. Web et Mobile sont optionnels, soit 18 compositions prises en charge :

- API : NestJS ou Spring Boot ;
- Web : aucun, Next.js ou Angular ;
- Mobile : aucun, React Native ou Flutter.

Des exemples sont disponibles dans [`examples/blueprints/`](examples/blueprints/).

## Gouvernance

Les agents Codex, Claude Code et Gemini sont des exécutants locaux interchangeables. Une validation
humaine est requise avant leur exécution puis avant l'application de leur diff. Ils travaillent dans
un worktree temporaire et ne disposent d'aucune autorité de merge, tag ou release.

Sources de vérité :

1. [`strategy/`](strategy/)
2. [`docs/adr/ADR-042-ai-native-project-factory-architecture.md`](docs/adr/ADR-042-ai-native-project-factory-architecture.md)
3. [`docs/project-status/NEXT_ACTIONS.md`](docs/project-status/NEXT_ACTIONS.md)
4. code, tests et gates réels

La baseline et les notes de release V1 restent consultables dans [`docs/project-status/`](docs/project-status/).
