import { mount } from "@vue/test-utils";
import { createPinia, setActivePinia } from "pinia";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { defineComponent } from "vue";
import { useOrganizations } from "./organizations.ts";
import { useErrorHandlingStore } from "../stores/error.handling.ts";

const mocks = vi.hoisted(() => {
  return {
    removeMember: vi.fn(),
  };
});

vi.mock("../lib/api-client", () => ({
  default: {
    dpp: {
      organizations: {
        removeMember: mocks.removeMember,
      },
    },
  },
}));

vi.mock("vue-i18n", () => ({
  useI18n: () => ({
    t: (key: string) => key,
  }),
}));

describe("organizations composable", () => {
  const mountedWrappers: Array<ReturnType<typeof mount>> = [];

  function mountHarness() {
    const Harness = defineComponent({
      name: "OrganizationsHarness",
      setup() {
        const api = useOrganizations();
        return { api };
      },
      template: "<div />",
    });

    const wrapper = mount(Harness);
    mountedWrappers.push(wrapper);
    return {
      wrapper,
      ...(wrapper.vm.api as ReturnType<typeof useOrganizations>),
    };
  }

  beforeEach(() => {
    setActivePinia(createPinia());
    vi.resetAllMocks();
  });

  afterEach(() => {
    mountedWrappers.splice(0).forEach((w) => {
      w.unmount();
    });
  });

  it("removes a member and returns true on success", async () => {
    mocks.removeMember.mockResolvedValueOnce({ status: 204 });

    const { removeMember } = mountHarness();
    const result = await removeMember("member-1");

    expect(result).toBe(true);
    expect(mocks.removeMember).toHaveBeenCalledWith("member-1");
  });

  it("returns false and notifies when removing a member fails", async () => {
    const errorHandlingStore = useErrorHandlingStore();
    const logSpy = vi
      .spyOn(errorHandlingStore, "logErrorWithNotification")
      .mockImplementation(() => {});
    mocks.removeMember.mockRejectedValueOnce(new Error("boom"));

    const { removeMember } = mountHarness();
    const result = await removeMember("member-1");

    expect(result).toBe(false);
    expect(logSpy).toHaveBeenCalled();
  });
});
