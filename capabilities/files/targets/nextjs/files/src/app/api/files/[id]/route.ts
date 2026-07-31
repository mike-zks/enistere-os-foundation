import { buildAuthHandlerDeps } from "../../../../features/auth/server/route-deps.js";
import { handleDeleteFile } from "../../../../features/files/handlers/delete-file-handler.js";
import { handleGetFileMetadata } from "../../../../features/files/handlers/get-file-metadata-handler.js";

export const dynamic = "force-dynamic";

export async function GET(
  request: Request,
  context: { params: Promise<{ id: string }> },
): Promise<Response> {
  const { id } = await context.params;
  return handleGetFileMetadata(request, await buildAuthHandlerDeps(), id);
}

export async function DELETE(
  request: Request,
  context: { params: Promise<{ id: string }> },
): Promise<Response> {
  const { id } = await context.params;
  return handleDeleteFile(request, await buildAuthHandlerDeps(), id);
}
