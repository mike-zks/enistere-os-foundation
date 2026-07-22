# Stratégie Git

Politique opérationnelle subordonnée à [`SOURCE_OF_TRUTH.md`](SOURCE_OF_TRUTH.md).

## Règles

- `main` est protégée et toujours livrable.
- Toute modification passe par une branche courte et une PR.
- Les commits sont cohérents, non interactifs et sans artefacts générés inutiles.
- Une PR déclare objectif, périmètre, hors périmètre, risques et gates exécutés.
- Les agents travaillent dans des worktrees dédiés et ne poussent jamais directement sur `main`.
- Aucun secret, `.env` réel, build local ou cache n'est versionné.

## Conventions de branches

`feat/`, `fix/`, `refactor/`, `docs/`, `chore/`, `release/`.

## Archive

Les tags et GitHub Releases sont les archives officielles. Le dépôt actif ne conserve pas les journaux
de missions ni les anciennes architectures documentaires.

## Ruptures

Les breaking changes de blueprint, manifests, CLI ou packages publics exigent une migration et un
incrément SemVer, selon
[`LIFECYCLE_AND_UPGRADE_SPECIFICATION.md`](../specifications/LIFECYCLE_AND_UPGRADE_SPECIFICATION.md).
