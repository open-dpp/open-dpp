import type { SecurityResponseDto } from "@open-dpp/dto";
import type { SecurityPlainTransientParams } from "@open-dpp/testing";
import type { AasPermissionsFormProps } from "./aas-permissions-form.ts";
import {
  GuestRoleDto,
  MemberRoleDto,
  PermissionKind,
  Permissions,
  UserRoleDto,
} from "@open-dpp/dto";
import {
  allPermissionsPlainAllow,
  permissionObjectPlainFactory,
  propertyOutputPlainFactory,
  securityPlainFactory,
} from "@open-dpp/testing";
import { mount } from "@vue/test-utils";
import { createPinia, setActivePinia } from "pinia";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { defineComponent } from "vue";
import { isEqualSubject, makeSubjectAttributes } from "../lib/aas-security.ts";
import { HTTPCode } from "../stores/http-codes.ts";
import { useAasPermissionsForm } from "./aas-permissions-form.ts";

const mocks = vi.hoisted(() => {
  return {
    asSubject: vi.fn(),
  };
});

vi.mock("../stores/user.ts", () => ({
  useUserStore: () => ({
    asSubject: mocks.asSubject,
  }),
}));

vi.mock("vue-i18n", () => ({
  useI18n: () => ({
    t: (key: string, params?: Record<string, string>) =>
      params ? `${key} ${JSON.stringify(params)}` : key,
  }),
}));

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
  const deletePolicyMock = vi.fn();

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
          permissions: allPermissionsPlainAllow,
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
    const security: SecurityResponseDto = securityPlainFactory.build(undefined, {
      transient: transientParams,
    });

    let permissionsForm = mountHarness({
      getAccessPermissionRules: () => security.localAccessControl.accessPermissionRules,
      object: "section1",
      deletePolicyBySubjectAndObject: deletePolicyMock,
      modifyShell: modifyShellMock,
    });

    const admin = { userRole: UserRoleDto.ADMIN };
    expect(permissionsForm.permissions.value.find((p) => isEqualSubject(p.subject, admin))).toEqual(
      {
        subject: admin,
        permissions: [Permissions.Create, Permissions.Edit],
        inheritedFrom: null,
      },
    );

    const member = {
      userRole: UserRoleDto.USER,
      memberRole: MemberRoleDto.MEMBER,
    };
    expect(
      permissionsForm.permissions.value.find((p) => isEqualSubject(p.subject, member)),
    ).toEqual({ subject: member, permissions: [Permissions.Create], inheritedFrom: null });

    const anonymous = { userRole: UserRoleDto.ANONYMOUS };
    expect(
      permissionsForm.permissions.value.find((p) => isEqualSubject(p.subject, anonymous)),
    ).toEqual({ subject: anonymous, permissions: [], inheritedFrom: null });

    permissionsForm = mountHarness({
      getAccessPermissionRules: () => security.localAccessControl.accessPermissionRules,
      object: "section1.field1",
      modifyShell: modifyShellMock,
      deletePolicyBySubjectAndObject: deletePolicyMock,
    });

    expect(permissionsForm.permissions.value.find((p) => isEqualSubject(p.subject, admin))).toEqual(
      {
        subject: admin,
        permissions: [Permissions.Create, Permissions.Edit],
        inheritedFrom: { kind: "parent", object: "section1" },
      },
    );

    permissionsForm = mountHarness({
      getAccessPermissionRules: () => security.localAccessControl.accessPermissionRules,
      object: "section3",
      modifyShell: modifyShellMock,
      deletePolicyBySubjectAndObject: deletePolicyMock,
    });
    expect(
      permissionsForm.permissions.value.find((p) => isEqualSubject(p.subject, member)),
    ).toEqual({
      subject: member,
      permissions: allPermissionsPlainAllow.map((p) => p.permission),
      inheritedFrom: null,
    });
  });

  it("should consider ignorePermissionsOptions", async () => {
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
              permission: Permissions.Read,
              kindOfPermission: PermissionKind.Allow,
            },
            {
              permission: Permissions.Create,
              kindOfPermission: PermissionKind.Allow,
            },
          ],
        },
      ],
    };
    const security: SecurityResponseDto = securityPlainFactory.build(undefined, {
      transient: transientParams,
    });
    const owner = {
      userRole: UserRoleDto.USER,
      memberRole: MemberRoleDto.OWNER,
    };
    mocks.asSubject.mockReturnValue(owner);
    const { editPermissions, permissions } = mountHarness({
      getAccessPermissionRules: () => security.localAccessControl.accessPermissionRules,
      object: "section1.prop1",
      modifyShell: modifyShellMock,
      deletePolicyBySubjectAndObject: deletePolicyMock,
      ignoredPermissionOptions: [Permissions.Create],
    });
    const member = { userRole: UserRoleDto.USER, memberRole: MemberRoleDto.MEMBER };
    expect(permissions.value.find((p) => isEqualSubject(p.subject, member))).toEqual({
      subject: member,
      permissions: [Permissions.Read],
      inheritedFrom: { kind: "parent", object: "section1" },
    });
    editPermissions([Permissions.Edit], member);
    expect(permissions.value.find((p) => isEqualSubject(p.subject, member))).toEqual({
      subject: member,
      permissions: [Permissions.Edit, Permissions.Read],
      inheritedFrom: null,
    });
    editPermissions([], member);

    expect(permissions.value.find((p) => isEqualSubject(p.subject, member))).toEqual({
      subject: member,
      permissions: [],
      inheritedFrom: null,
    });
  });

  it("should modify permissions", async () => {
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
          permissions: allPermissionsPlainAllow,
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
    const security: SecurityResponseDto = securityPlainFactory.build(undefined, {
      transient: transientParams,
    });
    const owner = {
      userRole: UserRoleDto.USER,
      memberRole: MemberRoleDto.OWNER,
    };
    mocks.asSubject.mockReturnValue(owner);
    const { editPermissions, permissions, savePermissions } = mountHarness({
      getAccessPermissionRules: () => security.localAccessControl.accessPermissionRules,
      object: "section1",
      modifyShell: modifyShellMock,
      deletePolicyBySubjectAndObject: deletePolicyMock,
    });
    const member = { userRole: UserRoleDto.USER, memberRole: MemberRoleDto.MEMBER };

    editPermissions([Permissions.Create, Permissions.Edit], member);
    editPermissions([Permissions.Create, Permissions.Edit], member);
    expect(permissions.value.find((p) => isEqualSubject(p.subject, member))).toEqual({
      subject: member,
      permissions: [Permissions.Create, Permissions.Edit, Permissions.Read],
      inheritedFrom: null,
    });
    editPermissions([Permissions.Read, Permissions.Delete], owner);

    expect(permissions.value.find((p) => isEqualSubject(p.subject, owner))).toEqual({
      subject: owner,
      permissions: [Permissions.Read, Permissions.Delete],
      inheritedFrom: null,
    });

    await savePermissions();
    const expected = {
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
    };
    expect(modifyShellMock).toHaveBeenCalledWith(expected);
  });

  it("should reset permissions to inherited permissions", async () => {
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
              permission: Permissions.Read,
              kindOfPermission: PermissionKind.Allow,
            },
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
          object: { idShortPath: "section1.prop1" },
          permissions: [
            {
              permission: Permissions.Read,
              kindOfPermission: PermissionKind.Allow,
            },
          ],
        },
      ],
    };
    const security: SecurityResponseDto = securityPlainFactory.build(undefined, {
      transient: transientParams,
    });
    const permissionsForm = mountHarness({
      getAccessPermissionRules: () => security.localAccessControl.accessPermissionRules,
      object: "section1.prop1",
      modifyShell: modifyShellMock,
      deletePolicyBySubjectAndObject: deletePolicyMock,
    });
    const owner = { userRole: UserRoleDto.USER, memberRole: MemberRoleDto.OWNER };
    const member = { userRole: UserRoleDto.USER, memberRole: MemberRoleDto.MEMBER };
    permissionsForm.editPermissions([Permissions.Create, Permissions.Edit], member);
    expect(
      permissionsForm.permissions.value.find((p) => isEqualSubject(p.subject, member)),
    ).toEqual({
      subject: member,
      permissions: [Permissions.Create, Permissions.Edit, Permissions.Read],
      inheritedFrom: null,
    });
    deletePolicyMock.mockResolvedValue({ status: HTTPCode.NO_CONTENT });
    await permissionsForm.resetToInheritedPermissions(member);
    expect(deletePolicyMock).toHaveBeenCalledWith({
      subject: makeSubjectAttributes(member),
      object: "section1.prop1",
    });
    expect(
      permissionsForm.permissions.value.find((p) => isEqualSubject(p.subject, member)),
    ).toEqual({
      subject: member,
      permissions: [Permissions.Read, Permissions.Create],
      inheritedFrom: { kind: "parent", object: "section1" },
    });
    mocks.asSubject.mockReturnValueOnce(owner);
    await permissionsForm.savePermissions();
    expect(modifyShellMock).not.toHaveBeenCalled();
  });

  describe("public fallback", () => {
    const anonymous = { userRole: UserRoleDto.ANONYMOUS };
    const repairer = { userRole: UserRoleDto.USER, guestRole: GuestRoleDto.REPAIRER };

    function securityWithPublicRead(): SecurityResponseDto {
      return securityPlainFactory.build(undefined, {
        transient: {
          policies: [
            {
              subject: anonymous,
              object: { idShortPath: "section1" },
              permissions: [
                { permission: Permissions.Read, kindOfPermission: PermissionKind.Allow },
              ],
            },
          ],
        },
      });
    }

    it("shows a role without a rule of its own the permissions of the public", () => {
      const security = securityWithPublicRead();
      const permissionsForm = mountHarness({
        getAccessPermissionRules: () => security.localAccessControl.accessPermissionRules,
        object: "section1",
        modifyShell: modifyShellMock,
        deletePolicyBySubjectAndObject: deletePolicyMock,
      });

      expect(
        permissionsForm.permissions.value.find((p) => isEqualSubject(p.subject, repairer)),
      ).toEqual({
        subject: repairer,
        permissions: [Permissions.Read],
        inheritedFrom: { kind: "public" },
      });
      expect(
        permissionsForm.permissions.value.find((p) => isEqualSubject(p.subject, anonymous)),
      ).toEqual({
        subject: anonymous,
        permissions: [Permissions.Read],
        inheritedFrom: null,
      });
    });

    it("takes over the permissions of the public as a rule of the role and shows them as own", () => {
      const security = securityWithPublicRead();
      const permissionsForm = mountHarness({
        getAccessPermissionRules: () => security.localAccessControl.accessPermissionRules,
        object: "section1",
        modifyShell: modifyShellMock,
        deletePolicyBySubjectAndObject: deletePolicyMock,
      });

      permissionsForm.takeOverInheritedPermissions(repairer);

      expect(
        permissionsForm.permissions.value.find((p) => isEqualSubject(p.subject, repairer)),
      ).toEqual({ subject: repairer, permissions: [Permissions.Read], inheritedFrom: null });
    });
  });

  describe("permissionSourceText", () => {
    function formWithoutRules() {
      return mountHarness({
        getAccessPermissionRules: () => [],
        object: "section1",
        modifyShell: modifyShellMock,
        deletePolicyBySubjectAndObject: deletePolicyMock,
      });
    }

    it("names the public", () => {
      expect(formWithoutRules().permissionSourceText({ kind: "public" })).toBe(
        "aasEditor.security.inheritedFromPublic",
      );
    });

    it("names the parent node", () => {
      expect(
        formWithoutRules().permissionSourceText({ kind: "parent", object: "section1.list" }),
      ).toBe('aasEditor.security.inheritedFromParent {"object":"section1.list"}');
    });

    it("has no text for permissions which are not inherited", () => {
      expect(formWithoutRules().permissionSourceText(null)).toBeUndefined();
    });
  });
});
