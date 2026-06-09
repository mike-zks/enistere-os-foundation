/**
 * Surface publique de `@enistere/api-contracts` — **types-only** (aucun runtime applicatif).
 * Source de vérité : le contrat OpenAPI canonique du API Core (généré, jamais édité à la main).
 */
export type { paths, webhooks, components, operations } from './generated/schema.js';

import type { components, operations, paths } from './generated/schema.js';

/** Aliases stables (sémantique Enistere) au-dessus des types générés. */
export type ApiPaths = paths;
export type ApiOperations = operations;
export type ApiComponents = components;
export type ApiSchemas = components['schemas'];

/** Un schéma nommé du contrat — ex. `SchemaOf<'PublicStoredFileDto'>`. */
export type SchemaOf<Name extends keyof ApiSchemas> = ApiSchemas[Name];

/** Enveloppe d'erreur commune du contrat (`ApiErrorResponseDto`). */
export type ApiErrorResponse = ApiSchemas['ApiErrorResponseDto'];

/** Corps JSON de requête d'une opération (`never` si absent ou non-JSON, ex. multipart). */
export type OperationJsonRequestBody<Op extends keyof operations> = operations[Op] extends {
  requestBody: { content: { 'application/json': infer B } };
}
  ? B
  : never;

/** Corps JSON d'une réponse d'opération pour un statut donné (`never` si sans corps JSON). */
export type OperationJsonResponse<
  Op extends keyof operations,
  Status extends keyof operations[Op]['responses'],
> = operations[Op]['responses'][Status] extends { content: { 'application/json': infer C } } ? C : never;
