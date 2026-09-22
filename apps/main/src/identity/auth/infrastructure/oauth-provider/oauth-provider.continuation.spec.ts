// Must stay the first import: it enables the OAuth Provider before the auth module validates env.
import "./trusted-client.test-env";
import { afterAll, beforeAll, describe, expect, it } from "@jest/globals";
import type { INestApplication } from "@nestjs/common";
import type { Auth, User } from "better-auth";
import request from "supertest";
import { BetterAuthHelper } from "../../../../../test/better-auth-helper";
import { UsersService } from "../../../users/application/services/users.service";
import { AUTH } from "../../auth.provider";
import {
  authorize,
  authorizeQuery,
  createPkcePair,
  ISSUER,
  signedQueryOf,
  signInWithOAuthQuery,
  TEST_PASSWORD,
  TEST_REDIRECT_URI,
} from "./oauth-flow.test-helpers";
import { AUTH_PATH, createAuthTestContext } from "./auth.test.context";
import { TEST_TRUSTED_CLIENT } from "./trusted-client.test-env";

const TEN_MINUTES_MS = 10 * 60 * 1000;

/** The `Cookie` header a browser sends back after a response's `Set-Cookie` headers. */
function sessionCookieOf(setCookie: string | string[] | undefined): string {
  const headers = Array.isArray(setCookie) ? setCookie : [setCookie ?? ""];
  return headers.map((header) => header.split(";")[0]).join("; ");
}

/** The redirect back to the Trusted Client: its redirect URI with code, state and iss. */
function expectTrustedClientRedirect(url: string): URL {
  const redirect = new URL(url);
  expect(`${redirect.origin}${redirect.pathname}`).toBe(TEST_REDIRECT_URI);
  expect(redirect.searchParams.get("code")).toEqual(expect.any(String));
  expect(redirect.searchParams.get("state")).toBe("state-123");
  expect(redirect.searchParams.get("iss")).toBe(ISSUER);
  return redirect;
}

describe("OAuth Provider login and signup continuation", () => {
  let app: INestApplication;
  let user: User;
  const betterAuthHelper = new BetterAuthHelper();

  beforeAll(async () => {
    const testApp = await createAuthTestContext();
    app = testApp.app;
    betterAuthHelper.init(
      testApp.moduleRef.get<UsersService>(UsersService),
      testApp.moduleRef.get<Auth>(AUTH),
    );
    user = (await betterAuthHelper.createUser()).user;
  });

  afterAll(async () => {
    await app.close();
  });

  describe("authorize without a session", () => {
    it("redirects to the sign-in page with the signed authorize query", async () => {
      const pkce = createPkcePair();
      const before = Date.now();

      const response = await authorize(app, authorizeQuery(pkce));

      expect(response.status).toBe(200);
      expect(response.body.redirect).toBe(true);
      const url: string = response.body.url;
      expect(url.startsWith("/signin?")).toBe(true);
      const signed = new URLSearchParams(signedQueryOf(url));
      expect(Object.fromEntries(signed)).toEqual({
        client_id: TEST_TRUSTED_CLIENT.clientId,
        redirect_uri: TEST_REDIRECT_URI,
        response_type: "code",
        scope: "openid profile email offline_access open-dpp:api",
        state: "state-123",
        nonce: "nonce-456",
        code_challenge: pkce.challenge,
        code_challenge_method: "S256",
        exp: expect.stringMatching(/^\d+$/),
        ba_iat: expect.stringMatching(/^\d+$/),
        // standard base64 (not base64url): `+`, `/` and `=` travel percent-encoded in the URL
        sig: expect.stringMatching(/^[A-Za-z0-9+/]+=*$/),
      });
      // `sig` is the last parameter: a page forwards the query up to and including it
      expect([...signed.keys()].at(-1)).toBe("sig");
      // the pending request lives as long as an authorization code (10 minutes)
      const expiresAt = Number(signed.get("exp")) * 1000;
      expect(expiresAt).toBeGreaterThan(before + TEN_MINUTES_MS - 5000);
      expect(expiresAt).toBeLessThanOrEqual(Date.now() + TEN_MINUTES_MS);
      // nothing is persisted or set as a cookie: the signed URL is the pending request
      expect(response.headers["set-cookie"]).toBeUndefined();
    });

    it("answers a browser navigation with a 302 to the sign-in page", async () => {
      const response = await request(app.getHttpServer()).get(
        `${AUTH_PATH}/oauth2/authorize?${authorizeQuery(createPkcePair())}`,
      );

      expect(response.status).toBe(302);
      expect(response.headers.location.startsWith("/signin?")).toBe(true);
    });

    it("sends prompt=create to the sign-up page with the prompt kept in the signed query", async () => {
      const response = await authorize(app, authorizeQuery(createPkcePair(), { prompt: "create" }));

      expect(response.status).toBe(200);
      const url: string = response.body.url;
      expect(url.startsWith("/signup?")).toBe(true);
      expect(new URLSearchParams(signedQueryOf(url)).get("prompt")).toBe("create");
    });
  });

  describe("sign-in with the signed query", () => {
    it("resumes the authorize request and answers with the Trusted Client redirect", async () => {
      const { body: pending } = await authorize(app, authorizeQuery(createPkcePair()));

      const response = await signInWithOAuthQuery(
        app,
        { email: user.email, password: TEST_PASSWORD },
        signedQueryOf(pending.url),
      );

      expect(response.status).toBe(200);
      expect(response.body).toEqual({ redirect: true, url: expect.any(String) });
      expectTrustedClientRedirect(response.body.url);
      // the sign-in still establishes the open-dpp session
      expect(response.headers["set-cookie"]).toEqual(
        expect.arrayContaining([expect.stringContaining("better-auth.session_token=")]),
      );
    });

    it("rejects a tampered signed query before signing in", async () => {
      const { body: pending } = await authorize(app, authorizeQuery(createPkcePair()));
      const tampered = signedQueryOf(pending.url).replace("state=state-123", "state=other");

      const response = await signInWithOAuthQuery(
        app,
        { email: user.email, password: TEST_PASSWORD },
        tampered,
      );

      expect(response.status).toBe(400);
      expect(response.body.error).toBe("invalid_signature");
      expect(response.headers["set-cookie"]).toBeUndefined();
    });
  });

  describe("authorize with a session", () => {
    let cookie: string;

    beforeAll(async () => {
      cookie = await betterAuthHelper.signAsUser(user.id);
    });

    it("redirects straight to the Trusted Client with a code", async () => {
      const response = await authorize(app, authorizeQuery(createPkcePair()), cookie);

      expect(response.status).toBe(200);
      expect(response.body.redirect).toBe(true);
      expectTrustedClientRedirect(response.body.url);
    });

    it("re-authenticates on prompt=login even with a session", async () => {
      const response = await authorize(
        app,
        authorizeQuery(createPkcePair(), { prompt: "login" }),
        cookie,
      );

      expect(response.status).toBe(200);
      const url: string = response.body.url;
      expect(url.startsWith("/signin?")).toBe(true);
      expect(new URLSearchParams(signedQueryOf(url)).get("prompt")).toBe("login");
    });

    it("sends prompt=create to the sign-up page and completes on continue", async () => {
      const pending = await authorize(
        app,
        authorizeQuery(createPkcePair(), { prompt: "create" }),
        cookie,
      );
      expect(pending.body.url.startsWith("/signup?")).toBe(true);

      const response = await request(app.getHttpServer())
        .post(`${AUTH_PATH}/oauth2/continue`)
        .set("Accept", "application/json")
        .set("Cookie", cookie)
        .send({ created: true, oauth_query: signedQueryOf(pending.body.url) });

      expect(response.status).toBe(200);
      expect(response.body).toEqual({ redirect: true, url: expect.any(String) });
      expectTrustedClientRedirect(response.body.url);
    });

    it("refuses continue without a session", async () => {
      const pending = await authorize(app, authorizeQuery(createPkcePair(), { prompt: "create" }));

      const response = await request(app.getHttpServer())
        .post(`${AUTH_PATH}/oauth2/continue`)
        .set("Accept", "application/json")
        .send({ created: true, oauth_query: signedQueryOf(pending.body.url) });

      expect(response.status).toBe(401);
    });
  });

  describe("sign-up with the signed query", () => {
    const signUpBody = (email: string) => ({
      email,
      password: TEST_PASSWORD,
      firstName: "New",
      lastName: "User",
      name: "New User",
    });

    it("resumes the authorize request on its own when no prompt is set", async () => {
      const { body: pending } = await authorize(app, authorizeQuery(createPkcePair()));

      const response = await request(app.getHttpServer())
        .post(`${AUTH_PATH}/sign-up/email`)
        .set("Accept", "application/json")
        .send({
          ...signUpBody(`plain-signup-${Date.now()}@test.test`),
          oauth_query: signedQueryOf(pending.url),
        });

      expect(response.status).toBe(200);
      expect(response.body).toEqual({ redirect: true, url: expect.any(String) });
      expectTrustedClientRedirect(response.body.url);
    });

    it("bounces back to the sign-up page on prompt=create until the page continues", async () => {
      const { body: pending } = await authorize(
        app,
        authorizeQuery(createPkcePair(), { prompt: "create" }),
      );

      const signUp = await request(app.getHttpServer())
        .post(`${AUTH_PATH}/sign-up/email`)
        .set("Accept", "application/json")
        .send({
          ...signUpBody(`create-signup-${Date.now()}@test.test`),
          oauth_query: signedQueryOf(pending.url),
        });

      expect(signUp.status).toBe(200);
      expect(signUp.body.redirect).toBe(true);
      // the prompt is still pending: a freshly signed query back to the sign-up page
      const bounced: string = signUp.body.url;
      expect(bounced.startsWith("/signup?")).toBe(true);
      expect(new URLSearchParams(signedQueryOf(bounced)).get("prompt")).toBe("create");
      const sessionCookie = sessionCookieOf(signUp.headers["set-cookie"]);

      const response = await request(app.getHttpServer())
        .post(`${AUTH_PATH}/oauth2/continue`)
        .set("Accept", "application/json")
        .set("Cookie", sessionCookie)
        .send({ created: true, oauth_query: signedQueryOf(bounced) });

      expect(response.status).toBe(200);
      expectTrustedClientRedirect(response.body.url);
    });
  });
});
