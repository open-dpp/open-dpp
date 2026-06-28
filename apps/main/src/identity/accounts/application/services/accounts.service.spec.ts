import type { INestApplication } from "@nestjs/common";
import type { Auth } from "better-auth";
import { afterAll, beforeAll, describe, expect, it, jest } from "@jest/globals";
import { Logger } from "@nestjs/common";
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
import { Account } from "../../domain/account";
import { AccountsRepository } from "../../infrastructure/adapters/accounts.repository";
import { AccountsService } from "./accounts.service";

describe("AccountsService.verifyPassword (integration)", () => {
  let app: INestApplication;
  let service: AccountsService;
  let accountsRepository: AccountsRepository;
  let auth: Auth;
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

    auth = moduleRef.get<Auth>(AUTH);
    betterAuthHelper.init(moduleRef.get<UsersService>(UsersService), auth);
    moduleRef.get<Connection>(getConnectionToken());
    service = moduleRef.get(AccountsService, { strict: false });
    accountsRepository = moduleRef.get(AccountsRepository, { strict: false });
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

  it("returns false without calling password.verify when the credential account has no password hash", async () => {
    // Pins the no-hash short-circuit (accounts.service.ts:18): a credential row
    // that carries no stored password must fail closed BEFORE any hash compare,
    // so password.verify is never reached.
    const account = Account.loadFromDb({
      id: new Types.ObjectId().toString(),
      userId: new Types.ObjectId().toString(),
      accountId: "account-without-password",
      providerId: "credential",
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    const context = await auth.$context;
    const lookupSpy = jest
      .spyOn(accountsRepository, "findCredentialByUserId")
      .mockResolvedValueOnce(account);
    const verifySpy = jest.spyOn(context.password, "verify");
    try {
      expect(await service.verifyPassword(account.userId, "password1234")).toBe(false);
      expect(verifySpy).not.toHaveBeenCalled();
    } finally {
      // Restore each spy per test: `service`/repo are shared and `$context` is
      // memoized, so a leaked spy would corrupt sibling tests.
      lookupSpy.mockRestore();
      verifySpy.mockRestore();
    }
  });

  // The next two tests pin the fail-closed contract (accounts.service.ts:23-26):
  // when the lookup OR the hash comparison *throws*, verifyPassword must rethrow
  // (and log) — it must NOT swallow the failure into `false`. Contrast with
  // "returns false for an incorrect password": a wrong password is a clean
  // negative answer, whereas an infrastructure failure must surface loudly and
  // never masquerade as "this password is simply wrong".
  it("rethrows (does not swallow) and logs when the credential lookup fails", async () => {
    const errorSpy = jest.spyOn(Logger.prototype, "error").mockImplementation(() => undefined);
    const lookupSpy = jest
      .spyOn(accountsRepository, "findCredentialByUserId")
      .mockRejectedValueOnce(new Error("db down"));
    try {
      await expect(
        service.verifyPassword(new Types.ObjectId().toString(), "password1234"),
      ).rejects.toThrow("db down");
      expect(errorSpy).toHaveBeenCalled();
    } finally {
      lookupSpy.mockRestore();
      errorSpy.mockRestore();
    }
  });

  it("rethrows and logs when password verification itself throws", async () => {
    const { user } = await betterAuthHelper.createUser();
    const context = await auth.$context;
    const errorSpy = jest.spyOn(Logger.prototype, "error").mockImplementation(() => undefined);
    const verifySpy = jest
      .spyOn(context.password, "verify")
      .mockRejectedValueOnce(new Error("db down"));
    try {
      await expect(service.verifyPassword(user.id, "password1234")).rejects.toThrow("db down");
      expect(errorSpy).toHaveBeenCalled();
    } finally {
      verifySpy.mockRestore();
      errorSpy.mockRestore();
    }
  });
});
