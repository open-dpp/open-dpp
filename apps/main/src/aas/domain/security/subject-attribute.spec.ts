import { expect, it } from "@jest/globals";
import { MemberRole } from "../../../identity/organizations/domain/member-role.enum";
import { UserRole } from "../../../identity/users/domain/user-role.enum";
import { SubjectAttributes } from "./subject-attributes";

describe("subjectAttribute", () => {
  it("should evaluate isEqual", () => {
    const admin = SubjectAttributes.create({ userRole: UserRole.ADMIN });
    const adminWithMemberRole = SubjectAttributes.create({
      userRole: UserRole.ADMIN,
      memberRole: MemberRole.OWNER,
    });
    expect(admin.isEqual(adminWithMemberRole)).toBeTruthy();
    const user = SubjectAttributes.create({
      userRole: UserRole.USER,
      memberRole: MemberRole.MEMBER,
    });
    const otherUser = SubjectAttributes.create({
      userRole: UserRole.USER,
      memberRole: MemberRole.MEMBER,
    });
    const owner = SubjectAttributes.create({
      userRole: UserRole.USER,
      memberRole: MemberRole.OWNER,
    });
    expect(user.isEqual(otherUser)).toBeTruthy();
    expect(user.isEqual(owner)).toBeFalsy();
  });

  it("should compare roles", () => {
    const admin = SubjectAttributes.create({ userRole: UserRole.ADMIN });
    const owner = SubjectAttributes.create({
      userRole: UserRole.USER,
      memberRole: MemberRole.OWNER,
    });

    const anonymous = SubjectAttributes.create({ userRole: UserRole.ANONYMOUS });
    const member = SubjectAttributes.create({
      userRole: UserRole.USER,
      memberRole: MemberRole.MEMBER,
    });
    expect(admin.hasHigherThanOrEqualRoles(owner)).toBeTruthy();
    expect(admin.hasHigherThanOrEqualRoles(anonymous)).toBeTruthy();
    expect(admin.hasHigherThanOrEqualRoles(member)).toBeTruthy();

    expect(owner.hasHigherThanOrEqualRoles(admin)).toBeFalsy();
    expect(owner.hasHigherThanOrEqualRoles(anonymous)).toBeTruthy();
    expect(owner.hasHigherThanOrEqualRoles(member)).toBeTruthy();

    expect(member.hasHigherThanOrEqualRoles(owner)).toBeFalsy();
    expect(member.hasHigherThanOrEqualRoles(admin)).toBeFalsy();
    expect(member.hasHigherThanOrEqualRoles(anonymous)).toBeTruthy();

    expect(anonymous.hasLowerThanOrEqualRoles(owner)).toBeTruthy();
    expect(anonymous.hasLowerThanOrEqualRoles(admin)).toBeTruthy();
    expect(anonymous.hasLowerThanOrEqualRoles(member)).toBeTruthy();
  });

  it("should get subjects with subordinated roles ", () => {
    const admin = SubjectAttributes.create({ userRole: UserRole.ADMIN });
    const adminWithMemberRole = SubjectAttributes.create({
      userRole: UserRole.ADMIN,
      memberRole: MemberRole.OWNER,
    });
    const owner = SubjectAttributes.create({
      userRole: UserRole.USER,
      memberRole: MemberRole.OWNER,
    });
    const member = SubjectAttributes.create({
      userRole: UserRole.USER,
      memberRole: MemberRole.MEMBER,
    });
    const user = SubjectAttributes.create({ userRole: UserRole.USER });
    const anonymous = SubjectAttributes.create({ userRole: UserRole.ANONYMOUS });

    expect(admin.getSubjectsWithSubordinatedRoles()).toEqual([owner, member, user, anonymous]);
    expect(adminWithMemberRole.getSubjectsWithSubordinatedRoles()).toEqual([
      owner,
      member,
      user,
      anonymous,
    ]);
    expect(owner.getSubjectsWithSubordinatedRoles()).toEqual([member, user, anonymous]);
    expect(member.getSubjectsWithSubordinatedRoles()).toEqual([user, anonymous]);
    expect(user.getSubjectsWithSubordinatedRoles()).toEqual([anonymous]);
    expect(anonymous.getSubjectsWithSubordinatedRoles()).toEqual([]);
  });
});
