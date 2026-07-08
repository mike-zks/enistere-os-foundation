import { buildAuthHandlerDeps } from "../../../../core/auth/server/route-deps.js";
import { handleUploadFile } from "../../../../core/files/handlers/upload-file-handler.js";

export const dynamic = "force-dynamic";

export async function POST(request: Request): Promise<Response> {
  return handleUploadFile(request, await buildAuthHandlerDeps());
}
