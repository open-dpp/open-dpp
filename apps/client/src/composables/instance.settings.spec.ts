import { UserRoleDto } from "@open-dpp/dto";
import { mount } from "@vue/test-utils";
import { createPinia, setActivePinia } from "pinia";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { defineComponent } from "vue";
import { useInstanceSettings } from "./instance.settings.ts";
import { waitFor } from "@testing-library/vue";
import { useUserStore } from "../stores/user.ts";

const mocks = vi.hoisted(() => {
  return {
    getPublic: vi.fn(),
  };
});

vi.mock("../lib/api-client", () => ({
  default: {
    setActiveOrganizationId: vi.fn(),
    dpp: {
      instanceSettings: {
        getPublic: mocks.getPublic,
      },
    },
  },
}));

vi.mock("vue-i18n", () => ({
  useI18n: () => ({
    t: (key: string) => key,
  }),
}));

describe("instanceSettings composable", () => {
  const mountedWrappers: Array<ReturnType<typeof mount>> = [];

  function mountHarness() {
    const Harness = defineComponent({
      name: "InstanceSettingsHarness",
      setup() {
        const api = useInstanceSettings();
        return { api };
      },
      template: "<div />",
    });

    const wrapper = mount(Harness);
    mountedWrappers.push(wrapper);
    return {
      wrapper,
      ...(wrapper.vm.api as ReturnType<typeof useInstanceSettings>),
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

  it("should get organizationCreationEnabled", async () => {
    const userStore = useUserStore();
    userStore.user.role = UserRoleDto.USER;

    const { canCreateOrganization, fetchInstanceSettings } = mountHarness();
    mocks.getPublic.mockResolvedValueOnce({
      data: {
        organizationCreationEnabled: true,
      },
    });

    await fetchInstanceSettings();
    expect(canCreateOrganization.value).toBeTruthy();

    mocks.getPublic.mockResolvedValueOnce({
      data: {
        organizationCreationEnabled: false,
      },
    });

    await fetchInstanceSettings();
    expect(canCreateOrganization.value).toBeFalsy();

    mocks.getPublic.mockResolvedValueOnce({
      data: {
        organizationCreationEnabled: false,
      },
    });
    userStore.user.role = UserRoleDto.ADMIN;

    await fetchInstanceSettings();
    await waitFor(() => expect(canCreateOrganization.value).toBeTruthy());
  });
});
