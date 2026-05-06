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

    // Ensure unique index is built before tests run, so duplicate-key
    // rejections actually fire at the DB level.
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
});
