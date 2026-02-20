import { expect } from "@jest/globals";
import { Session as BetterAuthSessionSchema } from "better-auth";
import { Session } from "../../domain/session";
import { SessionDocument } from "../schemas/session.schema";
import { SessionMapper } from "./session.mapper";

describe("sessionMapper", () => {
  const now = new Date();
  const validDomainSession = Session.loadFromDb({
    id: "session-123",
    userId: "user-123",
    token: "valid-token",
    expiresAt: now,
    createdAt: now,
    updatedAt: now,
    activeOrganizationId: "org-123",
    activeTeamId: "team-123",
    ipAddress: "127.0.0.1",
    userAgent: "TestAgent",
  });

  const validSessionDocument = {
    id: "session-123",
    userId: "user-123",
    token: "valid-token",
    expiresAt: now,
    createdAt: now,
    updatedAt: now,
    activeOrganizationId: "org-123",
    activeTeamId: "team-123",
    ipAddress: "127.0.0.1",
    userAgent: "TestAgent",
  } as SessionDocument;

  const validBetterAuthSession = {
    id: "session-123",
    userId: "user-123",
    token: "valid-token",
    expiresAt: now,
    createdAt: now,
    updatedAt: now,
    ipAddress: "127.0.0.1",
    userAgent: "TestAgent",
    activeOrganizationId: "org-123",
    activeTeamId: "team-123",
  } as unknown as BetterAuthSessionSchema;

  it("should map from domain to persistence", () => {
    const before = new Date();
    const persistence = SessionMapper.toPersistence(validDomainSession);
    const after = new Date();

    expect(persistence).toEqual({
      _id: validDomainSession.id,
      userId: validDomainSession.userId,
      token: validDomainSession.token,
      createdAt: validDomainSession.createdAt,
      expiresAt: validDomainSession.expiresAt,
      updatedAt: expect.any(Date),
      activeOrganizationId: validDomainSession.activeOrganizationId,
      activeTeamId: validDomainSession.activeTeamId,
      ipAddress: validDomainSession.ipAddress,
      userAgent: validDomainSession.userAgent,
    });
    expect(persistence.updatedAt.getTime()).toBeGreaterThanOrEqual(before.getTime());
    expect(persistence.updatedAt.getTime()).toBeLessThanOrEqual(after.getTime());
  });

  it("should map from persistence to domain", () => {
    const domain = SessionMapper.toDomain(validSessionDocument);

    expect(domain).toBeInstanceOf(Session);
    expect(domain.id).toBe(validSessionDocument.id);
    expect(domain.userId).toBe(validSessionDocument.userId);
    expect(domain.token).toBe(validSessionDocument.token);
    expect(domain.activeOrganizationId).toBe(validSessionDocument.activeOrganizationId);
    expect(domain.activeTeamId).toBe(validSessionDocument.activeTeamId);
  });

  it("should map from better-auth session to domain", () => {
    const domain = SessionMapper.toDomainFromBetterAuth(validBetterAuthSession);

    expect(domain).toBeInstanceOf(Session);
    expect(domain.id).toBe("session-123");
    expect(domain.userId).toBe("user-123");
    expect(domain.activeOrganizationId).toBe("org-123");
    expect(domain.activeTeamId).toBe("team-123");
  });
});
