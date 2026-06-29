import { randomUUID } from "node:crypto";
import { afterAll, beforeAll, describe, expect, it, jest } from "@jest/globals";
import type { INestApplication } from "@nestjs/common";
import { APP_GUARD } from "@nestjs/core";
import { getConnectionToken, MongooseModule } from "@nestjs/mongoose";
import { Test, TestingModule } from "@nestjs/testing";
import { type Connection, Types } from "mongoose";
import { EnvModule, EnvService } from "@open-dpp/env";
import {
  ForbiddenExceptionFilter,
  NotFoundExceptionFilter,
  NotFoundInDatabaseExceptionFilter,
  ValueErrorFilter,
} from "@open-dpp/exception";
import type { Auth } from "better-auth";
import request from "supertest";
import { BetterAuthHelper } from "../../../../test/better-auth-helper";
import { generateMongoConfig } from "../../../database/config";
import { EmailService } from "../../../email/email.service";
import { AuthModule } from "../../auth/auth.module";
import { AUTH } from "../../auth/auth.provider";
import { AuthGuard } from "../../auth/infrastructure/guards/auth.guard";
import { EmailChangeRequestsService } from "../../email-change-requests/application/services/email-change-requests.service";
import {
  signRevokeToken,
  verifyRevokeToken,
} from "../../email-change-requests/domain/revoke-token";
import { EMAIL_CHANGE_REQUEST_COLLECTION } from "../../email-change-requests/infrastructure/schemas/email-change-request.schema";
import { InvitationStatus } from "../../organizations/domain/invitation-status.enum";
import { OrganizationsModule } from "../../organizations/organizations.module";
import { UsersService } from "../application/services/users.service";
import { UserRole } from "../domain/user-role.enum";
import { UsersRepository } from "../infrastructure/adapters/users.repository";
import { UsersModule } from "../users.module";

const TEST_PASSWORD = "password1234";

describe("UsersController", () => {
  let app: INestApplication;
  let moduleRef: TestingModule;
  let usersRepository: UsersRepository;
  let emailSendMock: jest.Mock;
  let connection: Connection;
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
    connection = moduleRef.get<Connection>(getConnectionToken());

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

  describe("POST /users", () => {
    it("returns 403 when caller is not an admin", async () => {
      const { user } = await betterAuthHelper.createUser();
      const userCookie = await betterAuthHelper.signAsUser(user.id);

      const response = await request(app.getHttpServer())
        .post("/users")
        .set("Cookie", userCookie)
        .send({ email: `${randomUUID()}@test.test`, firstName: "Jane", lastName: "Doe" });

      expect(response.status).toBe(403);
    });

    it("creates a user and returns a UserDto without admin-only fields", async () => {
      const { user: admin } = await betterAuthHelper.createUser({ role: UserRole.ADMIN });
      const adminCookie = await betterAuthHelper.signAsUser(admin.id);
      const newEmail = `${randomUUID()}@test.test`;

      const response = await request(app.getHttpServer())
        .post("/users")
        .set("Cookie", adminCookie)
        .send({ email: newEmail, firstName: "Jane", lastName: "Doe" });

      expect(response.status).toBe(201);
      expect(response.body).toEqual(
        expect.objectContaining({
          email: newEmail,
          firstName: "Jane",
          lastName: "Doe",
        }),
      );
      expect(response.body).not.toHaveProperty("role");
      expect(response.body).not.toHaveProperty("banned");

      const persisted = await usersRepository.findOneByEmail(newEmail);
      expect(persisted!.email).toBe(newEmail);
    });
  });

  describe("PATCH /users/:id/role", () => {
    it("returns 403 when caller is not an admin", async () => {
      const { user } = await betterAuthHelper.createUser();
      const userCookie = await betterAuthHelper.signAsUser(user.id);

      const response = await request(app.getHttpServer())
        .patch(`/users/${user.id}/role`)
        .set("Cookie", userCookie)
        .send({ role: UserRole.ADMIN });

      expect(response.status).toBe(403);
    });

    it("changes the user's role and returns a UserDto without admin-only fields", async () => {
      const { user: admin } = await betterAuthHelper.createUser({ role: UserRole.ADMIN });
      const adminCookie = await betterAuthHelper.signAsUser(admin.id);
      const { user: target } = await betterAuthHelper.createUser({ role: UserRole.USER });

      const response = await request(app.getHttpServer())
        .patch(`/users/${target.id}/role`)
        .set("Cookie", adminCookie)
        .send({ role: UserRole.ADMIN });

      expect(response.status).toBe(200);
      expect(response.body).toEqual(
        expect.objectContaining({
          id: target.id,
          email: target.email,
        }),
      );
      expect(response.body).not.toHaveProperty("role");
      expect(response.body).not.toHaveProperty("banned");

      const persisted = await usersRepository.findOneById(target.id);
      expect(persisted!.role).toBe(UserRole.ADMIN);
    });
  });

  describe("GET /users/me", () => {
    it("returns 403 when no session is present", async () => {
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
    it("returns 403 when no session is present", async () => {
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

    it("preserves the pending email change in the response when an unrelated profile field is patched", async () => {
      const { user } = await betterAuthHelper.createUser();
      const userCookie = await betterAuthHelper.signAsUser(user.id);
      const newEmail = `${randomUUID()}@test.test`;
      emailSendMock.mockClear();

      const requestResponse = await request(app.getHttpServer())
        .post("/users/me/email-change")
        .set("Cookie", userCookie)
        .send({ newEmail, currentPassword: TEST_PASSWORD });
      expect(requestResponse.status).toBe(202);

      const response = await request(app.getHttpServer())
        .patch("/users/me")
        .set("Cookie", userCookie)
        .send({ firstName: "Renamed" });

      expect(response.status).toBe(200);
      expect(response.body.user.firstName).toBe("Renamed");
      expect(response.body.pendingEmailChange?.newEmail).toBe(newEmail);
      expect(response.body.pendingEmailChange?.requestedAt).toBeDefined();
    });
  });

  describe("POST /users/me/email-change", () => {
    it("returns 403 when no session is present", async () => {
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
      expect(response.body.pendingEmailChange?.newEmail).toBe(newEmail);
      expect(response.body.pendingEmailChange?.requestedAt).toBeDefined();
      expect(response.body.user).not.toHaveProperty("role");

      const notificationCall = (emailSendMock.mock.calls as unknown[][]).find(
        (args) => (args[0] as { type?: string } | undefined)?.type === "EMAIL_CHANGE_NOTIFICATION",
      );
      expect(notificationCall).toBeDefined();
      const notification = notificationCall![0] as {
        to: string;
        templateProperties: { currentEmail: string; newEmail: string; revokeUrl: string };
      };
      expect(notification.to).toBe(user.email);
      expect(notification.templateProperties.currentEmail).toBe(user.email);
      expect(notification.templateProperties.newEmail).toBe(newEmail);

      const revokeUrl = new URL(notification.templateProperties.revokeUrl);
      expect(revokeUrl.pathname).toBe("/account/email-change-revoke");
      const revokeToken = revokeUrl.searchParams.get("token");
      expect(typeof revokeToken).toBe("string");
      const secret = moduleRef.get<EnvService>(EnvService).get("OPEN_DPP_AUTH_SECRET");
      const decoded = verifyRevokeToken(revokeToken!, secret);
      expect(decoded.userId).toBe(user.id);
      const pendingRow = await moduleRef
        .get<EmailChangeRequestsService>(EmailChangeRequestsService)
        .findByUserId(user.id);
      expect(pendingRow).not.toBeNull();
      expect(decoded.requestId).toBe(pendingRow!.id);

      const persisted = await usersRepository.findOneById(user.id);
      expect(persisted!.email).toBe(user.email);
    });

    it("rate-limits the endpoint per user, returning 429 after the allowed number of requests", async () => {
      const { user } = await betterAuthHelper.createUser();
      const userCookie = await betterAuthHelper.signAsUser(user.id);
      emailSendMock.mockClear();

      for (let attempt = 0; attempt < 3; attempt++) {
        const accepted = await request(app.getHttpServer())
          .post("/users/me/email-change")
          .set("Cookie", userCookie)
          .send({ newEmail: `${randomUUID()}@test.test`, currentPassword: TEST_PASSWORD });
        expect(accepted.status).toBe(202);
      }

      const throttled = await request(app.getHttpServer())
        .post("/users/me/email-change")
        .set("Cookie", userCookie)
        .send({ newEmail: `${randomUUID()}@test.test`, currentPassword: TEST_PASSWORD });
      expect(throttled.status).toBe(429);
    });

    it("does not create an orphaned session when verifying the current password", async () => {
      const { user } = await betterAuthHelper.createUser();
      const userCookie = await betterAuthHelper.signAsUser(user.id);
      emailSendMock.mockClear();

      const countUserSessions = async () =>
        connection.collection("session").countDocuments({
          $or: [
            { userId: { $eq: user.id } },
            ...(Types.ObjectId.isValid(user.id)
              ? [{ userId: { $eq: new Types.ObjectId(user.id) } }]
              : []),
          ],
        });

      const sessionsBefore = await countUserSessions();
      expect(sessionsBefore).toBeGreaterThanOrEqual(1);

      const response = await request(app.getHttpServer())
        .post("/users/me/email-change")
        .set("Cookie", userCookie)
        .send({ newEmail: `${randomUUID()}@test.test`, currentPassword: TEST_PASSWORD });

      expect(response.status).toBe(202);

      const sessionsAfter = await countUserSessions();
      expect(sessionsAfter).toBe(sessionsBefore);
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

    it("atomically replaces a pending change when a second request arrives without cancelling", async () => {
      const { user } = await betterAuthHelper.createUser();
      const userCookie = await betterAuthHelper.signAsUser(user.id);
      const emailA = `${randomUUID()}@test.test`;
      const emailB = `${randomUUID()}@test.test`;

      const firstResponse = await request(app.getHttpServer())
        .post("/users/me/email-change")
        .set("Cookie", userCookie)
        .send({ newEmail: emailA, currentPassword: TEST_PASSWORD });
      expect(firstResponse.status).toBe(202);
      expect(firstResponse.body.pendingEmailChange?.newEmail).toBe(emailA);

      emailSendMock.mockClear();
      const secondResponse = await request(app.getHttpServer())
        .post("/users/me/email-change")
        .set("Cookie", userCookie)
        .send({ newEmail: emailB, currentPassword: TEST_PASSWORD });

      expect(secondResponse.status).toBe(202);
      expect(secondResponse.body.pendingEmailChange?.newEmail).toBe(emailB);
      expect(emailSendMock).toHaveBeenCalled();

      const meResponse = await request(app.getHttpServer())
        .get("/users/me")
        .set("Cookie", userCookie);
      expect(meResponse.body.pendingEmailChange?.newEmail).toBe(emailB);

      const rowCount = await connection
        .collection(EMAIL_CHANGE_REQUEST_COLLECTION)
        .countDocuments({ userId: { $eq: user.id } });
      expect(rowCount).toBe(1);
      const row = await connection
        .collection(EMAIL_CHANGE_REQUEST_COLLECTION)
        .findOne({ userId: { $eq: user.id } });
      expect(row?.newEmail).toBe(emailB);

      const persisted = await usersRepository.findOneById(user.id);
      expect(persisted!.email).toBe(user.email);
    });

    it("rolls back the pending change and returns 500 when the notification email fails", async () => {
      const { user } = await betterAuthHelper.createUser();
      const userCookie = await betterAuthHelper.signAsUser(user.id);
      const newEmail = `${randomUUID()}@test.test`;
      emailSendMock.mockClear();
      emailSendMock.mockImplementation(async (mail: unknown) => {
        if ((mail as { type?: string }).type === "EMAIL_CHANGE_NOTIFICATION") {
          throw new Error("SMTP unavailable");
        }
      });

      try {
        const response = await request(app.getHttpServer())
          .post("/users/me/email-change")
          .set("Cookie", userCookie)
          .send({ newEmail, currentPassword: TEST_PASSWORD });

        expect(response.status).toBe(500);

        const meResponse = await request(app.getHttpServer())
          .get("/users/me")
          .set("Cookie", userCookie);
        expect(meResponse.body.pendingEmailChange).toBeNull();
      } finally {
        emailSendMock.mockReset();
      }
    });

    it("lets two different users hold a pending change to the SAME new address without a 500", async () => {
      const sharedNewEmail = `${randomUUID()}@test.test`;

      const { user: userA } = await betterAuthHelper.createUser();
      const userACookie = await betterAuthHelper.signAsUser(userA.id);
      const { user: userB } = await betterAuthHelper.createUser();
      const userBCookie = await betterAuthHelper.signAsUser(userB.id);

      const responseA = await request(app.getHttpServer())
        .post("/users/me/email-change")
        .set("Cookie", userACookie)
        .send({ newEmail: sharedNewEmail, currentPassword: TEST_PASSWORD });
      expect(responseA.status).toBe(202);
      expect(responseA.body.pendingEmailChange?.newEmail).toBe(sharedNewEmail);

      const responseB = await request(app.getHttpServer())
        .post("/users/me/email-change")
        .set("Cookie", userBCookie)
        .send({ newEmail: sharedNewEmail, currentPassword: TEST_PASSWORD });
      expect(responseB.status).toBe(202);
      expect(responseB.body.pendingEmailChange?.newEmail).toBe(sharedNewEmail);

      const rowCount = await connection
        .collection(EMAIL_CHANGE_REQUEST_COLLECTION)
        .countDocuments({ newEmail: { $eq: sharedNewEmail } });
      expect(rowCount).toBe(2);
    });

    it("sends the new-address verification as an EMAIL_CHANGE_VERIFICATION mail, not the generic VERIFY_EMAIL", async () => {
      const { user } = await betterAuthHelper.createUser();
      const userCookie = await betterAuthHelper.signAsUser(user.id);
      const newEmail = `${randomUUID()}@test.test`;
      emailSendMock.mockClear();

      const response = await request(app.getHttpServer())
        .post("/users/me/email-change")
        .set("Cookie", userCookie)
        .send({ newEmail, currentPassword: TEST_PASSWORD });
      expect(response.status).toBe(202);

      const verificationCall = (emailSendMock.mock.calls as unknown[][]).find((args) => {
        const link = (args[0] as { templateProperties?: { link?: string } } | undefined)
          ?.templateProperties?.link;
        return typeof link === "string" && link.includes("/verify-email?token=");
      });
      expect(verificationCall).toBeDefined();
      const verification = verificationCall![0] as {
        type: string;
        to: string;
        templateProperties: { newEmail?: string; firstName?: string };
      };
      expect(verification.type).toBe("EMAIL_CHANGE_VERIFICATION");
      expect(verification.to).toBe(newEmail);
      expect(verification.templateProperties.newEmail).toBe(newEmail);

      const genericVerifyCall = (emailSendMock.mock.calls as unknown[][]).find(
        (args) => (args[0] as { type?: string } | undefined)?.type === "VERIFY_EMAIL",
      );
      expect(genericVerifyCall).toBeUndefined();
    });
  });

  describe("DELETE /users/me/email-change", () => {
    it("returns 403 when no session is present", async () => {
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

    it("blocks completion of a verification link after the change has been revoked", async () => {
      const auth = moduleRef.get<Auth>(AUTH);
      const { user } = await betterAuthHelper.createUser();
      const userCookie = await betterAuthHelper.signAsUser(user.id);
      const newEmail = `${randomUUID()}@test.test`;
      emailSendMock.mockClear();

      await request(app.getHttpServer())
        .post("/users/me/email-change")
        .set("Cookie", userCookie)
        .send({ newEmail, currentPassword: TEST_PASSWORD });

      const verifyEmailCall = (emailSendMock.mock.calls as unknown[][]).find((args) => {
        const link = (args[0] as { templateProperties?: { link?: string } } | undefined)
          ?.templateProperties?.link;
        return typeof link === "string" && link.includes("/verify-email?token=");
      });
      expect(verifyEmailCall).toBeDefined();
      const verifyLink = (verifyEmailCall![0] as { templateProperties: { link: string } })
        .templateProperties.link;
      const token = new URL(verifyLink).searchParams.get("token");
      expect(typeof token).toBe("string");

      const revokeResponse = await request(app.getHttpServer())
        .delete("/users/me/email-change")
        .set("Cookie", userCookie);
      expect(revokeResponse.status).toBe(200);

      try {
        await (auth.api as any).verifyEmail({
          query: { token, callbackURL: "/" },
          asResponse: true,
        });
      } catch {}

      const persisted = await usersRepository.findOneById(user.id);
      expect(persisted!.email).toBe(user.email);
    });

    it("sends an EMAIL_CHANGE_COMPLETED notification to the new address when the change completes", async () => {
      const auth = moduleRef.get<Auth>(AUTH);
      const { user } = await betterAuthHelper.createUser();
      const userCookie = await betterAuthHelper.signAsUser(user.id);
      const previousEmail = user.email;
      const newEmail = `${randomUUID()}@test.test`;
      emailSendMock.mockClear();

      await request(app.getHttpServer())
        .post("/users/me/email-change")
        .set("Cookie", userCookie)
        .send({ newEmail, currentPassword: TEST_PASSWORD });

      const verifyEmailCall = (emailSendMock.mock.calls as unknown[][]).find((args) => {
        const link = (args[0] as { templateProperties?: { link?: string } } | undefined)
          ?.templateProperties?.link;
        return typeof link === "string" && link.includes("/verify-email?token=");
      });
      expect(verifyEmailCall).toBeDefined();
      const verifyLink = (verifyEmailCall![0] as { templateProperties: { link: string } })
        .templateProperties.link;
      const token = new URL(verifyLink).searchParams.get("token");
      emailSendMock.mockClear();

      try {
        await (auth.api as any).verifyEmail({
          query: { token, callbackURL: "/" },
          headers: { cookie: userCookie },
          asResponse: true,
        });
      } catch {}

      const persisted = await usersRepository.findOneById(user.id);
      expect(persisted!.email).toBe(newEmail);

      const completedCall = (emailSendMock.mock.calls as unknown[][]).find(
        (args) => (args[0] as { type?: string } | undefined)?.type === "EMAIL_CHANGE_COMPLETED",
      );
      expect(completedCall).toBeDefined();
      const completedMail = completedCall![0] as {
        to: string;
        templateProperties: { previousEmail: string; currentEmail: string; firstName: string };
      };
      expect(completedMail.to).toBe(newEmail);
      expect(completedMail.templateProperties.currentEmail).toBe(newEmail);
      expect(completedMail.templateProperties.previousEmail).toBe(previousEmail);

      const meResponse = await request(app.getHttpServer())
        .get("/users/me")
        .set("Cookie", userCookie);
      expect(meResponse.body.pendingEmailChange).toBeNull();
    });

    it("does not send an EMAIL_CHANGE_COMPLETED notification on an unrelated profile update", async () => {
      const { user } = await betterAuthHelper.createUser();
      const userCookie = await betterAuthHelper.signAsUser(user.id);
      emailSendMock.mockClear();

      const response = await request(app.getHttpServer())
        .patch("/users/me")
        .set("Cookie", userCookie)
        .send({ firstName: "Renamed", preferredLanguage: "de" });

      expect(response.status).toBe(200);
      const completedCall = (emailSendMock.mock.calls as unknown[][]).find(
        (args) => (args[0] as { type?: string } | undefined)?.type === "EMAIL_CHANGE_COMPLETED",
      );
      expect(completedCall).toBeUndefined();
    });

    it("does not let one user's pending shadow row authorize another user's email update (no cookie on verify)", async () => {
      const auth = moduleRef.get<Auth>(AUTH);
      const sharedNewEmail = `${randomUUID()}@test.test`;

      const { user: userA } = await betterAuthHelper.createUser();
      const userACookie = await betterAuthHelper.signAsUser(userA.id);
      emailSendMock.mockClear();

      await request(app.getHttpServer())
        .post("/users/me/email-change")
        .set("Cookie", userACookie)
        .send({ newEmail: sharedNewEmail, currentPassword: TEST_PASSWORD });

      const { user: userB } = await betterAuthHelper.createUser();
      const userBCookie = await betterAuthHelper.signAsUser(userB.id);
      emailSendMock.mockClear();

      try {
        await (auth.api as any).changeEmail({
          body: { newEmail: sharedNewEmail, callbackURL: "/" },
          headers: { cookie: userBCookie },
        });
      } catch {}

      const userBVerifyCall = (emailSendMock.mock.calls as unknown[][]).find((args) => {
        const link = (args[0] as { templateProperties?: { link?: string } } | undefined)
          ?.templateProperties?.link;
        return typeof link === "string" && link.includes("/verify-email?token=");
      });
      const userBToken = userBVerifyCall
        ? new URL(
            (userBVerifyCall[0] as { templateProperties: { link: string } }).templateProperties
              .link,
          ).searchParams.get("token")
        : null;

      if (typeof userBToken === "string") {
        try {
          await (auth.api as any).verifyEmail({
            query: { token: userBToken, callbackURL: "/" },
            asResponse: true,
          });
        } catch {}
      }

      const persistedB = await usersRepository.findOneById(userB.id);
      expect(persistedB!.email).toBe(userB.email);
      const persistedA = await usersRepository.findOneById(userA.id);
      expect(persistedA!.email).toBe(userA.email);
    });

    it("does not let one user's pending shadow row authorize another user's email update (with cookie on verify)", async () => {
      const auth = moduleRef.get<Auth>(AUTH);
      const sharedNewEmail = `${randomUUID()}@test.test`;

      const { user: userA } = await betterAuthHelper.createUser();
      const userACookie = await betterAuthHelper.signAsUser(userA.id);
      emailSendMock.mockClear();

      await request(app.getHttpServer())
        .post("/users/me/email-change")
        .set("Cookie", userACookie)
        .send({ newEmail: sharedNewEmail, currentPassword: TEST_PASSWORD });

      const { user: userB } = await betterAuthHelper.createUser();
      const userBCookie = await betterAuthHelper.signAsUser(userB.id);
      emailSendMock.mockClear();

      try {
        await (auth.api as any).changeEmail({
          body: { newEmail: sharedNewEmail, callbackURL: "/" },
          headers: { cookie: userBCookie },
        });
      } catch {}

      const userBVerifyCall = (emailSendMock.mock.calls as unknown[][]).find((args) => {
        const link = (args[0] as { templateProperties?: { link?: string } } | undefined)
          ?.templateProperties?.link;
        return typeof link === "string" && link.includes("/verify-email?token=");
      });
      const userBToken = userBVerifyCall
        ? new URL(
            (userBVerifyCall[0] as { templateProperties: { link: string } }).templateProperties
              .link,
          ).searchParams.get("token")
        : null;

      if (typeof userBToken === "string") {
        try {
          await (auth.api as any).verifyEmail({
            query: { token: userBToken, callbackURL: "/" },
            headers: { cookie: userBCookie },
            asResponse: true,
          });
        } catch {}
      }

      const persistedB = await usersRepository.findOneById(userB.id);
      expect(persistedB!.email).toBe(userB.email);
    });
  });

  describe("email-change gate (auth.provider databaseHooks.user.update)", () => {
    it("blocks a direct in-process user.email write that has no verification-token context and leaves the email unchanged", async () => {
      const { user } = await betterAuthHelper.createUser();
      emailSendMock.mockClear();
      const auth = moduleRef.get<Auth>(AUTH);
      const ctx = await (auth as any).$context;
      const attemptedEmail = `${randomUUID()}@test.test`;

      // No verification-token context => the before-hook cannot resolve previousEmail and returns
      // false (auth.provider.ts:251-256), so updateWithHooks short-circuits to null and skips the write.
      const result = await ctx.internalAdapter.updateUser(user.id, { email: attemptedEmail });
      expect(result).toBeNull();

      const afterBlocked = await usersRepository.findOneById(user.id);
      expect(afterBlocked!.email).toBe(user.email);

      // Control: a non-email field write is not email-specific, so the same path DOES persist.
      const updated = await ctx.internalAdapter.updateUser(user.id, { firstName: "GateControl" });
      expect(updated).not.toBeNull();
      const afterControl = await usersRepository.findOneById(user.id);
      expect(afterControl!.firstName).toBe("GateControl");
      expect(afterControl!.email).toBe(user.email);
    });

    it("still applies the email change and clears the pending row when the EMAIL_CHANGE_COMPLETED courtesy mail fails", async () => {
      const auth = moduleRef.get<Auth>(AUTH);
      const { user } = await betterAuthHelper.createUser();
      const userCookie = await betterAuthHelper.signAsUser(user.id);
      const newEmail = `${randomUUID()}@test.test`;
      emailSendMock.mockClear();

      await request(app.getHttpServer())
        .post("/users/me/email-change")
        .set("Cookie", userCookie)
        .send({ newEmail, currentPassword: TEST_PASSWORD });

      const verifyEmailCall = (emailSendMock.mock.calls as unknown[][]).find((args) => {
        const link = (args[0] as { templateProperties?: { link?: string } } | undefined)
          ?.templateProperties?.link;
        return typeof link === "string" && link.includes("/verify-email?token=");
      });
      expect(verifyEmailCall).toBeDefined();
      const verifyLink = (verifyEmailCall![0] as { templateProperties: { link: string } })
        .templateProperties.link;
      const token = new URL(verifyLink).searchParams.get("token");
      expect(typeof token).toBe("string");

      emailSendMock.mockClear();
      emailSendMock.mockImplementation(async (mail: unknown) => {
        if ((mail as { type?: string }).type === "EMAIL_CHANGE_COMPLETED") {
          throw new Error("SMTP unavailable");
        }
      });

      try {
        try {
          await (auth.api as any).verifyEmail({
            query: { token, callbackURL: "/" },
            headers: { cookie: userCookie },
            asResponse: true,
          });
        } catch {}

        // The throwing courtesy-mail branch (auth.provider.ts:294-299) was actually exercised.
        const completedCall = (emailSendMock.mock.calls as unknown[][]).find(
          (args) => (args[0] as { type?: string } | undefined)?.type === "EMAIL_CHANGE_COMPLETED",
        );
        expect(completedCall).toBeDefined();

        // Despite the caught send error, the email change is durable...
        const persisted = await usersRepository.findOneById(user.id);
        expect(persisted!.email).toBe(newEmail);

        // ...and the pending row is still cleared (auth.provider.ts:301).
        const pendingRow = await moduleRef
          .get<EmailChangeRequestsService>(EmailChangeRequestsService)
          .findByUserId(user.id);
        expect(pendingRow).toBeNull();
      } finally {
        emailSendMock.mockReset();
      }
    });

    it("runs the update hooks but sends no EMAIL_CHANGE_COMPLETED when a signup verification flips emailVerified with no pending change", async () => {
      const auth = moduleRef.get<Auth>(AUTH);
      const email = `${randomUUID()}@test.test`;
      emailSendMock.mockClear();

      // Do NOT use betterAuthHelper.createUser (it auto-verifies, making the verify route a no-op).
      // Sign up fresh + unverified so the verification actually flips emailVerified.
      await (auth.api as any).signUpEmail({
        body: {
          firstName: "Fresh",
          lastName: "Signup",
          name: "Fresh Signup",
          email,
          password: TEST_PASSWORD,
        },
      });

      const verifyEmailCall = (emailSendMock.mock.calls as unknown[][]).find((args) => {
        const link = (args[0] as { templateProperties?: { link?: string } } | undefined)
          ?.templateProperties?.link;
        return typeof link === "string" && link.includes("/verify-email?token=");
      });
      expect(verifyEmailCall).toBeDefined();
      const verifyLink = (verifyEmailCall![0] as { templateProperties: { link: string } })
        .templateProperties.link;
      const token = new URL(verifyLink).searchParams.get("token");
      expect(typeof token).toBe("string");

      emailSendMock.mockClear();
      try {
        await (auth.api as any).verifyEmail({
          query: { token, callbackURL: "/" },
          asResponse: true,
        });
      } catch {}

      // No pending change for this user => the after-hook early-returns (auth.provider.ts:277-279).
      const completedCall = (emailSendMock.mock.calls as unknown[][]).find(
        (args) => (args[0] as { type?: string } | undefined)?.type === "EMAIL_CHANGE_COMPLETED",
      );
      expect(completedCall).toBeUndefined();

      // The update path still ran (emailVerified flipped true), proving the hooks executed.
      const persisted = await usersRepository.findOneByEmail(email);
      expect(persisted!.emailVerified).toBe(true);
    });

    // TODO(auth.provider.ts:258-265): the before-hook `if (!targetUser) return false` guard is
    // genuinely unreachable from the live stack — better-auth's email-verification.mjs:172
    // short-circuits with USER_NOT_FOUND before the user.update write runs, so a verification token
    // can never carry a subject email that resolves to no user. Honest coverage needs a prod refactor
    // (export the hook as a pure fn). Skipped, not faked.
    it.skip("blocks a verification-token write whose subject email matches no user (auth.provider.ts:258-265)", () => {});

    // TODO(auth.provider.ts:302-303): the after-hook outer catch only fires if clearing the pending
    // row itself throws. Forcing that requires monkeypatching the shared connection.db.collection
    // used across the whole suite (brittle, leaks into sibling tests). Deferred.
    it.skip("logs and swallows when clearing the EmailChangeRequest after the update fails (auth.provider.ts:302-303)", () => {});
  });

  describe("POST /users/email-change/revoke (anonymous boundary)", () => {
    it("revokes a real pending change via the public link with NO session (200 → status:ok) and clears the pending row", async () => {
      const { user } = await betterAuthHelper.createUser();
      const userCookie = await betterAuthHelper.signAsUser(user.id);
      const newEmail = `${randomUUID()}@test.test`;
      emailSendMock.mockClear();

      await request(app.getHttpServer())
        .post("/users/me/email-change")
        .set("Cookie", userCookie)
        .send({ newEmail, currentPassword: TEST_PASSWORD });

      const notificationCall = (emailSendMock.mock.calls as unknown[][]).find(
        (args) => (args[0] as { type?: string } | undefined)?.type === "EMAIL_CHANGE_NOTIFICATION",
      );
      expect(notificationCall).toBeDefined();
      const revokeUrl = (notificationCall![0] as { templateProperties: { revokeUrl: string } })
        .templateProperties.revokeUrl;
      const token = new URL(revokeUrl).searchParams.get("token");
      expect(typeof token).toBe("string");

      const emailChangeRequestsService = moduleRef.get<EmailChangeRequestsService>(
        EmailChangeRequestsService,
      );
      expect(await emailChangeRequestsService.findByUserId(user.id)).not.toBeNull();

      // Public POST, NO cookie. The HMAC revoke token is the unguessable secret; a
      // state-changing POST (not a prefetchable GET) prevents mail link-scanners from
      // auto-cancelling a legitimate pending change.
      const response = await request(app.getHttpServer())
        .post("/users/email-change/revoke")
        .send({ token: token! });

      expect(response.status).toBe(200);
      expect(response.body).toEqual({ status: "ok" });
      expect(await emailChangeRequestsService.findByUserId(user.id)).toBeNull();
    });

    it("rejects a tampered token via the public link with NO session (200 → status:invalid)", async () => {
      const { user } = await betterAuthHelper.createUser();
      const secret = moduleRef.get<EnvService>(EnvService).get("OPEN_DPP_AUTH_SECRET");

      // A well-formed, SAME-LENGTH token whose signature has been tampered: it passes the length
      // guard in verifyRevokeToken but fails timingSafeEqual => ValueError => ?status=invalid.
      const validToken = signRevokeToken(
        { userId: user.id, requestId: randomUUID() },
        secret,
        60_000,
      );
      const [body, sig] = validToken.split(".");
      const tamperedSig = (sig[0] === "A" ? "B" : "A") + sig.slice(1);
      const tamperedToken = `${body}.${tamperedSig}`;
      expect(tamperedToken.length).toBe(validToken.length);

      const response = await request(app.getHttpServer())
        .post("/users/email-change/revoke")
        .send({ token: tamperedToken });

      expect(response.status).toBe(200);
      expect(response.status).not.toBe(500);
      expect(response.body).toEqual({ status: "invalid" });
      expect(response.headers["set-cookie"]).toBeUndefined();
    });
  });

  describe("GET /users/me/invitations", () => {
    it("returns 403 when no session is present", async () => {
      const response = await request(app.getHttpServer()).get("/users/me/invitations");
      expect(response.status).toBe(403);
    });

    it("returns invitations for the signed-in user populated with organization and inviter", async () => {
      const { user: inviter } = await betterAuthHelper.createUser({ role: UserRole.ADMIN });
      const inviterCookie = await betterAuthHelper.signAsUser(inviter.id);
      const organization = await betterAuthHelper.createOrganization(inviter.id);
      const inviteeEmail = `invite.${randomUUID()}@test.test`;

      const inviteResponse = await request(app.getHttpServer())
        .post(`/organizations/${organization.id}/invite`)
        .set("Cookie", inviterCookie)
        .send({ email: inviteeEmail });
      expect(inviteResponse.status).toBe(201);

      const { user: invitee } = await betterAuthHelper.createUser({
        role: UserRole.USER,
        email: inviteeEmail,
      });
      const inviteeCookie = await betterAuthHelper.signAsUser(invitee.id);

      const response = await request(app.getHttpServer())
        .get("/users/me/invitations")
        .set("Cookie", inviteeCookie);

      expect(response.status).toBe(200);
      expect(response.body).toHaveLength(1);
      expect(response.body[0]).toEqual(
        expect.objectContaining({
          organization: { name: organization.name },
          inviter: { name: "First Last" },
          status: InvitationStatus.PENDING,
          organizationId: organization.id,
        }),
      );
      expect(typeof response.body[0].id).toBe("string");
      expect(typeof response.body[0].expiresAt).toBe("string");
    });

    it("filters invitations by status query param", async () => {
      const { user: inviter } = await betterAuthHelper.createUser({ role: UserRole.ADMIN });
      const inviterCookie = await betterAuthHelper.signAsUser(inviter.id);
      const organization = await betterAuthHelper.createOrganization(inviter.id);
      const inviteeEmail = `invite.${randomUUID()}@test.test`;

      const pendingInvite = await request(app.getHttpServer())
        .post(`/organizations/${organization.id}/invite`)
        .set("Cookie", inviterCookie)
        .send({ email: inviteeEmail });
      expect(pendingInvite.status).toBe(201);

      const { user: invitee } = await betterAuthHelper.createUser({
        role: UserRole.USER,
        email: inviteeEmail,
      });
      const inviteeCookie = await betterAuthHelper.signAsUser(invitee.id);

      const pendingResponse = await request(app.getHttpServer())
        .get("/users/me/invitations?status=pending")
        .set("Cookie", inviteeCookie);
      expect(pendingResponse.status).toBe(200);
      expect(pendingResponse.body).toHaveLength(1);
      expect(pendingResponse.body[0].status).toBe(InvitationStatus.PENDING);

      const declinedResponse = await request(app.getHttpServer())
        .get("/users/me/invitations?status=declined")
        .set("Cookie", inviteeCookie);
      expect(declinedResponse.status).toBe(200);
      expect(declinedResponse.body).toHaveLength(0);
    });
  });
});
