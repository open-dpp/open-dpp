import { afterAll, beforeAll, beforeEach, describe, expect, it } from "@jest/globals";
import { getConnectionToken, MongooseModule } from "@nestjs/mongoose";
import { Test, TestingModule } from "@nestjs/testing";
import { EnvModule, EnvService } from "@open-dpp/env";
import { Connection } from "mongoose";
import { generateMongoConfig } from "../../../../database/config";
import { EmailChangeRequest } from "../../domain/email-change-request";
import {
  EMAIL_CHANGE_REQUEST_COLLECTION,
  EmailChangeRequest as EmailChangeRequestSchemaClass,
  EmailChangeRequestSchema,
} from "../schemas/email-change-request.schema";
import { EmailChangeRequestsRepository } from "./email-change-requests.repository";

describe("EmailChangeRequestsRepository", () => {
  let module: TestingModule;
  let repository: EmailChangeRequestsRepository;
  let connection: Connection;

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
      providers: [EmailChangeRequestsRepository],
    }).compile();

    repository = module.get(EmailChangeRequestsRepository);
    connection = module.get(getConnectionToken());

    await connection.model(EmailChangeRequestSchemaClass.name).syncIndexes();
  });

  afterAll(async () => {
    await module.close();
  });

  beforeEach(async () => {
    await connection.collection(EMAIL_CHANGE_REQUEST_COLLECTION).deleteMany({});
  });

  it("saves and finds by userId", async () => {
    const request = EmailChangeRequest.create({ userId: "user-1", newEmail: "new@example.com" });
    await repository.save(request);

    const found = await repository.findByUserId("user-1");
    expect(found).not.toBeNull();
    expect(found?.userId).toBe("user-1");
    expect(found?.newEmail).toBe("new@example.com");
    expect(found?.id).toBe(request.id);
    expect(found?.requestedAt.getTime()).toBe(request.requestedAt.getTime());
  });

  it("returns null when no request exists for userId", async () => {
    const found = await repository.findByUserId("does-not-exist");
    expect(found).toBeNull();
  });

  it("rejects a second request for the same userId (unique index)", async () => {
    await repository.save(
      EmailChangeRequest.create({ userId: "user-1", newEmail: "first@example.com" }),
    );
    await expect(
      repository.save(
        EmailChangeRequest.create({ userId: "user-1", newEmail: "second@example.com" }),
      ),
    ).rejects.toThrow();
  });

  it("rejects a second user holding a pending change to the same newEmail (partial unique index on newEmail)", async () => {
    await repository.save(
      EmailChangeRequest.create({ userId: "user-1", newEmail: "shared@example.com" }),
    );
    await expect(
      repository.save(
        EmailChangeRequest.create({ userId: "user-2", newEmail: "shared@example.com" }),
      ),
    ).rejects.toThrow();
  });

  it("upserts by userId: inserts when no row exists", async () => {
    const request = EmailChangeRequest.create({ userId: "user-1", newEmail: "first@example.com" });
    await repository.upsertByUserId(request);

    const found = await repository.findByUserId("user-1");
    expect(found?.id).toBe(request.id);
    expect(found?.newEmail).toBe("first@example.com");
  });

  it("upserts by userId: replaces an existing row atomically", async () => {
    await repository.save(
      EmailChangeRequest.create({ userId: "user-1", newEmail: "first@example.com" }),
    );

    const replacement = EmailChangeRequest.create({
      userId: "user-1",
      newEmail: "second@example.com",
    });
    await repository.upsertByUserId(replacement);

    const found = await repository.findByUserId("user-1");
    expect(found?.id).toBe(replacement.id);
    expect(found?.newEmail).toBe("second@example.com");
  });

  it("deletes by userId", async () => {
    await repository.save(
      EmailChangeRequest.create({ userId: "user-1", newEmail: "new@example.com" }),
    );
    await repository.deleteByUserId("user-1");
    expect(await repository.findByUserId("user-1")).toBeNull();
  });

  it("delete is idempotent for missing userId", async () => {
    await expect(repository.deleteByUserId("does-not-exist")).resolves.not.toThrow();
  });

  describe("NoSQL injection defense", () => {
    it("findByUserId rejects an operator-shaped userId (Mongoose cast error from $eq + schema)", async () => {
      await repository.save(
        EmailChangeRequest.create({ userId: "user-1", newEmail: "new@example.com" }),
      );

      const malicious = { $ne: null } as unknown as string;
      await expect(repository.findByUserId(malicious)).rejects.toThrow();
      expect(await repository.findByUserId("user-1")).not.toBeNull();
    });

    it("deleteByUserId rejects an operator-shaped userId without deleting any rows", async () => {
      await repository.save(
        EmailChangeRequest.create({ userId: "user-1", newEmail: "new@example.com" }),
      );

      const malicious = { $ne: null } as unknown as string;
      await expect(repository.deleteByUserId(malicious)).rejects.toThrow();
      expect(await repository.findByUserId("user-1")).not.toBeNull();
    });
  });
});
