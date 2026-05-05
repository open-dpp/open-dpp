import { randomUUID } from "node:crypto";
import { afterAll, beforeAll, describe, expect, it, jest } from "@jest/globals";
import type { INestApplication } from "@nestjs/common";
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
import type { Auth } from "better-auth";
import request from "supertest";
import { BetterAuthHelper } from "../../../../test/better-auth-helper";
import { generateMongoConfig } from "../../../database/config";
import { EmailService } from "../../../email/email.service";
import { AuthModule } from "../../auth/auth.module";
import { AUTH } from "../../auth/auth.provider";
import { AuthGuard } from "../../auth/infrastructure/guards/auth.guard";
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
      // After the user clicks the revoke link sent to their old inbox, the verification
      // JWT in the new inbox must no longer be able to mutate user.email. Better Auth's
      // change-email JWT is stateless, so the gate lives in the user.update before-hook
      // that requires a matching EmailChangeRequest row to exist.
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
      } catch {
        // Hook veto can surface as an error from parseUserOutput on null — expected.
      }

      const persisted = await usersRepository.findOneById(user.id);
      expect(persisted!.email).toBe(user.email);
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
