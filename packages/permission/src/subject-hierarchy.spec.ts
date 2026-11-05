import { describe, expect, it } from "@jest/globals";
import { GuestRoleDto, MemberRoleDto, UserRoleDto } from "@open-dpp/dto";
import {
  compareSubjects,
  isEqualSubjectRoles,
  levelOfSubject,
  subjectHierarchy,
  subjectsBelow,
} from "./subject-hierarchy";

const admin = { userRole: UserRoleDto.ADMIN };
const owner = { userRole: UserRoleDto.USER, memberRole: MemberRoleDto.OWNER };
const member = { userRole: UserRoleDto.USER, memberRole: MemberRoleDto.MEMBER };
const repairer = { userRole: UserRoleDto.USER, guestRole: GuestRoleDto.REPAIRER };
const supplier = { userRole: UserRoleDto.USER, guestRole: GuestRoleDto.SUPPLIER };
const user = { userRole: UserRoleDto.USER };
const anonymous = { userRole: UserRoleDto.ANONYMOUS };

describe("subject hierarchy", () => {
  it("lists admin, owner, member, guests, user and anonymous from top to bottom", () => {
    expect(subjectHierarchy.map((level) => level.length)).toEqual([
      1,
      1,
      1,
      Object.values(GuestRoleDto).length,
      1,
      1,
    ]);
    expect(subjectHierarchy[3].map((subject) => subject.guestRole)).toEqual(
      Object.values(GuestRoleDto),
    );
  });

  describe("isEqualSubjectRoles", () => {
    it("treats missing and undefined roles alike", () => {
      expect(isEqualSubjectRoles(user, { userRole: UserRoleDto.USER, memberRole: undefined })).toBe(
        true,
      );
      expect(isEqualSubjectRoles(anonymous, { ...anonymous })).toBe(true);
    });

    it("distinguishes members, guests and guest roles", () => {
      expect(isEqualSubjectRoles(member, owner)).toBe(false);
      expect(isEqualSubjectRoles(repairer, { ...repairer })).toBe(true);
      expect(isEqualSubjectRoles(repairer, supplier)).toBe(false);
      expect(isEqualSubjectRoles(repairer, user)).toBe(false);
      expect(isEqualSubjectRoles(repairer, member)).toBe(false);
    });

    it("ignores the other roles of an admin", () => {
      expect(isEqualSubjectRoles(admin, { ...admin, memberRole: MemberRoleDto.OWNER })).toBe(true);
    });
  });

  describe("levelOfSubject", () => {
    it("ranks guest roles equally, below members and above users without an organization", () => {
      expect(
        [admin, owner, member, repairer, supplier, user, anonymous].map(levelOfSubject),
      ).toEqual([0, 1, 2, 3, 3, 4, 5]);
    });

    it("answers -1 for a subject outside the hierarchy", () => {
      expect(
        levelOfSubject({ userRole: UserRoleDto.ANONYMOUS, memberRole: MemberRoleDto.MEMBER }),
      ).toBe(-1);
    });
  });

  describe("compareSubjects", () => {
    it("is positive for a higher, negative for a lower and 0 for the same rank", () => {
      expect(compareSubjects(owner, member)).toBeGreaterThan(0);
      expect(compareSubjects(member, owner)).toBeLessThan(0);
      expect(compareSubjects(repairer, supplier)).toBe(0);
      expect(compareSubjects(member, repairer)).toBeGreaterThan(0);
      expect(compareSubjects(repairer, user)).toBeGreaterThan(0);
    });
  });

  describe("subjectsBelow", () => {
    const guests = Object.values(GuestRoleDto).map((guestRole) => ({
      userRole: UserRoleDto.USER,
      guestRole,
    }));

    it("returns the subjects on every lower level", () => {
      expect(subjectsBelow(admin)).toEqual([owner, member, ...guests, user, anonymous]);
      expect(subjectsBelow(owner)).toEqual([member, ...guests, user, anonymous]);
      expect(subjectsBelow(member)).toEqual([...guests, user, anonymous]);
      expect(subjectsBelow(anonymous)).toEqual([]);
    });

    it("does not include other roles of the same level", () => {
      expect(subjectsBelow(repairer)).toEqual([user, anonymous]);
    });
  });
});
