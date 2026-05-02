import { beforeEach, describe, expect, it, jest } from "@jest/globals";
import { Test, TestingModule } from "@nestjs/testing";
import { EnvService } from "@open-dpp/env";
import { AUTH } from "../../../auth/auth.provider";
import { EmailChangeRequest } from "../../domain/email-change-request";
import { BetterAuthTokenCleaner } from "../../infrastructure/better-auth-token.cleaner";
import { EmailChangeRequestsRepository } from "../../infrastructure/adapters/email-change-requests.repository";
import { EmailChangeRequestsService } from "./email-change-requests.service";

describe("EmailChangeRequestsService", () => {
  let service: EmailChangeRequestsService;
  let mockRepo: any;
  let mockCleaner: any;
  let mockAuth: any;
  let mockEnv: any;

  beforeEach(async () => {
    mockRepo = {
      save: jest.fn(),
      findByUserId: jest.fn(),
      deleteByUserId: jest.fn(),
    };
    mockCleaner = {
      invalidateChangeEmailTokens: jest.fn<() => Promise<void>>().mockResolvedValue(undefined),
    };
    mockAuth = {
      api: {
        changeEmail: jest.fn<() => Promise<void>>().mockResolvedValue(undefined),
      },
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
        { provide: BetterAuthTokenCleaner, useValue: mockCleaner },
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
    it("deletes the row and invalidates tokens", async () => {
      mockRepo.findByUserId.mockResolvedValue(
        EmailChangeRequest.create({ userId: "user-1", newEmail: "new@x.com" }),
      );

      await service.hardCancel("user-1");

      expect(mockRepo.deleteByUserId).toHaveBeenCalledWith("user-1");
      expect(mockCleaner.invalidateChangeEmailTokens).toHaveBeenCalledWith("user-1");
    });

    it("is tolerant of missing rows (no-op when no pending request)", async () => {
      mockRepo.findByUserId.mockResolvedValue(null);

      await expect(service.hardCancel("user-1")).resolves.not.toThrow();

      expect(mockRepo.deleteByUserId).toHaveBeenCalledWith("user-1");
      expect(mockCleaner.invalidateChangeEmailTokens).toHaveBeenCalledWith("user-1");
    });

    it("is tolerant of cleaner failure (logs and continues)", async () => {
      mockRepo.findByUserId.mockResolvedValue(
        EmailChangeRequest.create({ userId: "user-1", newEmail: "new@x.com" }),
      );
      mockCleaner.invalidateChangeEmailTokens.mockRejectedValue(new Error("verif boom"));

      await expect(service.hardCancel("user-1")).resolves.not.toThrow();
      expect(mockRepo.deleteByUserId).toHaveBeenCalledWith("user-1");
    });
  });
});
