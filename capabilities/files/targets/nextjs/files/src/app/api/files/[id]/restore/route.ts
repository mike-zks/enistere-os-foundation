import { buildAuthHandlerDeps } from "../../../../../features/auth/server/route-deps.js";
import { handleRestoreFile } from "../../../../../features/files/handlers/restore-file-handler.js";

export const dynamic = "force-dynamic";

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> },
): Promise<Response> {
  const { id } = await context.params;
  return handleRestoreFile(request, await buildAuthHandlerDeps(), id);
}
