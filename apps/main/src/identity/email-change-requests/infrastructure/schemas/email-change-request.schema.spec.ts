import type { Connection, Model } from "mongoose";
import { describe, expect, it } from "@jest/globals";
import { getConnectionToken, MongooseModule } from "@nestjs/mongoose";
import { Test, TestingModule } from "@nestjs/testing";
import { EnvModule, EnvService } from "@open-dpp/env";
import { generateMongoConfig } from "../../../../database/config";
import {
  EMAIL_CHANGE_REQUEST_TTL_SECONDS,
  EmailChangeRequest,
  EmailChangeRequestSchema,
} from "./email-change-request.schema";

describe("emailChangeRequestSchema", () => {
  let mongoConnection: Connection;
  let EmailChangeRequestModel: Model<EmailChangeRequest>;
  let module: TestingModule;

  beforeAll(async () => {
    module = await Test.createTestingModule({
      imports: [
        EnvModule.forRoot(),
        MongooseModule.forRootAsync({
          imports: [EnvModule],
          useFactory: (configService: EnvService) => ({
            ...generateMongoConfig(configService),
          }),
          inject: [EnvService],
        }),
        MongooseModule.forFeature([
          { name: EmailChangeRequest.name, schema: EmailChangeRequestSchema },
        ]),
      ],
    }).compile();
    mongoConnection = module.get<Connection>(getConnectionToken());
    EmailChangeRequestModel = mongoConnection.model(
      EmailChangeRequest.name,
      EmailChangeRequestSchema,
    );
  });

  afterEach(async () => {
    const collections = mongoConnection.collections;
    for (const key in collections) {
      await collections[key].deleteMany({});
    }
  });

  afterAll(async () => {
    await mongoConnection.dropDatabase();
    await module.close();
  });

  it("creates a document carrying previousEmail", async () => {
    const data = {
      _id: "req-1",
      userId: "user-1",
      newEmail: "new@example.com",
      previousEmail: "old@example.com",
      requestedAt: new Date(),
    };

    const saved = await new EmailChangeRequestModel(data).save();

    expect(saved._id).toBe(data._id);
    expect(saved.userId).toBe(data.userId);
    expect(saved.newEmail).toBe(data.newEmail);
    expect(saved.previousEmail).toBe(data.previousEmail);
  });

  it("requires previousEmail", async () => {
    const doc = new EmailChangeRequestModel({
      _id: "req-1",
      userId: "user-1",
      newEmail: "new@example.com",
      requestedAt: new Date(),
    });

    let err: any;
    try {
      await doc.save();
    } catch (error) {
      err = error;
    }

    expect(err).toBeDefined();
    expect(err.errors.previousEmail).toBeDefined();
  });

  describe("indexes", () => {
    const findIndex = (key: string) =>
      EmailChangeRequestSchema.indexes().filter(([fields]) =>
        Object.prototype.hasOwnProperty.call(fields, key),
      );

    it("keeps a unique index on userId (at most one outstanding request per user)", () => {
      const userIdIndexes = findIndex("userId");
      expect(userIdIndexes.length).toBeGreaterThanOrEqual(1);
      expect(userIdIndexes.some(([, options]) => options?.unique === true)).toBe(true);
    });

    it("declares a TTL index on requestedAt aligned to EMAIL_CHANGE_REQUEST_TTL_SECONDS", () => {
      const requestedAtIndexes = findIndex("requestedAt");
      expect(requestedAtIndexes.length).toBeGreaterThanOrEqual(1);
      expect(
        requestedAtIndexes.some(
          ([, options]) => options?.expireAfterSeconds === EMAIL_CHANGE_REQUEST_TTL_SECONDS,
        ),
      ).toBe(true);
    });

    it("does NOT declare a unique index on newEmail (no cross-user address reservation)", () => {
      const newEmailUniqueIndexes = findIndex("newEmail").filter(
        ([, options]) => options?.unique === true,
      );
      expect(newEmailUniqueIndexes).toHaveLength(0);
    });
  });

  it("exposes a TTL constant of 3600 seconds", () => {
    expect(EMAIL_CHANGE_REQUEST_TTL_SECONDS).toBe(3600);
  });
});
