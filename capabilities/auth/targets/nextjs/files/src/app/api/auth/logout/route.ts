import { handleLogout } from "../../../../features/auth/handlers/logout-handler.js";
import { buildAuthHandlerDeps } from "../../../../features/auth/server/route-deps.js";

export const dynamic = "force-dynamic";

export async function POST(request: Request): Promise<Response> {
  return handleLogout(request, await buildAuthHandlerDeps());
}
