# Guide GHCR — images Enistere (Cloud Core 5)

> Comment les images sont **construites** et **publiées** sur GitHub Container Registry (GHCR), comment les
> retrouver et les utiliser. **L'image ne déploie rien** : elle est seulement construite et stockée.

## Images produites

| Image | Source | Contexte de build | Exécution |
|---|---|---|---|
| `ghcr.io/<owner>/<repo>/api-nestjs` | `cores/api-nestjs/Dockerfile` | `cores/api-nestjs/` | NestJS, non-root, `node dist/main.js`, port 3000 |
| `ghcr.io/<owner>/<repo>/web-nextjs` | `cores/web-nextjs/Dockerfile` | **racine** du monorepo | Next.js **standalone**, non-root, `node cores/web-nextjs/server.js`, port 3000 |

`<owner>/<repo>` = `github.repository` (minuscules forcés). Multi-stage : un stage `build` (deps complètes,
`prisma generate` / `next build`) puis un stage `runtime` minimal (deps de prod, artefacts, **aucun secret**).

## Quand les images sont-elles poussées ?

- **Pull request** : les images sont **construites** (vérifie qu'elles compilent) **mais NON poussées**
  (`push: false`, pas de login GHCR).
- **Push sur `main`** : login GHCR (`GITHUB_TOKEN`) → **build + push**.

Workflow : `.github/workflows/registry-ci.yml` (job `images`, matrice api/web).

## Tags (immuables, pas de `latest`)

- **`sha-<short>`** — toujours (référence immuable du commit).
- **`main-<short>`** — sur `main`.
- **`pr-<n>`** — build de PR (construit, **non poussé**).
- **`latest` n'est JAMAIS généré** (`flavor: latest=false`). Ne jamais désigner « la prod » par un tag mobile.

Labels OCI ajoutés (`docker/metadata-action`) : `source`, `revision`, `created`, `title`, `description`.

## Authentification

Uniquement le **`GITHUB_TOKEN`** automatique de l'exécution (`permissions: packages: write`, login
**conditionnel** sur push `main`). **Aucun PAT, aucun `GHCR_TOKEN`, aucun secret custom.**

## Retrouver / utiliser une image

```bash
# Lister : page du dépôt GitHub → onglet "Packages" → api-nestjs / web-nextjs.
# Tirer une image (repo public : pas de login requis pour le pull) :
docker pull ghcr.io/<owner>/<repo>/api-nestjs:sha-<short>
docker pull ghcr.io/<owner>/<repo>/web-nextjs:main-<short>

# Lancer (exemple — la config réelle relève du déploiement, hors périmètre) :
#   l'API a besoin de DATABASE_URL, JWT_*, S3_* au RUNTIME (jamais dans l'image) ;
#   le Web lit API_INTERNAL_URL/WEB_ALLOWED_ORIGINS au runtime (NEXT_PUBLIC_* sont figés au build).
docker run --rm -e PORT=3000 ghcr.io/<owner>/<repo>/web-nextjs:sha-<short>
```

> **Repo public** : les images publiées sont **publiques et gratuites**. **Repo privé** : quota de stockage/
> trafic GHCR limité sur les plans gratuits ; le pull nécessite une authentification.

## Contraintes & limites

- **Migrations Prisma** : **non** exécutées au build d'image ; elles relèveront du runtime/déploiement (futur).
- **`NEXT_PUBLIC_*`** : inlinés au `next build` → **non modifiables** après build. L'image actuelle ne fige
  **aucune** URL d'API (build indépendant de l'API). Pour un déploiement avec API publique côté navigateur, il
  faudra soit builder par environnement, soit n'utiliser que le rendu serveur (`API_INTERNAL_URL`, runtime).
- **Pas de déploiement** dans cette chaîne : l'image est stockée, point. Le déploiement (environnements
  protégés, rollback) est le **niveau 4 complet**, futur.
- **Durcissement futur** : scan de vulnérabilité d'image, signature/provenance (cosign/SLSA), SHA-pinning des
  actions Docker, semver/release, rétention automatisée.
