import { jest } from "@jest/globals";
import { ExecutionContext } from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { Test, TestingModule } from "@nestjs/testing";
import { EnvService } from "@open-dpp/env";
import { MembersService } from "../../../organizations/application/services/members.service";
import { UsersRepository } from "../../../users/infrastructure/adapters/users.repository";
import { SessionsService } from "../../application/services/sessions.service";
import { AuthGuard } from "./auth.guard";

describe("authGuard Allowlist Repro", () => {
  let guard: AuthGuard;
  let mockSessionsService: any;
  let mockMembersService: any;

  beforeEach(async () => {
    mockSessionsService = {
      getSession: jest.fn<() => Promise<null>>().mockResolvedValue(null),
      verifyApiKey: jest.fn<() => Promise<null>>().mockResolvedValue(null),
    };
    mockMembersService = {
      isMemberOfOrganization: jest.fn<() => Promise<boolean>>().mockResolvedValue(false),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthGuard,
        {
          provide: Reflector,
          useValue: {
            getAllAndOverride: jest.fn(),
          },
        },
        {
          provide: EnvService,
          useValue: {
            get: jest.fn(),
          },
        },
        {
          provide: SessionsService,
          useValue: mockSessionsService,
        },
        {
          provide: MembersService,
          useValue: mockMembersService,
        },
        {
          provide: UsersRepository,
          useValue: {
            findOneById: jest.fn(),
          },
        },
      ],
    }).compile();

    guard = module.get<AuthGuard>(AuthGuard);
  });

  const createMockContext = (url: string, headers: any = {}) => {
    const request = {
      url,
      headers,
      params: {},
      session: null as any,
    };
    return {
      switchToHttp: () => ({
        getRequest: () => request,
      }),
      getHandler: () => { },
      getClass: () => { },
      _request: request,
    } as ExecutionContext & { _request: any };
  };

  it("should allow /api/sse exactly", async () => {
    const context = createMockContext("/api/sse");
    expect(await guard.canActivate(context)).toBe(true);
  });

  it("should NOT allow /api/sse/something", async () => {
    const context = createMockContext("/api/sse/123");
    expect(await guard.canActivate(context)).toBe(false);
  });

  it("should allow /api/sse?query=123", async () => {
    const context = createMockContext("/api/sse?foo=bar");
    expect(await guard.canActivate(context)).toBe(true);
  });

  it("should allow /api/messages exactly", async () => {
    const context = createMockContext("/api/messages");
    expect(await guard.canActivate(context)).toBe(true);
  });

  it("should NOT allow /api/messages/something", async () => {
    const context = createMockContext("/api/messages/123");
    expect(await guard.canActivate(context)).toBe(false);
  });

  it("should NOT allow /api/sse-extension (partial match prefix)", async () => {
    const context = createMockContext("/api/sse-extension");
    expect(await guard.canActivate(context)).toBe(false);
  });

  it("should NOT allow /api/messages-extension (partial match prefix)", async () => {
    const context = createMockContext("/api/messages-extension");
    expect(await guard.canActivate(context)).toBe(false);
  });

  describe("api key authentication", () => {
    it("should create synthetic session when API key is valid", async () => {
      mockSessionsService.verifyApiKey.mockResolvedValue({ userId: "user-789" });
      const context = createMockContext("/api/items", { "x-api-key": "valid-key" });

      const result = await guard.canActivate(context);

      expect(result).toBe(true);
      expect(mockSessionsService.verifyApiKey).toHaveBeenCalledWith("valid-key");
      const request = (context as any)._request;
      expect(request.session).toBeDefined();
      expect(request.session.userId).toBe("user-789");
    });

    it("should deny access when API key is invalid", async () => {
      mockSessionsService.verifyApiKey.mockResolvedValue(null);
      const context = createMockContext("/api/items", { "x-api-key": "invalid-key" });

      const result = await guard.canActivate(context);

      expect(result).toBe(false);
    });

    it("should check org membership when API key and org header are provided", async () => {
      mockSessionsService.verifyApiKey.mockResolvedValue({ userId: "user-789" });
      mockMembersService.isMemberOfOrganization.mockResolvedValue(true);
      const context = createMockContext("/api/items", {
        "x-api-key": "valid-key",
        "x-open-dpp-organization-id": "org-1",
      });

      const result = await guard.canActivate(context);

      expect(result).toBe(true);
      expect(mockMembersService.isMemberOfOrganization).toHaveBeenCalledWith("user-789", "org-1");
    });

    it("should deny when API key user is not member of org", async () => {
      mockSessionsService.verifyApiKey.mockResolvedValue({ userId: "user-789" });
      mockMembersService.isMemberOfOrganization.mockResolvedValue(false);
      const context = createMockContext("/api/items", {
        "x-api-key": "valid-key",
        "x-open-dpp-organization-id": "org-1",
      });

      const result = await guard.canActivate(context);

      expect(result).toBe(false);
    });

    it("should treat API key verification failure as no session", async () => {
      mockSessionsService.verifyApiKey.mockRejectedValue(new Error("Network error"));
      const context = createMockContext("/api/items", { "x-api-key": "some-key" });

      const result = await guard.canActivate(context);

      expect(result).toBe(false);
    });
  });
});
