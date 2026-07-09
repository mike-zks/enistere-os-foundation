import { buildAuthHandlerDeps } from "../../../../../core/auth/server/route-deps.js";
import { handleRestoreFile } from "../../../../../core/files/handlers/restore-file-handler.js";

export const dynamic = "force-dynamic";

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> },
): Promise<Response> {
  const { id } = await context.params;
  return handleRestoreFile(request, await buildAuthHandlerDeps(), id);
}
