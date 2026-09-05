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

/** A promise settled by the test, to hold a mocked response until the test decides. */
function deferred<T>() {
  let resolve!: (value: T) => void;
  let reject!: (reason: unknown) => void;
  const promise = new Promise<T>((res, rej) => {
    resolve = res;
    reject = rej;
  });
  return { promise, resolve, reject };
}

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

  describe("when a newer load starts before an earlier one finishes", () => {
    const passportFor = (id: string) => ({
      data: { passport: { id: `passport-${id}` }, presentationConfiguration: null },
    });
    const submodelsFor = (id: string) => ({ data: { result: [{ id: `submodel-${id}` }] } });
    const shellsFor = (id: string) => ({ data: { result: [{ id: `shell-${id}` }] } });

    beforeEach(() => {
      mocks.getById.mockImplementation(async (id: string) => passportFor(id));
      mocks.getSubmodels.mockImplementation(async (id: string) => submodelsFor(id));
      mocks.getShells.mockImplementation(async (id: string) => shellsFor(id));
    });

    /** Holds the "slug-old" response of one request until the test releases it. */
    function holdOldResponse(mock: ReturnType<typeof vi.fn>, responseFor: (id: string) => unknown) {
      const requested = deferred<void>();
      const response = deferred<unknown>();
      mock.mockImplementation((id: string) => {
        if (id !== "slug-old") return Promise.resolve(responseFor(id));
        requested.resolve();
        return response.promise;
      });
      return { requested: requested.promise, release: response.resolve, fail: response.reject };
    }

    it.each([
      ["passport", mocks.getById, passportFor],
      ["submodels", mocks.getSubmodels, submodelsFor],
      ["shells", mocks.getShells, shellsFor],
    ] as const)(
      "drops the earlier load's late %s response, so the store never mixes it with the current permalink",
      async (_step, mock, responseFor) => {
        const store = usePassportStore();
        const old = holdOldResponse(mock, responseFor);

        const oldLoad = store.loadPassport("slug-old");
        await old.requested;
        await store.loadPassport("slug-new");
        old.release(responseFor("slug-old"));
        await oldLoad;

        expect(store.permalinkIdOrSlug).toBe("slug-new");
        expect(store.productPassport).toEqual({ id: "passport-slug-new" });
        expect(store.submodels).toEqual([{ id: "submodel-slug-new" }]);
        expect(store.shells).toEqual([{ id: "shell-slug-new" }]);
      },
    );

    it("resolves a superseded load without reporting its failure, since only the latest load's outcome matters", async () => {
      const store = usePassportStore();
      const old = holdOldResponse(mocks.getById, passportFor);

      const oldLoad = store.loadPassport("slug-old");
      await old.requested;
      await store.loadPassport("slug-new");
      old.fail(new Error("network down"));

      await expect(oldLoad).resolves.toBeUndefined();
      expect(store.productPassport).toEqual({ id: "passport-slug-new" });
    });
  });
});
