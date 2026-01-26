import { jest } from "@jest/globals";
import { ExecutionContext } from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { Test, TestingModule } from "@nestjs/testing";
import { EnvService } from "@open-dpp/env";
import { AuthGuard } from "./auth.guard";
import { AuthService } from "./auth.service";

describe("authGuard Allowlist Repro", () => {
  let guard: AuthGuard;

  beforeEach(async () => {
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
          provide: AuthService,
          useValue: {
            getSession: jest.fn(),
            isMemberOfOrganization: jest.fn(),
          },
        },
        {
          provide: EnvService,
          useValue: {
            get: jest.fn(),
          },
        },
      ],
    }).compile();

    guard = module.get<AuthGuard>(AuthGuard);
  });

  const createMockContext = (url: string, headers: any = {}) => {
    return {
      switchToHttp: () => ({
        getRequest: () => ({
          url,
          headers,
          params: {},
        }),
      }),
      getHandler: () => { },
      getClass: () => { },
    } as ExecutionContext;
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
});
