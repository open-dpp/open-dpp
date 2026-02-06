import { expect } from "@jest/globals";
import { Invitation } from "../../domain/invitation";
import { MemberRole } from "../../domain/member-role.enum";
import { InvitationDocument } from "../schemas/invitation.schema";
import { InvitationMapper } from "./invitation.mapper";

describe("invitationMapper", () => {
  const now = new Date();

  const validDomainInvitation = Invitation.loadFromDb({
    id: "invitation-123",
    email: "test@example.com",
    organizationId: "org-123",
    inviterId: "user-123",
    role: MemberRole.MEMBER,
    status: "pending",
    createdAt: now,
    expiresAt: now,
  });

  const validInvitationDocument = {
    _id: "invitation-123",
    email: "test@example.com",
    organizationId: "org-123",
    inviterId: "user-123",
    role: MemberRole.MEMBER,
    status: "pending",
    createdAt: now,
    expiresAt: now,
  } as InvitationDocument;

  it("should map from domain to persistence", () => {
    const persistence = InvitationMapper.toPersistence(validDomainInvitation);

    expect(persistence).toEqual({
      _id: validDomainInvitation.id,
      email: validDomainInvitation.email,
      organizationId: validDomainInvitation.organizationId,
      inviterId: validDomainInvitation.inviterId,
      role: validDomainInvitation.role,
      status: validDomainInvitation.status,
      createdAt: validDomainInvitation.createdAt,
      expiresAt: validDomainInvitation.expiresAt,
    });
  });

  it("should map from persistence to domain", () => {
    const domain = InvitationMapper.toDomain(validInvitationDocument);

    expect(domain).toBeInstanceOf(Invitation);
    expect(domain.id).toBe(validInvitationDocument._id);
    expect(domain.email).toBe(validInvitationDocument.email);
    expect(domain.organizationId).toBe(validInvitationDocument.organizationId);
    expect(domain.role).toBe(validInvitationDocument.role);
    expect(domain.status).toBe(validInvitationDocument.status);
  });
});
