import { expect, it } from "@jest/globals";
import { ValueError } from "@open-dpp/exception";
import { GuestRole } from "../../../identity/guest-access/domain/guest-role.enum";
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
    const guests = Object.values(GuestRole).map((guestRole) =>
      SubjectAttributes.create({ userRole: UserRole.USER, guestRole }),
    );
    const user = SubjectAttributes.create({ userRole: UserRole.USER });
    const anonymous = SubjectAttributes.create({ userRole: UserRole.ANONYMOUS });

    expect(admin.getSubjectsWithSubordinatedRoles()).toEqual([
      owner,
      member,
      ...guests,
      user,
      anonymous,
    ]);
    expect(adminWithMemberRole.getSubjectsWithSubordinatedRoles()).toEqual([
      owner,
      member,
      ...guests,
      user,
      anonymous,
    ]);
    expect(owner.getSubjectsWithSubordinatedRoles()).toEqual([member, ...guests, user, anonymous]);
    expect(member.getSubjectsWithSubordinatedRoles()).toEqual([...guests, user, anonymous]);
    for (const guest of guests) {
      expect(guest.getSubjectsWithSubordinatedRoles()).toEqual([user, anonymous]);
    }
    expect(user.getSubjectsWithSubordinatedRoles()).toEqual([anonymous]);
    expect(anonymous.getSubjectsWithSubordinatedRoles()).toEqual([]);
  });

  describe("guest roles", () => {
    const repairer = SubjectAttributes.create({
      userRole: UserRole.USER,
      guestRole: GuestRole.REPAIRER,
    });
    const recycler = SubjectAttributes.create({
      userRole: UserRole.USER,
      guestRole: GuestRole.RECYCLER,
    });
    const member = SubjectAttributes.create({
      userRole: UserRole.USER,
      memberRole: MemberRole.MEMBER,
    });
    const user = SubjectAttributes.create({ userRole: UserRole.USER });
    const anonymous = SubjectAttributes.create({ userRole: UserRole.ANONYMOUS });

    it("exposes the guest role and keeps it out of non-guest subjects", () => {
      expect(repairer.guestRole).toEqual(GuestRole.REPAIRER);
      expect(repairer.memberRole).toBeUndefined();
      expect(repairer.getRoles()).toEqual({
        userRole: UserRole.USER,
        memberRole: undefined,
        guestRole: GuestRole.REPAIRER,
      });
      expect(member.guestRole).toBeUndefined();
    });

    it("distinguishes subjects by guest role", () => {
      expect(repairer.isEqual(SubjectAttributes.create(repairer.getRoles()))).toBeTruthy();
      expect(repairer.isEqual(recycler)).toBeFalsy();
      expect(repairer.isEqual(user)).toBeFalsy();
    });

    it("ranks guest roles below members and above users without organization", () => {
      expect(member.hasHigherThanOrEqualRoles(repairer)).toBeTruthy();
      expect(repairer.hasHigherThanOrEqualRoles(member)).toBeFalsy();
      expect(repairer.hasHigherThanOrEqualRoles(user)).toBeTruthy();
      expect(user.hasHigherThanOrEqualRoles(repairer)).toBeFalsy();
      expect(repairer.hasHigherThanOrEqualRoles(anonymous)).toBeTruthy();
    });

    it("ranks all guest roles equally", () => {
      expect(repairer.hasHigherThanOrEqualRoles(recycler)).toBeTruthy();
      expect(repairer.hasLowerThanOrEqualRoles(recycler)).toBeTruthy();
    });

    it("survives a round trip through plain", () => {
      expect(SubjectAttributes.fromPlain(repairer.toPlain()).guestRole).toEqual(GuestRole.REPAIRER);
      expect(repairer.copy().isEqual(repairer)).toBeTruthy();
    });

    it("rejects a guest role combined with another role", () => {
      expect(() =>
        SubjectAttributes.create({
          userRole: UserRole.USER,
          memberRole: MemberRole.MEMBER,
          guestRole: GuestRole.REPAIRER,
        }),
      ).toThrow(ValueError);
      expect(() =>
        SubjectAttributes.create({ userRole: UserRole.ANONYMOUS, guestRole: GuestRole.REPAIRER }),
      ).toThrow(ValueError);
      expect(() =>
        SubjectAttributes.create({ userRole: UserRole.ADMIN, guestRole: GuestRole.REPAIRER }),
      ).toThrow(ValueError);
    });
  });
});
