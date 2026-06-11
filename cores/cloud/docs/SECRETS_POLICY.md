# Cloud Core — Politique des secrets (cadrage)

> Cadre la gestion des secrets pour la fondation et les futurs déploiements. **Aucun secret n'est créé,
> stocké ni référencé en valeur dans cette mission.** Seuls des **noms** de variables sont cités (jamais de
> valeur). Aligné sur `CORE_SPECIFICATION.md` §28, ADR-005/007/040 et `strategy/07_SECURITY.md`.

## 1. Principes

- **Aucun secret dans Git** (ni en clair, ni en exemple avec valeur réelle). Les fichiers `.env*` réels sont
  **ignorés** (`.gitignore`) ; seuls les `.env.example` (sans valeur) sont versionnés.
- **Aucun secret dans la CI minimale actuelle** : `ci.yml` n'utilise aucun `secrets.*`, aucun token registry.
- **Jamais de secret en `NEXT_PUBLIC_*`** (préfixe exposé au navigateur). Les valeurs serveur (ex.
  `API_INTERNAL_URL`) ne sont **jamais** préfixées `NEXT_PUBLIC_`.
- **Jamais de secret journalisé** (logs API/CI/BFF) ni placé dans une URL, une erreur ou un artefact.
- **Moindre privilège** : un secret n'est lisible que par l'environnement/jobs qui en ont besoin.

## 2. Aujourd'hui (V1)

- La CI **ne consomme aucun secret** (lecture seule, non-déployante).
- Les preuves runtime (API + MinIO) utilisent des **valeurs jetables locales**, hors Git, détruites après
  exécution — **jamais** committées.
- Aucun **GitHub Environment** ni **GitHub Secret** n'est défini par cette mission.
- **Staging manuel (Cloud Core 6)** : les secrets sont fournis **sur le serveur staging** via un fichier
  `.env.staging` **non versionné** (copié depuis `cores/cloud/staging/.env.staging.example`, placeholders
  `CHANGE_ME`). Générer : `openssl rand -base64 48`. **Jamais committé, jamais journalisé.** Les secrets API ne
  sont injectés **que** dans le conteneur API (le compose ne les passe pas au conteneur Web).

## 3. Usage futur — GitHub Environments

Quand des workflows déployants existeront (niveau 4), les secrets seront définis **par environnement**
(`staging`, `production`) via **GitHub → Settings → Environments**, avec :

- **scope par environnement** (un secret `production` n'est pas lisible depuis `staging`/PR) ;
- **protection** (required reviewers, wait timer) sur `production` ;
- **rotation** documentée et périodique ;
- accès **restreint** (admins / déployeurs).

## 4. Noms recommandés (sans valeurs)

Exemples de noms de secrets **futurs** (valeurs **jamais** dans Git) :

```text
DATABASE_URL
REDIS_URL
S3_ENDPOINT
S3_ACCESS_KEY_ID
S3_SECRET_ACCESS_KEY
S3_BUCKET
JWT_ACCESS_SECRET
JWT_REFRESH_SECRET
REFRESH_TOKEN_HASH_SECRET
GHCR_TOKEN        # uniquement si publication d'images (niveau 4, ADR-014)
SMTP_PASSWORD     # si notifications futures
```

> Ces noms sont **indicatifs** et alignés sur les variables déjà utilisées par l'API NestJS (config validée)
> et la cible Cloud. **Aucune valeur** ne doit figurer ici ni ailleurs dans le dépôt.

## 5. Interdictions

- Secret en clair dans un fichier versionné, un commentaire, un test ou un exemple.
- Secret en `NEXT_PUBLIC_*` ou dans un bundle client.
- `echo`/`cat`/log d'une variable sensible dans un job CI ou un script.
- Secret passé en argument de ligne de commande visible dans les logs de process.
- Réutilisation d'un même secret entre `staging` et `production`.

## 6. Procédure en cas d'exposition

1. **Révoquer/roter** immédiatement le secret exposé (provider + GitHub Environment).
2. Invalider les sessions/tokens dérivés si applicable (ex. rotation `JWT_*`/`REFRESH_TOKEN_HASH_SECRET`).
3. Purger l'historique si committé par erreur (réécriture + invalidation), **après** rotation.
4. Vérifier les logs/artefacts pour toute fuite secondaire.
5. Documenter l'incident (post-mortem) et renforcer la prévention (scan de secrets en CI — futur).

## 7. Évolutions futures

Scan de secrets en CI (ex. détection de patterns) ; secrets manager dédié (niveau VF) ; chiffrement des
backups ; provenance/attestations sur les images (niveau 4). **Non implémentés** ici.
