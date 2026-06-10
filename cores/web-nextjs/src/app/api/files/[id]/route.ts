import { buildAuthHandlerDeps } from "../../../../core/auth/server/route-deps.js";
import { handleGetFileMetadata } from "../../../../core/files/handlers/get-file-metadata-handler.js";

export const dynamic = "force-dynamic";

export async function GET(
  request: Request,
  context: { params: Promise<{ id: string }> },
): Promise<Response> {
  const { id } = await context.params;
  return handleGetFileMetadata(request, await buildAuthHandlerDeps(), id);
}
