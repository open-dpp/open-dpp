import { expect } from "@jest/globals";
import { Types } from "mongoose";
import { Member } from "../../domain/member";
import { MemberRole } from "../../domain/member-role.enum";
import { MemberDocument } from "../schemas/member.schema";
import { MemberMapper } from "./member.mapper";

describe("memberMapper", () => {
  const now = new Date();
  const orgId = new Types.ObjectId();
  const userId = new Types.ObjectId();

  const validDomainMember = Member.loadFromDb({
    id: "member-123",
    organizationId: orgId.toString(),
    userId: userId.toString(),
    role: MemberRole.ADMIN,
    createdAt: now,
  });

  const validMemberDocument = {
    _id: "member-123",
    organizationId: orgId,
    userId,
    role: MemberRole.ADMIN,
    createdAt: now,
  } as unknown as MemberDocument;

  it("should map from domain to persistence", () => {
    const persistence = MemberMapper.toPersistence(validDomainMember);

    expect(persistence._id).toBe(validDomainMember.id);
    expect(persistence.organizationId.toString()).toBe(validDomainMember.organizationId);
    expect(persistence.userId.toString()).toBe(validDomainMember.userId);
    expect(persistence.role).toBe(validDomainMember.role);
    expect(persistence.createdAt).toBe(validDomainMember.createdAt);
  });

  it("should map from persistence to domain", () => {
    const domain = MemberMapper.toDomain(validMemberDocument);

    expect(domain).toBeInstanceOf(Member);
    expect(domain.id).toBe(validMemberDocument._id);
    expect(domain.organizationId).toBe(validMemberDocument.organizationId.toString());
    expect(domain.userId).toBe(validMemberDocument.userId.toString());
    expect(domain.role).toBe(validMemberDocument.role);
  });
});
