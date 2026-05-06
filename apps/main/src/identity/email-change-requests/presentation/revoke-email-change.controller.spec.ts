import { beforeEach, describe, expect, it, jest } from "@jest/globals";
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

  it("redirects to ?status=ok when token is valid and a matching request exists, then hard-cancels", async () => {
    const existing = EmailChangeRequest.create({ userId: "user-1", newEmail: "new@x.com" });
    mockService.findByUserId.mockResolvedValue(existing);
    const token = signRevokeToken(
      { userId: existing.userId, requestId: existing.id },
      SECRET,
      60_000,
    );

    const result = await controller.revoke(token);

    expect(result).toEqual({
      url: `${BASE_URL}/account/email-change-revoked?status=ok`,
      statusCode: 302,
    });
    expect(mockService.findByUserId).toHaveBeenCalledWith("user-1");
    expect(mockService.hardCancel).toHaveBeenCalledWith("user-1");
  });

  it("redirects to ?status=invalid when the token is malformed", async () => {
    const result = await controller.revoke("not-a-valid-token");

    expect(result).toEqual({
      url: `${BASE_URL}/account/email-change-revoked?status=invalid`,
      statusCode: 302,
    });
    expect(mockService.hardCancel).not.toHaveBeenCalled();
  });

  it("redirects to ?status=invalid when the token is expired", async () => {
    const expiredToken = signRevokeToken(
      { userId: "user-1", requestId: "req-1" },
      SECRET,
      -1_000, // expired 1 second ago
    );

    const result = await controller.revoke(expiredToken);

    expect(result).toEqual({
      url: `${BASE_URL}/account/email-change-revoked?status=invalid`,
      statusCode: 302,
    });
    expect(mockService.hardCancel).not.toHaveBeenCalled();
  });

  it("redirects to ?status=ok (idempotent) when no current request matches the token's requestId", async () => {
    mockService.findByUserId.mockResolvedValue(null);
    const token = signRevokeToken({ userId: "user-1", requestId: "stale-req" }, SECRET, 60_000);

    const result = await controller.revoke(token);

    expect(result).toEqual({
      url: `${BASE_URL}/account/email-change-revoked?status=ok`,
      statusCode: 302,
    });
    expect(mockService.hardCancel).not.toHaveBeenCalled();
  });

  it("redirects to ?status=ok (idempotent) when the current request id does not match the token's requestId", async () => {
    const existing = EmailChangeRequest.create({ userId: "user-1", newEmail: "new@x.com" });
    mockService.findByUserId.mockResolvedValue(existing);
    const token = signRevokeToken(
      { userId: "user-1", requestId: "different-request-id" },
      SECRET,
      60_000,
    );

    const result = await controller.revoke(token);

    expect(result).toEqual({
      url: `${BASE_URL}/account/email-change-revoked?status=ok`,
      statusCode: 302,
    });
    expect(mockService.hardCancel).not.toHaveBeenCalled();
  });

  it("redirects to ?status=invalid when no token is supplied", async () => {
    const result = await controller.revoke(undefined as unknown as string);

    expect(result).toEqual({
      url: `${BASE_URL}/account/email-change-revoked?status=invalid`,
      statusCode: 302,
    });
    expect(mockService.findByUserId).not.toHaveBeenCalled();
    expect(mockService.hardCancel).not.toHaveBeenCalled();
  });
});
