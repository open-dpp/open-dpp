import type { INestApplication } from "@nestjs/common";
import type { Auth } from "better-auth";
import { describe, expect, it, jest } from "@jest/globals";
import { getConnectionToken, MongooseModule } from "@nestjs/mongoose";
import { Test } from "@nestjs/testing";
import { EnvModule, EnvService } from "@open-dpp/env";
import { Connection, Schema as MongooseSchema } from "mongoose";
import { BetterAuthHelper } from "../../../../../test/better-auth-helper";
import { generateMongoConfig } from "../../../../database/config";
import { EmailService } from "../../../../email/email.service";
import { UsersService } from "../../../users/application/services/users.service";
import { AccountSchema } from "../../../users/infrastructure/schemas/account.schema";
import { UserSchema } from "../../../users/infrastructure/schemas/user.schema";
import { UsersModule } from "../../../users/users.module";
import { AuthModule } from "../../auth.module";
import { AUTH } from "../../auth.provider";
import { SessionSchema } from "./session.schema";

function getSchemaFieldNames(schema: MongooseSchema): Set<string> {
  return new Set(Object.keys(schema.paths));
}

/**
 * These tests verify that the custom Mongoose schemas stay in sync with
 * what Better Auth actually writes to MongoDB via its mongodbAdapter.
 *
 * If a Better Auth upgrade changes the document structure (adds, renames,
 * or removes fields), these tests will fail, signaling that the
 * corresponding Mongoose schemas and mappers need to be updated.
 */
describe("Better Auth Schema Sync", () => {
  let app: INestApplication;
  let mongoConnection: Connection;
  const betterAuthHelper = new BetterAuthHelper();

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [
        EnvModule.forRoot(),
        MongooseModule.forRootAsync({
          imports: [EnvModule],
          useFactory: (configService: EnvService) => ({
            ...generateMongoConfig(configService),
          }),
          inject: [EnvService],
        }),
        AuthModule,
        UsersModule,
      ],
    }).overrideProvider(EmailService).useValue({
      send: jest.fn(),
    }).compile();

    betterAuthHelper.init(
      moduleRef.get<UsersService>(UsersService),
      moduleRef.get<Auth>(AUTH),
    );

    mongoConnection = moduleRef.get<Connection>(getConnectionToken());
    app = moduleRef.createNestApplication();
    await app.init();

    const { user } = await betterAuthHelper.createUser();
    await betterAuthHelper.signAsUser(user.id);
  });

  afterAll(async () => {
    if (app) {
      await app.close();
    }
  });

  it("user collection fields should match User Mongoose schema", async () => {
    const db = mongoConnection.db;
    if (!db)
      throw new Error("MongoDB connection not established");
    const rawUser = await db.collection("user").findOne({});
    if (!rawUser)
      throw new Error("user collection is empty — Better Auth did not create a user document");

    const rawFields = Object.keys(rawUser);
    const schemaFields = getSchemaFieldNames(UserSchema);
    const unknownFields = rawFields.filter(f => !schemaFields.has(f));

    expect(unknownFields).toEqual([]);
  });

  it("session collection fields should match Session Mongoose schema", async () => {
    const db = mongoConnection.db;
    if (!db)
      throw new Error("MongoDB connection not established");
    const rawSession = await db.collection("session").findOne({});
    if (!rawSession)
      throw new Error("session collection is empty — Better Auth did not create a session document");

    const rawFields = Object.keys(rawSession);
    const schemaFields = getSchemaFieldNames(SessionSchema);
    const unknownFields = rawFields.filter(f => !schemaFields.has(f));

    expect(unknownFields).toEqual([]);
  });

  it("account collection fields should match Account Mongoose schema", async () => {
    const db = mongoConnection.db;
    if (!db)
      throw new Error("MongoDB connection not established");
    const rawAccount = await db.collection("account").findOne({});
    if (!rawAccount)
      throw new Error("account collection is empty — Better Auth did not create an account document");

    const rawFields = Object.keys(rawAccount);
    const schemaFields = getSchemaFieldNames(AccountSchema);
    const unknownFields = rawFields.filter(f => !schemaFields.has(f));

    expect(unknownFields).toEqual([]);
  });
});
