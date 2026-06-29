import { beforeEach, describe, expect, it, jest } from "@jest/globals";
import { Logger } from "@nestjs/common";
import { Test, TestingModule } from "@nestjs/testing";
import { EnvService } from "@open-dpp/env";
import { EmailChangeRequestsService } from "../application/services/email-change-requests.service";
import { EmailChangeRequest } from "../domain/email-change-request";
import { signRevokeToken } from "../domain/revoke-token";
import { RevokeEmailChangeController } from "./revoke-email-change.controller";

const SECRET = "test-secret-32-chars-min-........";
const BASE_URL = "https://open-dpp.test";

describe("RevokeEmailChangeController", () => {
  let controller: RevokeEmailChangeController;
  let mockService: any;
  let mockEnv: any;

  beforeEach(async () => {
    mockService = {
      findByUserId: jest.fn(),
      hardCancel: jest.fn<() => Promise<void>>().mockResolvedValue(undefined),
    };
    mockEnv = {
      get: jest.fn((key: string) => {
        if (key === "OPEN_DPP_URL") return BASE_URL;
        if (key === "OPEN_DPP_AUTH_SECRET") return SECRET;
        return undefined;
      }),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [RevokeEmailChangeController],
      providers: [
        { provide: EmailChangeRequestsService, useValue: mockService },
        { provide: EnvService, useValue: mockEnv },
      ],
    }).compile();

    controller = module.get<RevokeEmailChangeController>(RevokeEmailChangeController);
  });

  describe("POST revoke", () => {
    it("returns status:ok and hard-cancels when the token matches the current pending request", async () => {
      const existing = EmailChangeRequest.create({
        userId: "user-1",
        newEmail: "new@x.com",
        previousEmail: "old@x.com",
      });
      mockService.findByUserId.mockResolvedValue(existing);
      const token = signRevokeToken(
        { userId: existing.userId, requestId: existing.id },
        SECRET,
        60_000,
      );

      const result = await controller.revoke({ token });

      expect(result).toEqual({ status: "ok" });
      expect(mockService.findByUserId).toHaveBeenCalledWith("user-1");
      expect(mockService.hardCancel).toHaveBeenCalledWith("user-1");
    });

    it("returns status:invalid when the token is malformed", async () => {
      const result = await controller.revoke({ token: "not-a-valid-token" });

      expect(result).toEqual({ status: "invalid" });
      expect(mockService.hardCancel).not.toHaveBeenCalled();
    });

    it("returns status:invalid when the token is expired", async () => {
      const expiredToken = signRevokeToken(
        { userId: "user-1", requestId: "req-1" },
        SECRET,
        -1_000,
      );

      const result = await controller.revoke({ token: expiredToken });

      expect(result).toEqual({ status: "invalid" });
      expect(mockService.hardCancel).not.toHaveBeenCalled();
    });

    it("returns status:ok (idempotent) when no current request matches the token's requestId", async () => {
      mockService.findByUserId.mockResolvedValue(null);
      const token = signRevokeToken({ userId: "user-1", requestId: "stale-req" }, SECRET, 60_000);

      const result = await controller.revoke({ token });

      expect(result).toEqual({ status: "ok" });
      expect(mockService.hardCancel).not.toHaveBeenCalled();
    });

    it("returns status:ok (idempotent) when the current request id does not match the token's requestId", async () => {
      const existing = EmailChangeRequest.create({
        userId: "user-1",
        newEmail: "new@x.com",
        previousEmail: "old@x.com",
      });
      mockService.findByUserId.mockResolvedValue(existing);
      const token = signRevokeToken(
        { userId: "user-1", requestId: "different-request-id" },
        SECRET,
        60_000,
      );

      const result = await controller.revoke({ token });

      expect(result).toEqual({ status: "ok" });
      expect(mockService.hardCancel).not.toHaveBeenCalled();
    });

    it("returns status:invalid when no token is supplied", async () => {
      const result = await controller.revoke({ token: "" });

      expect(result).toEqual({ status: "invalid" });
      expect(mockService.findByUserId).not.toHaveBeenCalled();
      expect(mockService.hardCancel).not.toHaveBeenCalled();
    });

    it("returns status:error (not invalid) when hardCancel fails, so a system failure is not masked as a bad link", async () => {
      const errorSpy = jest.spyOn(Logger.prototype, "error").mockImplementation(() => undefined);
      const existing = EmailChangeRequest.create({
        userId: "user-1",
        newEmail: "new@x.com",
        previousEmail: "old@x.com",
      });
      mockService.findByUserId.mockResolvedValue(existing);
      mockService.hardCancel.mockRejectedValue(new Error("mongo down"));
      const token = signRevokeToken(
        { userId: existing.userId, requestId: existing.id },
        SECRET,
        60_000,
      );

      const result = await controller.revoke({ token });

      expect(result).toEqual({ status: "error" });
      expect(mockService.hardCancel).toHaveBeenCalledWith("user-1");
      expect(errorSpy).toHaveBeenCalled();
      errorSpy.mockRestore();
    });

    it("returns status:error when the request lookup fails", async () => {
      const errorSpy = jest.spyOn(Logger.prototype, "error").mockImplementation(() => undefined);
      mockService.findByUserId.mockRejectedValue(new Error("mongo down"));
      const token = signRevokeToken({ userId: "user-1", requestId: "req-1" }, SECRET, 60_000);

      const result = await controller.revoke({ token });

      expect(result).toEqual({ status: "error" });
      expect(mockService.hardCancel).not.toHaveBeenCalled();
      expect(errorSpy).toHaveBeenCalled();
      errorSpy.mockRestore();
    });
  });

  describe("GET revoke/info", () => {
    it("returns valid:true with the new email when the token matches the current pending request", async () => {
      const existing = EmailChangeRequest.create({
        userId: "user-1",
        newEmail: "new@x.com",
        previousEmail: "old@x.com",
      });
      mockService.findByUserId.mockResolvedValue(existing);
      const token = signRevokeToken(
        { userId: existing.userId, requestId: existing.id },
        SECRET,
        60_000,
      );

      const result = await controller.revokeInfo(token);

      expect(result).toEqual({ valid: true, newEmail: "new@x.com" });
      expect(mockService.hardCancel).not.toHaveBeenCalled();
    });

    it("returns valid:true without an email when the token is valid but no matching request exists", async () => {
      mockService.findByUserId.mockResolvedValue(null);
      const token = signRevokeToken({ userId: "user-1", requestId: "stale-req" }, SECRET, 60_000);

      const result = await controller.revokeInfo(token);

      expect(result).toEqual({ valid: true });
    });

    it("returns valid:false when the token is malformed", async () => {
      const result = await controller.revokeInfo("not-a-valid-token");

      expect(result).toEqual({ valid: false });
      expect(mockService.findByUserId).not.toHaveBeenCalled();
    });

    it("returns valid:false when no token is supplied", async () => {
      const result = await controller.revokeInfo(undefined as unknown as string);

      expect(result).toEqual({ valid: false });
      expect(mockService.findByUserId).not.toHaveBeenCalled();
    });

    it("returns valid:false when the request lookup fails", async () => {
      const errorSpy = jest.spyOn(Logger.prototype, "error").mockImplementation(() => undefined);
      mockService.findByUserId.mockRejectedValue(new Error("mongo down"));
      const token = signRevokeToken({ userId: "user-1", requestId: "req-1" }, SECRET, 60_000);

      const result = await controller.revokeInfo(token);

      expect(result).toEqual({ valid: false });
      expect(errorSpy).toHaveBeenCalled();
      errorSpy.mockRestore();
    });
  });
});
