import { MemberRoleDto } from "@open-dpp/dto";
import { waitFor } from "@testing-library/vue";
import { createPinia, setActivePinia } from "pinia";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { LAST_SELECTED_ORGANIZATION_ID_KEY } from "../const";
import apiClient from "../lib/api-client";
import { HTTPCode } from "./http-codes.ts";
import { useIndexStore } from "./index";
import { useUserStore } from "./user.ts";
import "primevue";

const mocks = vi.hoisted(() => {
  return {
    getMembers: vi.fn(),
  };
});

vi.mock("../lib/api-client", () => ({
  default: {
    setActiveOrganizationId: vi.fn(),
    dpp: {
      organizations: {
        getMembers: mocks.getMembers,
      },
    },
  },
}));

vi.mock("primevue", () => ({
  usePrimeVue: vi.fn().mockReturnValue({
    config: {
      locale: "en",
    },
  }),
}));

vi.mock("../auth-client", () => ({
  authClient: {
    organization: {
      setActive: vi.fn().mockResolvedValue({}),
    },
  },
}));

describe("indexStore", () => {
  beforeEach(() => {
    // Create a fresh pinia instance and make it active
    setActivePinia(createPinia());
  });

  it("should update organization id of api client on orga select", async () => {
    const userStore = useUserStore();
    userStore.user.id = "u1";
    mocks.getMembers.mockResolvedValue({
      status: HTTPCode.OK,
      data: [{ userId: "u1", role: MemberRoleDto.MEMBER }],
    });
    const indexStore = useIndexStore();
    const id = "someId";
    indexStore.selectOrganization(id);
    await waitFor(() =>
      expect(apiClient.setActiveOrganizationId).toHaveBeenCalledWith(id),
    );
    await waitFor(() => expect(userStore.memberRole).toEqual(MemberRoleDto.MEMBER));
  });

  it("should update organization id of api client on startup", async () => {
    mocks.getMembers.mockResolvedValue({ status: HTTPCode.OK, data: [] });

    const id = "initialId";
    localStorage.setItem(LAST_SELECTED_ORGANIZATION_ID_KEY, id);
    useIndexStore();
    await waitFor(() =>
      expect(apiClient.setActiveOrganizationId).toHaveBeenCalledWith(id),
    );
  });
});
