// Must stay the first import: it links the legal documents before the env is validated.
import "../../../test/legal-links.test-env";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import type { INestApplication } from "@nestjs/common";
import { EventEmitterModule } from "@nestjs/event-emitter";
import request from "supertest";
import { TEST_LEGAL_LINKS } from "../../../test/legal-links.test-env";
import { BetterAuthHelper } from "../../../test/better-auth-helper";
import {
  API_PATH,
  createAuthTestContext,
} from "../../identity/auth/infrastructure/oauth-provider/auth.test.context";
import { InstanceSettingsModule } from "../instance-settings.module";

describe("InstanceSettingsController — public settings", () => {
  let app: INestApplication;
  let betterAuthHelper: BetterAuthHelper;

  beforeAll(async () => {
    const testApp = await createAuthTestContext({
      imports: [EventEmitterModule.forRoot(), InstanceSettingsModule],
      withAuthGuard: true,
    });
    app = testApp.app;
    betterAuthHelper = testApp.betterAuthHelper;
  });

  afterAll(async () => {
    await app.close();
  });

  function getPublicSettings(cookie?: string) {
    const pending = request(app.getHttpServer()).get(`${API_PATH}/instance-settings/public`);
    return cookie ? pending.set("Cookie", cookie) : pending;
  }

  it("shows the legal links to anonymous visitors", async () => {
    const response = await getPublicSettings();

    expect(response.status).toBe(200);
    expect(response.body.legalLinks).toEqual(TEST_LEGAL_LINKS);
    expect(response.body).not.toHaveProperty("organizationCreationEnabled");
  });

  it("shows the legal links to signed-in users", async () => {
    const { user } = await betterAuthHelper.createUser();
    const cookie = await betterAuthHelper.signAsUser(user.id);

    const response = await getPublicSettings(cookie);

    expect(response.status).toBe(200);
    expect(response.body.legalLinks).toEqual(TEST_LEGAL_LINKS);
    expect(response.body.organizationCreationEnabled).toEqual(expect.any(Boolean));
  });
});
