// Must stay the first import: it enables the OAuth Provider before the auth module validates env.
import { TEST_TRUSTED_CLIENT } from "./trusted-client.test-env";
import { randomUUID } from "node:crypto";
import { afterEach, describe, expect, it } from "@jest/globals";
import type { INestApplication } from "@nestjs/common";
import { ObjectId } from "mongodb";
import type { Connection } from "mongoose";
import { hashClientSecret } from "./client-secret";
import { bootAuthTestApp } from "./oauth-provider.test-app";
import { OAUTH_CLIENT_MODEL } from "./trusted-client-upsert";

/** The stored row for the env-configured Trusted Client, as the plugin reads it. */
const EXPECTED_ROW = {
  clientId: TEST_TRUSTED_CLIENT.clientId,
  clientSecret: hashClientSecret(TEST_TRUSTED_CLIENT.clientSecret),
  name: TEST_TRUSTED_CLIENT.clientId,
  redirectUris: TEST_TRUSTED_CLIENT.redirectUris,
  tokenEndpointAuthMethod: "client_secret_basic",
  grantTypes: ["authorization_code", "refresh_token"],
  responseTypes: ["code"],
  type: "web",
  public: false,
  skipConsent: true,
  requirePKCE: true,
  scopes: ["openid", "profile", "email", "offline_access", "open-dpp:api"],
  disabled: false,
};

function oauthClients(connection: Connection) {
  const db = connection.db;
  if (!db) {
    throw new Error("Database connection not established");
  }
  return db.collection(OAUTH_CLIENT_MODEL);
}

describe("Trusted Client bootstrap", () => {
  const apps: INestApplication[] = [];

  async function boot(dbName: string) {
    const testApp = await bootAuthTestApp({ dbName });
    apps.push(testApp.app);
    return testApp;
  }

  afterEach(async () => {
    await Promise.all(apps.splice(0).map((app) => app.close()));
  });

  it("stores the env-configured Trusted Client on startup", async () => {
    const { connection } = await boot(`test-${randomUUID()}`);

    const rows = await oauthClients(connection).find({}).toArray();

    expect(rows).toEqual([
      {
        ...EXPECTED_ROW,
        _id: expect.any(ObjectId),
        createdAt: expect.any(Date),
        updatedAt: expect.any(Date),
      },
    ]);
  });

  it("enforces one row per client id with a unique index", async () => {
    const { connection } = await boot(`test-${randomUUID()}`);

    const indexes = await oauthClients(connection).indexes();

    expect(indexes).toContainEqual(expect.objectContaining({ key: { clientId: 1 }, unique: true }));
  });

  it("brings a drifted row back to the env values on the next boot, keeping one row", async () => {
    const dbName = `test-${randomUUID()}`;
    const first = await boot(dbName);
    const [created] = await oauthClients(first.connection).find({}).toArray();
    await oauthClients(first.connection).updateOne(
      { clientId: TEST_TRUSTED_CLIENT.clientId },
      {
        $set: {
          clientSecret: hashClientSecret("rotated-away"),
          redirectUris: ["https://stale.example.com/callback"],
          name: "stale name",
          disabled: true,
        },
      },
    );
    await first.app.close();
    apps.splice(0);

    const second = await boot(dbName);
    const rows = await oauthClients(second.connection).find({}).toArray();

    expect(rows).toEqual([
      expect.objectContaining({
        ...EXPECTED_ROW,
        _id: created._id,
        createdAt: created.createdAt,
      }),
    ]);
    expect(rows[0].updatedAt.getTime()).toBeGreaterThanOrEqual(created.updatedAt.getTime());
  });
});
