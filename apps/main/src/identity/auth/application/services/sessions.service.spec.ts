import { beforeEach, describe, expect, it, jest } from "@jest/globals";
import { Test, TestingModule } from "@nestjs/testing";
import { EnvService } from "@open-dpp/env";
import type { TrustedClientEnv } from "@open-dpp/env";
import { AUTH } from "../../auth.provider";
import { Session } from "../../domain/session";
import {
  accessTokenClaims,
  createSigningKey,
  signAccessToken,
} from "../../infrastructure/oauth-provider/access-token.test-helpers";
import { SessionsService } from "./sessions.service";

const OPEN_DPP_URL = "https://dpp.example.com";
const ISSUER = `${OPEN_DPP_URL}/api/v2/auth`;
const TRUSTED_CLIENT: TrustedClientEnv = {
  clientId: "landing-page",
  clientSecret: "secret",
  redirectUris: ["https://landing.example.com/callback"],
};

describe("SessionsService", () => {
  let service: SessionsService;
  let mockAuth: any;

  async function createService(trustedClient?: TrustedClientEnv): Promise<SessionsService> {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SessionsService,
        { provide: AUTH, useValue: mockAuth },
        {
          provide: EnvService,
          useValue: {
            get: jest.fn((key: string) => (key === "OPEN_DPP_URL" ? OPEN_DPP_URL : undefined)),
            getTrustedClient: jest.fn(() => trustedClient),
          },
        },
      ],
    }).compile();
    return module.get<SessionsService>(SessionsService);
  }

  beforeEach(async () => {
    mockAuth = {
      api: {
        getSession: jest.fn(),
        verifyApiKey: jest.fn(),
        getJwks: jest.fn(),
      },
    };
    service = await createService();
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

  describe("verifyApiKey", () => {
    it("should return null if API key is invalid", async () => {
      mockAuth.api.verifyApiKey.mockResolvedValue({
        valid: false,
        error: { code: "INVALID_API_KEY", message: "Invalid" },
        key: null,
      });

      const result = await service.verifyApiKey("invalid-key");

      expect(result).toBeNull();
      expect(mockAuth.api.verifyApiKey).toHaveBeenCalledWith({ body: { key: "invalid-key" } });
    });

    it("should return userId if API key is valid", async () => {
      mockAuth.api.verifyApiKey.mockResolvedValue({
        valid: true,
        error: null,
        key: { id: "key-1", referenceId: "user-456", name: "test-key" },
      });

      const result = await service.verifyApiKey("valid-key");

      expect(result).toEqual({ userId: "user-456" });
    });

    it("should return null if result has no key", async () => {
      mockAuth.api.verifyApiKey.mockResolvedValue({ valid: true, error: null, key: null });

      const result = await service.verifyApiKey("some-key");

      expect(result).toBeNull();
    });
  });

  describe("verifyAccessToken", () => {
    const key = createSigningKey();
    const tokenFor = ({ clientId = TRUSTED_CLIENT.clientId, issuer = ISSUER } = {}) =>
      signAccessToken(key, accessTokenClaims({ issuer, clientId, userId: "user-789" }));

    describe("while the OAuth Provider is disabled", () => {
      it("accepts no access tokens and never touches the key set", async () => {
        expect(service.acceptsAccessTokens).toBe(false);

        const result = await service.verifyAccessToken(tokenFor());

        expect(result).toBeNull();
        expect(mockAuth.api.getJwks).not.toHaveBeenCalled();
      });
    });

    describe("while the OAuth Provider is enabled", () => {
      beforeEach(async () => {
        mockAuth.api.getJwks.mockResolvedValue(key.jwks);
        service = await createService(TRUSTED_CLIENT);
      });

      it("accepts access tokens", () => {
        expect(service.acceptsAccessTokens).toBe(true);
      });

      it("verifies a Trusted Client token against the jwt plugin's key set, in process", async () => {
        const result = await service.verifyAccessToken(tokenFor());

        expect(result).toEqual({ userId: "user-789", expiresAt: expect.any(Date) });
        expect(mockAuth.api.getJwks).toHaveBeenCalledTimes(1);
      });

      it("returns null for a token that is not the Trusted Client's", async () => {
        const result = await service.verifyAccessToken(tokenFor({ clientId: "other-client" }));

        expect(result).toBeNull();
      });

      it("returns null for a token from another issuer", async () => {
        const result = await service.verifyAccessToken(
          tokenFor({ issuer: "https://other.example.com/api/v2/auth" }),
        );

        expect(result).toBeNull();
      });

      it("propagates a key-set outage instead of calling the token invalid", async () => {
        mockAuth.api.getJwks.mockRejectedValue(new Error("database unavailable"));

        await expect(service.verifyAccessToken(tokenFor())).rejects.toThrow(/database unavailable/);
      });
    });
  });
});
