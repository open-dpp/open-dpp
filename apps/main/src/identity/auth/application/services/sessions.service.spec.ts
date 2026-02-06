import { beforeEach, describe, expect, it, jest } from "@jest/globals";
import { Test, TestingModule } from "@nestjs/testing";
import { AUTH } from "../../auth.provider";
import { Session } from "../../domain/session";
import { SessionsService } from "./sessions.service";

describe("SessionsService", () => {
  let service: SessionsService;
  let mockAuth: any;

  beforeEach(async () => {
    mockAuth = {
      api: {
        getSession: jest.fn(),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SessionsService,
        {
          provide: AUTH,
          useValue: mockAuth,
        },
      ],
    }).compile();

    service = module.get<SessionsService>(SessionsService);
  });

  it("should return null if no session is active", async () => {
    mockAuth.api.getSession.mockResolvedValue(null);
    const headers = new Headers();

    const result = await service.getSession(headers);

    expect(result).toBeNull();
    expect(mockAuth.api.getSession).toHaveBeenCalledWith({ headers });
  });

  it("should return domain session if session is active", async () => {
    const now = new Date();
    const betterAuthSession = {
      session: {
        id: "session-123",
        userId: "user-123",
        token: "token",
        expiresAt: now,
        createdAt: now,
        updatedAt: now,
        ipAddress: "127.0.0.1",
        userAgent: "Agent",
        activeOrganizationId: "org-1",
        activeTeamId: "team-1",
      },
      user: {
        id: "user-123",
        email: "test@example.com",
      },
    };

    mockAuth.api.getSession.mockResolvedValue(betterAuthSession);
    const headers = new Headers();

    const result = await service.getSession(headers);

    expect(result).toBeInstanceOf(Session);
    expect(result?.id).toBe("session-123");
    expect(result?.userId).toBe("user-123");
  });
});
