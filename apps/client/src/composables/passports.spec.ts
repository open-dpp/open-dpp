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

    mocks.createPassport.mockResolvedValueOnce({ data: p1, status: HTTPCode.CREATED });
    const passports = { paging_metadata: { cursor: p1.id }, result: [p1] };
    mocks.fetchPassports.mockResolvedValueOnce({ data: passports });

    await createPassport({});
    expect(mocks.createPassport).toHaveBeenCalledWith({});
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

  /* it("should fetch next or previous passports", async () => {
    const { passports, init, nextPage, previousPage } = usePassports({ changeQueryParams });
    const passportsResponse: PassportDto[] = [...Array.from({ length: 20 }).keys()].map(
      key => passportsPlainFactory.build({ id: key.toFixed() }),
    );
    const firstBlock = { paging_metadata: { cursor: passportsResponse[9]?.id }, result: passportsResponse.slice(0, 10) };
    const secondBlock = { paging_metadata: { cursor: passportsResponse[19]?.id }, result: passportsResponse.slice(10, 20) };

    mocks.fetchPassports.mockImplementation(({ cursor }: PagingParamsDto) => cursor === undefined ? { data: firstBlock } : { data: secondBlock });
    await init();
    await nextPage();
    expect(mocks.fetchPassports).toHaveBeenCalledWith({ limit: 10, cursor: passportsResponse[9]?.id });
    expect(passports.value).toEqual(secondBlock);
    await previousPage();
    expect(mocks.fetchPassports).toHaveBeenCalledWith({ limit: 10, cursor: undefined });
    expect(passports.value).toEqual(firstBlock);
  }); */
});
