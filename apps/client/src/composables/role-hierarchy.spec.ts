import { GuestRoleDto, MemberRoleDto, UserRoleDto } from "@open-dpp/dto";
import { subjectHierarchy } from "@open-dpp/permission";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { useRoleHierarchy } from "./role-hierarchy.ts";

const i18n = vi.hoisted(() => ({ translations: {} as Record<string, string> }));

vi.mock("vue-i18n", () => ({
  useI18n: () => ({
    t: (key: string) => i18n.translations[key] ?? key,
  }),
}));

const guestRoleEntries = Object.values(GuestRoleDto).map((guestRole) => ({
  key: { userRole: UserRoleDto.USER, guestRole },
  name: `user.guestRoles.${guestRole}`,
}));

describe("useRoleHierarchy", () => {
  beforeEach(() => {
    i18n.translations = {};
  });

  it("should return editable roles", () => {
    const { getVisibleRoles, hierarchy } = useRoleHierarchy();
    expect(
      getVisibleRoles({
        userRole: UserRoleDto.USER,
        memberRole: MemberRoleDto.OWNER,
      }),
    ).toEqual([
      {
        key: { userRole: UserRoleDto.USER, memberRole: MemberRoleDto.OWNER },
        name: "organizations.owner",
      },
      {
        key: { userRole: UserRoleDto.USER, memberRole: MemberRoleDto.MEMBER },
        name: "organizations.member",
      },
      ...guestRoleEntries,
      {
        key: { userRole: UserRoleDto.ANONYMOUS },
        name: "user.public",
      },
    ]);

    expect(
      getVisibleRoles({
        userRole: UserRoleDto.ADMIN,
      }),
    ).toEqual(hierarchy.map((role) => ({ ...role })));
  });

  it("should return if role is editable by specified subject", () => {
    const { canEditPermissionsOfRole } = useRoleHierarchy();
    expect(
      canEditPermissionsOfRole(
        {
          userRole: UserRoleDto.USER,
          memberRole: MemberRoleDto.OWNER,
        },
        { userRole: UserRoleDto.USER, memberRole: MemberRoleDto.OWNER },
      ),
    ).toBeFalsy();
    expect(
      canEditPermissionsOfRole(
        {
          userRole: UserRoleDto.USER,
          memberRole: MemberRoleDto.OWNER,
        },
        { userRole: UserRoleDto.USER, memberRole: MemberRoleDto.MEMBER },
      ),
    ).toBeTruthy();
    expect(
      canEditPermissionsOfRole(
        {
          userRole: UserRoleDto.USER,
          memberRole: MemberRoleDto.OWNER,
        },
        { userRole: UserRoleDto.ADMIN },
      ),
    ).toBeFalsy();

    expect(
      canEditPermissionsOfRole(
        {
          userRole: UserRoleDto.ADMIN,
        },
        { userRole: UserRoleDto.ADMIN },
      ),
    ).toBeFalsy();
    expect(
      canEditPermissionsOfRole(
        {
          userRole: UserRoleDto.ANONYMOUS,
        },
        { userRole: UserRoleDto.USER, memberRole: MemberRoleDto.MEMBER },
      ),
    ).toBeFalsy();
  });

  it("should rank the guest roles below members and above the public", () => {
    const { hierarchy } = useRoleHierarchy();

    expect(hierarchy.map((role) => role.name)).toEqual([
      "user.admin",
      "organizations.owner",
      "organizations.member",
      "user.guestRoles.Repairer",
      "user.guestRoles.Recycler",
      "user.guestRoles.MarketSurveillance",
      "user.guestRoles.IndependentOperator",
      "user.guestRoles.Supplier",
      "user.public",
    ]);
  });

  it("should show members the guest roles and the public", () => {
    const { getVisibleRoles } = useRoleHierarchy();

    expect(
      getVisibleRoles({ userRole: UserRoleDto.USER, memberRole: MemberRoleDto.MEMBER }),
    ).toEqual([
      {
        key: { userRole: UserRoleDto.USER, memberRole: MemberRoleDto.MEMBER },
        name: "organizations.member",
      },
      ...guestRoleEntries,
      { key: { userRole: UserRoleDto.ANONYMOUS }, name: "user.public" },
    ]);
  });

  it("should show a guest only itself and the public", () => {
    const { getVisibleRoles } = useRoleHierarchy();

    expect(
      getVisibleRoles({ userRole: UserRoleDto.USER, guestRole: GuestRoleDto.REPAIRER }),
    ).toEqual([
      guestRoleEntries.find((entry) => entry.key.guestRole === GuestRoleDto.REPAIRER),
      { key: { userRole: UserRoleDto.ANONYMOUS }, name: "user.public" },
    ]);
  });

  it("should let owners and members edit the permissions of guest roles", () => {
    const { canEditPermissionsOfRole } = useRoleHierarchy();
    const repairer = { userRole: UserRoleDto.USER, guestRole: GuestRoleDto.REPAIRER };

    expect(
      canEditPermissionsOfRole(
        { userRole: UserRoleDto.USER, memberRole: MemberRoleDto.OWNER },
        repairer,
      ),
    ).toBeTruthy();
    expect(
      canEditPermissionsOfRole(
        { userRole: UserRoleDto.USER, memberRole: MemberRoleDto.MEMBER },
        repairer,
      ),
    ).toBeTruthy();
    expect(canEditPermissionsOfRole({ userRole: UserRoleDto.ADMIN }, repairer)).toBeTruthy();
  });

  it("should not let guests edit the permissions of anyone", () => {
    const { canEditPermissionsOfRole } = useRoleHierarchy();
    const repairer = { userRole: UserRoleDto.USER, guestRole: GuestRoleDto.REPAIRER };

    expect(
      canEditPermissionsOfRole(repairer, {
        userRole: UserRoleDto.USER,
        guestRole: GuestRoleDto.RECYCLER,
      }),
    ).toBeFalsy();
    expect(canEditPermissionsOfRole(repairer, repairer)).toBeFalsy();
    expect(canEditPermissionsOfRole(repairer, { userRole: UserRoleDto.ANONYMOUS })).toBeFalsy();
    expect(
      canEditPermissionsOfRole(repairer, {
        userRole: UserRoleDto.USER,
        memberRole: MemberRoleDto.MEMBER,
      }),
    ).toBeFalsy();
  });

  it("should not let users without an organization or anonymous users edit anything", () => {
    const { canEditPermissionsOfRole } = useRoleHierarchy();
    const target = { userRole: UserRoleDto.ANONYMOUS };

    expect(canEditPermissionsOfRole({ userRole: UserRoleDto.USER }, target)).toBeFalsy();
    expect(canEditPermissionsOfRole({ userRole: UserRoleDto.ANONYMOUS }, target)).toBeFalsy();
  });

  it("should not let members edit the permissions of the roles above", () => {
    const { canEditPermissionsOfRole } = useRoleHierarchy();

    expect(
      canEditPermissionsOfRole(
        { userRole: UserRoleDto.USER, memberRole: MemberRoleDto.MEMBER },
        { userRole: UserRoleDto.USER, memberRole: MemberRoleDto.OWNER },
      ),
    ).toBeFalsy();
  });

  it("should name guest roles and fall back for unknown ones", () => {
    const { getRoleName } = useRoleHierarchy();

    expect(getRoleName({ userRole: UserRoleDto.USER, guestRole: GuestRoleDto.SUPPLIER })).toEqual(
      "user.guestRoles.Supplier",
    );
    expect(getRoleName({ userRole: UserRoleDto.USER })).toEqual("aasEditor.security.unknownRole");
  });

  it("should list exactly the configurable subjects of the shared hierarchy in its order", () => {
    const { hierarchy } = useRoleHierarchy();
    const isPlainUser = (subject: { userRole: string; memberRole?: string; guestRole?: string }) =>
      subject.userRole === UserRoleDto.USER && !subject.memberRole && !subject.guestRole;

    expect(hierarchy.map((role) => role.key)).toEqual(
      subjectHierarchy.flat().filter((subject) => !isPlainUser(subject)),
    );
  });

  it("should name every configurable subject of the shared hierarchy", () => {
    const { hierarchy, getRoleName } = useRoleHierarchy();

    for (const { key } of hierarchy) {
      expect(getRoleName(key)).not.toEqual("aasEditor.security.unknownRole");
    }
  });

  describe("getRoleDescription", () => {
    const repairer = { userRole: UserRoleDto.USER, guestRole: GuestRoleDto.REPAIRER };

    it("should return the description of a guest role", () => {
      i18n.translations = { "user.guestRoleDescriptions.Repairer": "Repairs products" };
      const { getRoleDescription } = useRoleHierarchy();

      expect(getRoleDescription(repairer)).toEqual("Repairs products");
    });

    it("should have no description while the text of a guest role is empty", () => {
      i18n.translations = { "user.guestRoleDescriptions.Repairer": "" };
      const { getRoleDescription } = useRoleHierarchy();

      expect(getRoleDescription(repairer)).toBeUndefined();
    });

    it("should have no description for roles which are no guest roles", () => {
      i18n.translations = {};
      const { getRoleDescription } = useRoleHierarchy();

      expect(
        getRoleDescription({ userRole: UserRoleDto.USER, memberRole: MemberRoleDto.MEMBER }),
      ).toBeUndefined();
      expect(getRoleDescription({ userRole: UserRoleDto.ANONYMOUS })).toBeUndefined();
    });
  });
});
