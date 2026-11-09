import type { OrganizationDto } from "@open-dpp/api-client";
import { createPinia, setActivePinia } from "pinia";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { useOrganizationsStore } from "./organizations";

vi.mock("../auth-client.ts", () => ({ authClient: { getSession: vi.fn() } }));
vi.mock("../lib/api-client", () => ({ default: { dpp: { organizations: {} } } }));
vi.mock("../translations/i18n.ts", () => ({ i18n: { global: { t: (key: string) => key } } }));
vi.mock("./error.handling.ts", () => ({
  useErrorHandlingStore: () => ({ logErrorWithNotification: vi.fn() }),
}));

describe("organizations store", () => {
  beforeEach(() => {
    setActivePinia(createPinia());
  });

  it("reset clears the organizations", () => {
    const store = useOrganizationsStore();
    store.organizations = [{ id: "org-1", name: "ACME" } as OrganizationDto];

    store.reset();

    expect(store.organizations).toEqual([]);
  });
});
