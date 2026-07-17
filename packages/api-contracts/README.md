# @enistere/api-contracts

> **Types OpenAPI canoniques Enistere** — runtime-indépendant. Générés depuis le contrat du API Core
> (ADR-016). Aucune logique HTTP/auth, aucune dépendance React/Next.js/React Native/Angular.
> **Privé / non publié** (version `0.1.0`, phase expérimentale).

## Rôle

Source de types unique pour les clients TypeScript Enistere : `paths`, `components`, `operations`
(et des aliases/helpers). Consommé par [`@enistere/api-client-fetch`](../api-client-fetch) et,
ultérieurement, par les cores Web/Mobile (via les hooks TanStack Query qu'ils maintiennent — ADR-012).

## Source

Contrat canonique : `cores/api-nestjs/openapi/openapi.json` (jamais un serveur HTTP, jamais `/docs`,
jamais une URL de production). Le fichier `src/generated/schema.ts` est **généré** et **ne doit jamais
être édité à la main**.

## Commandes

```bash
npm run generate         # (ré)génère src/generated/schema.ts (déterministe)
npm run generate:check   # échoue (RC=1) si l'artefact suivi diverge du contrat (génère en temp, compare, nettoie)
npm run typecheck        # TypeScript strict
npm run build            # émet dist/ (types + index)
npm run test             # vérifie 14 opérations, formes, absence de champs sensibles
```

## Imports

```ts
import type {
  paths, components, operations,        // types bruts openapi-typescript
  ApiPaths, ApiOperations, ApiComponents, ApiSchemas,
  SchemaOf, ApiErrorResponse,
  OperationJsonRequestBody, OperationJsonResponse,
} from '@enistere/api-contracts';

type File = SchemaOf<'PublicStoredFileDto'>;          // { size: string; category: 'IMAGE' | ...; ... }
type LoginBody = OperationJsonRequestBody<'auth_login'>;
type LoginOk = OperationJsonResponse<'auth_login', 200>;
```

## Garanties

- **Runtime-indépendant** : types uniquement (l'`index.js` émis est quasi vide). `sideEffects: false`.
- **Déterministe** : deux générations produisent un fichier identique ; `generate:check` détecte toute
  divergence contrat↔types.
- **Sans fuite** : aucun modèle Prisma, secret ni champ interne dans les types générés.

## Versionnement

`0.1.0` (pré-1.0, SemVer pré-release). Un changement cassant du contrat (renommage d'`operationId`,
suppression de champ, etc.) entraînera une montée de version coordonnée avec `@enistere/api-client-fetch`.
La détection de breaking changes (oasdiff) relèvera de la CI (ADR-013), hors de ce package.

Distribution cible décidée : **GitHub Packages npm registry** pour le scope `@enistere/*`, avec repli
gouverné par artefacts **GitHub Release** (`npm pack` tarballs). Le package reste non publié tant que la
préparation publish-ready et la publication contrôlée ne sont pas livrées.

## Interdiction

Ne pas modifier `src/generated/schema.ts` à la main. Toute évolution passe par le contrat + `npm run
generate`. Ce package **n'est pas publié** dans cette phase.
