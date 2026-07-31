import {
  buildAuthCookieOptions,
  type CookieAttributes,
  cookieName,
  type CookieEnv,
} from "../../src/features/auth/cookie-config.js";
import type { ServerCookieStore } from "../../src/features/auth/server-cookie-store.js";
import { buildCsrfCookieOptions, csrfCookieName } from "../../src/features/auth/csrf/csrf-cookie.js";
import { generateCsrfToken } from "../../src/features/auth/csrf/csrf-token.js";
import type { AuthHandlerDeps } from "../../src/features/auth/handlers/types.js";
import { InMemoryCookieStore } from "../../src/features/auth/server-cookie-store.js";
import type { MockFetch } from "./api-test-kit.js";

export const TEST_ENV: CookieEnv = "development";
export const TEST_ORIGIN = "http://localhost:3100";
export const TEST_BASE_URL = "https://internal.test";

/** Cookie store de test qui **enregistre les options** posées (pour vérifier HttpOnly/Secure/…). */
export class RecordingCookieStore implements ServerCookieStore {
  private readonly values = new Map<string, string>();
  readonly setOptions = new Map<string, CookieAttributes>();

  get(name: string): string | undefined {
    return this.values.get(name);
  }

  set(name: string, value: string, options: CookieAttributes): void {
    this.values.set(name, value);
    this.setOptions.set(name, options);
  }

  delete(name: string): void {
    this.values.delete(name);
  }

  has(name: string): boolean {
    return this.values.has(name);
  }
}

/** Enveloppe de succès API (forme `{ success, data, timestamp }`). */
export function apiEnvelope<T>(data: T): { success: true; data: T; timestamp: string } {
  return { success: true, data, timestamp: "2026-06-09T12:00:00.000Z" };
}

export function loginPayload(access = "AT", refresh = "RT") {
  return {
    accessToken: access,
    refreshToken: refresh,
    accessTokenExpiresIn: 900,
    refreshTokenExpiresIn: 1209600,
    tokenType: "Bearer",
    user: { id: "u1", email: "user@example.test" },
  };
}

export function refreshPayload(access = "AT2", refresh = "RT2") {
  return {
    accessToken: access,
    refreshToken: refresh,
    accessTokenExpiresIn: 900,
    refreshTokenExpiresIn: 1209600,
    tokenType: "Bearer",
  };
}

export function seedCsrf(store: ServerCookieStore, env: CookieEnv = TEST_ENV): string {
  const token = generateCsrfToken();
  store.set(csrfCookieName(env), token, buildCsrfCookieOptions(env));
  return token;
}

export function seedAuth(
  store: ServerCookieStore,
  access: string,
  refresh: string,
  env: CookieEnv = TEST_ENV,
): void {
  store.set(cookieName("access", env), access, buildAuthCookieOptions(env, 900));
  store.set(cookieName("refresh", env), refresh, buildAuthCookieOptions(env, 1209600));
}

export function makeDeps(
  store: ServerCookieStore,
  fetchMock: MockFetch,
  overrides?: Partial<AuthHandlerDeps>,
): AuthHandlerDeps {
  return {
    cookieStore: store,
    env: TEST_ENV,
    allowedOrigins: [TEST_ORIGIN],
    fetch: fetchMock,
    baseUrl: TEST_BASE_URL,
    ...overrides,
  };
}

export interface ReqOptions {
  readonly method?: string;
  readonly origin?: string | null;
  readonly referer?: string | null;
  readonly csrf?: string | null;
  readonly requestId?: string;
  readonly jsonBody?: unknown;
  readonly rawBody?: string;
  readonly contentType?: string | null;
}

export function makeRequest(path: string, opts: ReqOptions = {}): Request {
  const headers = new Headers();
  const origin = "origin" in opts ? opts.origin : TEST_ORIGIN;
  if (origin !== null && origin !== undefined) headers.set("origin", origin);
  if (opts.referer) headers.set("referer", opts.referer);
  if (opts.csrf) headers.set("x-csrf-token", opts.csrf);
  if (opts.requestId) headers.set("x-request-id", opts.requestId);

  let body: string | undefined;
  if (opts.rawBody !== undefined) body = opts.rawBody;
  else if (opts.jsonBody !== undefined) body = JSON.stringify(opts.jsonBody);

  const contentType =
    "contentType" in opts ? opts.contentType : body !== undefined ? "application/json" : null;
  if (contentType) headers.set("content-type", contentType);

  const method = opts.method ?? "POST";
  return new Request(`https://web.test${path}`, {
    method,
    headers,
    ...(body !== undefined ? { body } : {}),
  });
}
