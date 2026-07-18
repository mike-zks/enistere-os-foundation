import { handleGetProfile } from "../../../../core/auth/handlers/get-profile-handler.js";
import { buildAuthHandlerDeps } from "../../../../core/auth/server/route-deps.js";

export const dynamic = "force-dynamic";

export async function GET(request: Request): Promise<Response> {
  return handleGetProfile(request, await buildAuthHandlerDeps());
}
