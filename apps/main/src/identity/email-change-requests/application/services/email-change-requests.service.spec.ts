import { beforeEach, describe, expect, it, jest } from "@jest/globals";
import { Test, TestingModule } from "@nestjs/testing";
import { EnvService } from "@open-dpp/env";
import { ValueError } from "@open-dpp/exception";
import { AUTH } from "../../../auth/auth.provider";
import { EmailChangeRequest } from "../../domain/email-change-request";
import { EmailChangeRequestsRepository } from "../../infrastructure/adapters/email-change-requests.repository";
import { EmailChangeRequestsService } from "./email-change-requests.service";

describe("EmailChangeRequestsService", () => {
  let service: EmailChangeRequestsService;
  let mockRepo: any;
  let mockAuth: any;
  let mockEnv: any;
  let mockInternalAdapter: any;
  let mockPassword: any;

  beforeEach(async () => {
    mockRepo = {
      save: jest.fn(),
      findByUserId: jest.fn(),
      deleteByUserId: jest.fn(),
      upsertByUserId: jest.fn(),
    };
    mockInternalAdapter = {
      findUserByEmail: jest.fn(),
    };
    mockPassword = {
      verify: jest.fn<() => Promise<boolean>>().mockResolvedValue(true),
    };
    mockAuth = {
      api: {
        changeEmail: jest.fn<() => Promise<void>>().mockResolvedValue(undefined),
        signInEmail: jest.fn<() => Promise<void>>().mockResolvedValue(undefined),
        signOut: jest.fn<() => Promise<void>>().mockResolvedValue(undefined),
      },
      $context: Promise.resolve({
        internalAdapter: mockInternalAdapter,
        password: mockPassword,
      }),
    };
    mockEnv = {
      get: jest.fn((key: string) => {
        if (key === "OPEN_DPP_URL") return "https://open-dpp.test";
        if (key === "OPEN_DPP_AUTH_SECRET") return "test-secret-32-chars-min-........";
        return undefined;
      }),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        EmailChangeRequestsService,
        { provide: EmailChangeRequestsRepository, useValue: mockRepo },
        { provide: AUTH, useValue: mockAuth },
        { provide: EnvService, useValue: mockEnv },
      ],
    }).compile();

    service = module.get(EmailChangeRequestsService);
  });

  describe("findByUserId", () => {
    it("returns the row when present", async () => {
      const request = EmailChangeRequest.create({ userId: "user-1", newEmail: "new@x.com" });
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
        EmailChangeRequest.create({ userId: "user-1", newEmail: "new@x.com" }),
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
    const headers = { cookie: "session=abc" } as const;

    beforeEach(() => {
      mockInternalAdapter.findUserByEmail.mockResolvedValue({
        user: { id: "user-1", email: "current@x.com" },
        accounts: [{ providerId: "credential", password: "stored-hash" }],
      });
      mockPassword.verify.mockResolvedValue(true);
    });

    it("creates a new request when none exists, verifying the password without minting a session", async () => {
      mockRepo.upsertByUserId.mockImplementation(async (r: EmailChangeRequest) => r);

      const result = await service.request(
        "user-1",
        "new@x.com",
        "current@x.com",
        "hunter2",
        headers,
      );

      expect(mockAuth.api.signInEmail).not.toHaveBeenCalled();
      expect(mockPassword.verify).toHaveBeenCalledWith({
        hash: "stored-hash",
        password: "hunter2",
      });
      expect(mockRepo.upsertByUserId).toHaveBeenCalledTimes(1);
      expect(mockAuth.api.changeEmail).toHaveBeenCalledTimes(1);
      expect(result.newEmail).toBe("new@x.com");
    });

    it("rejects with ValueError when password is wrong and creates no session", async () => {
      mockPassword.verify.mockResolvedValue(false);

      await expect(
        service.request("user-1", "new@x.com", "current@x.com", "wrong", headers),
      ).rejects.toThrow(ValueError);

      expect(mockAuth.api.signInEmail).not.toHaveBeenCalled();
      expect(mockRepo.upsertByUserId).not.toHaveBeenCalled();
      expect(mockAuth.api.changeEmail).not.toHaveBeenCalled();
    });

    it("rejects with ValueError when no credential account exists", async () => {
      mockInternalAdapter.findUserByEmail.mockResolvedValue({
        user: { id: "user-1", email: "current@x.com" },
        accounts: [],
      });

      await expect(
        service.request("user-1", "new@x.com", "current@x.com", "hunter2", headers),
      ).rejects.toThrow(ValueError);

      expect(mockAuth.api.signInEmail).not.toHaveBeenCalled();
      expect(mockRepo.upsertByUserId).not.toHaveBeenCalled();
      expect(mockAuth.api.changeEmail).not.toHaveBeenCalled();
    });

    it("rejects with ValueError when the email resolves to a different user", async () => {
      mockInternalAdapter.findUserByEmail.mockResolvedValue({
        user: { id: "other-user", email: "current@x.com" },
        accounts: [{ providerId: "credential", password: "stored-hash" }],
      });

      await expect(
        service.request("user-1", "new@x.com", "current@x.com", "hunter2", headers),
      ).rejects.toThrow(ValueError);

      expect(mockPassword.verify).not.toHaveBeenCalled();
      expect(mockRepo.upsertByUserId).not.toHaveBeenCalled();
      expect(mockAuth.api.changeEmail).not.toHaveBeenCalled();
    });

    it("replaces an existing pending request atomically", async () => {
      mockRepo.upsertByUserId.mockImplementation(async (r: EmailChangeRequest) => r);

      const result = await service.request(
        "user-1",
        "new@x.com",
        "current@x.com",
        "hunter2",
        headers,
      );

      expect(mockRepo.upsertByUserId).toHaveBeenCalledTimes(1);
      expect(mockRepo.upsertByUserId.mock.calls[0][0].newEmail).toBe("new@x.com");
      expect(mockRepo.deleteByUserId).not.toHaveBeenCalled();
      expect(result.newEmail).toBe("new@x.com");
    });

    it("rolls back the row when better-auth.changeEmail fails", async () => {
      mockRepo.upsertByUserId.mockImplementation(async (r: EmailChangeRequest) => r);
      mockAuth.api.changeEmail.mockRejectedValue(new Error("auth boom"));

      await expect(
        service.request("user-1", "new@x.com", "current@x.com", "hunter2", headers),
      ).rejects.toThrow();

      expect(mockRepo.upsertByUserId).toHaveBeenCalledTimes(1);
      expect(mockRepo.deleteByUserId).toHaveBeenCalledWith("user-1");
    });

    it("rejects when newEmail equals currentEmail", async () => {
      await expect(
        service.request("user-1", "same@x.com", "same@x.com", "hunter2", headers),
      ).rejects.toThrow(ValueError);

      expect(mockAuth.api.signInEmail).not.toHaveBeenCalled();
      expect(mockRepo.upsertByUserId).not.toHaveBeenCalled();
    });
  });
});
