import { buildAuthHandlerDeps } from "../../../../../features/auth/server/route-deps.js";
import { handleCreateDownloadUrl } from "../../../../../features/files/handlers/create-download-url-handler.js";

export const dynamic = "force-dynamic";

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> },
): Promise<Response> {
  const { id } = await context.params;
  return handleCreateDownloadUrl(request, await buildAuthHandlerDeps(), id);
}
