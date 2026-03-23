import type { SecurityResponseDto } from "@open-dpp/dto";
import type { SecurityPlainTransientParams } from "@open-dpp/testing";
import type { AasAbilityProps } from "./aas-ability.ts";
import {
  MemberRoleDto,

  PermissionKind,
  Permissions,
  UserRoleDto,
} from "@open-dpp/dto";
import {
  securityPlainFactory,

} from "@open-dpp/testing";
import { mount } from "@vue/test-utils";
import { createPinia, setActivePinia } from "pinia";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { defineComponent } from "vue";
import { useAasAbility } from "./aas-ability.ts";

describe("aasAbility composable", () => {
  const mountedWrappers: Array<ReturnType<typeof mount>> = [];

  function mountHarness(props: AasAbilityProps) {
    const Harness = defineComponent({
      name: "MediaFileCollectionHarness",
      setup() {
        const api = useAasAbility(props);
        return { api };
      },
      template: "<div />",
    });

    const wrapper = mount(Harness);
    mountedWrappers.push(wrapper);
    return {
      wrapper,
      ...(wrapper.vm.api as ReturnType<typeof useAasAbility>),
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

  it("should and check permissions", async () => {
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

    const { can } = mountHarness({ accessPermissionRules: security.localAccessControl.accessPermissionRules });

    expect(can(Permissions.Create, "section1")).toBeTruthy();
    expect(can(Permissions.Create, "section1.field1")).toBeTruthy();
    expect(can(Permissions.Edit, "section1.field1")).toBeTruthy();

    expect(can(Permissions.Create, "section2.field1")).toBeFalsy();

    expect(can(Permissions.Read, "section1")).toBeFalsy();
  });
});
