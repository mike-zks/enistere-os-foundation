# Architecture cible

```txt
strategy/       décisions et trajectoire
factory/        CLI, moteur déterministe, IA et qualité
starters/       baselines technologiques minimales
capabilities/   overlays fonctionnels par target
packages/       artefacts partagés publiables
deployment/     packs d'exécution et runbooks
examples/       blueprints et goldens
docs/           ADR et documentation opérationnelle
```

## Control plane

La Factory lit un blueprint versionné, valide la combinaison, résout les dépendances, compose les
starters et overlays, produit un lock déterministe puis exécute les gates. Les adapters Codex, Claude
et Gemini sont optionnels et ne modifient pas le moteur déterministe.

## Data plane généré

Un projet dérivé contient ses applications, contrats, infrastructure, documentation utile et lock
Foundation. Il ne dépend pas de `npm link` ni du monorepo source pour fonctionner.

## Contrat de composition

- `base` est intégré à chaque starter ;
- les autres capabilities sont des overlays déclaratifs ;
- les manifests croisent support, dépendances, intégrations et gates ;
- une target `planned` ou `unsupported` bloque la génération ;
- aucun script arbitraire provenant d'un pack n'est exécuté.

Les intégrations centrales sont rendues par des adapters Factory de confiance : modules backend,
providers frontend/mobile, routes, dépendances et variables d'environnement.
