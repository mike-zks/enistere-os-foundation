/**
 * Preuve de résolution À LA COMPILATION des paquets clients officiels.
 *
 * Imports de TYPES uniquement : aucune valeur n'est importée, donc le `.js` émis est vide —
 * aucun import runtime, aucun appel réseau. Si `@enistere/api-contracts` ou
 * `@enistere/api-client-fetch` ne résolvaient pas, `tsc -p tsconfig.test.json` échouerait.
 *
 * Ce fichier n'est pas un test (`*.fixture.ts`) : sa compilation EST la vérification.
 */
import type { ApiPaths, ApiSchemas, ApiErrorResponse } from "@enistere/api-contracts";
import type { EnistereApiClientOptions, AuthTokens } from "@enistere/api-client-fetch";

export type ApiContractsResolves = ApiPaths;
export type ApiSchemaNamesResolve = keyof ApiSchemas;
export type ApiErrorResolves = ApiErrorResponse;
export type ApiClientOptionsResolve = EnistereApiClientOptions;
export type AuthTokensResolve = AuthTokens;
