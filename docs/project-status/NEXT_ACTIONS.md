# Prochaines actions

> Source opérationnelle V2. L'historique détaillé appartient au `CHANGELOG.md` et aux rapports archivés.

## Action unique

**Foundation V2 R1-R7 — Project Factory AI-native**

Objectif : livrer sur une branche dédiée la nouvelle taxonomie, le kernel `enistere`, les adapters
Codex/Claude/Gemini, les manifests des six starters, les premiers capability/deployment packs et les
preuves de génération multi-stack.

Critères de sortie :

- ancien répertoire `cores/` absent ;
- 18 compositions validées par la matrice golden ;
- projet généré hors dépôt avec starters et packages réellement matérialisés ;
- `base`, `auth`, `rbac`, `files` validés avec dépendances explicites ;
- Compose local et staging générés sans secret ;
- agents locaux isolés en worktree avec approbation avant exécution et avant application ;
- gates Factory, docs, packages et six starters verts, hors gates nécessitant un environnement indisponible ;
- PR CI verte avant merge.

## Après R1-R7

1. **R8 — Golden runtime** : installer et démarrer au moins Spring+Angular et NestJS+Next.js+React Native.
2. **R9 — Domain compiler** : transformer le contrat neutre en code CRUD framework-spécifique.
3. **R10 — Project lifecycle** : `enistere upgrade`, migrations de blueprint et compatibilité SemVer.
4. **R11 — Distribution** : publication npm/registry de la CLI et des packages publics.
5. **R12 — Adoption** : temps jusqu'au premier run, taux de génération réussie, overrides et retours projets.

Les nouvelles fonctionnalités transverses sont interdites tant qu'elles ne sont pas demandées par un
blueprint, un golden project ou un projet dérivé réel.
