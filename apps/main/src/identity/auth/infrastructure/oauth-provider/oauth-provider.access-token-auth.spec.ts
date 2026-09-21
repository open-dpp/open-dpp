// Must stay the first import: it enables the OAuth Provider before the auth module validates env.
import "./trusted-client.test-env";
import { afterAll, beforeAll, describe, expect, it } from "@jest/globals";
import type { INestApplication } from "@nestjs/common";
import request from "supertest";
import { BetterAuthHelper, BetterAuthOrganization } from "../../../../../test/better-auth-helper";
import { PolicyManagementService } from "../../../../policy/application/services/policy-management.service";
import { PolicyModule } from "../../../../policy/policy.module";
import { ApiKeysModule } from "../../../api-keys/api-keys.module";
import { MemberRole } from "../../../organizations/domain/member-role.enum";
import { ORGANIZATION_ID_HEADER } from "../../presentation/decorators/organization-id.decorator";
import { obtainTokens, TEST_PASSWORD } from "./oauth-flow.test-helpers";
import { API_PATH, AUTH_PATH, bootAuthTestApp } from "./oauth-provider.test-app";

interface TestUser {
  id: string;
  email: string;
}

describe("AuthGuard with Trusted Client access tokens", () => {
  let app: INestApplication;
  let user: TestUser;
  let organization: BetterAuthOrganization;
  let accessToken: string;
  let betterAuthHelper: BetterAuthHelper;

  const bearer = (token: string) => `Bearer ${token}`;

  /** The token with its subject swapped: well-formed, but the signature no longer holds. */
  function tampered(token: string): string {
    const [header, payload, signature] = token.split(".");
    const claims = JSON.parse(Buffer.from(payload, "base64url").toString("utf8"));
    const forged = Buffer.from(JSON.stringify({ ...claims, sub: "someone-else" })).toString(
      "base64url",
    );
    return `${header}.${forged}.${signature}`;
  }

  beforeAll(async () => {
    const testApp = await bootAuthTestApp({
      imports: [PolicyModule, ApiKeysModule],
      withAuthGuard: true,
    });
    app = testApp.app;
    betterAuthHelper = testApp.betterAuthHelper;
    user = (await betterAuthHelper.createUser()).user;
    organization = await betterAuthHelper.createOrganization(user.id);
    await testApp.moduleRef
      .get<PolicyManagementService>(PolicyManagementService)
      .ensureDefaultPolicies(organization.id);
    ({ access_token: accessToken } = await obtainTokens(app, {
      email: user.email,
      password: TEST_PASSWORD,
    }));
  });

  afterAll(async () => {
    await app.close();
  });

  describe("acts as the User", () => {
    it("lists the User's organizations", async () => {
      const response = await request(app.getHttpServer())
        .get(`${API_PATH}/organizations/member`)
        .set("Authorization", bearer(accessToken));

      expect(response.status).toBe(200);
      expect(response.body.map((item: { id: string }) => item.id)).toContain(organization.id);
    });

    it("lists the members of the User's organization", async () => {
      const response = await request(app.getHttpServer())
        .get(`${API_PATH}/organizations/${organization.id}/members`)
        .set("Authorization", bearer(accessToken));

      expect(response.status).toBe(200);
      expect(response.body).toEqual([
        expect.objectContaining({ userId: user.id, role: MemberRole.OWNER }),
      ]);
    });

    it("reads the organization's quota utilization with the organization header", async () => {
      const response = await request(app.getHttpServer())
        .get(`${API_PATH}/policies/organizations/${organization.id}`)
        .set("Authorization", bearer(accessToken))
        .set(ORGANIZATION_ID_HEADER, organization.id);

      expect(response.status).toBe(200);
      expect(Object.keys(response.body).length).toBeGreaterThan(0);
    });

    it("is refused the organization context of an organization the User is not a member of", async () => {
      const { org: foreign } = await betterAuthHelper.createOrganizationAndUserWithCookie();

      const response = await request(app.getHttpServer())
        .get(`${API_PATH}/policies/organizations/${foreign.id}`)
        .set("Authorization", bearer(accessToken))
        .set(ORGANIZATION_ID_HEADER, foreign.id);

      expect(response.status).toBe(403);
    });

    it("is refused the members of an organization the User is not a member of", async () => {
      const { org: foreign } = await betterAuthHelper.createOrganizationAndUserWithCookie();

      const response = await request(app.getHttpServer())
        .get(`${API_PATH}/organizations/${foreign.id}/members`)
        .set("Authorization", bearer(accessToken));

      expect(response.status).toBe(403);
    });
  });

  describe("leaves the auth mount to the OAuth Provider", () => {
    it("serves userinfo to a token without open-dpp:api (the plugin judges it, not the guard)", async () => {
      const tokens = await obtainTokens(
        app,
        { email: user.email, password: TEST_PASSWORD },
        { scope: "openid email" },
      );

      const response = await request(app.getHttpServer())
        .get(`${AUTH_PATH}/oauth2/userinfo`)
        .set("Authorization", bearer(tokens.access_token));

      expect(response.status).toBe(200);
      expect(response.body).toEqual(expect.objectContaining({ sub: user.id, email: user.email }));
    });

    it("serves userinfo to the full token as well", async () => {
      const response = await request(app.getHttpServer())
        .get(`${AUTH_PATH}/oauth2/userinfo`)
        .set("Authorization", bearer(accessToken));

      expect(response.status).toBe(200);
      expect(response.body.sub).toBe(user.id);
    });

    it("lets the plugin answer a forged bearer on its own endpoints", async () => {
      const response = await request(app.getHttpServer())
        .get(`${AUTH_PATH}/oauth2/userinfo`)
        .set("Authorization", bearer(tampered(accessToken)));

      // not served, and not the guard's verdict either: the plugin's own error handling
      // answers (in 1.6.17 a signature failure surfaces as its SERVER_ERROR)
      expect(response.status).not.toBe(200);
      expect(response.body).not.toEqual({
        code: "UNAUTHORIZED",
        message: "Invalid or expired access token",
      });
    });
  });

  describe("refuses", () => {
    it("a token without the open-dpp:api scope with 401", async () => {
      const tokens = await obtainTokens(
        app,
        { email: user.email, password: TEST_PASSWORD },
        { scope: "openid profile email" },
      );

      const response = await request(app.getHttpServer())
        .get(`${API_PATH}/organizations/member`)
        .set("Authorization", bearer(tokens.access_token));

      expect(response.status).toBe(401);
      expect(response.body).toEqual({
        code: "UNAUTHORIZED",
        message: "Invalid or expired access token",
      });
    });

    it("an opaque token (exchange without resource) with 401", async () => {
      const tokens = await obtainTokens(
        app,
        { email: user.email, password: TEST_PASSWORD },
        { resource: null },
      );
      expect(tokens.access_token.split(".")).not.toHaveLength(3);

      const response = await request(app.getHttpServer())
        .get(`${API_PATH}/organizations/member`)
        .set("Authorization", bearer(tokens.access_token));

      expect(response.status).toBe(401);
    });

    it("a tampered token with 401", async () => {
      const response = await request(app.getHttpServer())
        .get(`${API_PATH}/organizations/member`)
        .set("Authorization", bearer(tampered(accessToken)));

      expect(response.status).toBe(401);
    });

    it("a token on a session-only endpoint with 403", async () => {
      const response = await request(app.getHttpServer())
        .get(`${API_PATH}/users/me/api-keys`)
        .set("Authorization", bearer(accessToken));

      expect(response.status).toBe(403);
    });

    it("a request without any credential as before", async () => {
      const response = await request(app.getHttpServer()).get(`${API_PATH}/organizations/member`);

      expect(response.status).toBe(403);
    });
  });
});
