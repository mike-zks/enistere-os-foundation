# Files Web — métadonnées & téléchargement sécurisé (Files 1)

> Première intégration **Files** du Web Core, en **lecture seule** : consulter les métadonnées **publiques**
> d'un fichier possédé et obtenir une **URL signée courte** pour le télécharger directement depuis le
> stockage objet. **Aucun upload, aucune suppression, aucune administration.** Web Core reste
> `IMPLEMENTATION_PARTIELLE`.

## 1. Architecture (BFF ciblé, jamais un proxy générique)

```
Navigateur
  → BFF GET  /api/files/:id              → client serveur authentifié read-only → API GET  /files/:id
  → BFF POST /api/files/:id/download-url → Origin/Referer + CSRF → client serveur writable → API POST /files/:id/download-url
  → {url, expiresAt} → téléchargement DIRECT navigateur → stockage objet (MinIO/S3)
```

Le **seul** paramètre métier accepté est l'**UUID** du fichier dans le chemin. Le BFF **n'accepte jamais** :
URL de destination, path API arbitraire, bucket, storageKey, TTL, ni transmission libre d'en-têtes.

## 2. Routes BFF

| Route | Méthode | Auth | CSRF | Client serveur | `no-store` |
|---|---|---|---|---|---|
| `/api/files/:id` | GET | session | non (GET) | **read-only** (aucun refresh au rendu) | ✓ |
| `/api/files/:id/download-url` | POST | session | **oui** + Origin/Referer | **writable** (réutilise le refresh BFF existant) | ✓ |

Ordre de garde : **méthode (405) → validation UUID (400, aucun appel API) → [POST : Origin/Referer + CSRF
(403, aucun appel API)] → API**. operationId consommés : `files_getMetadata`, `files_createDownloadUrl`
(contrats OpenAPI, via la façade `@enistere/api-client-fetch` — aucun DTO recopié).

## 3. Permission & ownership : l'API est l'autorité

- Permissions **`files.read`** (métadonnées) et **`files.download`** (URL signée) sont vérifiées **par l'API**.
- **Ownership** requis : un non-propriétaire (même avec la permission) reçoit **404** (anti-énumération :
  absent / autre propriétaire / soft-deleted → 404 **indistinct** ; le BFF ne distingue pas ces cas).
- Le Web n'**autorise** rien : `useAuthorization` ne sert qu'à **masquer/désactiver** le bouton de
  téléchargement (affichage conditionnel). L'API revérifie et fait foi (403/404/409).

## 4. Métadonnées publiques (jamais de champ interne)

`PublicStoredFileDto` exposé : `id`, `originalName` (UX, non fiable), `mimeType`, `extension`, `size`
(chaîne décimale → `formatFileSize` en **BigInt**), `category`, `status`, `visibility`, `createdAt`,
`updatedAt`. **Jamais** : `storageKey`, `bucket`, `checksum`, `ownerId`, métadonnée interne, credentials.

## 5. URL signée (donnée temporaire sensible)

Réponse **minimale** `{ url, expiresAt }` — rien d'autre (ni bucket/storageKey/checksum/TTL/headers AWS).
L'URL contient nécessairement une **signature** (et souvent la clé) : elle n'est autorisée **que** dans la
réponse de création et la requête **directe** au stockage. Elle **n'est jamais** :

- mise en cache de query (la `mutationFn` retourne `void` ; l'URL est consommée puis abandonnée) ;
- journalisée, ni placée dans une erreur, une clé de query, `localStorage`/`sessionStorage`, analytics.

## 6. CSRF & Origin/Referer

`POST /download-url` est une **mutation sensible** → protégée par **CSRF double-submit** + **Origin/Referer**
fail-closed (mêmes garanties que login/refresh/logout). `GET /:id` (non mutatif) **n'exige pas** de CSRF.

## 7. Auth read-only vs writable

- Métadonnées (GET) : client **read-only** (`enableRefresh:false`) → un access expiré ⇒ **401**, **aucun
  refresh** au rendu.
- URL signée (POST) : client **writable** → réutilise le **mécanisme BFF existant** (sur 401, un seul refresh
  coordonné côté `api-client-fetch` puis rejeu ; sinon 401). **Aucune seconde stratégie Auth.**

## 8. Cache (TanStack Query)

`fileKeys.all = ["files"]`, `fileKeys.detail(id) = ["files","detail",id]` — disjoints de `authKeys`/
`healthKeys` ; **jamais** d'URL signée/token dans une clé. `fileMetadataQueryOptions` : `enabled` seulement
si UUID valide, `retry:false`, `staleTime` court. **L'URL signée n'a aucune query** (mutation only).

## 9. États UI (réutilisés, Web UI 1)

`LoadingState` ; **`EmptyState`** « Fichier introuvable » (404, **non révélateur**) ; **`ForbiddenState`**
(403, permission **non révélée**) ; `UnauthorizedState` (401) ; **`ServiceUnavailableState`** (503 stockage /
réseau) ; `ErrorState` (générique, `requestId`). Succès : `PageHeader` + `Card`. **Aucun nouveau composant
UI Kit.** Distinction stricte **404 ≠ 403 ≠ 503**.

## 10. Téléchargement (déclenchement)

URL **validée** (`isSafeDownloadUrl` : https ; http toléré seulement en dev/test MinIO ; `javascript:`/`data:`
refusés) → **ancre temporaire** `rel="noopener noreferrer"`, clic, retrait. La signature n'est jamais
reconstruite. Limite : l'attribut `download` n'est pas garanti en cross-origin ; le `Content-Disposition`
est gouverné par S3/MinIO. Anti-double-clic (verrou `useRef`).

## 11. Sécurité (synthèse)

`no-store` sur les deux réponses ; erreurs **génériques** (jamais la réponse API brute) ; mapping distinct
**400/401/403/404/409/429/500/503/network/timeout/invalid** ; aucun champ interne ; URL signée jamais
journalisée/persistée ; le build reste **indépendant de l'API**.

## 12. Preuve réelle (API NestJS + MinIO jetables)

Parcours rejoué de bout en bout (utilisateurs + fichier VALIDATED **éphémères**, environnement démonté) :
upload (auto-VALIDATED + objet MinIO) → propriétaire `GET /api/files/:id` **200** (champs publics, no-store,
aucun champ interne) → `download-url` **200** `{url,expiresAt}` → **téléchargement réel MinIO** (octets ==
upload, `Content-Type` image/png) → **sans permission → 403** → **non-propriétaire (avec permission) → 404**
→ **quarantaine → 409** → **objet supprimé → 503** → **logout → 401** + page privée → redirection `/login`.
Scan : aucune `storageKey`/`bucket`/`X-Amz-Signature`/credentials dans les métadonnées, logs ou bundle.

## 13. Hors périmètre (Files 1)

Upload, FormData, suppression, quarantaine/restauration **côté Web**, liste/recherche/pagination, galerie,
prévisualisation, streaming/proxy du fichier par Next.js, mise en cache/persistance de l'URL signée, CDN,
partage public, administration Files. ADR-007 n'est **que partiellement** consommé côté Web (lecture/
téléchargement uniquement).
