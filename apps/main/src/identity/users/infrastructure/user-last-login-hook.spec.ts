import { afterAll, beforeAll, beforeEach, describe, expect, it, jest } from "@jest/globals";
import type { Logger } from "@nestjs/common";
import { getConnectionToken, MongooseModule } from "@nestjs/mongoose";
import { Test, TestingModule } from "@nestjs/testing";
import { EnvModule, EnvService } from "@open-dpp/env";
import type { Db } from "mongodb";
import { type Connection, Types } from "mongoose";
import { generateMongoConfig } from "../../../database/config";
import { recordLastLogin } from "./user-last-login-hook";

const USER_COLLECTION = "user";

describe("recordLastLogin", () => {
  let module: TestingModule;
  let connection: Connection;
  let db: Db;
  let logger: Logger;

  beforeAll(async () => {
    module = await Test.createTestingModule({
      imports: [
        EnvModule.forRoot(),
        MongooseModule.forRootAsync({
          imports: [EnvModule],
          useFactory: (configService: EnvService) => generateMongoConfig(configService),
          inject: [EnvService],
        }),
      ],
    }).compile();

    connection = module.get(getConnectionToken());
    const rawDb = connection.db;
    if (!rawDb) {
      throw new Error("Database connection not established");
    }
    db = rawDb;
  });

  afterAll(async () => {
    await module.close();
  });

  beforeEach(async () => {
    await db.collection(USER_COLLECTION).deleteMany({});
    logger = { log: jest.fn(), warn: jest.fn(), error: jest.fn() } as unknown as Logger;
  });

  const seedUser = async (overrides: Partial<Record<string, unknown>> = {}) => {
    const row: Record<string, unknown> = {
      _id: "user-1",
      email: "user-1@example.com",
      lastLoginAt: null,
      ...overrides,
    };
    await db.collection(USER_COLLECTION).insertOne(row as any);
    return row;
  };

  const lastLoginAtOf = async (id: unknown) =>
    (await db.collection(USER_COLLECTION).findOne({ _id: id as any }))?.lastLoginAt;

  const session = (overrides: Partial<Record<string, unknown>> = {}) => ({
    userId: "user-1",
    createdAt: new Date("2026-10-01T08:00:00Z"),
    updatedAt: new Date("2026-10-20T08:00:00Z"),
    impersonatedBy: null,
    ...overrides,
  });

  it("stores the session's updatedAt so refreshed sessions count as activity", async () => {
    await seedUser();

    await recordLastLogin(db, logger, session());

    expect(await lastLoginAtOf("user-1")).toEqual(new Date("2026-10-20T08:00:00Z"));
  });

  it("matches users stored with an ObjectId _id", async () => {
    const objectId = new Types.ObjectId();
    await seedUser({ _id: objectId });

    await recordLastLogin(db, logger, session({ userId: objectId.toString() }));

    expect(await lastLoginAtOf(objectId)).toEqual(new Date("2026-10-20T08:00:00Z"));
  });

  it("never moves lastLoginAt backwards", async () => {
    await seedUser({ lastLoginAt: new Date("2026-10-25T08:00:00Z") });

    await recordLastLogin(db, logger, session());

    expect(await lastLoginAtOf("user-1")).toEqual(new Date("2026-10-25T08:00:00Z"));
  });

  it("ignores impersonated sessions", async () => {
    await seedUser();

    await recordLastLogin(db, logger, session({ impersonatedBy: "admin-1" }));

    expect(await lastLoginAtOf("user-1")).toBeNull();
  });

  it("ignores a session the update hook could not find", async () => {
    await seedUser();

    await expect(recordLastLogin(db, logger, null)).resolves.toBeUndefined();
    expect(await lastLoginAtOf("user-1")).toBeNull();
  });

  it("logs instead of throwing when the write fails, so sign-in is not blocked", async () => {
    const failure = new Error("write failed");
    const failingDb = {
      collection: () => ({ updateOne: () => Promise.reject(failure) }),
    } as unknown as Db;

    await expect(recordLastLogin(failingDb, logger, session())).resolves.toBeUndefined();
    expect(logger.error).toHaveBeenCalledWith("Failed to record last login", failure);
  });
});
