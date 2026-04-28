import { expect } from "@jest/globals";
import { Invitation } from "../../domain/invitation";
import { MemberRole } from "../../domain/member-role.enum";
import { InvitationMapper } from "./invitation.mapper";
import { Types } from "mongoose";
import { InvitationStatus } from "../../domain/invitation-status.enum";
import { ObjectId } from "mongodb";

describe("invitationMapper", () => {
  const now = new Date();

  const id = new Types.ObjectId().toHexString();
  const validDomainInvitation = Invitation.loadFromDb({
    id,
    email: "test@example.com",
    organizationId: "org-123",
    inviterId: "user-123",
    role: MemberRole.MEMBER,
    status: InvitationStatus.PENDING,
    createdAt: now,
    expiresAt: now,
  });

  const validInvitationDocument = {
    _id: id,
    email: "test@example.com",
    organizationId: "org-123",
    inviterId: "user-123",
    role: MemberRole.MEMBER,
    status: "pending",
    createdAt: now,
    expiresAt: now,
  } as any;

  it("should map from domain to persistence", () => {
    const persistence = InvitationMapper.toPersistence(validDomainInvitation);

    expect(persistence).toEqual({
      _id: new ObjectId(validDomainInvitation.id),
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
