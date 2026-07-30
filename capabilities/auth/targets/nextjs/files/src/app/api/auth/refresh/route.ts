import { handleRefresh } from "../../../../features/auth/handlers/refresh-handler.js";
import { buildAuthHandlerDeps } from "../../../../features/auth/server/route-deps.js";

export const dynamic = "force-dynamic";

export async function POST(request: Request): Promise<Response> {
  return handleRefresh(request, await buildAuthHandlerDeps());
}
