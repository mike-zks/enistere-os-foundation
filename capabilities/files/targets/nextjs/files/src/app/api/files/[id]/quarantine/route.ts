import { buildAuthHandlerDeps } from "../../../../../core/auth/server/route-deps.js";
import { handleQuarantineFile } from "../../../../../core/files/handlers/quarantine-file-handler.js";

export const dynamic = "force-dynamic";

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> },
): Promise<Response> {
  const { id } = await context.params;
  return handleQuarantineFile(request, await buildAuthHandlerDeps(), id);
}
