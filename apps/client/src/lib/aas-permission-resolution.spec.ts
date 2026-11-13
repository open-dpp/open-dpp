import type { PermissionType } from "@open-dpp/dto";
import type { Subject } from "./aas-security.ts";
import {
  GuestRoleDto,
  MemberRoleDto,
  PermissionKind,
  Permissions,
  UserRoleDto,
} from "@open-dpp/dto";
import { describe, expect, it } from "vitest";
import { canInheritPermissions, resolvePermissions } from "./aas-permission-resolution.ts";
import { makeRule } from "./aas-security.ts";

const admin: Subject = { userRole: UserRoleDto.ADMIN };
const owner: Subject = { userRole: UserRoleDto.USER, memberRole: MemberRoleDto.OWNER };
const member: Subject = { userRole: UserRoleDto.USER, memberRole: MemberRoleDto.MEMBER };
const repairer: Subject = { userRole: UserRoleDto.USER, guestRole: GuestRoleDto.REPAIRER };
const anonymous: Subject = { userRole: UserRoleDto.ANONYMOUS };

function rule(subject: Subject, object: string, permissions: PermissionType[]) {
  return makeRule({
    subject,
    object,
    permissions: permissions.map((permission) => ({
      permission,
      kindOfPermission: PermissionKind.Allow,
    })),
  });
}

const read = [Permissions.Read];
const all = [Permissions.Read, Permissions.Create, Permissions.Edit, Permissions.Delete];

describe("resolvePermissions", () => {
  it("takes the own rule on the object", () => {
    const rules = [rule(member, "section1", all), rule(anonymous, "section1", read)];

    expect(resolvePermissions({ rules, subject: member, object: "section1" })).toEqual({
      permissions: all,
      inheritedFrom: null,
    });
  });

  it("takes the own rule of a parent and names it", () => {
    const rules = [rule(member, "section1", all)];

    expect(resolvePermissions({ rules, subject: member, object: "section1.field1" })).toEqual({
      permissions: all,
      inheritedFrom: { kind: "parent", object: "section1" },
    });
  });

  it("falls back to the public for admins, owners, members and guests", () => {
    const rules = [rule(anonymous, "section1", read)];

    for (const subject of [admin, owner, member, repairer]) {
      expect(resolvePermissions({ rules, subject, object: "section1" })).toEqual({
        permissions: read,
        inheritedFrom: { kind: "public" },
      });
    }
  });

  it("names the public, not the parent, when only the public has an entry on a parent", () => {
    const rules = [rule(anonymous, "section1", read)];

    expect(resolvePermissions({ rules, subject: repairer, object: "section1.field1" })).toEqual({
      permissions: read,
      inheritedFrom: { kind: "public" },
    });
  });

  it("keeps the rights of the own rule on the parent for a child the public reads", () => {
    const rules = [
      rule(member, "section1", all),
      rule(anonymous, "section1", read),
      rule(anonymous, "section1.field1", read),
    ];

    expect(resolvePermissions({ rules, subject: member, object: "section1.field1" })).toEqual({
      permissions: all,
      inheritedFrom: { kind: "parent", object: "section1" },
    });
  });

  it("has nothing for a subject when no rule applies", () => {
    expect(resolvePermissions({ rules: [], subject: repairer, object: "section1" })).toEqual({
      permissions: [],
      inheritedFrom: null,
    });
  });
});

describe("canInheritPermissions", () => {
  it("is true for every object with a parent", () => {
    for (const subject of [admin, member, repairer, anonymous]) {
      expect(canInheritPermissions(subject, true)).toBe(true);
    }
  });

  it("is true without a parent for the roles which fall back to the public", () => {
    for (const subject of [admin, owner, member, repairer]) {
      expect(canInheritPermissions(subject, false)).toBe(true);
    }
  });

  it("is false without a parent for the public and a user without an organization", () => {
    expect(canInheritPermissions(anonymous, false)).toBe(false);
    expect(canInheritPermissions({ userRole: UserRoleDto.USER }, false)).toBe(false);
  });
});
