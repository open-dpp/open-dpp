import { expect } from "@jest/globals";
import { Member } from "./member";
import { OrganizationRole } from "./organization-role.enum";

describe("member", () => {
  it("creates a member with a role", () => {
    const member = Member.create({
      organizationId: "org-1",
      userId: "user-1",
      role: OrganizationRole.ADMIN,
    });

    expect(member.id).toBeDefined();
    expect(member.organizationId).toEqual("org-1");
    expect(member.userId).toEqual("user-1");
    expect(member.role).toEqual(OrganizationRole.ADMIN);
  });
});
