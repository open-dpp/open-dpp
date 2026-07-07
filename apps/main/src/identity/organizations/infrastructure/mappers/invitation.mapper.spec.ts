import { expect } from "@jest/globals";
import { Invitation } from "../../domain/invitation";
import { MemberRole } from "../../domain/member-role.enum";
import { InvitationMapper } from "./invitation.mapper";
import { Types } from "mongoose";

describe("invitationMapper", () => {
  const now = new Date();

  const id = new Types.ObjectId().toHexString();

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

  it("should map from persistence to domain", () => {
    const domain = InvitationMapper.toDomain(validInvitationDocument);

    expect(domain).toBeInstanceOf(Invitation);
    expect(domain.id).toBe(validInvitationDocument._id);
    expect(domain.email).toBe(validInvitationDocument.email);
    expect(domain.organizationId).toBe(validInvitationDocument.organizationId);
    expect(domain.role).toBe(validInvitationDocument.role);
    expect(domain.status).toBe(validInvitationDocument.status);
  });

  it("should map raw better-auth documents with string _id and ObjectId references", () => {
    const organizationId = new Types.ObjectId();
    const inviterId = new Types.ObjectId();

    const domain = InvitationMapper.toDomain({
      _id: "NEWQhghstUEmtMdzRDhP5TrOTLt4hvBK",
      email: "raw@example.com",
      organizationId,
      inviterId,
      role: MemberRole.MEMBER,
      status: "pending",
      createdAt: now,
      expiresAt: now,
    } as any);

    expect(domain.id).toBe("NEWQhghstUEmtMdzRDhP5TrOTLt4hvBK");
    expect(domain.organizationId).toBe(organizationId.toHexString());
    expect(domain.inviterId).toBe(inviterId.toHexString());
  });

  it("should map missing reference fields to empty strings", () => {
    const domain = InvitationMapper.toDomain({
      _id: new Types.ObjectId(),
      email: "raw@example.com",
      role: MemberRole.MEMBER,
      status: "pending",
      createdAt: now,
      expiresAt: now,
    } as any);

    expect(domain.organizationId).toBe("");
    expect(domain.inviterId).toBe("");
  });
});
