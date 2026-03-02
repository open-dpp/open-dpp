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

  it("should create passport", async () => {
    const { createPassport } = usePassports();
    const p1 = passportsPlainFactory.build();

    mocks.createPassport.mockResolvedValueOnce({ data: p1, status: HTTPCode.CREATED });
    const passports = { paging_metadata: { cursor: p1.id }, result: [p1] };
    mocks.fetchPassports.mockResolvedValueOnce({ data: passports });

    await createPassport({});
    expect(mocks.createPassport).toHaveBeenCalledWith({});
    expect(mocks.routerPush).toHaveBeenCalledWith(`/passports/${p1.id}`);
  });
});
