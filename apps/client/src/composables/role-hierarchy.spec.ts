import { MemberRoleDto, UserRoleDto } from "@open-dpp/dto";
import { describe, expect, it, vi } from "vitest";
import { useRoleHierarchy } from "./role-hierarchy.ts";

vi.mock("vue-i18n", () => ({
  useI18n: () => ({
    t: (key: string) => key,
  }),
}));

describe("useRoleHierarchy", () => {
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
      {
        key: { userRole: UserRoleDto.ANONYMOUS },
        name: "user.public",
      },
    ]);

    expect(
      getVisibleRoles({
        userRole: UserRoleDto.ADMIN,
      }),
    ).toEqual(hierarchy.map(role => ({ ...role })));
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
  });
});
