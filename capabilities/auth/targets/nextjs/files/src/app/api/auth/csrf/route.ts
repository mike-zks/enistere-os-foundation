import { handleCsrf } from "../../../../features/auth/handlers/csrf-handler.js";
import { buildAuthHandlerDeps } from "../../../../features/auth/server/route-deps.js";

export const dynamic = "force-dynamic";

export async function GET(request: Request): Promise<Response> {
  return handleCsrf(request, await buildAuthHandlerDeps());
}
