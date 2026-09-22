// Must stay the first import: it enables the OAuth Provider before the auth module validates env.
import "./trusted-client.test-env";
import { afterAll, beforeAll, describe, expect, it } from "@jest/globals";
import type { INestApplication } from "@nestjs/common";
import type { Auth } from "better-auth";
import type { Connection } from "mongoose";
import request from "supertest";
import { BetterAuthHelper } from "../../../../../test/better-auth-helper";
import { UsersService } from "../../../users/application/services/users.service";
import { AUTH } from "../../auth.provider";
import { AUTH_PATH, createAuthTestContext, collectionNames } from "./auth.test.context";

// The issuer is the better-auth mount on the instance origin; v2 is the latest API version.
const ISSUER = "http://localhost:3000/api/v2/auth";

/** Client and consent management, plus the jwt plugin's session-to-JWT endpoint. */
const LOCKED_DOWN_ENDPOINTS = [
  ["get", "/token"],
  ["post", "/oauth2/register"],
  ["post", "/oauth2/create-client"],
  ["post", "/oauth2/update-client"],
  ["post", "/oauth2/delete-client"],
  ["get", "/oauth2/get-client"],
  ["get", "/oauth2/get-clients"],
  ["get", "/oauth2/public-client"],
  ["post", "/oauth2/public-client-prelogin"],
  ["post", "/oauth2/client/rotate-secret"],
  ["get", "/oauth2/get-consent"],
  ["get", "/oauth2/get-consents"],
  ["post", "/oauth2/update-consent"],
  ["post", "/oauth2/delete-consent"],
  ["get", "/oauth2/end-session"],
  ["post", "/oauth2/consent"],
] as const;

/** The flow endpoints the Trusted Client and the sign-in page use. */
const REACHABLE_ENDPOINTS = [
  ["get", "/oauth2/authorize"],
  ["post", "/oauth2/token"],
  ["post", "/oauth2/continue"],
  ["get", "/oauth2/userinfo"],
  ["post", "/oauth2/introspect"],
  ["post", "/oauth2/revoke"],
] as const;

describe("OAuth Provider enabled for one Trusted Client", () => {
  let app: INestApplication;
  let connection: Connection;
  const betterAuthHelper = new BetterAuthHelper();

  beforeAll(async () => {
    const testApp = await createAuthTestContext();
    app = testApp.app;
    connection = testApp.connection;
    betterAuthHelper.init(
      testApp.moduleRef.get<UsersService>(UsersService),
      testApp.moduleRef.get<Auth>(AUTH),
    );
  });

  afterAll(async () => {
    await app.close();
  });

  it("serves the OpenID discovery document under the auth mount", async () => {
    const response = await request(app.getHttpServer()).get(
      `${AUTH_PATH}/.well-known/openid-configuration`,
    );

    expect(response.status).toBe(200);
    expect(response.body).toEqual(
      expect.objectContaining({
        issuer: ISSUER,
        authorization_endpoint: `${ISSUER}/oauth2/authorize`,
        token_endpoint: `${ISSUER}/oauth2/token`,
        userinfo_endpoint: `${ISSUER}/oauth2/userinfo`,
        jwks_uri: `${ISSUER}/jwks`,
        scopes_supported: ["openid", "profile", "email", "offline_access", "open-dpp:api"],
        grant_types_supported: ["authorization_code", "refresh_token"],
        code_challenge_methods_supported: ["S256"],
      }),
    );
    expect(response.body.registration_endpoint).toBeUndefined();
  });

  it("serves the authorization server metadata under the auth mount", async () => {
    const response = await request(app.getHttpServer()).get(
      `${AUTH_PATH}/.well-known/oauth-authorization-server`,
    );

    expect(response.status).toBe(200);
    expect(response.body.issuer).toBe(ISSUER);
  });

  it("publishes an EdDSA signing key, creating the jwks collection on demand", async () => {
    const response = await request(app.getHttpServer()).get(`${AUTH_PATH}/jwks`);

    expect(response.status).toBe(200);
    expect(response.body.keys).toEqual([
      expect.objectContaining({
        kty: "OKP",
        crv: "Ed25519",
        alg: "EdDSA",
        kid: expect.any(String),
      }),
    ]);
    expect(await collectionNames(connection)).toContain("jwks");
  });

  it.each(LOCKED_DOWN_ENDPOINTS)("locks down %s %s", async (method, path) => {
    const response = await request(app.getHttpServer())[method](`${AUTH_PATH}${path}`);

    expect(response.status).toBe(404);
    expect(response.text).toBe("Not Found");
  });

  it.each([
    ["post", "/token"],
    ["get", "/oauth2/register"],
  ] as const)("locks down %s %s whatever the method", async (method, path) => {
    const response = await request(app.getHttpServer())[method](`${AUTH_PATH}${path}`);

    expect(response.status).toBe(404);
    expect(response.text).toBe("Not Found");
  });

  it.each([
    ["trailing slash", "/oauth2/register/"],
    ["upper case", "/oauth2/Register"],
    ["percent-encoded slash", "/oauth2%2Fregister"],
  ])("answers 404 to a locked-down path with a %s", async (_variant, path) => {
    const response = await request(app.getHttpServer()).post(`${AUTH_PATH}${path}`);

    expect(response.status).toBe(404);
  });

  it.each(["/admin/oauth2/create-client", "/admin/oauth2/update-client"])(
    "never routes the server-only admin endpoint %s",
    async (path) => {
      const response = await request(app.getHttpServer()).post(`${AUTH_PATH}${path}`);

      expect(response.status).toBe(404);
    },
  );

  it.each(REACHABLE_ENDPOINTS)("keeps %s %s reachable", async (method, path) => {
    const response = await request(app.getHttpServer())
      [method](`${AUTH_PATH}${path}`)
      .set("Accept", "application/json");

    expect(response.status).not.toBe(404);
  });

  it("does not attach a session JWT to the session endpoint", async () => {
    const { user } = await betterAuthHelper.createUser();
    const cookie = await betterAuthHelper.signAsUser(user.id);

    const response = await request(app.getHttpServer())
      .get(`${AUTH_PATH}/get-session`)
      .set("Cookie", cookie);

    expect(response.status).toBe(200);
    expect(response.body.user.id).toBe(user.id);
    expect(response.headers["set-auth-jwt"]).toBeUndefined();
  });
});
