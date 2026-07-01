import type { CreateGs1UniqueProductIdentifierRequest } from "@open-dpp/dto";
import { mount } from "@vue/test-utils";
import { createPinia, setActivePinia } from "pinia";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { defineComponent } from "vue";

import { useUniqueProductIdentifiers } from "./unique-product-identifiers.ts";

const mocks = vi.hoisted(() => {
  return {
    listUpis: vi.fn(),
    createUpi: vi.fn(),
    deleteUpi: vi.fn(),
    routerPush: vi.fn(),
  };
});

vi.mock("../lib/api-client", () => ({
  default: {
    setActiveOrganizationId: vi.fn(),
    dpp: {
      uniqueProductIdentifiers: {
        list: mocks.listUpis,
        create: mocks.createUpi,
        delete: mocks.deleteUpi,
      },
      passports: {
        getUniqueProductIdentifiers: mocks.listUpis,
      },
    },
  },
}));

vi.mock("vue-router", () => ({
  useRoute: () => ({ path: "/unique-product-identifiers" }),
  useRouter: () => ({
    push: mocks.routerPush,
  }),
}));

vi.mock("vue-i18n", () => ({
  useI18n: () => ({
    t: (key: string) => key,
  }),
}));

describe("useUniqueProductIdentifiers", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    setActivePinia(createPinia());
  });

  const mountedWrappers: Array<ReturnType<typeof mount>> = [];

  afterEach(() => {
    mountedWrappers.forEach((wrapper) => wrapper.unmount());
    mountedWrappers.length = 0;
  });

  function mountHarness() {
    const Harness = defineComponent({
      name: "use-unique-product-identifiers-harness",
      setup() {
        const api = useUniqueProductIdentifiers();
        return { api };
      },
      template: "<div></div>",
    });

    const wrapper = mount(Harness);
    mountedWrappers.push(wrapper);
    return {
      wrapper,
      ...(wrapper.vm.api as ReturnType<typeof useUniqueProductIdentifiers>),
    };
  }

  it("fetchUniqueProductIdentifiers calls list, sets upis ref, toggles loading, returns data", async () => {
    const { upis, loading, fetchUniqueProductIdentifiers } = mountHarness();

    const upisItems = [
      {
        uuid: "uuid-1",
        referenceId: "ref-1",
        type: "GS1",
        gtin: "04006381333931",
        batch: null,
        serial: null,
        granularity: "model",
        digitalLink: null,
        passportPublished: false,
      },
    ];

    let capturedLoading: boolean | undefined;
    mocks.listUpis.mockImplementationOnce(async () => {
      capturedLoading = loading.value;
      return { data: { paging_metadata: { cursor: "next-cursor" }, result: upisItems } };
    });

    const pagingParams = { limit: 10, cursor: undefined };
    const result = await fetchUniqueProductIdentifiers("passport-1", pagingParams);

    expect(mocks.listUpis).toHaveBeenCalledWith("passport-1", pagingParams);
    expect(capturedLoading).toBe(true);
    expect(loading.value).toBe(false);
    // The endpoint returns the cursor envelope; the composable exposes the result rows
    // directly and surfaces the next-page cursor for the pagination composable.
    expect(upis.value).toEqual(upisItems);
    expect(result).toEqual({ paging_metadata: { cursor: "next-cursor" }, result: upisItems });
  });

  it("fetchUniqueProductIdentifiers resets loading to false even on rejection", async () => {
    const { loading, fetchUniqueProductIdentifiers } = mountHarness();

    mocks.listUpis.mockRejectedValueOnce(new Error("network error"));

    await expect(
      fetchUniqueProductIdentifiers("passport-1", { limit: 10, cursor: undefined }),
    ).rejects.toThrow("network error");
    expect(loading.value).toBe(false);
  });

  it("createGs1Upi calls create with the provided body and resolves", async () => {
    const { createGs1Upi } = mountHarness();

    const createdUpi = {
      uuid: "uuid-2",
      referenceId: "ref-2",
      type: "GS1",
      gtin: "04006381333931",
      batch: "LOT-1",
      serial: null,
      granularity: "batch",
      digitalLink: null,
      passportPublished: false,
    };
    mocks.createUpi.mockResolvedValueOnce({ data: createdUpi });

    const body: CreateGs1UniqueProductIdentifierRequest = {
      referenceId: "ref-2",
      gtin: "04006381333931",
      batch: "LOT-1",
    };

    const result = await createGs1Upi(body);
    expect(mocks.createUpi).toHaveBeenCalledWith(body);
    expect(result).toEqual(createdUpi);
  });

  it("deleteUpi calls delete with the provided uuid", async () => {
    const { deleteUpi } = mountHarness();

    mocks.deleteUpi.mockResolvedValueOnce({ data: undefined });

    await deleteUpi("uuid-1");
    expect(mocks.deleteUpi).toHaveBeenCalledWith("uuid-1");
  });

  it("deleteUpi resets loading to false even on rejection", async () => {
    const { loading, deleteUpi } = mountHarness();

    mocks.deleteUpi.mockRejectedValueOnce(new Error("delete error"));

    await expect(deleteUpi("uuid-1")).rejects.toThrow("delete error");
    expect(loading.value).toBe(false);
  });
});
