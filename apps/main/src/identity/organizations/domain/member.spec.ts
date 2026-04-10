import { expect } from "@jest/globals";
import { Member } from "./member";
import { MemberRole } from "./member-role.enum";

describe("member", () => {
  it("creates a member with a role", () => {
    const member = Member.create({
      organizationId: "org-1",
      userId: "user-1",
      role: MemberRole.OWNER,
    });

    expect(member.id).toBeDefined();
    expect(member.organizationId).toEqual("org-1");
    expect(member.userId).toEqual("user-1");
    expect(member.role).toEqual(MemberRole.OWNER);
  });

  it("returns true for isOwner when role is OWNER", () => {
    const member = Member.create({
      organizationId: "org-1",
      userId: "user-1",
      role: MemberRole.OWNER,
    });

    expect(member.isOwner()).toBe(true);
  });

  it("returns false for isOwner when role is not OWNER", () => {
    const regularMember = Member.create({
      organizationId: "org-1",
      userId: "user-2",
      role: MemberRole.MEMBER,
    });

    expect(regularMember.isOwner()).toBe(false);
  });

  it("maps old role admin to member", () => {
    const member = Member.loadFromDb({
      organizationId: "org-1",
      userId: "user-2",
      role: "admin",
      createdAt: new Date(),
    } as any);

    expect(member.role).toEqual(MemberRole.MEMBER);
  });
});
