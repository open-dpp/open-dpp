// Must stay the first import: it enables the OAuth Provider, with the Trusted Client
// registered for client_secret_post, before the auth module validates env.
import "./trusted-client-post.test-env";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import type { INestApplication } from "@nestjs/common";
import { EventEmitterModule } from "@nestjs/event-emitter";
import request from "supertest";
import { AUTH_BASE_PATH } from "../../auth-base-path";
import { createAuthTestContext } from "./auth.test.context";
import {
  authorize,
  authorizeQuery,
  createPkcePair,
  decodeJwtPayload,
  exchangeCode,
  exchangeCodeWithBodySecret,
  ISSUER,
  type PkcePair,
  postWithBodySecret,
} from "./oauth-flow.test-helpers";
import { TEST_TRUSTED_CLIENT } from "./trusted-client.test-env";

/**
 * The instance of an operator whose Trusted Client sends its secret in the form body
 * (`OPEN_DPP_OAUTH_PROVIDER_CLIENT_AUTH_METHOD=client_secret_post`). The sibling specs
 * cover the default, HTTP Basic; the provider accepts exactly the registered method.
 */
describe("OAuth Provider for a Trusted Client registered for client_secret_post", () => {
  let app: INestApplication;
  let cookie: string;

  /** A code for the signed-in User, straight from authorize. */
  async function freshCode(pkce: PkcePair): Promise<string> {
    const response = await authorize(app, authorizeQuery(pkce), cookie);
    return new URL(response.body.url).searchParams.get("code") ?? "";
  }

  beforeAll(async () => {
    const testApp = await createAuthTestContext({ imports: [EventEmitterModule.forRoot()] });
    app = testApp.app;
    const { user } = await testApp.betterAuthHelper.createUser();
    cookie = await testApp.betterAuthHelper.signAsUser(user.id);
  });

  afterAll(async () => {
    await app.close();
  });

  it("exchanges the code when the client secret travels in the form body", async () => {
    const pkce = createPkcePair();
    const code = await freshCode(pkce);

    const response = await exchangeCodeWithBodySecret(app, {
      code,
      verifier: pkce.verifier,
      resource: ISSUER,
    });

    expect(response.status).toBe(200);
    expect(decodeJwtPayload(response.body.access_token).azp).toBe(TEST_TRUSTED_CLIENT.clientId);
    expect(response.body.refresh_token).toEqual(expect.any(String));
  });

  it("refreshes and revokes with the client secret in the form body, as on the token endpoint", async () => {
    const pkce = createPkcePair();
    const code = await freshCode(pkce);
    const { body: tokens } = await exchangeCodeWithBodySecret(app, {
      code,
      verifier: pkce.verifier,
      resource: ISSUER,
    });

    const refresh = await postWithBodySecret(app, "/oauth2/token", {
      grant_type: "refresh_token",
      refresh_token: tokens.refresh_token,
    });
    expect(refresh.status).toBe(200);

    const revoke = await postWithBodySecret(app, "/oauth2/revoke", {
      token: refresh.body.refresh_token,
      token_type_hint: "refresh_token",
    });
    expect(revoke.status).toBe(200);

    const afterRevoke = await postWithBodySecret(app, "/oauth2/token", {
      grant_type: "refresh_token",
      refresh_token: refresh.body.refresh_token,
    });
    expect(afterRevoke.status).toBe(400);
    expect(afterRevoke.body.error).toBe("invalid_grant");
  });

  it("refuses the client secret in an HTTP Basic header", async () => {
    const pkce = createPkcePair();
    const code = await freshCode(pkce);

    const response = await exchangeCode(app, { code, verifier: pkce.verifier, resource: ISSUER });

    expect(response.status).toBe(401);
    expect(response.body).toEqual({
      error: "invalid_client",
      error_description: "client registered for client_secret_post cannot use client_secret_basic",
    });
  });

  it("advertises client_secret_post as the one way to authenticate at the token endpoint", async () => {
    const response = await request(app.getHttpServer()).get(
      `${AUTH_BASE_PATH}/.well-known/openid-configuration`,
    );

    expect(response.status).toBe(200);
    expect(response.body.token_endpoint_auth_methods_supported).toEqual(["client_secret_post"]);
  });
});
