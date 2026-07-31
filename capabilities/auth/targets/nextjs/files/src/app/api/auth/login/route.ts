import { handleLogin } from "../../../../features/auth/handlers/login-handler.js";
import { buildAuthHandlerDeps } from "../../../../features/auth/server/route-deps.js";

export const dynamic = "force-dynamic";

export async function POST(request: Request): Promise<Response> {
  return handleLogin(request, await buildAuthHandlerDeps());
}
