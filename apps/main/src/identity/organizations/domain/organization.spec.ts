import { expect } from "@jest/globals";

import { InvitationStatus } from "./invitation-status.enum";
import { MemberRole } from "./member-role.enum";
import { Organization } from "./organization";

describe("organization", () => {
  it("creates an organization whose slug equals its id", () => {
    const organization = Organization.create({
      name: "Test Org",
      logo: null,
      metadata: {},
    });

    expect(organization.id).toBeDefined();
    expect(organization.name).toEqual("Test Org");
    expect(organization.slug).toEqual(organization.id);
  });

  it("keeps a stored slug that differs from the id when loading from the database", () => {
    const organization = Organization.loadFromDb({
      id: "690cf22459cdae7ce188c1f8",
      name: "Legacy Org",
      slug: "legacy-org",
      logo: null,
      metadata: {},
      createdAt: new Date("2026-01-01T00:00:00Z"),
    });

    expect(organization.slug).toEqual("legacy-org");
  });

  it("updates name and logo while preserving other fields", () => {
    const organization = Organization.create({
      name: "Test Org",
      logo: null,
      metadata: { key: "value" },
    });

    const updated = organization.update({
      name: "Updated Org",
      logo: "https://example.com/logo.png",
    });

    expect(updated.id).toEqual(organization.id);
    expect(updated.name).toEqual("Updated Org");
    expect(updated.slug).toEqual(organization.id);
    expect(updated.logo).toEqual("https://example.com/logo.png");
    expect(updated.metadata).toEqual({ key: "value" });
    expect(updated.createdAt).toEqual(organization.createdAt);
  });

  it("sets logo to null when update data has no logo", () => {
    const organization = Organization.create({
      name: "Test Org",
      logo: "https://example.com/old-logo.png",
      metadata: {},
    });

    const updated = organization.update({
      name: "Updated Org",
    });

    expect(updated.logo).toBeNull();
  });

  it("creates an invitation when inviting a member", () => {
    const organization = Organization.create({
      name: "Test Org",
      logo: null,
      metadata: {},
    });

    const invitation = organization.inviteMember(
      "invite@example.com",
      "inviter-1",
      MemberRole.MEMBER,
    );

    expect(invitation.id).toBeDefined();
    expect(invitation.email).toEqual("invite@example.com");
    expect(invitation.inviterId).toEqual("inviter-1");
    expect(invitation.organizationId).toEqual(organization.id);
    expect(invitation.role).toEqual(MemberRole.MEMBER);
    expect(invitation.status).toEqual(InvitationStatus.PENDING);
    expect(invitation.expiresAt.getTime()).toBeGreaterThan(invitation.createdAt.getTime());
  });
});
