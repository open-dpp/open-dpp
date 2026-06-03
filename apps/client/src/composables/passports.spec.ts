import { DigitalProductDocumentStatusDto, Language, Populates } from "@open-dpp/dto";
import { passportsPlainFactory } from "@open-dpp/testing";
import { mount } from "@vue/test-utils";
import { createPinia, setActivePinia } from "pinia";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { defineComponent } from "vue";

import { HTTPCode } from "../stores/http-codes.ts";
import { usePassports } from "./passports.ts";

const mocks = vi.hoisted(() => {
  return {
    createPassport: vi.fn(),
    fetchPassports: vi.fn(),
    routerPush: vi.fn(),
  };
});

vi.mock("../lib/api-client", () => ({
  default: {
    setActiveOrganizationId: vi.fn(),
    dpp: {
      passports: {
        create: mocks.createPassport,
        getAll: mocks.fetchPassports,
      },
    },
  },
}));

vi.mock("vue-router", () => ({
  useRoute: () => ({ path: "/passports" }),
  useRouter: () => ({
    push: mocks.routerPush,
  }),
}));

vi.mock("vue-i18n", () => ({
  useI18n: () => ({
    t: (key: string) => key,
  }),
}));

describe("passports", () => {
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
      name: "use-passports-harness",
      setup() {
        const api = usePassports();
        return { api };
      },
      template: "<div></div>",
    });

    const wrapper = mount(Harness);
    mountedWrappers.push(wrapper);
    return {
      wrapper,
      ...(wrapper.vm.api as ReturnType<typeof usePassports>),
    };
  }

  it("should create passport", async () => {
    const { createPassport } = mountHarness();
    const p1 = passportsPlainFactory.build();

    const passports = { paging_metadata: { cursor: p1.id }, result: [p1] };
    // From template
    mocks.createPassport.mockResolvedValueOnce({
      data: p1,
      status: HTTPCode.CREATED,
    });
    mocks.fetchPassports.mockResolvedValueOnce({ data: passports });
    await createPassport({ templateId: "t1" });
    expect(mocks.createPassport).toHaveBeenCalledWith({ templateId: "t1" });
    expect(mocks.routerPush).toHaveBeenCalledWith(`/passports/${p1.id}`);
    // From blank
    mocks.createPassport.mockResolvedValueOnce({
      data: p1,
      status: HTTPCode.CREATED,
    });
    mocks.fetchPassports.mockResolvedValueOnce({ data: passports });
    const displayName = [{ language: Language.en, text: "test" }];
    await createPassport({ displayName });
    expect(mocks.createPassport).toHaveBeenCalledWith({
      environment: { assetAdministrationShells: [{ displayName }] },
    });
    expect(mocks.routerPush).toHaveBeenCalledWith(`/passports/${p1.id}`);
  });

  it("should fetch passports", async () => {
    const { passports, fetchPassports } = mountHarness();
    const p1 = passportsPlainFactory.build();
    const passportsResponse = { paging_metadata: { cursor: p1.id }, result: [p1] };
    mocks.fetchPassports.mockResolvedValueOnce({ data: passportsResponse });
    await fetchPassports(
      { limit: 10, cursor: undefined },
      { status: [DigitalProductDocumentStatusDto.Archived] },
    );

    expect(mocks.fetchPassports).toHaveBeenCalledWith({
      pagination: { limit: 10, cursor: undefined },
      populate: [Populates.assetAdministrationShells],
      filter: { status: [DigitalProductDocumentStatusDto.Archived] },
    });
    expect(passports.value).toEqual(passportsResponse);
  });
});
