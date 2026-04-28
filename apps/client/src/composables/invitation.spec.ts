import { mount } from "@vue/test-utils";
import { createPinia, setActivePinia } from "pinia";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { defineComponent } from "vue";
import { useInvitations } from "./invitation.ts";
import { invitationsPlainFactory } from "@open-dpp/testing";
import { HTTPCode } from "../stores/http-codes.ts";
import { InvitationStatusDto } from "@open-dpp/dto";

const mocks = vi.hoisted(() => {
  return {
    getInvitations: vi.fn(),
    getSingleInvitation: vi.fn(),
  };
});

vi.mock("../lib/api-client", () => ({
  default: {
    setActiveOrganizationId: vi.fn(),
    dpp: {
      users: {
        getInvitations: mocks.getInvitations,
      },
      organizations: {
        getInvitation: mocks.getSingleInvitation,
      },
    },
  },
}));

vi.mock("vue-i18n", () => ({
  useI18n: () => ({
    t: (key: string) => key,
  }),
}));

describe("invitation composable", () => {
  const mountedWrappers: Array<ReturnType<typeof mount>> = [];

  function mountHarness() {
    const Harness = defineComponent({
      name: "InvitationHarness",
      setup() {
        const api = useInvitations();
        return { api };
      },
      template: "<div />",
    });

    const wrapper = mount(Harness);
    mountedWrappers.push(wrapper);
    return {
      wrapper,
      ...(wrapper.vm.api as ReturnType<typeof useInvitations>),
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

  it("should fetch invitations", async () => {
    const invitation = invitationsPlainFactory.build();
    const { invitations, fetchInvitations } = mountHarness();
    mocks.getInvitations.mockResolvedValueOnce({
      data: [invitation],
      status: HTTPCode.OK,
    });
    await fetchInvitations({ status: InvitationStatusDto.PENDING });
    expect(invitations.value).toEqual([invitation]);
    expect(mocks.getInvitations).toHaveBeenCalledWith({
      status: InvitationStatusDto.PENDING,
    });
  });

  it("should fetch single invitation", async () => {
    const invitation = invitationsPlainFactory.build();
    const { fetchInvitation } = mountHarness();
    mocks.getSingleInvitation.mockResolvedValueOnce({
      data: invitation,
      status: HTTPCode.OK,
    });
    const result = await fetchInvitation(invitation.id);
    expect(result).toEqual(invitation);
  });
});
