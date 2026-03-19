import type { SecurityResponseDto } from "@open-dpp/dto";
import type { SecurityPlainTransientParams } from "@open-dpp/testing";
import {
  MemberRoleDto,

  PermissionKind,
  Permissions,
  UserRoleDto,
} from "@open-dpp/dto";
import {
  allPermissionsAllow,
  securityPlainFactory,

} from "@open-dpp/testing";
import { mount } from "@vue/test-utils";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { defineComponent } from "vue";
import { useAasSecurity } from "./aas-security.ts";

describe("aasSecurity composable", () => {
  const mountedWrappers: Array<ReturnType<typeof mount>> = [];

  function mountHarness() {
    const Harness = defineComponent({
      name: "MediaFileCollectionHarness",
      setup() {
        const api = useAasSecurity();
        return { api };
      },
      template: "<div />",
    });

    const wrapper = mount(Harness);
    mountedWrappers.push(wrapper);
    return {
      wrapper,
      ...(wrapper.vm.api as ReturnType<typeof useAasSecurity>),
    };
  }

  beforeEach(() => {
    vi.resetAllMocks();
  });

  afterEach(() => {
    mountedWrappers.splice(0).forEach((w) => {
      w.unmount();
    });
  });

  it("should set security and check permissions", async () => {
    const transientParams: SecurityPlainTransientParams = {
      policies: [
        {
          subject: { userRole: UserRoleDto.USER, memberRole: MemberRoleDto.MEMBER },
          object: { idShortPath: "section1" },
          permissions: [
            {
              permission: Permissions.Create,
              kindOfPermission: PermissionKind.Allow,
            },
          ],
        },
        {
          subject: { userRole: UserRoleDto.ADMIN },
          object: { idShortPath: "section1" },
          permissions: [
            {
              permission: Permissions.Edit,
              kindOfPermission: PermissionKind.Allow,
            },
          ],
        },
      ],
    };
    const security: SecurityResponseDto = securityPlainFactory.build(undefined, { transient: transientParams });

    const { setAasSecurity, can } = mountHarness();
    setAasSecurity(security);

    expect(can(Permissions.Create, "section1")).toBeTruthy();
    expect(can(Permissions.Create, "section1.field1")).toBeTruthy();
    expect(can(Permissions.Edit, "section1.field1")).toBeTruthy();

    expect(can(Permissions.Create, "section2.field1")).toBeFalsy();

    expect(can(Permissions.Read, "section1")).toBeFalsy();
  });

  it("should return all permissions for given object", async () => {
    const transientParams: SecurityPlainTransientParams = {
      policies: [
        {
          subject: { userRole: UserRoleDto.USER, memberRole: MemberRoleDto.MEMBER },
          object: { idShortPath: "section1" },
          permissions: [
            {
              permission: Permissions.Create,
              kindOfPermission: PermissionKind.Allow,
            },
          ],
        },
        {
          subject: { userRole: UserRoleDto.USER, memberRole: MemberRoleDto.MEMBER },
          object: { idShortPath: "section3" },
          permissions: allPermissionsAllow,
        },
        {
          subject: { userRole: UserRoleDto.ADMIN },
          object: { idShortPath: "section1" },
          permissions: [
            {
              permission: Permissions.Create,
              kindOfPermission: PermissionKind.Allow,
            },
            {
              permission: Permissions.Edit,
              kindOfPermission: PermissionKind.Allow,
            },
          ],
        },
      ],
    };
    const security: SecurityResponseDto = securityPlainFactory.build(
      undefined,
      { transient: transientParams },
    );

    const { setAasSecurity, findPermissionForObject } = mountHarness();
    setAasSecurity(security);

    expect(findPermissionForObject("section1")).toEqual([
      {
        subject: { userRole: UserRoleDto.USER, memberRole: MemberRoleDto.MEMBER },
        permissions: [
          {
            permission: Permissions.Create,
            kindOfPermission: PermissionKind.Allow,
          },
        ],
      },
      {
        subject: { userRole: UserRoleDto.ADMIN, memberRole: undefined },
        permissions: [
          {
            permission: Permissions.Create,
            kindOfPermission: PermissionKind.Allow,
          },
          {
            permission: Permissions.Edit,
            kindOfPermission: PermissionKind.Allow,
          },
        ],
      },
    ]);
    expect(findPermissionForObject("section3")).toEqual([
      { subject: { userRole: "user", memberRole: "member" }, permissions: allPermissionsAllow },
    ]);
  });
});
