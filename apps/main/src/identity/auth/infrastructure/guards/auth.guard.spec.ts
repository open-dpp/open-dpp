import { jest } from "@jest/globals";
import { ExecutionContext, ForbiddenException, UnauthorizedException } from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { Test, TestingModule } from "@nestjs/testing";
import { EnvService } from "@open-dpp/env";
import { Member } from "../../../organizations/domain/member";
import { MemberRole } from "../../../organizations/domain/member-role.enum";
import { MembersRepository } from "../../../organizations/infrastructure/adapters/members.repository";
import { UsersRepository } from "../../../users/infrastructure/adapters/users.repository";
import { SessionsService } from "../../application/services/sessions.service";
import { AuthMethod, Session } from "../../domain/session";
import { SESSION_ONLY } from "../../presentation/decorators/session-only.decorator";
import { AuthGuard } from "./auth.guard";
import { LatestApiVersionWithPrefixDto } from "@open-dpp/dto";

describe("authGuard Allowlist Repro", () => {
  let guard: AuthGuard;
  let mockSessionsService: any;
  let mockMembersRepository: any;
  let mockUsersRepository: any;
  let mockReflector: any;

  beforeEach(async () => {
    mockSessionsService = {
      getSession: jest.fn<() => Promise<null>>().mockResolvedValue(null),
      verifyApiKey: jest.fn<() => Promise<null>>().mockResolvedValue(null),
      verifyAccessToken: jest.fn<() => Promise<null>>().mockResolvedValue(null),
      acceptsAccessTokens: false,
    };
    mockMembersRepository = {
      findOneByUserIdAndOrganizationId: jest
        .fn<() => Promise<Member | null>>()
        .mockResolvedValue(null),
    };
    mockUsersRepository = {
      findOneById: jest.fn<() => Promise<unknown>>().mockResolvedValue(undefined),
    };
    mockReflector = {
      getAllAndOverride: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthGuard,
        {
          provide: Reflector,
          useValue: mockReflector,
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
          provide: MembersRepository,
          useValue: mockMembersRepository,
        },
        {
          provide: UsersRepository,
          useValue: mockUsersRepository,
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
      getHandler: () => {},
      getClass: () => {},
      _request: request,
    } as ExecutionContext & { _request: any };
  };

  it(`should allow /api/${LatestApiVersionWithPrefixDto}/sse exactly`, async () => {
    const context = createMockContext(`/api/${LatestApiVersionWithPrefixDto}/sse`);
    expect(await guard.canActivate(context)).toBe(true);
  });

  it(`should NOT allow /api/${LatestApiVersionWithPrefixDto}/sse/something`, async () => {
    const context = createMockContext(`/api/${LatestApiVersionWithPrefixDto}/sse/123`);
    expect(await guard.canActivate(context)).toBe(false);
  });

  it(`should allow /api/${LatestApiVersionWithPrefixDto}/sse?query=123`, async () => {
    const context = createMockContext(`/api/${LatestApiVersionWithPrefixDto}/sse?foo=bar`);
    expect(await guard.canActivate(context)).toBe(true);
  });

  it(`should allow /api/${LatestApiVersionWithPrefixDto}/messages exactly`, async () => {
    const context = createMockContext(`/api/${LatestApiVersionWithPrefixDto}/messages`);
    expect(await guard.canActivate(context)).toBe(true);
  });

  it(`should NOT allow /api/${LatestApiVersionWithPrefixDto}/messages/something`, async () => {
    const context = createMockContext(`/api/${LatestApiVersionWithPrefixDto}/messages/123`);
    expect(await guard.canActivate(context)).toBe(false);
  });

  it(`should NOT allow /api/${LatestApiVersionWithPrefixDto}/sse-extension (partial match prefix)`, async () => {
    const context = createMockContext(`/api/${LatestApiVersionWithPrefixDto}/sse-extension`);
    expect(await guard.canActivate(context)).toBe(false);
  });

  it(`should NOT allow /api/${LatestApiVersionWithPrefixDto}/messages-extension (partial match prefix)`, async () => {
    const context = createMockContext(`/api/${LatestApiVersionWithPrefixDto}/messages-extension`);
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
      const context = createMockContext(`/api/${LatestApiVersionWithPrefixDto}/items`, {
        "x-api-key": "invalid-key",
      });

      const result = await guard.canActivate(context);

      expect(result).toBe(false);
    });

    it("should check org membership when API key and org header are provided", async () => {
      mockSessionsService.verifyApiKey.mockResolvedValue({ userId: "user-789" });
      mockMembersRepository.findOneByUserIdAndOrganizationId.mockResolvedValue(
        Member.create({ userId: "user-789", organizationId: "org-1", role: MemberRole.MEMBER }),
      );
      const context = createMockContext("/api/items", {
        "x-api-key": "valid-key",
        "x-open-dpp-organization-id": "org-1",
      });

      const result = await guard.canActivate(context);

      expect(result).toBe(true);
      expect(mockMembersRepository.findOneByUserIdAndOrganizationId).toHaveBeenCalledWith(
        "user-789",
        "org-1",
      );
    });

    it("should deny when API key user is not member of org", async () => {
      mockSessionsService.verifyApiKey.mockResolvedValue({ userId: "user-789" });
      mockMembersRepository.findOneByUserIdAndOrganizationId.mockResolvedValue(null);
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

  describe("Trusted Client access tokens", () => {
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000);

    function enableOAuthProvider() {
      mockSessionsService.acceptsAccessTokens = true;
      mockSessionsService.verifyAccessToken.mockResolvedValue({ userId: "user-789", expiresAt });
      mockUsersRepository.findOneById.mockResolvedValue({ id: "user-789", role: "user" });
    }

    it("builds an OAuth session from a verified bearer token", async () => {
      enableOAuthProvider();
      const context = createMockContext("/api/items", { authorization: "Bearer the.jwt.token" });

      const result = await guard.canActivate(context);

      expect(result).toBe(true);
      expect(mockSessionsService.verifyAccessToken).toHaveBeenCalledWith("the.jwt.token");
      const session: Session = (context as any)._request.session;
      expect(session.authMethod).toBe(AuthMethod.OAUTH);
      expect(session.userId).toBe("user-789");
      expect(session.expiresAt).toEqual(expiresAt);
      expect((context as any)._request.user).toEqual({ id: "user-789", role: "user" });
    });

    it("rejects an invalid bearer token with 401", async () => {
      enableOAuthProvider();
      mockSessionsService.verifyAccessToken.mockResolvedValue(null);
      const context = createMockContext("/api/items", {
        authorization: "Bearer expired.or.forged",
      });

      await expect(guard.canActivate(context)).rejects.toThrow(UnauthorizedException);
      expect(mockSessionsService.getSession).not.toHaveBeenCalled();
    });

    it("lets a public route proceed anonymously despite a rejected bearer token", async () => {
      enableOAuthProvider();
      mockSessionsService.verifyAccessToken.mockResolvedValue(null);
      mockReflector.getAllAndOverride.mockImplementation((key: string) => key === "PUBLIC");
      const context = createMockContext("/api/passports/public", {
        authorization: "Bearer expired.or.forged",
      });

      expect(await guard.canActivate(context)).toBe(true);
      expect((context as any)._request.session).toBeNull();
    });

    it("lets an optional-auth route proceed anonymously despite a rejected bearer token", async () => {
      enableOAuthProvider();
      mockSessionsService.verifyAccessToken.mockResolvedValue(null);
      mockReflector.getAllAndOverride.mockImplementation((key: string) => key === "OPTIONAL");
      const context = createMockContext(
        `/api/${LatestApiVersionWithPrefixDto}/auth/oauth2/userinfo`,
        {
          authorization: "Bearer narrow.or.expired",
        },
      );

      expect(await guard.canActivate(context)).toBe(true);
      expect((context as any)._request.session).toBeNull();
    });

    it("attaches the OAuth session on an optional-auth route", async () => {
      enableOAuthProvider();
      mockReflector.getAllAndOverride.mockImplementation((key: string) => key === "OPTIONAL");
      const context = createMockContext("/api/passports/public", {
        authorization: "Bearer the.jwt.token",
      });

      expect(await guard.canActivate(context)).toBe(true);
      expect((context as any)._request.session.authMethod).toBe(AuthMethod.OAUTH);
    });

    it("rejects a verified token whose User no longer exists with 401", async () => {
      enableOAuthProvider();
      mockUsersRepository.findOneById.mockResolvedValue(null);
      const context = createMockContext("/api/items", { authorization: "Bearer the.jwt.token" });

      await expect(guard.canActivate(context)).rejects.toThrow(UnauthorizedException);
    });

    it("ignores the bearer header while the OAuth Provider is disabled", async () => {
      const context = createMockContext("/api/items", {
        authorization: "Bearer the.jwt.token",
        cookie: "better-auth.session_token=abc",
      });

      const result = await guard.canActivate(context);

      expect(result).toBe(false);
      expect(mockSessionsService.verifyAccessToken).not.toHaveBeenCalled();
      expect(mockSessionsService.getSession).toHaveBeenCalledTimes(1);
      const headers: Headers = mockSessionsService.getSession.mock.calls[0][0];
      expect(headers.get("authorization")).toBe("Bearer the.jwt.token");
      expect(headers.get("cookie")).toBe("better-auth.session_token=abc");
    });

    it("leaves a non-bearer authorization header to the session lookup", async () => {
      enableOAuthProvider();
      const context = createMockContext("/api/items", { authorization: "Basic dXNlcjpwdw==" });

      await guard.canActivate(context);

      expect(mockSessionsService.verifyAccessToken).not.toHaveBeenCalled();
      expect(mockSessionsService.getSession).toHaveBeenCalledTimes(1);
    });

    it("prefers the api key when both credentials are sent", async () => {
      enableOAuthProvider();
      mockSessionsService.verifyApiKey.mockResolvedValue({ userId: "user-1" });
      const context = createMockContext("/api/items", {
        "x-api-key": "valid-key",
        authorization: "Bearer the.jwt.token",
      });

      const result = await guard.canActivate(context);

      expect(result).toBe(true);
      expect(mockSessionsService.verifyAccessToken).not.toHaveBeenCalled();
      expect((context as any)._request.session.authMethod).toBe(AuthMethod.API_KEY);
    });

    it("resolves the organization context through membership, as for any session", async () => {
      enableOAuthProvider();
      const member = Member.create({
        userId: "user-789",
        organizationId: "org-1",
        role: MemberRole.OWNER,
      });
      mockMembersRepository.findOneByUserIdAndOrganizationId.mockResolvedValue(member);
      const context = createMockContext("/api/items", {
        authorization: "Bearer the.jwt.token",
        "x-open-dpp-organization-id": "org-1",
      });

      const result = await guard.canActivate(context);

      expect(result).toBe(true);
      expect(mockMembersRepository.findOneByUserIdAndOrganizationId).toHaveBeenCalledWith(
        "user-789",
        "org-1",
      );
      expect((context as any)._request.member).toBe(member);
    });

    it("denies an OAuth user who is not a member of the requested organization", async () => {
      enableOAuthProvider();
      const context = createMockContext("/api/items", {
        authorization: "Bearer the.jwt.token",
        "x-open-dpp-organization-id": "org-1",
      });

      const result = await guard.canActivate(context);

      expect(result).toBe(false);
    });
  });

  describe("session-only endpoints", () => {
    beforeEach(() => {
      mockReflector.getAllAndOverride.mockImplementation((key: string) => key === SESSION_ONLY);
    });

    it("refuse OAuth sessions with 403", async () => {
      mockSessionsService.acceptsAccessTokens = true;
      mockSessionsService.verifyAccessToken.mockResolvedValue({
        userId: "user-789",
        expiresAt: new Date(Date.now() + 60_000),
      });
      mockUsersRepository.findOneById.mockResolvedValue({ id: "user-789" });
      const context = createMockContext("/api/users/me/api-keys", {
        authorization: "Bearer the.jwt.token",
      });

      await expect(guard.canActivate(context)).rejects.toThrow(ForbiddenException);
    });

    it("refuse api-key sessions with 403", async () => {
      mockSessionsService.verifyApiKey.mockResolvedValue({ userId: "user-789" });
      const context = createMockContext("/api/users/me/api-keys", { "x-api-key": "valid-key" });

      await expect(guard.canActivate(context)).rejects.toThrow(ForbiddenException);
    });

    it("let browser sessions through", async () => {
      mockSessionsService.getSession.mockResolvedValue(
        Session.create({ userId: "user-789", token: "session-token" }),
      );
      const context = createMockContext("/api/users/me/api-keys", {
        cookie: "better-auth.session_token=abc",
      });

      expect(await guard.canActivate(context)).toBe(true);
    });
  });
});
