import { handleGetAuthorization } from "../../../../features/authorization/get-authorization-handler.js";
import { buildAuthHandlerDeps } from "../../../../features/auth/server/route-deps.js";

export const dynamic = "force-dynamic";

export async function GET(request: Request): Promise<Response> {
  return handleGetAuthorization(request, await buildAuthHandlerDeps());
}
