import { createPinia, setActivePinia } from "pinia";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { usePassportStore } from "./passport";

const mocks = vi.hoisted(() => ({
  getById: vi.fn(),
  getSubmodels: vi.fn(),
  getShells: vi.fn(),
}));

vi.mock("../lib/api-client", () => ({
  default: {
    dpp: {
      permalinks: {
        getById: mocks.getById,
        aas: { getSubmodels: mocks.getSubmodels, getShells: mocks.getShells },
      },
    },
  },
}));

describe("passport store", () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    mocks.getById.mockReset();
    mocks.getSubmodels.mockReset();
    mocks.getShells.mockReset();
    mocks.getById.mockResolvedValue({
      data: { passport: { id: "p-1" }, presentationConfiguration: null },
    });
    mocks.getSubmodels.mockResolvedValue({ data: { result: [] } });
    mocks.getShells.mockResolvedValue({ data: { result: [] } });
  });

  it("starts without a permalink", () => {
    const store = usePassportStore();
    expect(store.permalinkIdOrSlug).toBe("");
  });

  it("keeps the permalink it loaded the passport through, so media can be fetched through it", async () => {
    const store = usePassportStore();

    await store.loadPassport("slug-1");

    expect(store.permalinkIdOrSlug).toBe("slug-1");
    expect(store.productPassport).toEqual({ id: "p-1" });
  });

  it("records the permalink before the passport request resolves", async () => {
    const store = usePassportStore();
    let seenDuringLoad: string | undefined;
    mocks.getById.mockImplementation(async () => {
      seenDuringLoad = store.permalinkIdOrSlug;
      return { data: { passport: { id: "p-1" }, presentationConfiguration: null } };
    });

    await store.loadPassport("slug-2");

    expect(seenDuringLoad).toBe("slug-2");
  });

  it("clears the permalink when leaving the public page, so other views fall back to bare media access", async () => {
    const store = usePassportStore();
    await store.loadPassport("slug-1");

    store.clearPermalink();

    expect(store.permalinkIdOrSlug).toBe("");
  });
});
