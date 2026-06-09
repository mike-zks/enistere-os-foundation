import { handleLogout } from "../../../../core/auth/handlers/logout-handler.js";
import { buildAuthHandlerDeps } from "../../../../core/auth/server/route-deps.js";

export const dynamic = "force-dynamic";

export async function POST(request: Request): Promise<Response> {
  return handleLogout(request, await buildAuthHandlerDeps());
}
