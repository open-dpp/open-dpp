// Must stay the first import: it enables the OAuth Provider before the auth module validates env.
import "./trusted-client.test-env";
import { afterAll, beforeAll, describe, expect, it } from "@jest/globals";
import type { INestApplication } from "@nestjs/common";
import request from "supertest";
import { BetterAuthHelper, BetterAuthOrganization } from "../../../../../test/better-auth-helper";
import { PolicyManagementService } from "../../../../policy/application/services/policy-management.service";
import { PolicyModule } from "../../../../policy/policy.module";
import { MemberRole } from "../../../organizations/domain/member-role.enum";
import { ORGANIZATION_ID_HEADER } from "../../presentation/decorators/organization-id.decorator";
import {
  authorize,
  authorizeQuery,
  createPkcePair,
  decodeJwtHeader,
  decodeJwtPayload,
  exchangeCode,
  introspectToken,
  ISSUER,
  obtainTokens,
  type PkcePair,
  refreshTokens,
  revokeToken,
  TEST_PASSWORD,
  TEST_REDIRECT_URI,
  type Tokens,
} from "./oauth-flow.test-helpers";
import {
  ACCESS_TOKEN_LIFETIME_SECONDS,
  OPEN_DPP_API_SCOPE,
  REFRESH_TOKEN_LIFETIME_SECONDS,
} from "../../domain/trusted-client-access-token";
import { API_PATH, AUTH_PATH, createAuthTestContext } from "./auth.test.context";
import { TEST_TRUSTED_CLIENT } from "./trusted-client.test-env";

interface TestUser {
  id: string;
  email: string;
}

const FULL_SCOPE = "openid profile email offline_access open-dpp:api";

/**
 * The Trusted Client's flow end to end, against the production prefix, the AuthGuard and
 * the real OAuth Provider plugin. The sibling specs pin the parts (lockdown, continuation,
 * claims, guard, disabled instance); this one walks the contract the landing page relies on.
 */
describe("OAuth Provider flow for the Trusted Client", () => {
  let app: INestApplication;
  let betterAuthHelper: BetterAuthHelper;
  let user: TestUser;
  let organization: BetterAuthOrganization;
  let cookie: string;

  const bearer = (token: string) => `Bearer ${token}`;

  /** GET /oauth2/authorize as the signed-in User's browser: straight back to the client with a code. */
  async function authorizeWithSession(pkce: PkcePair): Promise<URL> {
    const response = await authorize(app, authorizeQuery(pkce), cookie);
    expect(response.status).toBe(200);
    expect(response.body.redirect).toBe(true);
    return new URL(response.body.url);
  }

  /** A User of their own with a full token set: refresh-token families are per client and User. */
  async function freshUserTokens(): Promise<Tokens> {
    const created = (await betterAuthHelper.createUser()).user;
    return obtainTokens(app, { email: created.email, password: TEST_PASSWORD });
  }

  function callApi(accessToken: string) {
    return request(app.getHttpServer())
      .get(`${API_PATH}/organizations/member`)
      .set("Authorization", bearer(accessToken));
  }

  beforeAll(async () => {
    const testApp = await createAuthTestContext({ imports: [PolicyModule], withAuthGuard: true });
    app = testApp.app;
    betterAuthHelper = testApp.betterAuthHelper;
    user = (await betterAuthHelper.createUser()).user;
    organization = await betterAuthHelper.createOrganization(user.id);
    await testApp.moduleRef
      .get<PolicyManagementService>(PolicyManagementService)
      .ensureDefaultPolicies(organization.id);
    cookie = await betterAuthHelper.signAsUser(user.id);
  });

  afterAll(async () => {
    await app.close();
  });

  describe("from the signed-in User to the API call", () => {
    // one story, told in order: each step hands the next its result
    const pkce = createPkcePair();
    let code: string;
    let tokens: Tokens;

    it("authorize with PKCE sends the User back to the Trusted Client with a code", async () => {
      const redirect = await authorizeWithSession(pkce);

      expect(`${redirect.origin}${redirect.pathname}`).toBe(TEST_REDIRECT_URI);
      expect(redirect.searchParams.get("state")).toBe("state-123");
      expect(redirect.searchParams.get("iss")).toBe(ISSUER);
      code = redirect.searchParams.get("code") ?? "";
      expect(code).not.toBe("");
    });

    it("the code exchange with resource yields a JWT access token, an id token and a refresh token", async () => {
      const response = await exchangeCode(app, { code, verifier: pkce.verifier, resource: ISSUER });

      expect(response.status).toBe(200);
      // RFC 6749 §5.1: the token response must not be cached
      expect(response.headers["cache-control"]).toBe("no-store");
      expect(response.headers["pragma"]).toBe("no-cache");
      tokens = response.body;
      expect(tokens).toEqual({
        access_token: expect.stringMatching(/^[\w-]+\.[\w-]+\.[\w-]+$/),
        token_type: "Bearer",
        expires_in: ACCESS_TOKEN_LIFETIME_SECONDS,
        expires_at: expect.any(Number),
        scope: FULL_SCOPE,
        id_token: expect.stringMatching(/^[\w-]+\.[\w-]+\.[\w-]+$/),
        refresh_token: expect.any(String),
      });
    });

    it("the access token carries the claims the guard checks", async () => {
      expect(decodeJwtHeader(tokens.access_token)).toEqual({
        alg: "EdDSA",
        kid: expect.any(String),
      });
      const claims = decodeJwtPayload(tokens.access_token);
      expect(claims).toEqual({
        iss: ISSUER,
        sub: user.id,
        // the requested resource, plus userinfo because openid was granted
        aud: [ISSUER, `${ISSUER}/oauth2/userinfo`],
        azp: TEST_TRUSTED_CLIENT.clientId,
        scope: FULL_SCOPE,
        // present here because authorize ran against the browser session
        sid: expect.any(String),
        iat: expect.any(Number),
        exp: expect.any(Number),
      });
      expect(claims.scope).toContain(OPEN_DPP_API_SCOPE);
      expect((claims.exp as number) - (claims.iat as number)).toBe(ACCESS_TOKEN_LIFETIME_SECONDS);
      expect(tokens.expires_at).toBe(claims.exp);
    });

    it("the id token identifies the User to the Trusted Client", async () => {
      expect(decodeJwtPayload(tokens.id_token ?? "")).toEqual(
        expect.objectContaining({
          iss: ISSUER,
          sub: user.id,
          aud: TEST_TRUSTED_CLIENT.clientId,
          nonce: "nonce-456",
          email: user.email,
          email_verified: true,
        }),
      );
    });

    it("userinfo answers with the User's claims", async () => {
      const response = await request(app.getHttpServer())
        .get(`${AUTH_PATH}/oauth2/userinfo`)
        .set("Authorization", bearer(tokens.access_token));

      expect(response.status).toBe(200);
      expect(response.body).toEqual(
        expect.objectContaining({ sub: user.id, email: user.email, name: "First Last" }),
      );
    });

    it("the API serves the User's organizations, members and quota utilization with the bearer", async () => {
      const http = request(app.getHttpServer());

      const organizations = await http
        .get(`${API_PATH}/organizations/member`)
        .set("Authorization", bearer(tokens.access_token));
      expect(organizations.status).toBe(200);
      expect(organizations.body.map((item: { id: string }) => item.id)).toEqual([organization.id]);

      const members = await http
        .get(`${API_PATH}/organizations/${organization.id}/members`)
        .set("Authorization", bearer(tokens.access_token));
      expect(members.status).toBe(200);
      expect(members.body).toEqual([
        expect.objectContaining({ userId: user.id, role: MemberRole.OWNER }),
      ]);

      const policies = await http
        .get(`${API_PATH}/policies/organizations/${organization.id}`)
        .set("Authorization", bearer(tokens.access_token))
        .set(ORGANIZATION_ID_HEADER, organization.id);
      expect(policies.status).toBe(200);
    });

    it("the authorization code is single-use", async () => {
      const response = await exchangeCode(app, { code, verifier: pkce.verifier, resource: ISSUER });

      expect(response.status).toBe(401);
      expect(response.body).toEqual({ error: "invalid_grant", error_description: "invalid code" });
    });
  });

  describe("refresh", () => {
    it("rotates the refresh token and mints a new JWT that passes the guard", async () => {
      const tokens = await freshUserTokens();

      const response = await refreshTokens(app, {
        refreshToken: tokens.refresh_token ?? "",
        resource: ISSUER,
      });

      expect(response.status).toBe(200);
      expect(response.headers["cache-control"]).toBe("no-store");
      const refreshed: Tokens = response.body;
      expect(refreshed.refresh_token).toEqual(expect.any(String));
      expect(refreshed.refresh_token).not.toBe(tokens.refresh_token);
      expect(refreshed.scope).toBe(FULL_SCOPE);
      expect(decodeJwtPayload(refreshed.access_token)).toEqual(
        expect.objectContaining({
          azp: TEST_TRUSTED_CLIENT.clientId,
          aud: [ISSUER, `${ISSUER}/oauth2/userinfo`],
          scope: FULL_SCOPE,
        }),
      );
      expect((await callApi(refreshed.access_token)).status).toBe(200);
    });

    it("a refresh token lives seven days and every rotation restarts the window", async () => {
      const tokens = await freshUserTokens();

      const issued = await introspectToken(app, tokens.refresh_token ?? "", "refresh_token");
      expect(issued.status).toBe(200);
      expect(issued.body.active).toBe(true);
      expect(issued.body.exp - issued.body.iat).toBe(REFRESH_TOKEN_LIFETIME_SECONDS);

      const refreshed: Tokens = (
        await refreshTokens(app, { refreshToken: tokens.refresh_token ?? "", resource: ISSUER })
      ).body;
      const rotated = await introspectToken(app, refreshed.refresh_token ?? "", "refresh_token");
      expect(rotated.status).toBe(200);
      expect(rotated.body.active).toBe(true);
      expect(rotated.body.exp - rotated.body.iat).toBe(REFRESH_TOKEN_LIFETIME_SECONDS);
      // sliding: the new window starts at the rotation, never earlier than the old one
      expect(rotated.body.exp).toBeGreaterThanOrEqual(issued.body.exp);
    });

    it("issues an opaque access token when the refresh omits resource", async () => {
      const tokens = await freshUserTokens();

      const response = await refreshTokens(app, { refreshToken: tokens.refresh_token ?? "" });

      expect(response.status).toBe(200);
      const refreshed: Tokens = response.body;
      expect(refreshed.access_token.split(".")).not.toHaveLength(3);
      expect((await callApi(refreshed.access_token)).status).toBe(401);
    });

    it("refuses a replayed refresh token and tears down the whole family", async () => {
      const tokens = await freshUserTokens();
      const rotated: Tokens = (
        await refreshTokens(app, { refreshToken: tokens.refresh_token ?? "", resource: ISSUER })
      ).body;

      const replay = await refreshTokens(app, {
        refreshToken: tokens.refresh_token ?? "",
        resource: ISSUER,
      });
      expect(replay.status).toBe(400);
      expect(replay.body).toEqual({
        error: "invalid_grant",
        error_description: "invalid refresh token",
      });

      // the replay burned the successor too: the User has to sign in again
      const successor = await refreshTokens(app, {
        refreshToken: rotated.refresh_token ?? "",
        resource: ISSUER,
      });
      expect(successor.status).toBe(400);
      expect(successor.body.error).toBe("invalid_grant");
      // while the JWTs already issued stay valid until they expire
      expect((await callApi(rotated.access_token)).status).toBe(200);
    });

    it("refuses a refresh with the wrong client secret", async () => {
      const tokens = await freshUserTokens();

      const response = await refreshTokens(
        app,
        { refreshToken: tokens.refresh_token ?? "", resource: ISSUER },
        "not-the-secret",
      );

      expect(response.status).toBe(401);
      expect(response.body).toEqual({
        error: "invalid_client",
        error_description: "invalid client_secret",
      });
    });
  });

  describe("revoke", () => {
    it("revoking the refresh token stops refreshing while the JWT stays valid until it expires", async () => {
      const tokens = await freshUserTokens();

      const revoke = await revokeToken(app, tokens.refresh_token ?? "", "refresh_token");
      expect(revoke.status).toBe(200);

      const refresh = await refreshTokens(app, {
        refreshToken: tokens.refresh_token ?? "",
        resource: ISSUER,
      });
      expect(refresh.status).toBe(400);
      expect(refresh.body.error).toBe("invalid_grant");
      // a JWT is not stored on the server, so nothing can recall it before `exp`
      expect((await callApi(tokens.access_token)).status).toBe(200);
    });

    it("revoking the JWT access token itself is accepted and changes nothing", async () => {
      const tokens = await freshUserTokens();

      const revoke = await revokeToken(app, tokens.access_token, "access_token");
      expect(revoke.status).toBe(200);

      expect((await callApi(tokens.access_token)).status).toBe(200);
      const refresh = await refreshTokens(app, {
        refreshToken: tokens.refresh_token ?? "",
        resource: ISSUER,
      });
      expect(refresh.status).toBe(200);
    });
  });

  describe("code exchange without resource", () => {
    it("issues an opaque access token: introspectable, served by userinfo, refused by the API", async () => {
      const who = (await betterAuthHelper.createUser()).user;

      const opaque = await obtainTokens(
        app,
        { email: who.email, password: TEST_PASSWORD },
        { resource: null },
      );

      expect(opaque.access_token.split(".")).not.toHaveLength(3);
      expect(opaque.refresh_token).toEqual(expect.any(String));

      const introspection = await introspectToken(app, opaque.access_token);
      expect(introspection.status).toBe(200);
      expect(introspection.body).toEqual(
        expect.objectContaining({
          active: true,
          client_id: TEST_TRUSTED_CLIENT.clientId,
          sub: who.id,
          scope: FULL_SCOPE,
        }),
      );

      const userinfo = await request(app.getHttpServer())
        .get(`${AUTH_PATH}/oauth2/userinfo`)
        .set("Authorization", bearer(opaque.access_token));
      expect(userinfo.status).toBe(200);
      expect(userinfo.body.sub).toBe(who.id);

      expect((await callApi(opaque.access_token)).status).toBe(401);
    });
  });

  describe("refuses at authorize", () => {
    /** The redirect the User's browser is sent to, as `{ origin+pathname, params }`. */
    async function rejection(query: URLSearchParams, withSession = true) {
      const response = await authorize(app, query, withSession ? cookie : undefined);
      expect(response.status).toBe(200);
      expect(response.body.redirect).toBe(true);
      const url = new URL(response.body.url);
      return { at: `${url.origin}${url.pathname}`, params: Object.fromEntries(url.searchParams) };
    }

    it("an unregistered redirect_uri: the provider's error page, never the supplied URI", async () => {
      const { at, params } = await rejection(
        authorizeQuery(createPkcePair(), { redirect_uri: "https://evil.example.com/callback" }),
      );

      expect(at).toBe(`${ISSUER}/error`);
      expect(params).toEqual({
        error: "invalid_redirect",
        error_description: "invalid redirect uri",
      });
    });

    it("an unknown scope: back to the Trusted Client with invalid_scope", async () => {
      const { at, params } = await rejection(
        authorizeQuery(createPkcePair(), { scope: "openid open-dpp:api admin" }),
      );

      expect(at).toBe(TEST_REDIRECT_URI);
      expect(params).toEqual({
        error: "invalid_scope",
        error_description: "The following scopes are invalid: admin",
        state: "state-123",
        iss: ISSUER,
      });
    });

    it("a missing code challenge: PKCE is required for the Trusted Client", async () => {
      const query = authorizeQuery(createPkcePair());
      query.delete("code_challenge");
      query.delete("code_challenge_method");

      const { at, params } = await rejection(query);

      expect(at).toBe(TEST_REDIRECT_URI);
      expect(params).toEqual(
        expect.objectContaining({ error: "invalid_request", state: "state-123" }),
      );
      expect(params.error_description).toMatch(/^pkce is required/);
    });

    it("a plain code challenge: only S256 is accepted (a 400 before the handler runs)", async () => {
      const response = await authorize(
        app,
        authorizeQuery(createPkcePair(), { code_challenge_method: "plain" }),
        cookie,
      );

      expect(response.status).toBe(400);
    });

    it("prompt=none without a session: login_required instead of the sign-in page", async () => {
      const { at, params } = await rejection(
        authorizeQuery(createPkcePair(), { prompt: "none" }),
        false,
      );

      expect(at).toBe(TEST_REDIRECT_URI);
      expect(params).toEqual(
        expect.objectContaining({ error: "login_required", state: "state-123", iss: ISSUER }),
      );
    });
  });

  describe("refuses at the token endpoint", () => {
    async function freshCode(pkce: PkcePair): Promise<string> {
      const redirect = await authorizeWithSession(pkce);
      return redirect.searchParams.get("code") ?? "";
    }

    it("a wrong code_verifier", async () => {
      const code = await freshCode(createPkcePair());

      const response = await exchangeCode(app, {
        code,
        verifier: createPkcePair().verifier,
        resource: ISSUER,
      });

      expect(response.status).toBe(401);
      expect(response.body).toEqual({
        error: "invalid_request",
        error_description: "code verification failed",
      });
    });

    it("a wrong client secret", async () => {
      const pkce = createPkcePair();
      const code = await freshCode(pkce);

      const response = await exchangeCode(
        app,
        { code, verifier: pkce.verifier, resource: ISSUER },
        "not-the-secret",
      );

      expect(response.status).toBe(401);
      expect(response.body).toEqual({
        error: "invalid_client",
        error_description: "invalid client_secret",
      });
    });

    it("a resource outside the issuer", async () => {
      const pkce = createPkcePair();
      const code = await freshCode(pkce);

      const response = await exchangeCode(app, {
        code,
        verifier: pkce.verifier,
        resource: "https://api.example.com",
      });

      expect(response.status).toBe(400);
      expect(response.body.error).toBe("invalid_request");
    });
  });

  it("does not serve the provider under an older API version", async () => {
    const response = await request(app.getHttpServer())
      .get(`/api/v1/auth/oauth2/authorize?${authorizeQuery(createPkcePair())}`)
      .set("Accept", "application/json");

    expect(response.status).toBe(404);
  });
});
