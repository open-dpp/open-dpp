import { mount } from "@vue/test-utils";
import { createPinia, setActivePinia } from "pinia";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { defineComponent } from "vue";
import { useUsersRepo } from "./users-repo.ts";
import { useNotificationStore } from "../stores/notification.ts";

const mocks = vi.hoisted(() => {
  return {
    resendMyVerificationEmail: vi.fn(),
  };
});

vi.mock("../lib/api-client", () => ({
  default: {
    dpp: {
      users: {
        resendMyVerificationEmail: mocks.resendMyVerificationEmail,
      },
    },
  },
}));

vi.mock("vue-i18n", () => ({
  useI18n: () => ({
    t: (key: string) => key,
  }),
}));

describe("usersRepo composable", () => {
  const mountedWrappers: Array<ReturnType<typeof mount>> = [];

  function mountHarness() {
    const Harness = defineComponent({
      name: "UsersRepoHarness",
      setup() {
        const api = useUsersRepo();
        return { api };
      },
      template: "<div />",
    });

    const wrapper = mount(Harness);
    mountedWrappers.push(wrapper);
    return {
      wrapper,
      ...(wrapper.vm.api as ReturnType<typeof useUsersRepo>),
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

  it("resends the verification email and shows a success notification", async () => {
    const notificationStore = useNotificationStore();
    mocks.resendMyVerificationEmail.mockResolvedValueOnce({ data: {} });

    const { resendMyVerificationEmail } = mountHarness();
    const result = await resendMyVerificationEmail();

    expect(result).toBe(true);
    expect(mocks.resendMyVerificationEmail).toHaveBeenCalledOnce();
    expect(notificationStore.notifications).toHaveLength(1);
    expect(notificationStore.notifications[0]).toEqual(
      expect.objectContaining({ message: "user.resendVerificationEmail.success" }),
    );
  });

  it("shows an error notification and returns false when the request fails", async () => {
    const notificationStore = useNotificationStore();
    mocks.resendMyVerificationEmail.mockRejectedValueOnce(new Error("network down"));

    const { resendMyVerificationEmail } = mountHarness();
    const result = await resendMyVerificationEmail();

    expect(result).toBe(false);
    expect(notificationStore.notifications).toHaveLength(1);
    expect(notificationStore.notifications[0]).toEqual(
      expect.objectContaining({ message: "user.resendVerificationEmail.error" }),
    );
  });
});
