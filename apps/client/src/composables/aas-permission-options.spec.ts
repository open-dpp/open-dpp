import { GuestRoleDto, MemberRoleDto, Permissions, UserRoleDto } from "@open-dpp/dto";
import { describe, expect, it, vi } from "vitest";
import { useAasPermissionOptions } from "./aas-permission-options.ts";

vi.mock("vue-i18n", () => ({
  useI18n: () => ({
    t: (key: string) => key,
  }),
}));

const keysOf = (options: { key: string }[]) => options.map((option) => option.key);

describe("useAasPermissionOptions", () => {
  const member = { userRole: UserRoleDto.USER, memberRole: MemberRoleDto.MEMBER };

  it("offers all permissions for members", () => {
    const { getPermissionOptions } = useAasPermissionOptions();

    expect(keysOf(getPermissionOptions(member))).toEqual([
      Permissions.Read,
      Permissions.Create,
      Permissions.Edit,
      Permissions.Delete,
    ]);
    expect(getPermissionOptions(member)[0].name).toEqual("aasEditor.security.read");
  });

  it("offers only Read for the public", () => {
    const { getPermissionOptions } = useAasPermissionOptions();

    expect(keysOf(getPermissionOptions({ userRole: UserRoleDto.ANONYMOUS }))).toEqual([
      Permissions.Read,
    ]);
  });

  it("offers only Read for every guest role", () => {
    const { getPermissionOptions } = useAasPermissionOptions();

    for (const guestRole of Object.values(GuestRoleDto)) {
      expect(keysOf(getPermissionOptions({ userRole: UserRoleDto.USER, guestRole }))).toEqual([
        Permissions.Read,
      ]);
    }
  });

  it("leaves out ignored permission options", () => {
    const { getPermissionOptions } = useAasPermissionOptions([
      Permissions.Create,
      Permissions.Delete,
    ]);

    expect(keysOf(getPermissionOptions(member))).toEqual([Permissions.Read, Permissions.Edit]);
    expect(
      keysOf(
        getPermissionOptions({ userRole: UserRoleDto.USER, guestRole: GuestRoleDto.SUPPLIER }),
      ),
    ).toEqual([Permissions.Read]);
  });
});
