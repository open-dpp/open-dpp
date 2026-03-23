import type { SecurityResponseDto } from "@open-dpp/dto";
import type { SecurityPlainTransientParams } from "@open-dpp/testing";
import type { AasSecurityProps } from "./aas-security.ts";
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
import { createPinia, setActivePinia } from "pinia";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { defineComponent } from "vue";
import { useAasSecurity } from "./aas-security.ts";

describe("aasSecurity composable", () => {
  const mountedWrappers: Array<ReturnType<typeof mount>> = [];

  function mountHarness(props: AasSecurityProps) {
    const Harness = defineComponent({
      name: "MediaFileCollectionHarness",
      setup() {
        const api = useAasSecurity(props);
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
    // Create a fresh pinia instance and make it active
    setActivePinia(createPinia());

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

    const { can } = mountHarness({ initialAccessPermissionRules: security.localAccessControl.accessPermissionRules });

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

    const { findPermissionForObject } = mountHarness({
      initialAccessPermissionRules:
        security.localAccessControl.accessPermissionRules,
    });

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

  it("should modify security", async () => {
    const transientParams: SecurityPlainTransientParams = {
      policies: [
        {
          subject: {
            userRole: UserRoleDto.USER,
            memberRole: MemberRoleDto.MEMBER,
          },
          object: { idShortPath: "section1" },
          permissions: [
            {
              permission: Permissions.Create,
              kindOfPermission: PermissionKind.Allow,
            },
          ],
        },
        {
          subject: {
            userRole: UserRoleDto.USER,
            memberRole: MemberRoleDto.MEMBER,
          },
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

    const { editPermissions, findPermissionForObject } = mountHarness({
      initialAccessPermissionRules:
        security.localAccessControl.accessPermissionRules,
    });
    const member = { userRole: UserRoleDto.USER, memberRole: MemberRoleDto.MEMBER };
    editPermissions([Permissions.Create, Permissions.Edit], "section1", member);
    editPermissions([Permissions.Create, Permissions.Edit], "section1", member);

    expect(findPermissionForObject("section1")).toEqual([
      {
        subject: {
          userRole: UserRoleDto.USER,
          memberRole: MemberRoleDto.MEMBER,
        },
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
  });
});
