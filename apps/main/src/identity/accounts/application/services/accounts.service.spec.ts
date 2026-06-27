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
import { AccountsService } from "./accounts.service";

describe("AccountsService.verifyPassword (integration)", () => {
  let app: INestApplication;
  let service: AccountsService;
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
    service = moduleRef.get(AccountsService, { strict: false });
    app = moduleRef.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    if (app) await app.close();
  });

  it("returns true for the correct current password", async () => {
    const { user } = await betterAuthHelper.createUser();
    expect(await service.verifyPassword(user.id, "password1234")).toBe(true);
  });

  it("returns false for an incorrect password", async () => {
    const { user } = await betterAuthHelper.createUser();
    expect(await service.verifyPassword(user.id, "not-the-password")).toBe(false);
  });

  it("returns false when the user has no credential account", async () => {
    expect(await service.verifyPassword(new Types.ObjectId().toString(), "password1234")).toBe(
      false,
    );
  });
});
