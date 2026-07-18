import { handleCsrf } from "../../../../core/auth/handlers/csrf-handler.js";
import { buildAuthHandlerDeps } from "../../../../core/auth/server/route-deps.js";

export const dynamic = "force-dynamic";

export async function GET(request: Request): Promise<Response> {
  return handleCsrf(request, await buildAuthHandlerDeps());
}
