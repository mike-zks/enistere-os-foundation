import { buildAuthHandlerDeps } from "../../../features/auth/server/route-deps.js";
import { handleListFiles } from "../../../features/files/handlers/list-files-handler.js";

export const dynamic = "force-dynamic";

export async function GET(request: Request): Promise<Response> {
  return handleListFiles(request, await buildAuthHandlerDeps());
}
