import { setActivePinia, createPinia } from "pinia";
import { vi, expect, it } from "vitest";
import { useIndexStore } from "./index";
import apiClient from "../lib/api-client";
import { waitFor } from "@testing-library/vue";
import { LAST_SELECTED_ORGANIZATION_ID_KEY } from "../const";

vi.mock("../lib/api-client", () => ({
  default: {
    setActiveOrganizationId: vi.fn(),
  },
}));

describe("IndexStore", () => {
  beforeEach(() => {
    // Create a fresh pinia instance and make it active
    setActivePinia(createPinia());
  });

  it("should update organization id of api client on orga select", async () => {
    const indexStore = useIndexStore();
    const id = "someId";
    indexStore.selectOrganization(id);
    await waitFor(() =>
      expect(apiClient.setActiveOrganizationId).toHaveBeenCalledWith(id),
    );
  });

  it("should update organization id of api client on startup", async () => {
    const id = "initialId";
    localStorage.setItem(LAST_SELECTED_ORGANIZATION_ID_KEY, id);
    useIndexStore();
    await waitFor(() =>
      expect(apiClient.setActiveOrganizationId).toHaveBeenCalledWith(id),
    );
  });
});
