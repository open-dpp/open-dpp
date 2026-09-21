import { createHash, randomBytes } from "node:crypto";
import type { INestApplication } from "@nestjs/common";
import request from "supertest";
import { AUTH_PATH } from "./oauth-provider.test-app";
import { TEST_TRUSTED_CLIENT } from "./trusted-client.test-env";

/** The issuer of the test instance: the better-auth mount on OPEN_DPP_URL (v2 is the latest API version). */
export const ISSUER = "http://localhost:3000/api/v2/auth";

export const TEST_REDIRECT_URI = TEST_TRUSTED_CLIENT.redirectUris[0];

/** BetterAuthHelper's default password, for sign-ins through the HTTP seam. */
export const TEST_PASSWORD = "password1234";

export const DEFAULT_AUTHORIZE_PARAMS = {
  response_type: "code",
  scope: "openid profile email offline_access open-dpp:api",
  state: "state-123",
  nonce: "nonce-456",
  code_challenge_method: "S256",
} as const;

export interface PkcePair {
  verifier: string;
  challenge: string;
}

/** RFC 7636 S256 pair, as the Trusted Client generates it per authorize request. */
export function createPkcePair(): PkcePair {
  const verifier = randomBytes(32).toString("base64url");
  const challenge = createHash("sha256").update(verifier).digest("base64url");
  return { verifier, challenge };
}

/** The Trusted Client's authorize request; every parameter can be overridden. */
export function authorizeQuery(
  pkce: PkcePair,
  overrides: Record<string, string> = {},
): URLSearchParams {
  return new URLSearchParams({
    client_id: TEST_TRUSTED_CLIENT.clientId,
    redirect_uri: TEST_REDIRECT_URI,
    ...DEFAULT_AUTHORIZE_PARAMS,
    code_challenge: pkce.challenge,
    ...overrides,
  });
}

/** GET /oauth2/authorize as a browser fetch: every redirect comes back as `200 { redirect, url }`. */
export function authorize(app: INestApplication, query: URLSearchParams, cookie?: string) {
  const pending = request(app.getHttpServer())
    .get(`${AUTH_PATH}/oauth2/authorize?${query}`)
    .set("Accept", "application/json");
  return cookie ? pending.set("Cookie", cookie) : pending;
}

/** What a page sends back as `oauth_query`: everything after the `?` of the page URL the provider redirected to. */
export function signedQueryOf(pageUrl: string): string {
  const index = pageUrl.indexOf("?");
  if (index === -1) {
    throw new Error(`Expected a signed query in ${pageUrl}`);
  }
  return pageUrl.slice(index + 1);
}

/** POST /sign-in/email with the pending request attached, as the sign-in page does. */
export function signInWithOAuthQuery(
  app: INestApplication,
  credentials: { email: string; password: string },
  oauthQuery: string,
) {
  return request(app.getHttpServer())
    .post(`${AUTH_PATH}/sign-in/email`)
    .set("Accept", "application/json")
    .send({ ...credentials, oauth_query: oauthQuery });
}

export interface CodeExchange {
  code: string;
  verifier: string;
  /** Sent by the Trusted Client to obtain a JWT access token (otherwise the token is opaque). */
  resource?: string;
}

/** POST /oauth2/token with client_secret_basic, as the Trusted Client's server does. */
export function exchangeCode(app: INestApplication, { code, verifier, resource }: CodeExchange) {
  const basic = Buffer.from(
    `${TEST_TRUSTED_CLIENT.clientId}:${TEST_TRUSTED_CLIENT.clientSecret}`,
  ).toString("base64");
  return request(app.getHttpServer())
    .post(`${AUTH_PATH}/oauth2/token`)
    .set("Authorization", `Basic ${basic}`)
    .type("form")
    .send({
      grant_type: "authorization_code",
      code,
      redirect_uri: TEST_REDIRECT_URI,
      code_verifier: verifier,
      ...(resource ? { resource } : {}),
    });
}

/** Payload of a JWT without signature verification: enough to assert claims in specs. */
export function decodeJwtPayload(token: string): Record<string, unknown> {
  const [, payload] = token.split(".");
  if (!payload) {
    throw new Error("Not a JWT");
  }
  return JSON.parse(Buffer.from(payload, "base64url").toString("utf8"));
}

export interface Tokens {
  access_token: string;
  token_type: string;
  expires_in: number;
  scope: string;
  id_token?: string;
  refresh_token?: string;
}

export interface TokenRequest {
  /** The authorize `scope`; the default asks for every scope of the Trusted Client. */
  scope?: string;
  /** `resource` of the code exchange; `null` omits it, so the provider issues an opaque token. */
  resource?: string | null;
}

/**
 * The Trusted Client's flow up to the tokens, in three calls: authorize as a browser
 * fetch, sign-in with the signed query, code exchange with `client_secret_basic` and
 * (by default) `resource: ISSUER`, so the access token is a JWT.
 */
export async function obtainTokens(
  app: INestApplication,
  credentials: { email: string; password: string },
  { scope, resource = ISSUER }: TokenRequest = {},
): Promise<Tokens> {
  const pkce = createPkcePair();
  const { body: pending } = await authorize(app, authorizeQuery(pkce, scope ? { scope } : {}));
  if (typeof pending?.url !== "string") {
    throw new Error(`Authorize did not redirect: ${JSON.stringify(pending)}`);
  }
  const { body: resumed } = await signInWithOAuthQuery(
    app,
    credentials,
    signedQueryOf(pending.url),
  );
  const code =
    typeof resumed?.url === "string" ? new URL(resumed.url).searchParams.get("code") : null;
  if (!code) {
    throw new Error(`Sign-in did not yield a code: ${JSON.stringify(resumed)}`);
  }
  const response = await exchangeCode(app, {
    code,
    verifier: pkce.verifier,
    ...(resource ? { resource } : {}),
  });
  if (response.status !== 200) {
    throw new Error(`Token exchange failed: ${response.status} ${JSON.stringify(response.body)}`);
  }
  return response.body;
}
