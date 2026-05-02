import type { INestApplication } from "@nestjs/common";
import type { Auth } from "better-auth";
import { randomUUID } from "node:crypto";
import { afterAll, beforeAll, describe, expect, it, jest } from "@jest/globals";
import { APP_GUARD } from "@nestjs/core";
import { MongooseModule } from "@nestjs/mongoose";
import { Test, TestingModule } from "@nestjs/testing";
import { EnvModule, EnvService } from "@open-dpp/env";
import {
  ForbiddenExceptionFilter,
  NotFoundExceptionFilter,
  NotFoundInDatabaseExceptionFilter,
  ValueErrorFilter,
} from "@open-dpp/exception";
import request from "supertest";
import { BetterAuthHelper } from "../../../../test/better-auth-helper";
import { generateMongoConfig } from "../../../database/config";
import { EmailService } from "../../../email/email.service";
import { AuthModule } from "../../auth/auth.module";
import { AUTH } from "../../auth/auth.provider";
import { AuthGuard } from "../../auth/infrastructure/guards/auth.guard";
import { OrganizationsModule } from "../../organizations/organizations.module";
import { UsersService } from "../application/services/users.service";
import { UsersRepository } from "../infrastructure/adapters/users.repository";
import { UsersModule } from "../users.module";

const TEST_PASSWORD = "password1234";

describe("UsersController (integration /users/me)", () => {
  let app: INestApplication;
  let moduleRef: TestingModule;
  let usersRepository: UsersRepository;
  let emailSendMock: jest.Mock;
  const betterAuthHelper = new BetterAuthHelper();

  beforeAll(async () => {
    emailSendMock = jest.fn();
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
        UsersModule,
        OrganizationsModule,
      ],
      providers: [
        {
          provide: APP_GUARD,
          useClass: AuthGuard,
        },
      ],
    })
      .overrideProvider(EmailService)
      .useValue({ send: emailSendMock })
      .compile();

    betterAuthHelper.init(moduleRef.get<UsersService>(UsersService), moduleRef.get<Auth>(AUTH));
    usersRepository = moduleRef.get<UsersRepository>(UsersRepository);

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

  describe("GET /users/me", () => {
    it("returns 401 when no session is present", async () => {
      const response = await request(app.getHttpServer()).get("/users/me");
      expect(response.status).toBe(403);
    });

    it("returns the authenticated user with preferredLanguage defaulted to 'en'", async () => {
      const { user } = await betterAuthHelper.createUser();
      const userCookie = await betterAuthHelper.signAsUser(user.id);

      const response = await request(app.getHttpServer())
        .get("/users/me")
        .set("Cookie", userCookie);

      expect(response.status).toBe(200);
      expect(response.body.user).toEqual(
        expect.objectContaining({
          id: user.id,
          email: user.email,
          preferredLanguage: "en",
        }),
      );
      expect(response.body.pendingEmailChange).toBeNull();
    });

    it("strips admin-only fields (role, banned) from the user object", async () => {
      const { user } = await betterAuthHelper.createUser();
      const userCookie = await betterAuthHelper.signAsUser(user.id);

      const response = await request(app.getHttpServer())
        .get("/users/me")
        .set("Cookie", userCookie);

      expect(response.status).toBe(200);
      expect(response.body.user).not.toHaveProperty("role");
      expect(response.body.user).not.toHaveProperty("banned");
      expect(response.body.user).not.toHaveProperty("banReason");
      expect(response.body.user).not.toHaveProperty("banExpires");
    });
  });

  describe("PATCH /users/me", () => {
    it("returns 401 when no session is present", async () => {
      const response = await request(app.getHttpServer())
        .patch("/users/me")
        .send({ firstName: "Jane" });
      expect(response.status).toBe(403);
    });

    it("updates firstName, lastName, and preferredLanguage", async () => {
      const { user } = await betterAuthHelper.createUser();
      const userCookie = await betterAuthHelper.signAsUser(user.id);

      const response = await request(app.getHttpServer())
        .patch("/users/me")
        .set("Cookie", userCookie)
        .send({ firstName: "Jane", lastName: "Roe", preferredLanguage: "de" });

      expect(response.status).toBe(200);
      expect(response.body.user).toEqual(
        expect.objectContaining({
          firstName: "Jane",
          lastName: "Roe",
          name: "Jane Roe",
          preferredLanguage: "de",
        }),
      );

      const persisted = await usersRepository.findOneById(user.id);
      expect(persisted!.firstName).toBe("Jane");
      expect(persisted!.lastName).toBe("Roe");
      expect(persisted!.preferredLanguage).toBe("de");
    });

    it("rejects an empty firstName with 400", async () => {
      const { user } = await betterAuthHelper.createUser();
      const userCookie = await betterAuthHelper.signAsUser(user.id);

      const response = await request(app.getHttpServer())
        .patch("/users/me")
        .set("Cookie", userCookie)
        .send({ firstName: "" });

      expect(response.status).toBe(400);
    });

    it("rejects an unsupported language with 400", async () => {
      const { user } = await betterAuthHelper.createUser();
      const userCookie = await betterAuthHelper.signAsUser(user.id);

      const response = await request(app.getHttpServer())
        .patch("/users/me")
        .set("Cookie", userCookie)
        .send({ preferredLanguage: "fr" });

      expect(response.status).toBe(400);
    });

    it("returns 200 with the unchanged user and does not bump updatedAt for an empty body", async () => {
      const { user } = await betterAuthHelper.createUser();
      const userCookie = await betterAuthHelper.signAsUser(user.id);
      const before = await usersRepository.findOneById(user.id);

      const response = await request(app.getHttpServer())
        .patch("/users/me")
        .set("Cookie", userCookie)
        .send({});

      expect(response.status).toBe(200);
      const after = await usersRepository.findOneById(user.id);
      expect(after!.updatedAt.getTime()).toBe(before!.updatedAt.getTime());
    });

    it("does not bump updatedAt when patch values match the current user", async () => {
      const { user } = await betterAuthHelper.createUser();
      const userCookie = await betterAuthHelper.signAsUser(user.id);
      const before = await usersRepository.findOneById(user.id);

      const response = await request(app.getHttpServer())
        .patch("/users/me")
        .set("Cookie", userCookie)
        .send({ preferredLanguage: before!.preferredLanguage });

      expect(response.status).toBe(200);
      const after = await usersRepository.findOneById(user.id);
      expect(after!.updatedAt.getTime()).toBe(before!.updatedAt.getTime());
    });
  });

  describe("POST /users/me/email-change", () => {
    it("returns 401 when no session is present", async () => {
      const response = await request(app.getHttpServer())
        .post("/users/me/email-change")
        .send({ newEmail: `${randomUUID()}@test.test`, currentPassword: TEST_PASSWORD });

      expect(response.status).toBe(403);
    });

    it("triggers a notification email, creates a pending change request, keeps the current email unchanged", async () => {
      const { user } = await betterAuthHelper.createUser();
      const userCookie = await betterAuthHelper.signAsUser(user.id);
      emailSendMock.mockClear();
      const newEmail = `${randomUUID()}@test.test`;

      const response = await request(app.getHttpServer())
        .post("/users/me/email-change")
        .set("Cookie", userCookie)
        .send({ newEmail, currentPassword: TEST_PASSWORD });

      expect(response.status).toBe(202);
      expect(emailSendMock).toHaveBeenCalled();
      expect(response.body.pendingEmailChange?.newEmail).toBe(newEmail);
      expect(response.body.pendingEmailChange?.requestedAt).toBeDefined();
      expect(response.body.user).not.toHaveProperty("role");

      const persisted = await usersRepository.findOneById(user.id);
      expect(persisted!.email).toBe(user.email);
    });

    it("rejects requestEmailChange with wrong password", async () => {
      const { user } = await betterAuthHelper.createUser();
      const userCookie = await betterAuthHelper.signAsUser(user.id);

      const response = await request(app.getHttpServer())
        .post("/users/me/email-change")
        .set("Cookie", userCookie)
        .send({ newEmail: `${randomUUID()}@test.test`, currentPassword: "wrong-password" });

      expect(response.status).toBe(400);
      expect(response.body.message.toLowerCase()).toContain("password");
    });

    it("rejects a malformed email with 400", async () => {
      const { user } = await betterAuthHelper.createUser();
      const userCookie = await betterAuthHelper.signAsUser(user.id);

      const response = await request(app.getHttpServer())
        .post("/users/me/email-change")
        .set("Cookie", userCookie)
        .send({ newEmail: "not-an-email", currentPassword: TEST_PASSWORD });

      expect(response.status).toBe(400);
    });

    it("rejects a request to change to the user's current email", async () => {
      const { user } = await betterAuthHelper.createUser();
      const userCookie = await betterAuthHelper.signAsUser(user.id);
      emailSendMock.mockClear();

      const response = await request(app.getHttpServer())
        .post("/users/me/email-change")
        .set("Cookie", userCookie)
        .send({ newEmail: user.email, currentPassword: TEST_PASSWORD });

      expect(response.status).toBe(400);
      expect(emailSendMock).not.toHaveBeenCalled();

      const persisted = await usersRepository.findOneById(user.id);
      expect(persisted!.email).toBe(user.email);
    });

    it("does not change emailVerified on the requesting user", async () => {
      const { user } = await betterAuthHelper.createUser();
      const userCookie = await betterAuthHelper.signAsUser(user.id);
      const before = await usersRepository.findOneById(user.id);
      const newEmail = `${randomUUID()}@test.test`;

      const response = await request(app.getHttpServer())
        .post("/users/me/email-change")
        .set("Cookie", userCookie)
        .send({ newEmail, currentPassword: TEST_PASSWORD });

      expect(response.status).toBe(202);
      const after = await usersRepository.findOneById(user.id);
      expect(after!.emailVerified).toBe(before!.emailVerified);
    });
  });

  describe("DELETE /users/me/email-change", () => {
    it("returns 401 when no session is present", async () => {
      const response = await request(app.getHttpServer()).delete("/users/me/email-change");
      expect(response.status).toBe(403);
    });

    it("clears the pending email change", async () => {
      const { user } = await betterAuthHelper.createUser();
      const userCookie = await betterAuthHelper.signAsUser(user.id);
      const newEmail = `${randomUUID()}@test.test`;
      await request(app.getHttpServer())
        .post("/users/me/email-change")
        .set("Cookie", userCookie)
        .send({ newEmail, currentPassword: TEST_PASSWORD });

      const response = await request(app.getHttpServer())
        .delete("/users/me/email-change")
        .set("Cookie", userCookie);

      expect(response.status).toBe(200);
      expect(response.body.pendingEmailChange).toBeNull();
    });

    it("is a no-op when no email change is pending (still returns 200)", async () => {
      const { user } = await betterAuthHelper.createUser();
      const userCookie = await betterAuthHelper.signAsUser(user.id);

      const response = await request(app.getHttpServer())
        .delete("/users/me/email-change")
        .set("Cookie", userCookie);

      expect(response.status).toBe(200);
      expect(response.body.pendingEmailChange).toBeNull();
    });

    it("allows the user to request a new change after cancelling", async () => {
      const { user } = await betterAuthHelper.createUser();
      const userCookie = await betterAuthHelper.signAsUser(user.id);
      const firstNewEmail = `${randomUUID()}@test.test`;
      const secondNewEmail = `${randomUUID()}@test.test`;
      await request(app.getHttpServer())
        .post("/users/me/email-change")
        .set("Cookie", userCookie)
        .send({ newEmail: firstNewEmail, currentPassword: TEST_PASSWORD });
      await request(app.getHttpServer()).delete("/users/me/email-change").set("Cookie", userCookie);
      emailSendMock.mockClear();

      const response = await request(app.getHttpServer())
        .post("/users/me/email-change")
        .set("Cookie", userCookie)
        .send({ newEmail: secondNewEmail, currentPassword: TEST_PASSWORD });

      expect(response.status).toBe(202);
      expect(emailSendMock).toHaveBeenCalled();
      expect(response.body.pendingEmailChange?.newEmail).toBe(secondNewEmail);
    });
  });
});
