import { handleGetAuthorization } from "../../../../core/auth/handlers/get-authorization-handler.js";
import { buildAuthHandlerDeps } from "../../../../core/auth/server/route-deps.js";

export const dynamic = "force-dynamic";

export async function GET(request: Request): Promise<Response> {
  return handleGetAuthorization(request, await buildAuthHandlerDeps());
}
