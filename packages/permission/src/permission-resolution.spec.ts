import type { PermissionType } from "@open-dpp/dto";
import type { PermissionEntry } from "./permission-resolution";
import type { SubjectRoles } from "./subject-hierarchy";
import { GuestRoleDto, MemberRoleDto, Permissions, UserRoleDto } from "@open-dpp/dto";
import { describe, expect, it } from "vitest";
import { resolvePermissionEntry, subjectFallsBackToPublic } from "./permission-resolution";

const admin: SubjectRoles = { userRole: UserRoleDto.ADMIN };
const owner: SubjectRoles = { userRole: UserRoleDto.USER, memberRole: MemberRoleDto.OWNER };
const member: SubjectRoles = { userRole: UserRoleDto.USER, memberRole: MemberRoleDto.MEMBER };
const repairer: SubjectRoles = { userRole: UserRoleDto.USER, guestRole: GuestRoleDto.REPAIRER };
const recycler: SubjectRoles = { userRole: UserRoleDto.USER, guestRole: GuestRoleDto.RECYCLER };
const signedInUser: SubjectRoles = { userRole: UserRoleDto.USER };
const anonymous: SubjectRoles = { userRole: UserRoleDto.ANONYMOUS };

const read: PermissionType[] = [Permissions.Read];
const all: PermissionType[] = [
  Permissions.Read,
  Permissions.Create,
  Permissions.Edit,
  Permissions.Delete,
];

function entry(
  subject: SubjectRoles,
  object: string,
  permissions: PermissionType[],
): PermissionEntry {
  return { subject, object, permissions };
}

describe("subjectFallsBackToPublic", () => {
  it("is true for admins, owners, members and guests", () => {
    for (const subject of [admin, owner, member, repairer, recycler]) {
      expect(subjectFallsBackToPublic(subject)).toBe(true);
    }
  });

  it("is false for the public and for a user without an organization", () => {
    expect(subjectFallsBackToPublic(anonymous)).toBe(false);
    expect(subjectFallsBackToPublic(signedInUser)).toBe(false);
  });
});

describe("resolvePermissionEntry", () => {
  it("takes the own entry on the object", () => {
    const entries = [entry(member, "section1", all), entry(anonymous, "section1", read)];

    expect(resolvePermissionEntry(entries, member, "section1")).toEqual({
      permissions: all,
      at: "section1",
      from: "own",
    });
  });

  it("takes the own entry of a parent and names it", () => {
    const entries = [entry(member, "section1", all)];

    expect(resolvePermissionEntry(entries, member, "section1.field1")).toEqual({
      permissions: all,
      at: "section1",
      from: "own",
    });
  });

  it("takes the closest parent", () => {
    const entries = [entry(member, "section1", all), entry(member, "section1.list", read)];

    expect(resolvePermissionEntry(entries, member, "section1.list.item")).toEqual({
      permissions: read,
      at: "section1.list",
      from: "own",
    });
  });

  it("falls back to the public for admins, owners, members and guests", () => {
    const entries = [entry(anonymous, "section1", read)];

    for (const subject of [admin, owner, member, repairer]) {
      expect(resolvePermissionEntry(entries, subject, "section1")).toEqual({
        permissions: read,
        at: "section1",
        from: "public",
      });
    }
  });

  it("falls back to the entry of the public on a parent", () => {
    const entries = [entry(anonymous, "section1", read)];

    expect(resolvePermissionEntry(entries, repairer, "section1.field1")).toEqual({
      permissions: read,
      at: "section1",
      from: "public",
    });
  });

  it("lets an own entry without Read beat the public Read on the same object", () => {
    const entries = [entry(member, "section1", []), entry(anonymous, "section1", read)];

    expect(resolvePermissionEntry(entries, member, "section1")).toEqual({
      permissions: [],
      at: "section1",
      from: "own",
    });
  });

  it("keeps the rights of the own entry on the parent for a child the public reads", () => {
    const entries = [
      entry(member, "section1", all),
      entry(anonymous, "section1", read),
      entry(anonymous, "section1.field1", read),
    ];

    expect(resolvePermissionEntry(entries, member, "section1.field1")).toEqual({
      permissions: all,
      at: "section1",
      from: "own",
    });
  });

  it("hides a child the public reads behind an own entry of its parent without Read", () => {
    const entries = [entry(member, "section1", []), entry(anonymous, "section1.field1", read)];

    expect(resolvePermissionEntry(entries, member, "section1.field1")).toEqual({
      permissions: [],
      at: "section1",
      from: "own",
    });
  });

  it("does not mix entries: the first entry found decides all permissions", () => {
    const entries = [entry(repairer, "section1.field1", read), entry(repairer, "section1", all)];

    expect(resolvePermissionEntry(entries, repairer, "section1.field1")).toEqual({
      permissions: read,
      at: "section1.field1",
      from: "own",
    });
  });

  it("gives the public and a user without an organization no fallback", () => {
    const entries = [entry(anonymous, "section1", read)];

    expect(resolvePermissionEntry(entries, anonymous, "section2")).toBeUndefined();
    expect(resolvePermissionEntry(entries, signedInUser, "section1")).toBeUndefined();
  });

  it("gives the public its own entry", () => {
    const entries = [entry(anonymous, "section1", read)];

    expect(resolvePermissionEntry(entries, anonymous, "section1")).toEqual({
      permissions: read,
      at: "section1",
      from: "own",
    });
  });

  it("has nothing when no entry applies", () => {
    expect(resolvePermissionEntry([], repairer, "section1")).toBeUndefined();
  });

  it("keeps guest roles apart", () => {
    const entries = [entry(repairer, "section1", all)];

    expect(resolvePermissionEntry(entries, recycler, "section1")).toBeUndefined();
  });

  it("treats every admin as the same subject", () => {
    const entries = [entry(admin, "section1", all)];

    expect(
      resolvePermissionEntry(
        entries,
        { userRole: UserRoleDto.ADMIN, memberRole: MemberRoleDto.OWNER },
        "section1",
      ),
    ).toEqual({ permissions: all, at: "section1", from: "own" });
  });

  it("does not change the entries it is given", () => {
    const permissions: PermissionType[] = [Permissions.Read];
    const entries = [entry(member, "section1", permissions)];

    const resolved = resolvePermissionEntry(entries, member, "section1");
    resolved?.permissions.push(Permissions.Edit);

    expect(permissions).toEqual([Permissions.Read]);
  });
});
