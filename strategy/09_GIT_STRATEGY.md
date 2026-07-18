# Stratégie Git

- `main` est protégée et toujours livrable.
- Toute modification passe par une branche courte et une PR.
- Les commits sont cohérents, non interactifs et sans artefacts générés inutiles.
- Une PR déclare objectif, périmètre, hors périmètre, risques et gates exécutés.
- Les agents travaillent dans des worktrees dédiés et ne poussent pas directement sur `main`.
- Aucun secret, `.env` réel, build local ou cache ne doit être versionné.
- Les tags et GitHub Releases sont les archives officielles ; les journaux de missions ne sont pas
  conservés indéfiniment dans les sources actives.

Conventions de branches : `feat/`, `fix/`, `refactor/`, `docs/`, `chore/`, `release/`.

Les breaking changes de blueprint, manifests, CLI ou packages publics exigent migration et SemVer.
