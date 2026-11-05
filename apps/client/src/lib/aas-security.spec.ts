import { GuestRoleDto, MemberRoleDto, UserRoleDto } from "@open-dpp/dto";
import { describe, expect, it } from "vitest";
import {
  isEqualSubject,
  isReadOnlySubject,
  makeRule,
  makeSubjectAttributes,
  ruleHelper,
} from "./aas-security.ts";

const repairer = { userRole: UserRoleDto.USER, guestRole: GuestRoleDto.REPAIRER };
const member = { userRole: UserRoleDto.USER, memberRole: MemberRoleDto.MEMBER };

describe("aas-security", () => {
  describe("isEqualSubject", () => {
    it("treats missing and undefined roles alike", () => {
      expect(
        isEqualSubject({ userRole: UserRoleDto.ANONYMOUS }, { userRole: UserRoleDto.ANONYMOUS }),
      ).toBe(true);
      expect(
        isEqualSubject(
          { userRole: UserRoleDto.USER, memberRole: undefined },
          { userRole: UserRoleDto.USER },
        ),
      ).toBe(true);
    });

    it("distinguishes members, guests and guest roles", () => {
      expect(isEqualSubject(repairer, { ...repairer })).toBe(true);
      expect(isEqualSubject(repairer, member)).toBe(false);
      expect(
        isEqualSubject(repairer, { userRole: UserRoleDto.USER, guestRole: GuestRoleDto.RECYCLER }),
      ).toBe(false);
      expect(isEqualSubject(repairer, { userRole: UserRoleDto.USER })).toBe(false);
    });

    it("ignores the other roles of an admin", () => {
      expect(
        isEqualSubject(
          { userRole: UserRoleDto.ADMIN },
          { userRole: UserRoleDto.ADMIN, memberRole: MemberRoleDto.OWNER },
        ),
      ).toBe(true);
    });
  });

  describe("makeSubjectAttributes", () => {
    it("adds a property for the guest role only when there is one", () => {
      const idShorts = (subject: Parameters<typeof makeSubjectAttributes>[0]) =>
        makeSubjectAttributes(subject).subjectAttribute.map((p) => [p.idShort, p.value]);

      expect(idShorts(repairer)).toEqual([
        ["userRole", UserRoleDto.USER],
        ["guestRole", GuestRoleDto.REPAIRER],
      ]);
      expect(idShorts(member)).toEqual([
        ["userRole", UserRoleDto.USER],
        ["memberRole", MemberRoleDto.MEMBER],
      ]);
    });
  });

  describe("makeRule and ruleHelper", () => {
    const permissions = [{ permission: "Read" as const, kindOfPermission: "Allow" as const }];

    it("round-trips a guest subject", () => {
      const rule = ruleHelper(makeRule({ subject: repairer, object: "section1", permissions }));

      expect(rule.guestRole).toEqual(GuestRoleDto.REPAIRER);
      expect(rule.memberRole).toBeUndefined();
      expect(rule.getSubject()).toEqual({
        userRole: UserRoleDto.USER,
        memberRole: undefined,
        guestRole: GuestRoleDto.REPAIRER,
      });
      expect(rule.hasEqualSubject(repairer)).toBe(true);
      expect(rule.hasEqualSubject({ userRole: UserRoleDto.USER, guestRole: "Supplier" })).toBe(
        false,
      );
      expect(rule.hasEqualSubject(member)).toBe(false);
    });

    it("does not add a guest role to the rule of a member", () => {
      const rule = makeRule({ subject: member, object: "section1", permissions });

      expect(rule.targetSubjectAttributes.subjectAttribute.map((p) => p.idShort)).toEqual([
        "userRole",
        "memberRole",
      ]);
      expect(ruleHelper(rule).guestRole).toBeUndefined();
      expect(ruleHelper(rule).hasEqualSubject(repairer)).toBe(false);
    });
  });

  describe("isReadOnlySubject", () => {
    it("is true for the public and for every guest role", () => {
      expect(isReadOnlySubject({ userRole: UserRoleDto.ANONYMOUS })).toBe(true);
      for (const guestRole of Object.values(GuestRoleDto)) {
        expect(isReadOnlySubject({ userRole: UserRoleDto.USER, guestRole })).toBe(true);
      }
    });

    it("is false for members and admins", () => {
      expect(isReadOnlySubject(member)).toBe(false);
      expect(isReadOnlySubject({ userRole: UserRoleDto.ADMIN })).toBe(false);
    });
  });
});
