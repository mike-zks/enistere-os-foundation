import { buildAuthHandlerDeps } from "../../../../features/auth/server/route-deps.js";
import { handleUploadFile } from "../../../../features/files/handlers/upload-file-handler.js";

export const dynamic = "force-dynamic";

export async function POST(request: Request): Promise<Response> {
  return handleUploadFile(request, await buildAuthHandlerDeps());
}
