import { type Mock, beforeEach, describe, expect, it, vi } from "vitest";
import { Logger } from "@nestjs/common";
import type { EnvService } from "@open-dpp/env";
import type { Db } from "mongodb";
import { ensureAdminSeeded } from "./auth.provider";

describe("ensureAdminSeeded", () => {
  const ADMIN_ENV = {
    OPEN_DPP_AUTH_ADMIN_USERNAME: "admin@open-dpp.test",
    OPEN_DPP_AUTH_ADMIN_PASSWORD: "super-secret-password",
  } as Record<string, string | undefined>;

  type FindOneFn = (...args: unknown[]) => Promise<{ _id: string } | null>;
  type CreateUserFn = (...args: unknown[]) => Promise<unknown>;

  let findOne: Mock<FindOneFn>;
  let createUser: Mock<CreateUserFn>;
  let collection: Mock;
  let db: Db;
  let auth: { api: Record<string, any> };
  let logger: Logger;

  function makeConfig(env: Record<string, string | undefined>): EnvService {
    return { get: vi.fn((key: string) => env[key]) } as unknown as EnvService;
  }

  beforeEach(() => {
    findOne = vi.fn<FindOneFn>();
    createUser = vi.fn<CreateUserFn>();
    collection = vi.fn(() => ({ findOne }));
    db = { collection } as unknown as Db;
    auth = { api: { createUser } };
    logger = { log: vi.fn(), warn: vi.fn(), error: vi.fn() } as unknown as Logger;
  });

  it("does nothing when the admin env credentials are not provided", async () => {
    await ensureAdminSeeded(db, auth, makeConfig({}), logger);

    expect(collection).not.toHaveBeenCalled();
    expect(createUser).not.toHaveBeenCalled();
  });

  it("skips seeding when an admin already exists (the I1 regression guard)", async () => {
    findOne.mockResolvedValue({ _id: "existing-admin" });

    await ensureAdminSeeded(db, auth, makeConfig(ADMIN_ENV), logger);

    expect(collection).toHaveBeenCalledWith("user");
    expect(findOne).toHaveBeenCalledWith({ role: "admin" }, { projection: { _id: 1 } });
    expect(createUser).not.toHaveBeenCalled();
    expect(logger.log).toHaveBeenCalledWith(
      "Admin account already exists; skipping admin seeding.",
    );
  });

  it("creates the env admin only when no admin exists", async () => {
    findOne.mockResolvedValue(null);
    createUser.mockResolvedValue({});

    await ensureAdminSeeded(db, auth, makeConfig(ADMIN_ENV), logger);

    expect(createUser).toHaveBeenCalledTimes(1);
    expect(createUser).toHaveBeenCalledWith(
      expect.objectContaining({
        body: expect.objectContaining({
          email: ADMIN_ENV.OPEN_DPP_AUTH_ADMIN_USERNAME,
          password: ADMIN_ENV.OPEN_DPP_AUTH_ADMIN_PASSWORD,
          role: "admin",
        }),
      }),
    );
    expect(logger.log).toHaveBeenCalledWith("Admin Account created");
  });

  it("logs and swallows errors from createUser instead of crashing startup", async () => {
    findOne.mockResolvedValue(null);
    createUser.mockRejectedValue(new Error("boom"));

    await expect(
      ensureAdminSeeded(db, auth, makeConfig(ADMIN_ENV), logger),
    ).resolves.toBeUndefined();

    expect(logger.error).toHaveBeenCalled();
  });
});
