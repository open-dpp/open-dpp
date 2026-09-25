// Must stay the first import: it enables the OAuth Provider before the auth module validates env.
import "./trusted-client.test-env";
import { afterAll, beforeAll, describe, expect, it } from "@jest/globals";
import type { INestApplication } from "@nestjs/common";
import request from "supertest";
import { BetterAuthHelper } from "../../../../../test/better-auth-helper";
import { API_PATH, createAuthTestContext } from "./auth.test.context";
import {
  authorize,
  authorizeQuery,
  createPkcePair,
  ISSUER,
  signedQueryOf,
  TEST_REDIRECT_URI,
} from "./oauth-flow.test-helpers";

const CONTINUE_PATH = `${API_PATH}/oauth-provider/continue`;

describe("POST /oauth-provider/continue (sign-up continuation for the SPA)", () => {
  let app: INestApplication;
  let betterAuthHelper: BetterAuthHelper;
  let userId: string;
  let cookie: string;

  /** A pending `prompt=create` request, as the provider hands it to the sign-up page. */
  async function pendingSignupQuery(): Promise<string> {
    const pending = await authorize(
      app,
      authorizeQuery(createPkcePair(), { prompt: "create" }),
      cookie,
    );
    expect(pending.body.url.startsWith("/signup?")).toBe(true);
    return signedQueryOf(pending.body.url);
  }

  beforeAll(async () => {
    const testApp = await createAuthTestContext({ withAuthGuard: true });
    app = testApp.app;
    betterAuthHelper = testApp.betterAuthHelper;
    userId = (await betterAuthHelper.createUser()).user.id;
    cookie = await betterAuthHelper.signAsUser(userId);
  });

  afterAll(async () => {
    await app.close();
  });

  it("resumes the pending authorization and answers the Trusted Client redirect", async () => {
    const oauthQuery = await pendingSignupQuery();

    const response = await request(app.getHttpServer())
      .post(CONTINUE_PATH)
      .set("Cookie", cookie)
      .send({ oauthQuery });

    expect(response.status).toBe(200);
    expect(response.body).toEqual({ url: expect.any(String) });
    const redirect = new URL(response.body.url);
    expect(`${redirect.origin}${redirect.pathname}`).toBe(TEST_REDIRECT_URI);
    expect(redirect.searchParams.get("code")).toEqual(expect.any(String));
    expect(redirect.searchParams.get("state")).toBe("state-123");
    expect(redirect.searchParams.get("iss")).toBe(ISSUER);
  });

  it("rejects a tampered query with 400", async () => {
    const tampered = (await pendingSignupQuery()).replace("state-123", "state-666");

    const response = await request(app.getHttpServer())
      .post(CONTINUE_PATH)
      .set("Cookie", cookie)
      .send({ oauthQuery: tampered });

    expect(response.status).toBe(400);
  });

  it("rejects a body without the query with 400", async () => {
    const response = await request(app.getHttpServer())
      .post(CONTINUE_PATH)
      .set("Cookie", cookie)
      .send({});

    expect(response.status).toBe(400);
  });

  it("refuses a request without a session", async () => {
    const oauthQuery = await pendingSignupQuery();

    const response = await request(app.getHttpServer()).post(CONTINUE_PATH).send({ oauthQuery });

    expect(response.status).toBe(403);
  });

  it("refuses an api key: only the browser session may continue", async () => {
    const oauthQuery = await pendingSignupQuery();
    const apiKey = await betterAuthHelper.createApiKey(userId);

    const response = await request(app.getHttpServer())
      .post(CONTINUE_PATH)
      .set("x-api-key", apiKey)
      .send({ oauthQuery });

    expect(response.status).toBe(403);
  });
});
