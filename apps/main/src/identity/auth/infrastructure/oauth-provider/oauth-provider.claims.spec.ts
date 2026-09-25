// Must stay the first import: it enables the OAuth Provider before the auth module validates env.
import "./trusted-client.test-env";
import { afterAll, beforeAll, describe, expect, it } from "@jest/globals";
import type { INestApplication } from "@nestjs/common";
import type { Auth } from "better-auth";
import request from "supertest";
import { UsersService } from "../../../users/application/services/users.service";
import { AUTH } from "../../auth.provider";
import {
  authorize,
  authorizeQuery,
  createPkcePair,
  decodeJwtPayload,
  exchangeCode,
  ISSUER,
  signedQueryOf,
  signInWithOAuthQuery,
  TEST_PASSWORD,
} from "./oauth-flow.test-helpers";
import { createAuthTestContext } from "./auth.test.context";
import { TEST_TRUSTED_CLIENT } from "./trusted-client.test-env";
import { AUTH_BASE_PATH } from "../../auth-base-path";

interface SignedUpUser {
  id: string;
  email: string;
  name: string;
}

interface Tokens {
  access_token: string;
  id_token: string;
  scope: string;
}

describe("OAuth Provider claims", () => {
  let app: INestApplication;
  let auth: Auth;
  let usersService: UsersService;
  let user: SignedUpUser;

  /** Sign-up through better-auth's API, verified: the shape every open-dpp user has. */
  async function signUp(profile: {
    firstName: string;
    lastName: string;
    name: string;
    preferredLanguage?: string;
  }): Promise<SignedUpUser> {
    const email = `${Date.now()}-${Math.random().toString(36).slice(2)}@test.test`;
    const { user: created } = await auth.api.signUpEmail({
      body: { email, password: TEST_PASSWORD, ...profile } as any,
    });
    await usersService.setUserEmailVerified(email, true);
    return { id: created.id, email, name: created.name };
  }

  /** The Trusted Client's flow up to the tokens: authorize, sign-in with the signed query, code exchange with `resource`. */
  async function obtainTokens(who: SignedUpUser, scope?: string): Promise<Tokens> {
    const pkce = createPkcePair();
    const { body: pending } = await authorize(app, authorizeQuery(pkce, scope ? { scope } : {}));
    const { body: resumed } = await signInWithOAuthQuery(
      app,
      { email: who.email, password: TEST_PASSWORD },
      signedQueryOf(pending.url),
    );
    const code = new URL(resumed.url).searchParams.get("code");
    if (!code) {
      throw new Error(`No code in ${resumed.url}`);
    }
    const response = await exchangeCode(app, { code, verifier: pkce.verifier, resource: ISSUER });
    expect(response.status).toBe(200);
    return response.body;
  }

  function userinfo(accessToken: string) {
    return request(app.getHttpServer())
      .get(`${AUTH_BASE_PATH}/oauth2/userinfo`)
      .set("Authorization", `Bearer ${accessToken}`);
  }

  beforeAll(async () => {
    const testApp = await createAuthTestContext();
    app = testApp.app;
    auth = testApp.moduleRef.get<Auth>(AUTH);
    usersService = testApp.moduleRef.get<UsersService>(UsersService);
    // multi-word names: splitting the display name on spaces would misplace "de la"
    user = await signUp({
      firstName: "Anna Maria",
      lastName: "de la Cruz",
      name: "Anna Maria de la Cruz",
      preferredLanguage: "de",
    });
  });

  afterAll(async () => {
    await app.close();
  });

  it("advertises the standard claims, and only those", async () => {
    const response = await request(app.getHttpServer()).get(
      `${AUTH_BASE_PATH}/.well-known/openid-configuration`,
    );

    expect(response.status).toBe(200);
    expect(response.body.claims_supported).toEqual([
      "sub",
      "iss",
      "aud",
      "exp",
      "iat",
      "sid",
      "scope",
      "azp",
      "email",
      "email_verified",
      "name",
      "picture",
      "given_name",
      "family_name",
      "locale",
    ]);
  });

  it("puts the User's standard profile and email claims in the id token", async () => {
    const tokens = await obtainTokens(user);

    const idToken = decodeJwtPayload(tokens.id_token);
    expect(idToken).toEqual(
      expect.objectContaining({
        iss: ISSUER,
        sub: user.id,
        aud: TEST_TRUSTED_CLIENT.clientId,
        nonce: "nonce-456",
        name: "Anna Maria de la Cruz",
        given_name: "Anna Maria",
        family_name: "de la Cruz",
        email: user.email,
        email_verified: true,
        locale: "de",
      }),
    );
    // standard claims only: no organization, role or other open-dpp claims (`sid` is the
    // plugin's own optional session claim; it is absent on the sign-in continuation path)
    const claimNames = Object.keys(idToken).filter((name) => name !== "sid");
    expect(claimNames.sort()).toEqual([
      "acr",
      "aud",
      "auth_time",
      "email",
      "email_verified",
      "exp",
      "family_name",
      "given_name",
      "iat",
      "iss",
      "locale",
      "name",
      "nonce",
      "sub",
    ]);
  });

  it("serves the same claim set at userinfo", async () => {
    const tokens = await obtainTokens(user);

    const response = await userinfo(tokens.access_token);

    expect(response.status).toBe(200);
    expect(response.body).toEqual({
      sub: user.id,
      name: "Anna Maria de la Cruz",
      given_name: "Anna Maria",
      family_name: "de la Cruz",
      email: user.email,
      email_verified: true,
      locale: "de",
    });
  });

  it("withholds the profile claims when the profile scope was not granted", async () => {
    const tokens = await obtainTokens(user, "openid email open-dpp:api");

    const response = await userinfo(tokens.access_token);

    expect(response.status).toBe(200);
    expect(tokens.scope).toBe("openid email open-dpp:api");
    expect(response.body).toEqual({
      sub: user.id,
      email: user.email,
      email_verified: true,
    });
  });

  it("gives a User signed up without a display name one, so the claims never break", async () => {
    const nameless = await signUp({ firstName: "Solo", lastName: "Rider", name: "" });
    expect(nameless.name).toBe("Solo Rider");

    const tokens = await obtainTokens(nameless);
    const response = await userinfo(tokens.access_token);

    expect(response.status).toBe(200);
    expect(response.body).toEqual(
      expect.objectContaining({ name: "Solo Rider", given_name: "Solo", family_name: "Rider" }),
    );
  });

  it("gives a User created with blank names the fallback display name, so the claims never break", async () => {
    // Admin email-only invites create Users with empty first and last names.
    const blank = await signUp({ firstName: "", lastName: "", name: "" });
    expect(blank.name).toBe("User");

    const tokens = await obtainTokens(blank);
    const response = await userinfo(tokens.access_token);

    expect(response.status).toBe(200);
    expect(response.body).toEqual(expect.objectContaining({ name: "User" }));
    expect(response.body).not.toHaveProperty("given_name");
    expect(response.body).not.toHaveProperty("family_name");
  });
});
