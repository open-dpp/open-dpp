import type { INestApplication } from "@nestjs/common";
import type { Auth } from "better-auth";
import { randomUUID } from "node:crypto";
import { afterAll, beforeAll, describe, expect, it, jest } from "@jest/globals";
import { MongooseModule } from "@nestjs/mongoose";
import { Test, TestingModule } from "@nestjs/testing";
import { EnvModule, EnvService } from "@open-dpp/env";
import { generateMongoConfig } from "../../../../database/config";
import { EmailService } from "../../../../email/email.service";
import { User } from "../../../users/domain/user";
import { UserRole } from "../../../users/domain/user-role.enum";
import { UsersRepository } from "../../../users/infrastructure/adapters/users.repository";
import { UsersModule } from "../../../users/users.module";
import { AuthModule } from "../../auth.module";
import { AUTH } from "../../auth.provider";
import { EmailVerificationLinkBuilder } from "./email-verification-link.builder";

describe("EmailVerificationLinkBuilder", () => {
  let module: TestingModule;
  let app: INestApplication;
  let builder: EmailVerificationLinkBuilder;
  let usersRepository: UsersRepository;
  let auth: Auth;

  async function seedUnverifiedUser(): Promise<User> {
    const saved = await usersRepository.save(
      User.create({
        email: `${randomUUID()}@test.test`,
        firstName: "Verify",
        lastName: "Link",
        role: UserRole.USER,
      }),
    );
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

    builder = module.get<EmailVerificationLinkBuilder>(EmailVerificationLinkBuilder);
    usersRepository = module.get<UsersRepository>(UsersRepository);
    auth = module.get<Auth>(AUTH);
  });

  afterAll(async () => {
    if (app) {
      await app.close();
    }
  });

  it("builds better-auth's verify-email link with the app's verification callback", async () => {
    const user = await seedUnverifiedUser();

    const link = await builder.build(user.email);

    const url = new URL(link);
    expect(link.startsWith(`${(await auth.$context).baseURL}/verify-email?token=`)).toBe(true);
    expect(url.searchParams.get("callbackURL")).toBe("/email-verified");
    expect(url.searchParams.get("token")).toMatch(/^[\w-]+\.[\w-]+\.[\w-]+$/);
  });

  it("builds a link whose token better-auth's verify-email route accepts", async () => {
    const user = await seedUnverifiedUser();
    expect(user.emailVerified).toBe(false);

    const link = await builder.build(user.email);
    const token = new URL(link).searchParams.get("token")!;

    await auth.api.verifyEmail({ query: { token } });

    expect((await usersRepository.findOneById(user.id))!.emailVerified).toBe(true);
  });
});
