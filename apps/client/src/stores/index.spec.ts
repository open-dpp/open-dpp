import { waitFor } from "@testing-library/vue";
import { createPinia, setActivePinia } from "pinia";
import { expect, it, vi } from "vitest";
import { LAST_SELECTED_ORGANIZATION_ID_KEY } from "../const";
import apiClient from "../lib/api-client";
import { useIndexStore } from "./index";

vi.mock("../lib/api-client", () => ({
  default: {
    setActiveOrganizationId: vi.fn(),
  },
}));

describe("indexStore", () => {
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
