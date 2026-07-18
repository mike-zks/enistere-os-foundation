# Packages Distribution 2 — Preparation publish-ready sans publication

> Date : 2026-07-17.
> Portee : `packages/api-contracts`, `packages/api-client-fetch`, manifests npm, documentation de statut.
> Statut : **PUBLISH_READY_NON_PUBLIE**.

## 1. Objectif

Rendre les deux packages TypeScript officiels techniquement prets pour une distribution future, sans
publier et sans ajouter de secret, workflow automatique ou changement runtime.

Cette mission applique la decision `PACKAGES_DISTRIBUTION_DECISION.md` : GitHub Packages npm registry
comme cible principale, GitHub Release tarballs comme repli gouverne.

## 2. Changements manifests

| Package | Changement |
|---|---|
| `@enistere/api-contracts` | `private:false`, `publishConfig.registry=https://npm.pkg.github.com`, `publishConfig.access=restricted`, script `pack:dry-run` |
| `@enistere/api-client-fetch` | `private:false`, `publishConfig.registry=https://npm.pkg.github.com`, `publishConfig.access=restricted`, script `pack:dry-run`, dependance interne `@enistere/api-contracts: 0.1.0` |
| Racine | script `pack:dry-run` orchestrant les deux workspaces |

`package-lock.json` est synchronise avec la dependance interne `0.1.0`.

## 3. Verification `npm pack --dry-run`

Le premier essai a echoue dans ce sandbox parce que npm voulait ecrire dans le cache utilisateur
`/home/mintix/.npm`, en lecture seule ici. Le dry-run a ensuite ete rejoue avec un cache temporaire
dans `/tmp`, sans reseau et sans publication :

```bash
npm_config_cache=/tmp/enistere-npm-cache npm run pack:dry-run --workspace=@enistere/api-contracts
npm_config_cache=/tmp/enistere-npm-cache npm run pack:dry-run --workspace=@enistere/api-client-fetch
```

| Package | Tarball dry-run | Taille package | Unpacked | Fichiers | Shasum |
|---|---:|---:|---:|---:|---|
| `@enistere/api-contracts` | `enistere-api-contracts-0.1.0.tgz` | 9.9 kB | 84.8 kB | 10 | `57ebcc53203f2200b04d946ccc49dfdea4019833` |
| `@enistere/api-client-fetch` | `enistere-api-client-fetch-0.1.0.tgz` | 20.6 kB | 78.0 kB | 66 | `094934b85e3d87d564ac3827766bf7f224e3d260` |

Le dry-run confirme que les artefacts incluent uniquement `dist/`, `README.md` et `package.json`,
conformement aux champs `files`.

## 4. Verifications executees

```bash
node factory/quality/core/scripts/quality-gates.mjs run packages
npm_config_cache=/tmp/enistere-npm-cache npm run pack:dry-run --workspace=@enistere/api-contracts
npm_config_cache=/tmp/enistere-npm-cache npm run pack:dry-run --workspace=@enistere/api-client-fetch
npm_config_cache=/tmp/enistere-npm-cache npm run pack:dry-run
node factory/quality/core/scripts/quality-gates.mjs run docs
git diff --check
```

Resultats :

- `quality-gates packages` : **7/7**.
- `api-contracts` : typecheck, build, generate:check, tests OK.
- `api-client-fetch` : typecheck, build, tests OK.
- `pack:dry-run` : OK pour les deux packages avec cache temporaire ; OK aussi via le script racine.
- `quality-gates docs` : **2/2**.
- `git diff --check` : OK.

## 5. Garde-fous respectes

- aucun `npm publish` ;
- aucun token, `.npmrc`, secret GitHub ou workflow ajoute ;
- aucun changement OpenAPI, API runtime, Web, Mobile ou Cloud ;
- aucun changement de version ;
- aucun artefact `.tgz` versionne ;
- aucune publication automatique sur merge.

## 6. Statut apres mission

Les packages restent non publies, mais deviennent **publish-ready** :

- manifests compatibles publication GitHub Packages ;
- relation SemVer interne explicite ;
- contenu distribuable verifie par dry-run ;
- documentation d'usage et de cache restreint ajoutee.

ADR-016 reste **PARTIELLEMENT_IMPLEMENTE** tant que la publication controlee ou l'attachement de tarballs
a une GitHub Release n'a pas ete execute.

## 7. Prochaine mission unique recommandee

**Packages Release 1 — publication controlee ou release tarballs**.

Preconditions :

- choix humain explicite entre GitHub Packages et GitHub Release tarballs pour cette premiere release ;
- permissions GitHub Packages ou droits de release confirmes ;
- aucune modification de contrat non revue ;
- execution des gates packages + docs juste avant publication.

Interdits : publication automatique sur simple merge, token dans le depot, dependance a Swagger production.
