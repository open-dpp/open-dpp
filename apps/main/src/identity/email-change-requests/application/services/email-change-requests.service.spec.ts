import { beforeEach, describe, expect, it, jest } from "@jest/globals";
import { Test, TestingModule } from "@nestjs/testing";
import { EnvService } from "@open-dpp/env";
import { ValueError } from "@open-dpp/exception";
import { AccountsService } from "../../../accounts/application/services/accounts.service";
import { AUTH } from "../../../auth/auth.provider";
import { EmailService } from "../../../../email/email.service";
import { EmailChangeRequest } from "../../domain/email-change-request";
import { verifyRevokeToken } from "../../domain/revoke-token";
import { EmailChangeRequestsRepository } from "../../infrastructure/adapters/email-change-requests.repository";
import { EmailChangeRequestsService } from "./email-change-requests.service";

const AUTH_SECRET = "test-secret-32-chars-min-........";

describe("EmailChangeRequestsService", () => {
  let service: EmailChangeRequestsService;
  let mockRepo: any;
  let mockAuth: any;
  let mockEnv: any;
  let mockEmail: any;
  let mockAccountsService: any;

  const currentUser = { id: "user-1", email: "current@x.com", firstName: "Ada" };
  const headers = { cookie: "session=abc" } as const;

  beforeEach(async () => {
    mockRepo = {
      save: jest.fn(),
      findByUserId: jest.fn(),
      deleteByUserId: jest.fn(),
      upsertByUserId: jest.fn(),
    };
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
    mockEnv = {
      get: jest.fn((key: string) => {
        if (key === "OPEN_DPP_URL") return "https://open-dpp.test";
        if (key === "OPEN_DPP_AUTH_SECRET") return AUTH_SECRET;
        return undefined;
      }),
    };
    mockEmail = {
      send: jest.fn<() => Promise<void>>().mockResolvedValue(undefined),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        EmailChangeRequestsService,
        { provide: EmailChangeRequestsRepository, useValue: mockRepo },
        { provide: AccountsService, useValue: mockAccountsService },
        { provide: AUTH, useValue: mockAuth },
        { provide: EnvService, useValue: mockEnv },
        { provide: EmailService, useValue: mockEmail },
      ],
    }).compile();

    service = module.get(EmailChangeRequestsService);
  });

  describe("findByUserId", () => {
    it("returns the row when present", async () => {
      const request = EmailChangeRequest.create({
        userId: "user-1",
        newEmail: "new@x.com",
        previousEmail: "current@x.com",
      });
      mockRepo.findByUserId.mockResolvedValue(request);
      const result = await service.findByUserId("user-1");
      expect(result).toBe(request);
    });

    it("returns null when absent", async () => {
      mockRepo.findByUserId.mockResolvedValue(null);
      expect(await service.findByUserId("user-1")).toBeNull();
    });
  });

  describe("hardCancel", () => {
    it("deletes the shadow row", async () => {
      mockRepo.findByUserId.mockResolvedValue(
        EmailChangeRequest.create({
          userId: "user-1",
          newEmail: "new@x.com",
          previousEmail: "current@x.com",
        }),
      );

      await service.hardCancel("user-1");

      expect(mockRepo.deleteByUserId).toHaveBeenCalledWith("user-1");
    });

    it("is tolerant of missing rows (no-op when no pending request)", async () => {
      mockRepo.findByUserId.mockResolvedValue(null);

      await expect(service.hardCancel("user-1")).resolves.not.toThrow();

      expect(mockRepo.deleteByUserId).toHaveBeenCalledWith("user-1");
    });
  });

  describe("request", () => {
    beforeEach(() => {
      mockAccountsService.verifyPassword.mockResolvedValue(true);
      mockRepo.upsertByUserId.mockImplementation(async (r: EmailChangeRequest) => r);
    });

    it("creates a request whose previousEmail is the current email, verifying the password without minting a session", async () => {
      const result = await service.request(currentUser, "new@x.com", "hunter2", headers);

      expect(mockAuth.api.signInEmail).not.toHaveBeenCalled();
      expect(mockAccountsService.verifyPassword).toHaveBeenCalledWith("user-1", "hunter2");
      expect(mockRepo.upsertByUserId).toHaveBeenCalledTimes(1);
      const persisted = mockRepo.upsertByUserId.mock.calls[0][0] as EmailChangeRequest;
      expect(persisted.newEmail).toBe("new@x.com");
      expect(persisted.previousEmail).toBe("current@x.com");
      expect(mockAuth.api.changeEmail).toHaveBeenCalledTimes(1);
      expect(result.newEmail).toBe("new@x.com");
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
        "https://open-dpp.test/api/users/email-change/revoke",
      );
      const token = revokeUrl.searchParams.get("token");
      expect(typeof token).toBe("string");
      const decoded = verifyRevokeToken(token!, AUTH_SECRET);
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
      expect(mockRepo.upsertByUserId).not.toHaveBeenCalled();
      expect(mockAuth.api.changeEmail).not.toHaveBeenCalled();
      expect(mockEmail.send).not.toHaveBeenCalled();
    });

    it("replaces an existing pending request atomically", async () => {
      const result = await service.request(currentUser, "new@x.com", "hunter2", headers);

      expect(mockRepo.upsertByUserId).toHaveBeenCalledTimes(1);
      expect(mockRepo.upsertByUserId.mock.calls[0][0].newEmail).toBe("new@x.com");
      expect(mockRepo.deleteByUserId).not.toHaveBeenCalled();
      expect(result.newEmail).toBe("new@x.com");
    });

    it("rolls back the row when better-auth.changeEmail fails", async () => {
      mockAuth.api.changeEmail.mockRejectedValue(new Error("auth boom"));

      await expect(service.request(currentUser, "new@x.com", "hunter2", headers)).rejects.toThrow();

      expect(mockRepo.upsertByUserId).toHaveBeenCalledTimes(1);
      expect(mockRepo.deleteByUserId).toHaveBeenCalledWith("user-1");
      expect(mockEmail.send).not.toHaveBeenCalled();
    });

    it("hard-cancels and throws when the notification email fails to send", async () => {
      mockEmail.send.mockRejectedValue(new Error("SMTP unavailable"));

      await expect(service.request(currentUser, "new@x.com", "hunter2", headers)).rejects.toThrow();

      expect(mockAuth.api.changeEmail).toHaveBeenCalledTimes(1);
      expect(mockRepo.deleteByUserId).toHaveBeenCalledWith("user-1");
    });

    it("rejects when newEmail equals currentEmail", async () => {
      await expect(
        service.request(currentUser, "current@x.com", "hunter2", headers),
      ).rejects.toThrow(ValueError);

      expect(mockAuth.api.signInEmail).not.toHaveBeenCalled();
      expect(mockRepo.upsertByUserId).not.toHaveBeenCalled();
      expect(mockEmail.send).not.toHaveBeenCalled();
    });
  });
});
