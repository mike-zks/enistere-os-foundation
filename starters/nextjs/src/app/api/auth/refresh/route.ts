import { handleRefresh } from "../../../../core/auth/handlers/refresh-handler.js";
import { buildAuthHandlerDeps } from "../../../../core/auth/server/route-deps.js";

export const dynamic = "force-dynamic";

export async function POST(request: Request): Promise<Response> {
  return handleRefresh(request, await buildAuthHandlerDeps());
}
