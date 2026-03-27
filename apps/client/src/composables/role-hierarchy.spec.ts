import { MemberRoleDto, UserRoleDto } from "@open-dpp/dto";
import { describe, expect, it } from "vitest";
import { useRoleHierarchy } from "./role-hierarchy.ts";

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
        name: "Owner",
      },
      {
        key: { userRole: UserRoleDto.USER, memberRole: MemberRoleDto.MEMBER },
        name: "Member",
      },
      {
        key: { userRole: UserRoleDto.ANONYMOUS },
        name: "Public",
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
    ).toBeTruthy();
  });
});
