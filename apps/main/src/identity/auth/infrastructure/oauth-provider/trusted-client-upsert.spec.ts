import { beforeEach, describe, expect, it, jest } from "@jest/globals";
import type { Logger } from "@nestjs/common";
import type { TrustedClientEnv } from "@open-dpp/env";
import type { Db } from "mongodb";
import { verifyClientSecret } from "./client-secret";
import {
  ensureTrustedClientUpserted,
  OAUTH_CLIENT_MODEL,
  type OAuthClientAdapter,
} from "./trusted-client-upsert";

const TRUSTED_CLIENT: TrustedClientEnv = {
  clientId: "landing-page",
  clientSecret: "landing-page-secret",
  redirectUris: ["https://landing.example.com/auth/callback"],
  clientName: "Landing page",
};

/** The row the OAuth Provider plugin expects for a confidential, consent-free web client. */
const EXPECTED_ROW = {
  clientId: "landing-page",
  // salted scrypt: never the secret itself, verified below rather than compared
  clientSecret: expect.any(String),
  name: "Landing page",
  redirectUris: ["https://landing.example.com/auth/callback"],
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

const WHERE_CLIENT_ID = [{ field: "clientId", value: "landing-page" }];

describe("ensureTrustedClientUpserted", () => {
  let findOne: jest.Mock<OAuthClientAdapter["findOne"]>;
  let create: jest.Mock<OAuthClientAdapter["create"]>;
  let update: jest.Mock<OAuthClientAdapter["update"]>;
  let createIndex: jest.Mock<(...args: unknown[]) => Promise<string>>;
  let adapter: OAuthClientAdapter;
  let db: Db;
  let logger: Logger;

  beforeEach(() => {
    findOne = jest.fn<OAuthClientAdapter["findOne"]>().mockResolvedValue(null);
    create = jest.fn<OAuthClientAdapter["create"]>().mockResolvedValue({});
    update = jest.fn<OAuthClientAdapter["update"]>().mockResolvedValue({});
    createIndex = jest
      .fn<(...args: unknown[]) => Promise<string>>()
      .mockResolvedValue("clientId_1");
    adapter = { findOne, create, update };
    db = { collection: jest.fn(() => ({ createIndex })) } as unknown as Db;
    logger = { log: jest.fn(), warn: jest.fn(), error: jest.fn() } as unknown as Logger;
  });

  it("creates the Trusted Client row when none exists", async () => {
    await ensureTrustedClientUpserted(db, adapter, TRUSTED_CLIENT, logger);

    expect(findOne).toHaveBeenCalledWith({ model: OAUTH_CLIENT_MODEL, where: WHERE_CLIENT_ID });
    expect(create).toHaveBeenCalledTimes(1);
    expect(create).toHaveBeenCalledWith({
      model: OAUTH_CLIENT_MODEL,
      data: { ...EXPECTED_ROW, createdAt: expect.any(Date), updatedAt: expect.any(Date) },
    });
    expect(update).not.toHaveBeenCalled();
    expect(logger.log).toHaveBeenCalledWith('Trusted Client "landing-page" created');

    const stored = create.mock.calls[0][0].data.clientSecret as string;
    expect(stored).not.toBe(TRUSTED_CLIENT.clientSecret);
    await expect(verifyClientSecret(TRUSTED_CLIENT.clientSecret, stored)).resolves.toBe(true);
  });

  it("refreshes an existing row with the latest env values and keeps its creation date", async () => {
    findOne.mockResolvedValue({ id: "68d0", clientId: "landing-page", clientSecret: "stale" });

    await ensureTrustedClientUpserted(db, adapter, TRUSTED_CLIENT, logger);

    expect(create).not.toHaveBeenCalled();
    expect(update).toHaveBeenCalledTimes(1);
    expect(update).toHaveBeenCalledWith({
      model: OAUTH_CLIENT_MODEL,
      where: WHERE_CLIENT_ID,
      update: { ...EXPECTED_ROW, updatedAt: expect.any(Date) },
    });
    expect(logger.log).toHaveBeenCalledWith('Trusted Client "landing-page" updated');

    const stored = update.mock.calls[0][0].update.clientSecret as string;
    expect(stored).not.toBe(TRUSTED_CLIENT.clientSecret);
    await expect(verifyClientSecret(TRUSTED_CLIENT.clientSecret, stored)).resolves.toBe(true);
  });

  it("converges on an update when a sibling replica wins the first-boot race", async () => {
    // MongoDB's duplicate-key error on the unique clientId index, as the driver raises it
    create.mockRejectedValue(Object.assign(new Error("E11000 duplicate key"), { code: 11000 }));

    await ensureTrustedClientUpserted(db, adapter, TRUSTED_CLIENT, logger);

    expect(update).toHaveBeenCalledWith({
      model: OAUTH_CLIENT_MODEL,
      where: WHERE_CLIENT_ID,
      update: { ...EXPECTED_ROW, updatedAt: expect.any(Date) },
    });
    expect(logger.error).not.toHaveBeenCalled();
    expect(logger.log).toHaveBeenCalledWith('Trusted Client "landing-page" updated');
  });

  it("guards the first-boot race with a unique index on clientId before writing", async () => {
    const order: string[] = [];
    createIndex.mockImplementation(async () => {
      order.push("index");
      return "clientId_1";
    });
    create.mockImplementation(async () => {
      order.push("create");
      return {};
    });

    await ensureTrustedClientUpserted(db, adapter, TRUSTED_CLIENT, logger);

    expect(db.collection).toHaveBeenCalledWith(OAUTH_CLIENT_MODEL);
    expect(createIndex).toHaveBeenCalledWith({ clientId: 1 }, { unique: true });
    expect(order).toEqual(["index", "create"]);
  });

  it("still upserts when the index cannot be created, and warns", async () => {
    createIndex.mockRejectedValue(new Error("IndexOptionsConflict"));

    await ensureTrustedClientUpserted(db, adapter, TRUSTED_CLIENT, logger);

    expect(create).toHaveBeenCalledTimes(1);
    expect(logger.warn).toHaveBeenCalledWith(
      expect.stringContaining("unique index"),
      expect.any(Error),
    );
  });

  it("logs a failed upsert instead of blocking startup", async () => {
    create.mockRejectedValue(new Error("connection reset"));

    await expect(
      ensureTrustedClientUpserted(db, adapter, TRUSTED_CLIENT, logger),
    ).resolves.toBeUndefined();

    expect(update).not.toHaveBeenCalled();
    expect(logger.error).toHaveBeenCalledWith(
      expect.stringContaining('Trusted Client "landing-page"'),
      expect.any(Error),
    );
  });

  it("names the client after its id when no client name is configured", async () => {
    const { clientName: _unused, ...unnamed } = TRUSTED_CLIENT;

    await ensureTrustedClientUpserted(db, adapter, unnamed, logger);

    expect(create).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ name: "landing-page" }) }),
    );
  });
});
