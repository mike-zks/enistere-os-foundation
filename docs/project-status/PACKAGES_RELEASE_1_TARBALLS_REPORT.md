# Packages Release 1 — GitHub Release tarballs

> Date : 2026-07-18.
> Portée : `@enistere/api-contracts@0.1.0`, `@enistere/api-client-fetch@0.1.0`.
> Canal retenu : **GitHub Release tarballs** (repli gouverné ADR-016).

## 1. Décision d'exécution

La cible principale reste GitHub Packages npm registry. Pour cette première distribution, le canal exécuté
est le repli gouverné **GitHub Release tarballs**, parce qu'il :

- ne nécessite aucun token npm dans le dépôt ;
- produit des artefacts attachés à un tag GitHub immuable ;
- permet à un projet externe d'installer les packages sans `file:` ni `npm link`.

Tag release : `packages-api-typescript-v0.1.0`.

URL release :
`https://github.com/mike-zks/enistere-os-foundation/releases/tag/packages-api-typescript-v0.1.0`.

## 2. Artefacts

| Package | Version | Asset | SHA-256 |
|---|---:|---|---|
| `@enistere/api-contracts` | `0.1.0` | `enistere-api-contracts-0.1.0.tgz` | `598c45536feaa861721d5b5696b92e646f185a3e2b49c26ecd4fd4fb319cad97` |
| `@enistere/api-client-fetch` | `0.1.0` | `enistere-api-client-fetch-0.1.0.tgz` | `546176d57edb4834b8477fad153cd5cf666d9b71e6310045f2b12af23c1680c6` |

Les artefacts sont générés par `npm pack` depuis les manifests `publish-ready`. Ils ne sont pas versionnés
dans Git.

## 3. Installation consommateur

```bash
npm install \
  https://github.com/mike-zks/enistere-os-foundation/releases/download/packages-api-typescript-v0.1.0/enistere-api-contracts-0.1.0.tgz \
  https://github.com/mike-zks/enistere-os-foundation/releases/download/packages-api-typescript-v0.1.0/enistere-api-client-fetch-0.1.0.tgz
```

Les deux tarballs doivent être installés ensemble tant que GitHub Packages npm registry n'est pas le canal
actif, car `@enistere/api-client-fetch` dépend de `@enistere/api-contracts@0.1.0`.

## 4. Vérifications exécutées

```bash
node factory/quality/core/scripts/quality-gates.mjs run packages
npm_config_cache=/tmp/enistere-npm-cache npm pack --workspace=@enistere/api-contracts --pack-destination /tmp/enistere-packages-release-0.1.0
npm_config_cache=/tmp/enistere-npm-cache npm pack --workspace=@enistere/api-client-fetch --pack-destination /tmp/enistere-packages-release-0.1.0
sha256sum /tmp/enistere-packages-release-0.1.0/*.tgz
tar -tzf /tmp/enistere-packages-release-0.1.0/enistere-api-contracts-0.1.0.tgz
tar -tzf /tmp/enistere-packages-release-0.1.0/enistere-api-client-fetch-0.1.0.tgz
npm_config_cache=/tmp/enistere-npm-cache npm install /tmp/enistere-packages-release-0.1.0/enistere-api-contracts-0.1.0.tgz /tmp/enistere-packages-release-0.1.0/enistere-api-client-fetch-0.1.0.tgz
node /tmp/enistere-package-consumer-test/smoke.mjs
```

Résultats :

- `quality-gates packages` : **7/7** ;
- `npm pack` : OK pour les deux packages ;
- contenu tarballs : uniquement `dist/`, `README.md`, `package.json` ;
- installation consommateur externe temporaire : OK ;
- smoke consommateur externe : OK (`@enistere/api-client-fetch` importé par nom public, `/health` public
  sans `Authorization`, `/auth/me` authentifié via `InMemorySessionAdapter`).

## 5. Garde-fous

- aucun `npm publish` ;
- aucun token, `.npmrc`, secret GitHub, workflow ou package-lock ajouté ;
- aucun changement OpenAPI, API runtime, Web, Mobile ou Cloud ;
- aucun artefact `.tgz` versionné ;
- aucune dépendance à Swagger/OpenAPI production.

## 6. Statut après release

ADR-016 progresse : la distribution TypeScript officielle est désormais exécutable via GitHub Release
tarballs. Le canal GitHub Packages npm registry reste la cible principale future.

## 7. Prochaine action recommandée

**Examples Core 2 — mini-stack local documenté** si l'objectif est de continuer à prouver l'adoption sans
publication registry.

**Packages Release 2 — GitHub Packages npm registry** si l'objectif est de basculer du repli tarball vers le
canal principal.
