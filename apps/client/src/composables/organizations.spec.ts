import type { MemberDto } from "@open-dpp/api-client";
import type { ConfirmationOptions } from "primevue/confirmationoptions";
import { mount } from "@vue/test-utils";
import { createPinia, setActivePinia } from "pinia";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { defineComponent } from "vue";
import { useOrganizations } from "./organizations.ts";
import { useErrorHandlingStore } from "../stores/error.handling.ts";

const mocks = vi.hoisted(() => {
  return {
    removeMember: vi.fn(),
    confirm: vi.fn(),
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
    t: (key: string, params?: Record<string, unknown>) =>
      params ? `${key}:${JSON.stringify(params)}` : key,
  }),
}));

vi.mock("primevue/useconfirm", () => ({
  useConfirm: () => ({
    require: mocks.confirm,
  }),
}));

const member: MemberDto = {
  id: "member-1",
  organizationId: "org-1",
  userId: "user-1",
  role: "member",
  createdAt: new Date(),
  updatedAt: new Date(),
  user: {
    id: "user-1",
    email: "jane@example.com",
    name: "Jane",
    image: null,
  },
};

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

  it("asks for confirmation including the member email", () => {
    const { removeMember } = mountHarness();
    const onRemoved = vi.fn();

    removeMember(member, onRemoved);

    expect(mocks.confirm).toHaveBeenCalledWith(
      expect.objectContaining({
        header: "organizations.removeMemberDialog.header",
        message: 'organizations.removeMemberDialog.message:{"email":"jane@example.com"}',
        acceptLabel: "common.remove",
        rejectLabel: "common.cancel",
      }),
    );
    expect(mocks.removeMember).not.toHaveBeenCalled();
    expect(onRemoved).not.toHaveBeenCalled();
  });

  it("removes the member and runs onRemoved when confirmed", async () => {
    mocks.removeMember.mockResolvedValueOnce({ status: 204 });
    mocks.confirm.mockImplementation((options: ConfirmationOptions) => options.accept!());

    const { removeMember } = mountHarness();
    const onRemoved = vi.fn();
    removeMember(member, onRemoved);
    await vi.waitFor(() => expect(onRemoved).toHaveBeenCalled());

    expect(mocks.removeMember).toHaveBeenCalledWith("member-1");
  });

  it("notifies and skips onRemoved when removal fails after confirmation", async () => {
    const errorHandlingStore = useErrorHandlingStore();
    const logSpy = vi
      .spyOn(errorHandlingStore, "logErrorWithNotification")
      .mockImplementation(() => {});
    mocks.removeMember.mockRejectedValueOnce(new Error("boom"));
    mocks.confirm.mockImplementation((options: ConfirmationOptions) => options.accept!());

    const { removeMember } = mountHarness();
    const onRemoved = vi.fn();
    removeMember(member, onRemoved);
    await vi.waitFor(() => expect(logSpy).toHaveBeenCalled());

    expect(onRemoved).not.toHaveBeenCalled();
  });
});
