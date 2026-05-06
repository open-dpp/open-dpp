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

  beforeEach(async () => {
    mockRepo = {
      save: jest.fn(),
      findByUserId: jest.fn(),
      deleteByUserId: jest.fn(),
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
      mockAuth.api.signInEmail = jest.fn<() => Promise<void>>().mockResolvedValue(undefined);
    });

    it("creates a new request when none exists", async () => {
      mockRepo.findByUserId.mockResolvedValue(null);
      mockRepo.save.mockImplementation(async (r: EmailChangeRequest) => r);

      const result = await service.request(
        "user-1",
        "new@x.com",
        "current@x.com",
        "hunter2",
        headers,
      );

      expect(mockAuth.api.signInEmail).toHaveBeenCalledWith({
        body: { email: "current@x.com", password: "hunter2" },
      });
      expect(mockRepo.save).toHaveBeenCalledTimes(1);
      expect(mockAuth.api.changeEmail).toHaveBeenCalledTimes(1);
      expect(result.newEmail).toBe("new@x.com");
    });

    it("rejects when password is wrong", async () => {
      mockRepo.findByUserId.mockResolvedValue(null);
      mockAuth.api.signInEmail.mockRejectedValue(new Error("bad password"));

      await expect(
        service.request("user-1", "new@x.com", "current@x.com", "wrong", headers),
      ).rejects.toThrow(ValueError);

      expect(mockRepo.save).not.toHaveBeenCalled();
      expect(mockAuth.api.changeEmail).not.toHaveBeenCalled();
    });

    it("hard-cancels existing pending and replaces it", async () => {
      const existing = EmailChangeRequest.create({ userId: "user-1", newEmail: "old@x.com" });
      mockRepo.findByUserId.mockResolvedValue(existing);
      mockRepo.save.mockImplementation(async (r: EmailChangeRequest) => r);

      const result = await service.request(
        "user-1",
        "new@x.com",
        "current@x.com",
        "hunter2",
        headers,
      );

      expect(mockRepo.deleteByUserId).toHaveBeenCalledWith("user-1");
      expect(result.newEmail).toBe("new@x.com");
    });

    it("rolls back the row when better-auth.changeEmail fails", async () => {
      mockRepo.findByUserId.mockResolvedValue(null);
      mockRepo.save.mockImplementation(async (r: EmailChangeRequest) => r);
      mockAuth.api.changeEmail.mockRejectedValue(new Error("auth boom"));

      await expect(
        service.request("user-1", "new@x.com", "current@x.com", "hunter2", headers),
      ).rejects.toThrow();

      expect(mockRepo.save).toHaveBeenCalledTimes(1);
      expect(mockRepo.deleteByUserId).toHaveBeenCalledWith("user-1");
    });

    it("rejects when newEmail equals currentEmail", async () => {
      mockRepo.findByUserId.mockResolvedValue(null);

      await expect(
        service.request("user-1", "same@x.com", "same@x.com", "hunter2", headers),
      ).rejects.toThrow(ValueError);

      expect(mockAuth.api.signInEmail).not.toHaveBeenCalled();
      expect(mockRepo.save).not.toHaveBeenCalled();
    });
  });
});
