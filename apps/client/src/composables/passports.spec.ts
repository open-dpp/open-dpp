import { Language } from "@open-dpp/dto";
import { passportsPlainFactory } from "@open-dpp/testing";
import { createPinia, setActivePinia } from "pinia";
import { expect, it, vi } from "vitest";
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

describe("passports", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    setActivePinia(createPinia());
  });

  const changeQueryParams = vi.fn();

  it("should create passport", async () => {
    const { createPassport } = usePassports({ changeQueryParams });
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

  it("should init passport", async () => {
    const { passports, init } = usePassports({ changeQueryParams });
    const p1 = passportsPlainFactory.build();
    const passportsResponse = { paging_metadata: { cursor: p1.id }, result: [p1] };
    mocks.fetchPassports.mockResolvedValueOnce({ data: passportsResponse });
    await init();
    expect(mocks.fetchPassports).toHaveBeenCalledWith({ limit: 10, cursor: undefined });
    expect(passports.value).toEqual(passportsResponse);
  });
});
