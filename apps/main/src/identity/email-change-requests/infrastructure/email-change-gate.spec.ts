import { randomUUID } from "node:crypto";
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "@jest/globals";
import { getConnectionToken, MongooseModule } from "@nestjs/mongoose";
import { Test, TestingModule } from "@nestjs/testing";
import { EnvModule, EnvService } from "@open-dpp/env";
import type { Db } from "mongodb";
import type { Connection } from "mongoose";
import { generateMongoConfig } from "../../../database/config";
import {
  deletePendingEmailChangeForUser,
  findPendingEmailChangeForUser,
} from "./email-change-gate";
import {
  EMAIL_CHANGE_REQUEST_COLLECTION,
  EmailChangeRequest as EmailChangeRequestSchemaClass,
  EmailChangeRequestSchema,
} from "./schemas/email-change-request.schema";

describe("email-change-gate", () => {
  let module: TestingModule;
  let connection: Connection;
  let db: Db;

  beforeAll(async () => {
    module = await Test.createTestingModule({
      imports: [
        EnvModule.forRoot(),
        MongooseModule.forRootAsync({
          imports: [EnvModule],
          useFactory: (configService: EnvService) => generateMongoConfig(configService),
          inject: [EnvService],
        }),
        MongooseModule.forFeature([
          { name: EmailChangeRequestSchemaClass.name, schema: EmailChangeRequestSchema },
        ]),
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
    await db.collection(EMAIL_CHANGE_REQUEST_COLLECTION).deleteMany({});
  });

  const seedRow = async (overrides: Partial<Record<string, unknown>> = {}) => {
    const row: Record<string, unknown> = {
      _id: randomUUID() as string,
      userId: "user-1",
      newEmail: "new@example.com",
      previousEmail: "old@example.com",
      requestedAt: new Date("2026-05-02T10:00:00Z"),
      _schemaVersion: "1.0.0",
      ...overrides,
    };
    await db.collection(EMAIL_CHANGE_REQUEST_COLLECTION).insertOne(row);
    return row;
  };

  describe("findPendingEmailChangeForUser", () => {
    it("returns the mapped row (including previousEmail) when one exists for the user", async () => {
      const seeded = await seedRow();

      const found = await findPendingEmailChangeForUser(db, "user-1");

      expect(found).toEqual({
        id: seeded._id,
        userId: "user-1",
        newEmail: "new@example.com",
        previousEmail: "old@example.com",
        requestedAt: new Date("2026-05-02T10:00:00Z"),
      });
    });

    it("returns null when no row exists for the user", async () => {
      await seedRow({ userId: "someone-else" });

      expect(await findPendingEmailChangeForUser(db, "user-1")).toBeNull();
    });

    it("scopes the lookup to the given userId", async () => {
      await seedRow({ userId: "user-1", newEmail: "a@example.com" });
      await seedRow({ userId: "user-2", newEmail: "b@example.com" });

      expect((await findPendingEmailChangeForUser(db, "user-2"))?.newEmail).toBe("b@example.com");
    });

    it("does not treat an operator-shaped userId as a query operator", async () => {
      await seedRow({ userId: "user-1" });

      const malicious = { $ne: null } as unknown as string;
      expect(await findPendingEmailChangeForUser(db, malicious)).toBeNull();
    });
  });

  describe("deletePendingEmailChangeForUser", () => {
    it("deletes the row for the given user", async () => {
      await seedRow({ userId: "user-1" });

      await deletePendingEmailChangeForUser(db, "user-1");

      expect(await findPendingEmailChangeForUser(db, "user-1")).toBeNull();
    });

    it("leaves other users' rows untouched", async () => {
      await seedRow({ userId: "user-1", newEmail: "a@example.com" });
      await seedRow({ userId: "user-2", newEmail: "b@example.com" });

      await deletePendingEmailChangeForUser(db, "user-1");

      expect(await findPendingEmailChangeForUser(db, "user-1")).toBeNull();
      expect((await findPendingEmailChangeForUser(db, "user-2"))?.newEmail).toBe("b@example.com");
    });

    it("is a no-op when no row exists for the user", async () => {
      await expect(deletePendingEmailChangeForUser(db, "does-not-exist")).resolves.not.toThrow();
    });

    it("does not delete anything for an operator-shaped userId", async () => {
      await seedRow({ userId: "user-1" });

      const malicious = { $ne: null } as unknown as string;
      await deletePendingEmailChangeForUser(db, malicious);

      expect(await findPendingEmailChangeForUser(db, "user-1")).not.toBeNull();
    });
  });
});
