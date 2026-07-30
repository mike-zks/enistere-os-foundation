import { ApiClientError } from "@enistere/api-client-fetch";
import assert from "node:assert/strict";
import { test } from "node:test";

import { errorResponse, jsonError, jsonOk } from "../src/features/auth/http/web-response.js";

const http = (status: number) => ApiClientError.fromHttp(status, undefined, null);

async function statusAndBody(response: Response): Promise<{ status: number; body: Record<string, unknown> }> {
  return { status: response.status, body: (await response.json()) as Record<string, unknown> };
}

test("mapping des statuts API → BFF", async () => {
  const cases: Array<[ApiClientError, number]> = [
    [http(400), 400],
    [http(401), 401],
    [http(403), 403],
    [http(409), 409],
    [http(413), 413],
    [http(429), 429],
    [http(500), 502],
    [ApiClientError.network("x", null), 502],
    [ApiClientError.timeout(null), 504],
  ];
  for (const [error, expected] of cases) {
    const { status, body } = await statusAndBody(errorResponse(error, "rid-1"));
    assert.equal(status, expected);
    assert.equal(body.success, false);
    assert.equal(typeof body.errorCode, "string");
    assert.equal(body.requestId, "rid-1");
  }
});

test("aucune cause/stack/détail brut dans le corps d'erreur", async () => {
  const error = new ApiClientError({
    kind: "http",
    message: "RAW API MESSAGE",
    status: 401,
    errorCode: "INTERNAL_CODE",
    details: { secret: "LEAK" },
    requestId: "rid",
  });
  const { body } = await statusAndBody(errorResponse(error, "rid"));
  const serialized = JSON.stringify(body);
  assert.ok(!serialized.includes("LEAK"));
  assert.ok(!serialized.includes("RAW API MESSAGE"));
  assert.ok(!serialized.includes("stack"));
});

test("erreur inconnue → 500 générique", async () => {
  const { status, body } = await statusAndBody(errorResponse(new Error("boom"), "rid"));
  assert.equal(status, 500);
  assert.ok(!JSON.stringify(body).includes("boom"));
});

test("en-têtes no-store sur les réponses", () => {
  const ok = jsonOk({ x: 1 }, { requestId: "rid" });
  assert.equal(ok.headers.get("cache-control"), "no-store");
  assert.equal(ok.headers.get("x-request-id"), "rid");
  const err = jsonError(403, "X", "y");
  assert.equal(err.headers.get("cache-control"), "no-store");
});
