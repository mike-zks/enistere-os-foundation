# Web Core Files V1 — Revue globale et durcissement de cohérence

**Session** : Web Core Files 6  
**Date** : 2026-07-09  
**Périmètre** : API NestJS Files + packages + Web BFF (handlers, BFF client) + TanStack Query (hooks, keys) + UI + E2E  
**Verdict** : **Stable avec réserves mineures** (aucun bloquant — V1 livrable)

---

## 1. Fichiers audités

### API NestJS
| Fichier | Statut |
|---------|--------|
| `starters/nestjs/src/files/files.controller.ts` | Revu — OK |
| `starters/nestjs/src/files/files.service.ts` | Revu — OK |

### Packages
| Fichier | Statut |
|---------|--------|
| `packages/api-client-fetch/src/client/files-api.ts` | Revu — OK |

### Web BFF (handlers)
| Fichier | Statut |
|---------|--------|
| `starters/nextjs/src/core/files/handlers/list-files-handler.ts` | Revu — OK |
| `starters/nextjs/src/core/files/handlers/get-file-metadata-handler.ts` | Revu — OK |
| `starters/nextjs/src/core/files/handlers/upload-file-handler.ts` | **Corrigé (D4)** |
| `starters/nextjs/src/core/files/handlers/delete-file-handler.ts` | Revu — OK |
| `starters/nextjs/src/core/files/handlers/create-download-url-handler.ts` | Revu — OK |
| `starters/nextjs/src/core/files/http/files-response.ts` | Revu — OK |

### Web BFF (client + query)
| Fichier | Statut |
|---------|--------|
| `starters/nextjs/src/core/files/client/files-bff-client.ts` | Revu — OK |
| `starters/nextjs/src/core/query/keys/file-keys.ts` | Revu — OK |

### Features (hooks + UI)
| Fichier | Statut |
|---------|--------|
| `starters/nextjs/src/features/files/file-error.ts` | **Corrigé (D3)** |
| `starters/nextjs/src/features/files/file-queries.ts` | Revu — R1/R2 |
| `starters/nextjs/src/features/files/use-file-list.ts` | Revu — R1 |
| `starters/nextjs/src/features/files/use-delete-file.ts` | **Corrigé (D1)** |
| `starters/nextjs/src/features/files/use-upload-file.ts` | **Corrigé (D2)** |
| `starters/nextjs/src/features/files/use-create-download-url.ts` | Revu — OK |
| `starters/nextjs/src/features/files/file-details.tsx` | Revu — OK |
| `starters/nextjs/src/features/files/file-metadata-view.tsx` | Revu — OK |

### Tests
| Fichier | Statut |
|---------|--------|
| `starters/nextjs/test/list-files-handler.test.ts` | Revu — OK (9 tests) |
| `starters/nextjs/test/files-handlers.test.ts` | Revu — OK |
| `starters/nextjs/test/upload-handler.test.ts` | **+1 test D4** |
| `starters/nextjs/test/use-delete-file.test.tsx` | **+1 test D1** |
| `starters/nextjs/test/use-upload-file.test.tsx` | **+1 test D2** |
| `starters/nextjs/test/use-create-download-url.test.tsx` | Mis à jour (D3) |

---

## 2. Défauts corrigés

### D1 — Cache invalidation : delete ne rafraîchissait pas la liste

**Fichier** : `src/features/files/use-delete-file.ts`  
**Symptôme** : `useDeleteFile.onSuccess` supprimait `fileKeys.detail(id)` mais laissait `fileKeys.list(...)` stale. Avec `staleTime=0` par défaut, le bug était masqué par le remontage du composant (navigation vers `/protected`). Il se manifeste dès qu'une page composite montre liste + détails simultanément.  
**Correction** : ajout de `void queryClient.invalidateQueries({ queryKey: fileKeys.all })` dans `onSuccess`.  
**Test ajouté** : `use-delete-file.test.tsx` — "succès : fileKeys.list invalidé après suppression"

### D2 — Cache invalidation : upload n'invalidait rien

**Fichier** : `src/features/files/use-upload-file.ts`  
**Symptôme** : `useUploadFile` n'avait aucun `onSuccess`. Après un upload réussi, la liste visible restait identique jusqu'au prochain remontage du composant (staleTime=0). Sur une page composite sans démontage, la liste n'était jamais mise à jour.  
**Correction** : ajout de `useQueryClient` + `onSuccess: () => void queryClient.invalidateQueries({ queryKey: fileKeys.all })`.  
**Test ajouté** : `use-upload-file.test.tsx` — "succès : fileKeys.list invalidé après upload"

### D3 — Message 409 ambigu dans classifyFileError

**Fichier** : `src/features/files/file-error.ts`  
**Symptôme** : Le message 409 était "Ce fichier n'est pas téléchargeable." — sémantiquement correct pour `download-url`, mais affiché tel quel en contexte de suppression (409 = NOT_DELETABLE). L'utilisateur voyait "non téléchargeable" lorsqu'il tentait de supprimer.  
**Correction** : message neutre → "Cette action n'est pas disponible pour ce fichier."  
**Test mis à jour** : `use-create-download-url.test.tsx` — assertion sur "disponible" au lieu de "téléchargeable"

### D4 — Upload 409 renvoyait errorCode "NOT_DOWNLOADABLE"

**Fichier** : `src/core/files/handlers/upload-file-handler.ts`  
**Symptôme** : Le handler d'upload laissait passer le 409 API (quota dépassé) dans `filesErrorResponse`, qui renvoyait le code générique `NOT_DOWNLOADABLE` — sémantiquement faux pour une erreur de quota.  
**Correction** : catch explicite `ApiClientError` 409 avant `filesErrorResponse`, retourne `QUOTA_EXCEEDED`.  
**Test ajouté** : `upload-handler.test.ts` — "upload : 409 API (quota) → 409 QUOTA_EXCEEDED (jamais NOT_DOWNLOADABLE)"

---

## 3. Réserves (non bloquantes — documentées, non corrigées)

### R1 — staleTime=0 sur fileListQueryOptions (refetch à chaque montage)

**Impact** : chaque remontage du composant liste déclenche un refetch HTTP, même si les données sont fraîches. Non bloquant (cohérence garantie), mais coûteux en navigation rapide entre pages.  
**Recommandation V2** : staleTime ~5 s + invalidation explicite après mutations (déjà en place avec D1/D2).

### R2 — staleTime=30s sur fileMetadataQueryOptions (admin quarantaine non visible)

**Impact** : si un admin met un fichier en quarantaine, l'utilisateur continue de voir les métadonnées "ACTIVE" pendant 30 secondes. Acceptable en V1 (pas d'admin BFF côté Web).  
**Recommandation** : sans BFF admin, ce délai ne crée pas d'incohérence UI visible (aucun contrôle de quarantaine exposé côté utilisateur).

### R3 — Navigation post-delete vers /protected et non /protected/files

**Impact** : après suppression, l'utilisateur arrive sur la page d'accueil protégée, pas sur la liste fichiers. Comportement intentionnel dans l'implémentation actuelle (liste fichiers = Files 4). Non bloquant.  
**Recommandation** : corriger la navigation dans `FileDetailsWithNav` quand la liste fichiers sera l'écran principal.

### R4 — URL signée transitoire dans le DOM (ancre temporaire)

**Impact** : `useCreateDownloadUrl.mutationFn` crée une ancre `<a>` dans le DOM pour déclencher le téléchargement, visible brièvement dans la mémoire JS. L'URL n'est jamais mise en cache QueryCache ni dans les logs.  
**Verdict** : acceptable par design (ADR-005 respecté, URL jamais persistée ni loguée).

### R5 — Quarantaine/restauration admin non connectées au cache Web BFF

**Impact** : les endpoints `/quarantine` et `/restore` de l'API existent mais n'ont pas de BFF handler côté Web. Si une action admin extérieure modifie le statut d'un fichier, le cache Web n'est pas notifié.  
**Verdict** : hors périmètre V1 (pas de BFF admin). À traiter dans la session "Admin BFF".

### R6 — Pagination sans staleTime différencié

**Impact** : navigation rapide entre pages de la liste (`?offset=0`, `?offset=20`) provoque un refetch à chaque aller-retour. Combiné avec R1.  
**Recommandation V2** : staleTime uniforme sur `fileListQueryOptions` + invalidation via `fileKeys.all` (D1/D2 déjà en place).

---

## 4. Vérifications exécutées

| Vérification | Résultat |
|--------------|----------|
| `npm run typecheck --workspace=@enistere/web-nextjs` | ✅ Aucune erreur |
| `npm run lint --workspace=@enistere/web-nextjs` | ✅ Aucune erreur |
| `NODE_ENV=test npm run test --workspace=@enistere/web-nextjs` | ✅ 393/393 pass |
| `npm run build --workspace=@enistere/web-nextjs` | ✅ Build OK (15 routes) |
| `npm audit --workspace=@enistere/web-nextjs` | ✅ 0 vulnérabilités |
| `git diff --check` | ✅ Aucun whitespace |

---

## 5. Sécurité — Conformité ADR-005/ADR-007

Tous les points du périmètre interdit ont été vérifiés et respectés :

- Aucun token exposé côté client (Bearer uniquement server-side, cookies HttpOnly)
- Aucun proxy générique (handlers ciblés par endpoint)
- Aucun champ interne affiché : `storageKey`, `bucket`, `checksum`, `ownerId`, URL signée, `token` absents de toutes les réponses Web
- Same-origin + `credentials: "include"` + aucun header `Authorization` côté client
- Aucun CSRF requis pour GET (list, metadata) — CSRF requis pour POST/DELETE
- L'API reste l'autorité sur les permissions (`files.read`, `files.upload`, `files.delete`, `files.download`)
- Aucun token/URL signée/champ interne dans les logs ni les snapshots de test

---

## 6. Verdict détaillé

**Files Web/API V1 est stable avec réserves mineures.**

Les 4 défauts corrigés (D1–D4) étaient des incohérences de cohérence interne (cache, codes d'erreur, messages) sans impact sécurité. Les 6 réserves (R1–R6) sont des optimisations ou des limitations de périmètre documentées, non bloquantes pour une livraison V1.

---

## 7. Prochaines actions recommandées

| Priorité | Session suggérée | Décision nécessaire |
|----------|------------------|---------------------|
| 1 | Admin BFF (quarantaine/restauration) | BFF admin séparé ? |
| 2 | Cloud staging réel | Déploiement staging GCP/AWS |
| 3 | Mobile RN31 | Prochaine itération mobile |
| 4 | UI Kit 5 | Composants design system |
| 5 | V2 Cache (staleTime + pagination) | Après mesure en staging |
