import { handleLogin } from "../../../../core/auth/handlers/login-handler.js";
import { buildAuthHandlerDeps } from "../../../../core/auth/server/route-deps.js";

export const dynamic = "force-dynamic";

export async function POST(request: Request): Promise<Response> {
  return handleLogin(request, await buildAuthHandlerDeps());
}
