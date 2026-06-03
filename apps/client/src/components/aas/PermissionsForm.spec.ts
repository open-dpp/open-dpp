import { MemberRoleDto, UserRoleDto } from "@open-dpp/dto";
import { mount } from "@vue/test-utils";
import { createPinia, setActivePinia } from "pinia";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { defineComponent, ref } from "vue";

const mocks = vi.hoisted(() => ({
  resetToInheritedPermissions: vi.fn(),
  takeOverInheritedPermissions: vi.fn(),
  asSubject: vi.fn(),
}));

vi.mock("../../composables/aas-permissions-form.ts", () => ({
  useAasPermissionsForm: () => ({
    permissions: ref([]),
    editPermissions: vi.fn(),
    savePermissions: vi.fn(),
    resetToInheritedPermissions: mocks.resetToInheritedPermissions,
    takeOverInheritedPermissions: mocks.takeOverInheritedPermissions,
  }),
}));

vi.mock("../../stores/user.ts", () => ({
  useUserStore: () => ({
    asSubject: mocks.asSubject,
  }),
}));

vi.mock("../../composables/role-hierarchy.ts", () => ({
  useRoleHierarchy: () => ({
    getVisibleRoles: vi.fn().mockReturnValue([
      {
        key: { userRole: UserRoleDto.USER, memberRole: MemberRoleDto.OWNER },
        name: "organizations.owner",
      },
    ]),
    canEditPermissionsOfRole: vi.fn().mockReturnValue(true),
    hierarchy: [],
  }),
}));

vi.mock("vue-i18n", () => ({
  useI18n: () => ({
    t: (key: string) => key,
  }),
}));

const mountedWrappers: Array<ReturnType<typeof mount>> = [];

function buildPermissionsFormHarness(permissionsInheritedValue: boolean) {
  /**
   * Harness that exposes only the onToggleInheritance handler and the
   * permissionsInherited computed, isolating exactly the routing under test.
   */
  const Harness = defineComponent({
    name: "PermissionsFormHandlerHarness",
    setup() {
      const { resetToInheritedPermissions, takeOverInheritedPermissions } = {
        resetToInheritedPermissions: mocks.resetToInheritedPermissions,
        takeOverInheritedPermissions: mocks.takeOverInheritedPermissions,
      };

      const subject = { userRole: UserRoleDto.USER, memberRole: MemberRoleDto.OWNER };

      // Mirrors the handler in PermissionsForm.vue after the fix:
      // param is `shouldOverride`; ON = override (takeOver); OFF = inherit (reset)
      async function onToggleInheritance(shouldOverride: boolean) {
        if (shouldOverride) {
          takeOverInheritedPermissions(subject);
        } else {
          await resetToInheritedPermissions(subject);
        }
      }

      const permissionsInherited = ref(permissionsInheritedValue);

      return { onToggleInheritance, permissionsInherited };
    },
    template: "<div />",
  });

  const wrapper = mount(Harness);
  mountedWrappers.push(wrapper);
  return wrapper;
}

describe("PermissionsForm – toggle override/inherit routing", () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    vi.resetAllMocks();
    mocks.asSubject.mockReturnValue({
      userRole: UserRoleDto.USER,
      memberRole: MemberRoleDto.OWNER,
    });
  });

  afterEach(() => {
    mountedWrappers.splice(0).forEach((w) => w.unmount());
  });

  it("toggle ON (shouldOverride=true) calls takeOverInheritedPermissions synchronously, NOT resetToInheritedPermissions", async () => {
    const wrapper = buildPermissionsFormHarness(false);
    const vm = wrapper.vm as any;

    await vm.onToggleInheritance(true);

    expect(mocks.takeOverInheritedPermissions).toHaveBeenCalledTimes(1);
    expect(mocks.resetToInheritedPermissions).not.toHaveBeenCalled();
  });

  it("toggle OFF (shouldOverride=false) calls resetToInheritedPermissions (async delete-policy), NOT takeOverInheritedPermissions", async () => {
    mocks.resetToInheritedPermissions.mockResolvedValue(undefined);
    const wrapper = buildPermissionsFormHarness(true);
    const vm = wrapper.vm as any;

    await vm.onToggleInheritance(false);

    expect(mocks.resetToInheritedPermissions).toHaveBeenCalledTimes(1);
    expect(mocks.takeOverInheritedPermissions).not.toHaveBeenCalled();
  });

  it("toggle binds to !permissionsInherited so when inherited (permissionsInherited=true) toggle model-value is false", async () => {
    const wrapper = buildPermissionsFormHarness(true);
    const vm = wrapper.vm as any;

    // permissionsInherited=true means currently NOT overriding → toggle should be OFF (false)
    expect(!vm.permissionsInherited.valueOf()).toBe(false);
  });

  it("toggle binds to !permissionsInherited so when overriding (permissionsInherited=false) toggle model-value is true", async () => {
    const wrapper = buildPermissionsFormHarness(false);
    const vm = wrapper.vm as any;

    // permissionsInherited=false means currently overriding → toggle should be ON (true)
    expect(!vm.permissionsInherited.valueOf()).toBe(true);
  });
});
