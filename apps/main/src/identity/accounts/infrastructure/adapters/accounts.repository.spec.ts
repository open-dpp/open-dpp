import type { INestApplication } from "@nestjs/common";
import type { Auth } from "better-auth";
import { afterAll, beforeAll, describe, expect, it, jest } from "@jest/globals";
import { getConnectionToken, MongooseModule } from "@nestjs/mongoose";
import { Test } from "@nestjs/testing";
import { EnvModule, EnvService } from "@open-dpp/env";
import { Connection, Types } from "mongoose";
import { BetterAuthHelper } from "../../../../../test/better-auth-helper";
import { generateMongoConfig } from "../../../../database/config";
import { EmailService } from "../../../../email/email.service";
import { AuthModule } from "../../../auth/auth.module";
import { AUTH } from "../../../auth/auth.provider";
import { UsersService } from "../../../users/application/services/users.service";
import { UsersModule } from "../../../users/users.module";
import { AccountsModule } from "../../accounts.module";
import { AccountsRepository } from "./accounts.repository";

describe("AccountsRepository (integration)", () => {
  let app: INestApplication;
  let repository: AccountsRepository;
  const betterAuthHelper = new BetterAuthHelper();

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [
        EnvModule.forRoot(),
        MongooseModule.forRootAsync({
          imports: [EnvModule],
          useFactory: (configService: EnvService) => ({ ...generateMongoConfig(configService) }),
          inject: [EnvService],
        }),
        AuthModule,
        UsersModule,
        AccountsModule,
      ],
    })
      .overrideProvider(EmailService)
      .useValue({ send: jest.fn() })
      .compile();

    betterAuthHelper.init(moduleRef.get<UsersService>(UsersService), moduleRef.get<Auth>(AUTH));
    moduleRef.get<Connection>(getConnectionToken());
    repository = moduleRef.get(AccountsRepository, { strict: false });
    app = moduleRef.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    if (app) await app.close();
  });

  it("finds the credential account by string userId, despite Better Auth storing userId as ObjectId", async () => {
    const { user } = await betterAuthHelper.createUser();

    const account = await repository.findCredentialByUserId(user.id);

    expect(account).not.toBeNull();
    expect(account!.userId).toBe(user.id);
    expect(account!.providerId).toBe("credential");
    expect(typeof account!.password).toBe("string");
    expect(account!.password!.length).toBeGreaterThan(0);
  });

  it("returns null when the user has no account", async () => {
    expect(await repository.findCredentialByUserId(new Types.ObjectId().toString())).toBeNull();
  });

  it("does not treat an operator-shaped userId as a query operator", async () => {
    const { user } = await betterAuthHelper.createUser();
    const malicious = { $ne: null } as unknown as string;

    expect(await repository.findCredentialByUserId(malicious)).toBeNull();
    expect(await repository.findCredentialByUserId(user.id)).not.toBeNull();
  });
});
