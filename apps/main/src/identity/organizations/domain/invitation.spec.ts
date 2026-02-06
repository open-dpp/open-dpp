import { expect } from "@jest/globals";
import { Invitation } from "./invitation";
import { MemberRole } from "./member-role.enum";

describe("invitation", () => {
  it("should create an invitation with valid properties", () => {
    const props = {
      email: "test@example.com",
      inviterId: "user-123",
      organizationId: "org-123",
      role: MemberRole.ADMIN,
    };

    const invitation = Invitation.create(props);

    expect(invitation.id).toBeDefined();
    expect(invitation.email).toBe(props.email);
    expect(invitation.inviterId).toBe(props.inviterId);
    expect(invitation.organizationId).toBe(props.organizationId);
    expect(invitation.role).toBe(props.role);
    expect(invitation.createdAt).toBeInstanceOf(Date);
    expect(invitation.expiresAt.getTime()).toBeGreaterThan(
      invitation.createdAt.getTime(),
    );
  });

  it("should load invitation from database properties", () => {
    const now = new Date();
    const dbProps = {
      id: "invitation-123",
      email: "test@example.com",
      inviterId: "user-123",
      organizationId: "org-123",
      role: MemberRole.MEMBER,
      createdAt: now,
      expiresAt: now,
      status: "pending",
    };

    const invitation = Invitation.loadFromDb(dbProps);

    expect(invitation.id).toBe(dbProps.id);
    expect(invitation.email).toBe(dbProps.email);
    expect(invitation.role).toBe(dbProps.role);
    expect(invitation.createdAt).toEqual(dbProps.createdAt);
  });
});
