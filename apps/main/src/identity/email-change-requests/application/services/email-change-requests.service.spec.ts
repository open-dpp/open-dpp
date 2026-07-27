import { afterEach, beforeEach, describe, expect, it, jest } from "@jest/globals";
import { Logger } from "@nestjs/common";
import { MongooseModule } from "@nestjs/mongoose";
import { Test, TestingModule } from "@nestjs/testing";
import { EnvModule, EnvService } from "@open-dpp/env";
import { ValueError } from "@open-dpp/exception";
import { generateMongoConfig } from "../../../../database/config";
import { EmailService } from "../../../../email/email.service";
import { AccountsService } from "../../../accounts/application/services/accounts.service";
import { AUTH } from "../../../auth/auth.provider";
import { EmailChangeRequest } from "../../domain/email-change-request";
import { verifyRevokeToken } from "../../domain/revoke-token";
import { EmailChangeRequestsRepository } from "../../infrastructure/adapters/email-change-requests.repository";
import {
  EmailChangeRequest as EmailChangeRequestSchemaClass,
  EmailChangeRequestSchema,
} from "../../infrastructure/schemas/email-change-request.schema";
import { EmailChangeRequestsService } from "./email-change-requests.service";

describe("EmailChangeRequestsService", () => {
  let module: TestingModule;
  let service: EmailChangeRequestsService;
  let repository: EmailChangeRequestsRepository;
  let mockAuth: any;
  let mockEmail: any;
  let mockAccountsService: any;
  let openDppUrl: string;
  let authSecret: string;

  const currentUser = { id: "user-1", email: "current@x.com", firstName: "Ada" };
  const headers = { cookie: "session=abc" } as const;

  let errorSpy: ReturnType<typeof jest.spyOn>;

  beforeEach(async () => {
    errorSpy = jest.spyOn(Logger.prototype, "error").mockImplementation(() => undefined);

    mockAccountsService = {
      verifyPassword: jest.fn<() => Promise<boolean>>().mockResolvedValue(true),
    };
    mockAuth = {
      api: {
        changeEmail: jest.fn<() => Promise<void>>().mockResolvedValue(undefined),
        signInEmail: jest.fn<() => Promise<void>>().mockResolvedValue(undefined),
        signOut: jest.fn<() => Promise<void>>().mockResolvedValue(undefined),
      },
    };
    mockEmail = {
      send: jest.fn<() => Promise<void>>().mockResolvedValue(undefined),
    };

    module = await Test.createTestingModule({
      imports: [
        EnvModule.forRoot(),
        MongooseModule.forRootAsync({
          imports: [EnvModule],
          useFactory: (env: EnvService) => ({ ...generateMongoConfig(env) }),
          inject: [EnvService],
        }),
        MongooseModule.forFeature([
          {
            name: EmailChangeRequestSchemaClass.name,
            schema: EmailChangeRequestSchema,
          },
        ]),
      ],
      providers: [
        EmailChangeRequestsService,
        EmailChangeRequestsRepository,
        { provide: AccountsService, useValue: mockAccountsService },
        { provide: AUTH, useValue: mockAuth },
        { provide: EmailService, useValue: mockEmail },
      ],
    }).compile();

    service = module.get(EmailChangeRequestsService);
    repository = module.get(EmailChangeRequestsRepository);
    const env = module.get(EnvService);
    openDppUrl = env.get("OPEN_DPP_URL");
    authSecret = env.get("OPEN_DPP_AUTH_SECRET");
  });

  afterEach(async () => {
    errorSpy.mockRestore();
    await module.close();
  });

  describe("findByUserId", () => {
    it("returns the row when present", async () => {
      const request = EmailChangeRequest.create({
        userId: "user-1",
        newEmail: "new@x.com",
        previousEmail: "current@x.com",
      });
      await repository.upsertByUserId(request);

      const result = await service.findByUserId("user-1");

      expect(result).not.toBeNull();
      expect(result!.id).toBe(request.id);
      expect(result!.userId).toBe("user-1");
      expect(result!.newEmail).toBe("new@x.com");
      expect(result!.previousEmail).toBe("current@x.com");
    });

    it("returns null when absent", async () => {
      expect(await service.findByUserId("user-1")).toBeNull();
    });
  });

  describe("hardCancel", () => {
    it("deletes the shadow row", async () => {
      await repository.upsertByUserId(
        EmailChangeRequest.create({
          userId: "user-1",
          newEmail: "new@x.com",
          previousEmail: "current@x.com",
        }),
      );

      await service.hardCancel("user-1");

      expect(await repository.findByUserId("user-1")).toBeNull();
    });

    it("is tolerant of missing rows (no-op when no pending request)", async () => {
      await expect(service.hardCancel("user-1")).resolves.not.toThrow();

      expect(await repository.findByUserId("user-1")).toBeNull();
    });
  });

  describe("request", () => {
    it("creates a request whose previousEmail is the current email, verifying the password without minting a session", async () => {
      const result = await service.request(currentUser, "new@x.com", "hunter2", headers);

      expect(mockAuth.api.signInEmail).not.toHaveBeenCalled();
      expect(mockAccountsService.verifyPassword).toHaveBeenCalledWith("user-1", "hunter2");
      expect(mockAuth.api.changeEmail).toHaveBeenCalledTimes(1);
      expect(result.newEmail).toBe("new@x.com");

      const persisted = await repository.findByUserId("user-1");
      expect(persisted).not.toBeNull();
      expect(persisted!.newEmail).toBe("new@x.com");
      expect(persisted!.previousEmail).toBe("current@x.com");
    });

    it("sends an EmailChangeNotificationMail to the current email with a verifiable revoke URL after changeEmail succeeds", async () => {
      const result = await service.request(currentUser, "new@x.com", "hunter2", headers);

      const notificationCall = (mockEmail.send.mock.calls as unknown[][]).find(
        (args) => (args[0] as { type?: string } | undefined)?.type === "EMAIL_CHANGE_NOTIFICATION",
      );
      expect(notificationCall).toBeDefined();
      const mail = notificationCall![0] as {
        to: string;
        templateProperties: {
          firstName: string;
          currentEmail: string;
          newEmail: string;
          revokeUrl: string;
        };
      };
      expect(mail.to).toBe("current@x.com");
      expect(mail.templateProperties.firstName).toBe("Ada");
      expect(mail.templateProperties.currentEmail).toBe("current@x.com");
      expect(mail.templateProperties.newEmail).toBe("new@x.com");

      const revokeUrl = new URL(mail.templateProperties.revokeUrl);
      expect(revokeUrl.origin + revokeUrl.pathname).toBe(
        `${openDppUrl}/account/email-change-revoke`,
      );
      const token = revokeUrl.searchParams.get("token");
      expect(typeof token).toBe("string");
      const decoded = verifyRevokeToken(token!, authSecret);
      expect(decoded.userId).toBe("user-1");
      expect(decoded.requestId).toBe(result.id);
    });

    it("falls back to a default firstName when the user has none", async () => {
      await service.request(
        { id: "user-1", email: "current@x.com", firstName: null },
        "new@x.com",
        "hunter2",
        headers,
      );

      const notificationCall = (mockEmail.send.mock.calls as unknown[][]).find(
        (args) => (args[0] as { type?: string } | undefined)?.type === "EMAIL_CHANGE_NOTIFICATION",
      );
      const mail = notificationCall![0] as { templateProperties: { firstName: string } };
      expect(mail.templateProperties.firstName).toBe("User");
    });

    it("rejects with ValueError when password is wrong and creates no session", async () => {
      mockAccountsService.verifyPassword.mockResolvedValue(false);

      await expect(service.request(currentUser, "new@x.com", "wrong", headers)).rejects.toThrow(
        ValueError,
      );

      expect(mockAuth.api.signInEmail).not.toHaveBeenCalled();
      expect(mockAuth.api.changeEmail).not.toHaveBeenCalled();
      expect(mockEmail.send).not.toHaveBeenCalled();
      expect(await repository.findByUserId("user-1")).toBeNull();
    });

    it("replaces an existing pending request atomically", async () => {
      await repository.upsertByUserId(
        EmailChangeRequest.create({
          userId: "user-1",
          newEmail: "stale@x.com",
          previousEmail: "current@x.com",
        }),
      );

      const result = await service.request(currentUser, "new@x.com", "hunter2", headers);

      const persisted = await repository.findByUserId("user-1");
      expect(persisted!.newEmail).toBe("new@x.com");
      expect(result.newEmail).toBe("new@x.com");
    });

    it("rolls back the row when better-auth.changeEmail fails", async () => {
      mockAuth.api.changeEmail.mockRejectedValue(new Error("auth boom"));

      await expect(service.request(currentUser, "new@x.com", "hunter2", headers)).rejects.toThrow(
        "auth boom",
      );

      expect(await repository.findByUserId("user-1")).toBeNull();
      expect(mockEmail.send).not.toHaveBeenCalled();
    });

    it("hard-cancels and throws when the notification email fails to send", async () => {
      mockEmail.send.mockRejectedValue(new Error("SMTP unavailable"));

      await expect(service.request(currentUser, "new@x.com", "hunter2", headers)).rejects.toThrow(
        "SMTP unavailable",
      );

      expect(mockAuth.api.changeEmail).toHaveBeenCalledTimes(1);
      expect(await repository.findByUserId("user-1")).toBeNull();
    });

    it("propagates the rollback error when changeEmail AND deleteByUserId both reject", async () => {
      mockAuth.api.changeEmail.mockRejectedValue(new Error("auth boom"));
      jest.spyOn(repository, "deleteByUserId").mockRejectedValue(new Error("rollback failed"));

      // The catch block awaits the rollback (deleteByUserId) BEFORE re-throwing
      // the original error, so when the rollback itself rejects that rejection
      // propagates first — masking the original "auth boom".
      await expect(service.request(currentUser, "new@x.com", "hunter2", headers)).rejects.toThrow(
        "rollback failed",
      );

      expect(mockEmail.send).not.toHaveBeenCalled();
    });

    it("rejects when newEmail equals currentEmail", async () => {
      await expect(
        service.request(currentUser, "current@x.com", "hunter2", headers),
      ).rejects.toThrow(ValueError);

      expect(mockAuth.api.signInEmail).not.toHaveBeenCalled();
      expect(mockEmail.send).not.toHaveBeenCalled();
      expect(await repository.findByUserId("user-1")).toBeNull();
    });
  });
});
