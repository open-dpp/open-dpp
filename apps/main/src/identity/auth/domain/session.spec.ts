import { expect } from "@jest/globals";
import { Session } from "./session";

describe("session", () => {
  it("should create a session with valid properties", () => {
    const props = {
      userId: "user-123",
      token: "valid-token",
      ipAddress: "127.0.0.1",
      userAgent: "TestAgent",
      activeOrganizationId: "org-123",
      activeTeamId: "team-123",
    };

    const session = Session.create(props);

    expect(session.id).toBeDefined();
    expect(session.userId).toBe(props.userId);
    expect(session.token).toBe(props.token);
    expect(session.ipAddress).toBe(props.ipAddress);
    expect(session.userAgent).toBe(props.userAgent);
    expect(session.activeOrganizationId).toBe(props.activeOrganizationId);
    expect(session.activeTeamId).toBe(props.activeTeamId);
    expect(session.createdAt).toBeInstanceOf(Date);
    expect(session.updatedAt).toBeInstanceOf(Date);
    expect(session.expiresAt).toBeInstanceOf(Date);
  });

  it("should create a session without optional properties", () => {
    const props = {
      userId: "user-123",
      token: "valid-token",
    };

    const session = Session.create(props);

    expect(session.id).toBeDefined();
    expect(session.userId).toBe(props.userId);
    expect(session.token).toBe(props.token);
    expect(session.ipAddress).toBeUndefined();
    expect(session.userAgent).toBeUndefined();
    expect(session.activeOrganizationId).toBeNull();
    expect(session.activeTeamId).toBeNull();
  });

  it("should load session from database properties", () => {
    const now = new Date();
    const dbProps = {
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
    };

    const session = Session.loadFromDb(dbProps);

    expect(session.id).toBe(dbProps.id);
    expect(session.userId).toBe(dbProps.userId);
    expect(session.token).toBe(dbProps.token);
    expect(session.expiresAt).toEqual(dbProps.expiresAt);
    expect(session.createdAt).toEqual(dbProps.createdAt);
    expect(session.updatedAt).toEqual(dbProps.updatedAt);
    expect(session.activeOrganizationId).toBe(dbProps.activeOrganizationId);
    expect(session.activeTeamId).toBe(dbProps.activeTeamId);
    expect(session.ipAddress).toBe(dbProps.ipAddress);
    expect(session.userAgent).toBe(dbProps.userAgent);
  });

  it("should load session from database without optional properties", () => {
    const now = new Date();
    const dbProps = {
      id: "session-123",
      userId: "user-123",
      token: "valid-token",
      expiresAt: now,
      createdAt: now,
      updatedAt: now,
      activeOrganizationId: null,
      activeTeamId: null,
    };

    const session = Session.loadFromDb(dbProps);

    expect(session.id).toBe(dbProps.id);
    expect(session.userId).toBe(dbProps.userId);
    expect(session.activeOrganizationId).toBeNull();
    expect(session.activeTeamId).toBeNull();
  });
});
