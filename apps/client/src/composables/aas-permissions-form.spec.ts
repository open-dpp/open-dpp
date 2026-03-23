import type { SecurityResponseDto } from "@open-dpp/dto";
import type { SecurityPlainTransientParams } from "@open-dpp/testing";
import type { AasPermissionsFormProps } from "./aas-permissions-form.ts";
import {
  MemberRoleDto,

  PermissionKind,
  Permissions,
  UserRoleDto,
} from "@open-dpp/dto";
import { allPermissionsAllow, permissionObjectPlainFactory, propertyOutputPlainFactory, securityPlainFactory } from "@open-dpp/testing";
import { mount } from "@vue/test-utils";
import { createPinia, setActivePinia } from "pinia";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { defineComponent } from "vue";
import { useAasPermissionsForm } from "./aas-permissions-form.ts";

describe("aasPermissionsForm composable", () => {
  const mountedWrappers: Array<ReturnType<typeof mount>> = [];

  function mountHarness(props: AasPermissionsFormProps) {
    const Harness = defineComponent({
      name: "MediaFileCollectionHarness",
      setup() {
        const api = useAasPermissionsForm(props);
        return { api };
      },
      template: "<div />",
    });

    const wrapper = mount(Harness);
    mountedWrappers.push(wrapper);
    return {
      wrapper,
      ...(wrapper.vm.api as ReturnType<typeof useAasPermissionsForm>),
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

  const modifyShellMock = vi.fn();

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

    let permissionsForm = mountHarness({
      initialAccessPermissionRules:
        security.localAccessControl.accessPermissionRules,
      object: "section1",
      modifyShell: modifyShellMock,
    });

    expect(permissionsForm.getPermissions()).toEqual([
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

    expect(permissionsForm.getPermissions({ subject: { userRole: UserRoleDto.USER, memberRole: MemberRoleDto.MEMBER } })).toEqual([{
      subject: { userRole: UserRoleDto.USER, memberRole: MemberRoleDto.MEMBER },
      permissions: [
        {
          permission: Permissions.Create,
          kindOfPermission: PermissionKind.Allow,
        },
      ],
    }]);

    permissionsForm = mountHarness({
      initialAccessPermissionRules:
        security.localAccessControl.accessPermissionRules,
      object: "section3",
      modifyShell: modifyShellMock,
    });
    expect(permissionsForm.getPermissions()).toEqual([
      {
        subject: { userRole: "user", memberRole: "member" },
        permissions: allPermissionsAllow,
      },
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

    const { editPermissions, getPermissions, savePermissions } = mountHarness({
      initialAccessPermissionRules:
        security.localAccessControl.accessPermissionRules,
      object: "section1",
      modifyShell: modifyShellMock,
    });
    const member = { userRole: UserRoleDto.USER, memberRole: MemberRoleDto.MEMBER };
    const owner = { userRole: UserRoleDto.USER, memberRole: MemberRoleDto.OWNER };
    editPermissions([Permissions.Create, Permissions.Edit], member);
    editPermissions([Permissions.Create, Permissions.Edit], member);
    editPermissions([Permissions.Read], owner);
    expect(getPermissions()).toEqual([
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
        subject: { userRole: UserRoleDto.ADMIN },
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
        subject: { userRole: UserRoleDto.USER, memberRole: MemberRoleDto.OWNER },
        permissions: [
          {
            permission: Permissions.Read,
            kindOfPermission: PermissionKind.Allow,
          },
        ],
      },
    ]);
    await savePermissions();
    expect(modifyShellMock).toHaveBeenCalledWith({
      security: {
        localAccessControl: {
          accessPermissionRules: [
            {
              targetSubjectAttributes: {
                subjectAttribute: [
                  propertyOutputPlainFactory.build({
                    idShort: "userRole",
                    value: "user",
                  }),
                  propertyOutputPlainFactory.build({
                    idShort: "memberRole",
                    value: "member",
                  }),
                ],
              },
              permissionsPerObject: [
                {
                  object: permissionObjectPlainFactory.build({
                    idShort: "section1",
                  }),
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
            },
            {
              targetSubjectAttributes: {
                subjectAttribute: [
                  propertyOutputPlainFactory.build({
                    idShort: "userRole",
                    value: "admin",
                  }),
                ],
              },
              permissionsPerObject: [
                {
                  object: permissionObjectPlainFactory.build({
                    idShort: "section1",
                  }),
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
            },
            {
              targetSubjectAttributes: {
                subjectAttribute: [
                  propertyOutputPlainFactory.build({
                    idShort: "userRole",
                    value: "user",
                  }),
                  propertyOutputPlainFactory.build({
                    idShort: "memberRole",
                    value: "owner",
                  }),
                ],
              },
              permissionsPerObject: [
                {
                  object: permissionObjectPlainFactory.build({
                    idShort: "section1",
                    value: undefined,
                  }),
                  permissions: [
                    {
                      permission: Permissions.Read,
                      kindOfPermission: PermissionKind.Allow,
                    },
                  ],
                },
              ],
            },
          ],
        },
      },
    });
  });
});
