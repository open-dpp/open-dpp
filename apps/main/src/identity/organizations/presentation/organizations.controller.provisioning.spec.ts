import type { INestApplication } from "@nestjs/common";
import type { Auth } from "better-auth";
import { randomUUID } from "node:crypto";
import { afterAll, beforeAll, beforeEach, describe, expect, it, jest } from "@jest/globals";
import { APP_GUARD } from "@nestjs/core";
import { MongooseModule } from "@nestjs/mongoose";
import { Test, TestingModule } from "@nestjs/testing";
import { EnvModule, EnvService } from "@open-dpp/env";
import { OrganizationCreateResponseDtoSchema } from "@open-dpp/dto";
import {
  ForbiddenExceptionFilter,
  NotFoundExceptionFilter,
  NotFoundInDatabaseExceptionFilter,
  ValueErrorFilter,
} from "@open-dpp/exception";
import request from "supertest";
import { BetterAuthHelper } from "../../../../test/better-auth-helper";
import { generateMongoConfig } from "../../../database/config";
import { BaseEmail, BaseEmailTypes } from "../../../email/domain/base-email";
import { EmailService } from "../../../email/email.service";
import { AuthModule } from "../../auth/auth.module";
import { AUTH } from "../../auth/auth.provider";
import { AuthGuard } from "../../auth/infrastructure/guards/auth.guard";
import { UsersService } from "../../users/application/services/users.service";
import { UserRole } from "../../users/domain/user-role.enum";
import { UsersRepository } from "../../users/infrastructure/adapters/users.repository";
import { UsersModule } from "../../users/users.module";
import { MemberRole } from "../domain/member-role.enum";
import { MembersRepository } from "../infrastructure/adapters/members.repository";
import { OrganizationsRepository } from "../infrastructure/adapters/organizations.repository";
import { OrganizationsModule } from "../organizations.module";

/** `POST /organizations` with `owner` (#853). The plain create path lives in organizations.controller.spec.ts. */
describe("OrganizationsController provisioning", () => {
  let app: INestApplication;
  let moduleRef: TestingModule;
  const betterAuthHelper = new BetterAuthHelper();
  const emailSend = jest.fn<(mail: BaseEmail) => Promise<void>>();

  beforeAll(async () => {
    moduleRef = await Test.createTestingModule({
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
        OrganizationsModule,
        UsersModule,
      ],
      providers: [{ provide: APP_GUARD, useClass: AuthGuard }],
    })
      .overrideProvider(EmailService)
      .useValue({ send: emailSend })
      .compile();

    betterAuthHelper.init(moduleRef.get<UsersService>(UsersService), moduleRef.get<Auth>(AUTH));

    app = moduleRef.createNestApplication();
    app.useGlobalFilters(
      new NotFoundInDatabaseExceptionFilter(),
      new NotFoundExceptionFilter(),
      new ValueErrorFilter(),
      new ForbiddenExceptionFilter(),
    );
    await app.init();
  });

  afterAll(async () => {
    if (app) {
      await app.close();
    }
  });

  describe("POST /organizations with owner", () => {
    const sentMails = () => emailSend.mock.calls.map(([mail]) => mail);
    const mailFor = (type: string, to: string) =>
      sentMails().find((mail) => mail.type === type && mail.to === to);

    async function createAdmin() {
      const { user: admin } = await betterAuthHelper.createUser({
        role: UserRole.ADMIN,
        email: `admin-${randomUUID()}@example.com`,
      });
      const { userCookie } = await betterAuthHelper.getUserWithCookie(admin.id);
      return { admin, adminCookie: userCookie };
    }

    // Test users are created through better-auth's sign-up, which itself sends a
    // verification mail; each test clears the mock right before the request under test.
    beforeEach(() => {
      emailSend.mockReset();
      emailSend.mockResolvedValue(undefined);
    });

    it("creates the user and the organization, owned by the new user only, and mails in the requested language", async () => {
      const { admin, adminCookie } = await createAdmin();
      const local = randomUUID();
      const email = `${local}@example.com`;

      emailSend.mockClear();
      const response = await request(app.getHttpServer())
        .post("/organizations")
        .set("Cookie", adminCookie)
        .send({
          name: "ACME GmbH",
          owner: {
            email: `${local}@Example.COM`,
            firstName: "Jane",
            lastName: "Doe",
            locale: "de",
          },
        });

      expect(response.status).toEqual(201);
      const body = OrganizationCreateResponseDtoSchema.parse(response.body);
      expect(body.name).toBe("ACME GmbH");
      expect(body.provisioning).toEqual({
        owner: { id: expect.any(String), email, created: true },
        emailSent: true,
      });
      expect(response.body).not.toHaveProperty("slug");

      const usersRepository = moduleRef.get<UsersRepository>(UsersRepository);
      const owner = await usersRepository.findOneByEmail(email);
      expect(owner).not.toBeNull();
      expect(owner!.id).toBe(body.provisioning!.owner.id);
      expect(owner!.firstName).toBe("Jane");
      expect(owner!.preferredLanguage).toBe("de");
      expect(owner!.emailVerified).toBe(false);

      const membersRepository = moduleRef.get<MembersRepository>(MembersRepository);
      const members = await membersRepository.findByOrganizationId(body.id);
      expect(members.map((member) => [String(member.userId), member.role])).toEqual([
        [owner!.id, MemberRole.OWNER],
      ]);
      expect(members.some((member) => String(member.userId) === admin.id)).toBe(false);

      const welcome = mailFor(BaseEmailTypes.Welcome, email);
      expect(welcome).toBeDefined();
      expect(welcome!.subject).toBe("Jetzt mit open-dpp starten");
      expect(welcome!.language).toBe("de");
      const link = (welcome!.templateProperties as { link: string }).link;
      const openDppUrl = moduleRef.get(EnvService).get("OPEN_DPP_URL");
      expect(link.startsWith(`${openDppUrl}/password-reset?token=`)).toBe(true);
      const verify = mailFor(BaseEmailTypes.VerifyEmail, email);
      expect(verify).toBeDefined();
      expect(verify!.subject).toBe("E-Mail-Adresse bestätigen");
      expect(verify!.language).toBe("de");
      expect(mailFor(BaseEmailTypes.OrganizationReady, email)).toBeUndefined();
      expect(JSON.stringify(response.body)).not.toContain(new URL(link).searchParams.get("token"));

      // The minted token is a real better-auth reset token.
      const auth = moduleRef.get<Auth>(AUTH);
      const token = new URL(link).searchParams.get("token")!;
      const reset = await auth.api.resetPassword({
        body: { newPassword: "provisioned-password-1234", token },
      });
      expect(reset.status).toBe(true);
    });

    it("makes an existing unverified user the owner and mails in the user's language", async () => {
      const { adminCookie } = await createAdmin();
      const email = `${randomUUID()}@example.com`;
      const { user } = await betterAuthHelper.createUser({ email, preferredLanguage: "en" });
      const usersService = moduleRef.get<UsersService>(UsersService);
      await usersService.setUserEmailVerified(email, false);

      emailSend.mockClear();
      const response = await request(app.getHttpServer())
        .post("/organizations")
        .set("Cookie", adminCookie)
        .send({ name: "ACME GmbH", owner: { email, firstName: "Ignored", locale: "de" } });

      expect(response.status).toEqual(201);
      const body = OrganizationCreateResponseDtoSchema.parse(response.body);
      expect(body.provisioning).toEqual({
        owner: { id: user.id, email, created: false },
        emailSent: true,
      });

      const usersRepository = moduleRef.get<UsersRepository>(UsersRepository);
      const persisted = await usersRepository.findOneByEmail(email);
      expect(persisted!.firstName).toBe("First");
      expect(persisted!.preferredLanguage).toBe("en");

      const welcome = mailFor(BaseEmailTypes.Welcome, email);
      expect(welcome!.subject).toBe("Start using open-dpp");
      expect(welcome!.language).toBe("en");
      const verify = mailFor(BaseEmailTypes.VerifyEmail, email);
      expect(verify!.subject).toBe("Verify E-Mail address");
      expect(mailFor(BaseEmailTypes.OrganizationReady, email)).toBeUndefined();
    });

    it("makes an existing verified user the owner and sends the ready mail", async () => {
      const { adminCookie } = await createAdmin();
      const email = `${randomUUID()}@example.com`;
      const { user } = await betterAuthHelper.createUser({ email, preferredLanguage: "de" });

      emailSend.mockClear();
      const response = await request(app.getHttpServer())
        .post("/organizations")
        .set("Cookie", adminCookie)
        .send({ name: "Neue GmbH", owner: { email, locale: "en" } });

      expect(response.status).toEqual(201);
      const body = OrganizationCreateResponseDtoSchema.parse(response.body);
      expect(body.provisioning).toEqual({
        owner: { id: user.id, email, created: false },
        emailSent: true,
      });

      const membersRepository = moduleRef.get<MembersRepository>(MembersRepository);
      const members = await membersRepository.findByOrganizationId(body.id);
      expect(members.map((member) => [String(member.userId), member.role])).toEqual([
        [user.id, MemberRole.OWNER],
      ]);

      const ready = mailFor(BaseEmailTypes.OrganizationReady, email);
      expect(ready).toBeDefined();
      expect(ready!.subject).toBe("Ihre Organisation Neue GmbH ist bereit");
      expect(ready!.language).toBe("de");
      const openDppUrl = moduleRef.get(EnvService).get("OPEN_DPP_URL");
      expect((ready!.templateProperties as { link: string }).link).toBe(
        `${openDppUrl}/organizations/${body.id}/passports`,
      );
      expect(mailFor(BaseEmailTypes.Welcome, email)).toBeUndefined();
      expect(mailFor(BaseEmailTypes.VerifyEmail, email)).toBeUndefined();
    });

    it("accepts an instance admin's API key", async () => {
      const { admin } = await createAdmin();
      const apiKey = await betterAuthHelper.createApiKey(admin.id);
      const email = `${randomUUID()}@example.com`;

      emailSend.mockClear();
      const response = await request(app.getHttpServer())
        .post("/organizations")
        .set("x-api-key", apiKey)
        .send({ name: "ACME GmbH", owner: { email, locale: "en" } });

      expect(response.status).toEqual(201);
      expect(OrganizationCreateResponseDtoSchema.parse(response.body).provisioning).toEqual({
        owner: { id: expect.any(String), email, created: true },
        emailSent: true,
      });
    });

    it("rejects an owner from a non-admin with 403 and creates nothing", async () => {
      const { userCookie } = await betterAuthHelper.createOrganizationAndUserWithCookie();
      const email = `${randomUUID()}@example.com`;

      emailSend.mockClear();
      const response = await request(app.getHttpServer())
        .post("/organizations")
        .set("Cookie", userCookie)
        .send({ name: "ACME GmbH", owner: { email, locale: "en" } });

      expect(response.status).toEqual(403);
      const usersRepository = moduleRef.get<UsersRepository>(UsersRepository);
      expect(await usersRepository.findOneByEmail(email)).toBeNull();
      expect(emailSend).not.toHaveBeenCalled();
    });

    it("rejects an invalid owner with 400", async () => {
      const { adminCookie } = await createAdmin();

      emailSend.mockClear();
      const response = await request(app.getHttpServer())
        .post("/organizations")
        .set("Cookie", adminCookie)
        .send({ name: "ACME GmbH", owner: { email: "not-an-email", locale: "fr" } });

      expect(response.status).toEqual(400);
    });

    it("returns emailSent false when a mail cannot be sent", async () => {
      const { adminCookie } = await createAdmin();
      const email = `${randomUUID()}@example.com`;
      emailSend.mockClear();
      emailSend.mockRejectedValueOnce(new Error("SMTP down"));

      const response = await request(app.getHttpServer())
        .post("/organizations")
        .set("Cookie", adminCookie)
        .send({ name: "ACME GmbH", owner: { email, locale: "en" } });

      expect(response.status).toEqual(201);
      expect(OrganizationCreateResponseDtoSchema.parse(response.body).provisioning).toEqual({
        owner: { id: expect.any(String), email, created: true },
        emailSent: false,
      });
    });

    it("returns emailSent false when the verification mail cannot be sent", async () => {
      const { adminCookie } = await createAdmin();
      const email = `${randomUUID()}@example.com`;

      emailSend.mockClear();
      // welcome mail succeeds, verification mail fails
      emailSend.mockResolvedValueOnce(undefined).mockRejectedValueOnce(new Error("SMTP down"));
      const response = await request(app.getHttpServer())
        .post("/organizations")
        .set("Cookie", adminCookie)
        .send({ name: "ACME GmbH", owner: { email, locale: "en" } });

      expect(response.status).toEqual(201);
      expect(OrganizationCreateResponseDtoSchema.parse(response.body).provisioning).toEqual({
        owner: { id: expect.any(String), email, created: true },
        emailSent: false,
      });
      expect(mailFor(BaseEmailTypes.Welcome, email)).toBeDefined();
    });

    it("rejects an owner from a non-admin API key with 403", async () => {
      const { apiKey } = await betterAuthHelper.createOrganizationAndUserWithApiKey();
      const email = `${randomUUID()}@example.com`;

      emailSend.mockClear();
      const response = await request(app.getHttpServer())
        .post("/organizations")
        .set("x-api-key", apiKey)
        .send({ name: "ACME GmbH", owner: { email, locale: "en" } });

      expect(response.status).toEqual(403);
      const usersRepository = moduleRef.get<UsersRepository>(UsersRepository);
      expect(await usersRepository.findOneByEmail(email)).toBeNull();
    });

    it("removes the created user again when the organization cannot be created", async () => {
      const { adminCookie } = await createAdmin();
      const email = `${randomUUID()}@example.com`;
      const organizationsRepository =
        moduleRef.get<OrganizationsRepository>(OrganizationsRepository);
      const spy = jest
        .spyOn(organizationsRepository, "createForUser")
        .mockRejectedValueOnce(new Error("better-auth down"));

      emailSend.mockClear();
      const response = await request(app.getHttpServer())
        .post("/organizations")
        .set("Cookie", adminCookie)
        .send({ name: "ACME GmbH", owner: { email, locale: "en" } });

      spy.mockRestore();
      expect(response.status).toEqual(500);
      const usersRepository = moduleRef.get<UsersRepository>(UsersRepository);
      expect(await usersRepository.findOneByEmail(email)).toBeNull();
      expect(emailSend).not.toHaveBeenCalled();
    });

    it("returns no provisioning without an owner", async () => {
      const { adminCookie } = await createAdmin();

      emailSend.mockClear();
      const response = await request(app.getHttpServer())
        .post("/organizations")
        .set("Cookie", adminCookie)
        .send({ name: "Plain Org" });

      expect(response.status).toEqual(201);
      expect(response.body).not.toHaveProperty("provisioning");
    });
  });
});
