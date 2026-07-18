# Preuve client OpenAPI — RETIRÉE (migrée vers les packages officiels)

> **Statut : code exécutable retiré.** La preuve `openapi-typescript` + `openapi-fetch` a été
> **validée** (voir le rapport permanent [`../../docs/OPENAPI_CLIENT_PROOF.md`](../../docs/OPENAPI_CLIENT_PROOF.md))
> puis **migrée** vers les packages officiels du monorepo :
>
> - [`packages/api-contracts`](../../../../packages/api-contracts) — `@enistere/api-contracts` (types OpenAPI canoniques)
> - [`packages/api-client-fetch`](../../../../packages/api-client-fetch) — `@enistere/api-client-fetch` (wrapper Fetch typé)

## Pourquoi ce dossier ne contient plus de code

Conformément à la décision de migration (éviter une troisième implémentation divergente), le code
exécutable de la preuve (`src/`, `test/`, `scripts/`, `package.json`, `tsconfig`) a été **supprimé**
après validation des packages officiels :

- builds, typecheck stricts et suites de tests verts sur les deux packages ;
- **preuve LIVE 16/16** ré-exécutée contre une API réelle (PostgreSQL + MinIO) **en important le
  package officiel** `@enistere/api-client-fetch` (et non ce proof) ;
- contrat OpenAPI canonique **inchangé**.

Seul le **rapport permanent** est conservé (valeur historique) :
[`starters/nestjs/docs/OPENAPI_CLIENT_PROOF.md`](../../docs/OPENAPI_CLIENT_PROOF.md).

Pour consommer le client, utiliser les packages officiels ci-dessus (jamais ce dossier).
