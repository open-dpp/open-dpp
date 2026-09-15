import type { INestApplication } from "@nestjs/common";
import type { Auth } from "better-auth";
import { randomUUID } from "node:crypto";
import { afterAll, beforeAll, describe, expect, it, jest } from "@jest/globals";
import { getConnectionToken, MongooseModule } from "@nestjs/mongoose";
import { Test, TestingModule } from "@nestjs/testing";
import { EnvModule, EnvService } from "@open-dpp/env";
import { type Connection } from "mongoose";
import { generateMongoConfig } from "../../../../database/config";
import { EmailService } from "../../../../email/email.service";
import { User } from "../../../users/domain/user";
import { UserRole } from "../../../users/domain/user-role.enum";
import { UsersRepository } from "../../../users/infrastructure/adapters/users.repository";
import { UsersModule } from "../../../users/users.module";
import { AuthModule } from "../../auth.module";
import { AUTH } from "../../auth.provider";
import {
  PasswordResetTokensRepository,
  RESET_PASSWORD_IDENTIFIER_PREFIX,
} from "./password-reset-tokens.repository";

const SEED_PASSWORD = "seed-password-1234";

describe("PasswordResetTokensRepository", () => {
  let module: TestingModule;
  let app: INestApplication;
  let repository: PasswordResetTokensRepository;
  let usersRepository: UsersRepository;
  let auth: Auth;
  let connection: Connection;

  async function seedUser(): Promise<User> {
    const user = User.create({
      email: `${randomUUID()}@test.test`,
      firstName: "Reset",
      lastName: "Token",
      role: UserRole.USER,
    });
    const saved = await usersRepository.save(user, SEED_PASSWORD);
    if (!saved) {
      throw new Error("Failed to seed user");
    }
    return saved;
  }

  beforeAll(async () => {
    module = await Test.createTestingModule({
      imports: [
        EnvModule.forRoot(),
        MongooseModule.forRootAsync({
          imports: [EnvModule],
          useFactory: (configService: EnvService) => generateMongoConfig(configService),
          inject: [EnvService],
        }),
        AuthModule,
        UsersModule,
      ],
    })
      .overrideProvider(EmailService)
      .useValue({ send: jest.fn() })
      .compile();

    app = module.createNestApplication();
    await app.init();

    repository = module.get<PasswordResetTokensRepository>(PasswordResetTokensRepository);
    usersRepository = module.get<UsersRepository>(UsersRepository);
    auth = module.get<Auth>(AUTH);
    connection = module.get<Connection>(getConnectionToken());
  });

  afterAll(async () => {
    if (app) {
      await app.close();
    }
  });

  it("mints a url-safe token of at least 32 characters", async () => {
    const user = await seedUser();

    const token = await repository.mint(user.id);

    expect(token).toMatch(/^[A-Za-z0-9_-]{32,}$/);
  });

  it("stores the token under better-auth's reset-password identifier with a one-hour expiry", async () => {
    const user = await seedUser();
    const before = Date.now();

    const token = await repository.mint(user.id);

    const stored = await connection
      .db!.collection("verification")
      .findOne({ identifier: `${RESET_PASSWORD_IDENTIFIER_PREFIX}${token}` });
    expect(stored).not.toBeNull();
    expect(stored!.value).toBe(user.id);
    const expiresAt = new Date(stored!.expiresAt).getTime();
    expect(expiresAt).toBeGreaterThanOrEqual(before + 3600 * 1000 - 5000);
    expect(expiresAt).toBeLessThanOrEqual(Date.now() + 3600 * 1000 + 5000);
  });

  it("is rejected by better-auth once expired", async () => {
    const user = await seedUser();
    const token = await repository.mint(user.id);
    await connection
      .db!.collection("verification")
      .updateOne(
        { identifier: `${RESET_PASSWORD_IDENTIFIER_PREFIX}${token}` },
        { $set: { expiresAt: new Date(Date.now() - 1000) } },
      );

    await expect(
      auth.api.resetPassword({ body: { newPassword: "expired-password-1234", token } }),
    ).rejects.toThrow();
  });

  it("mints a token that better-auth's reset-password endpoint accepts exactly once", async () => {
    const user = await seedUser();
    const newPassword = "brand-new-password-1234";

    const token = await repository.mint(user.id);

    const reset = await auth.api.resetPassword({ body: { newPassword, token } });
    expect(reset.status).toBe(true);

    const signedIn = await auth.api.signInEmail({
      body: { email: user.email, password: newPassword },
    });
    expect(signedIn.user.id).toBe(user.id);

    await expect(auth.api.resetPassword({ body: { newPassword, token } })).rejects.toThrow();
  });
});
