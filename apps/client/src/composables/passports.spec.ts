import type { ConfirmationOptions } from "primevue/confirmationoptions";
import { DppStatusDto, DppStatusModificationMethodDto, Language, Populates } from "@open-dpp/dto";
import { passportsPlainFactory } from "@open-dpp/testing";
import { mount } from "@vue/test-utils";
import { createPinia, setActivePinia } from "pinia";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { defineComponent } from "vue";

import { HTTPCode } from "../stores/http-codes.ts";
import { usePassports } from "./passports.ts";

const mocks = vi.hoisted(() => {
  return {
    createPassport: vi.fn(),
    deleteById: vi.fn(),
    fetchPassports: vi.fn(),
    routerPush: vi.fn(),
    confirm: vi.fn(),
    modifyStatus: vi.fn(),
  };
});

vi.mock("../lib/api-client", () => ({
  default: {
    setActiveOrganizationId: vi.fn(),
    dpp: {
      passports: {
        create: mocks.createPassport,
        getAll: mocks.fetchPassports,
        deleteById: mocks.deleteById,
        modifyStatus: mocks.modifyStatus,
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

vi.mock("primevue/useconfirm", () => ({
  useConfirm: () => ({
    require: mocks.confirm,
  }),
}));

describe("passports", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    setActivePinia(createPinia());
  });

  const mountedWrappers: Array<ReturnType<typeof mount>> = [];

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

  it("should modify passport status", async () => {
    const { publish, archive, restore } = mountHarness();
    const p1 = passportsPlainFactory.build();

    mocks.modifyStatus.mockResolvedValueOnce({
      data: {
        ...p1,
        lastStatusChange: {
          currentStatus: DppStatusDto.Published,
          previousStatus: DppStatusDto.Draft,
        },
      },
      status: HTTPCode.OK,
    });
    await publish(p1.id);
    expect(mocks.modifyStatus).toHaveBeenCalledWith(p1.id, {
      method: DppStatusModificationMethodDto.Publish,
    });

    mocks.modifyStatus.mockResolvedValueOnce({
      data: {
        ...p1,
        lastStatusChange: {
          currentStatus: DppStatusDto.Archived,
          previousStatus: DppStatusDto.Draft,
        },
      },
      status: HTTPCode.OK,
    });
    await archive(p1.id);
    expect(mocks.modifyStatus).toHaveBeenCalledWith(p1.id, {
      method: DppStatusModificationMethodDto.Archive,
    });

    const p2 = passportsPlainFactory.build({
      lastStatusChange: {
        currentStatus: DppStatusDto.Archived,
        previousStatus: DppStatusDto.Draft,
      },
    });

    mocks.modifyStatus.mockResolvedValueOnce({
      data: {
        ...p2,
        lastStatusChange: {
          currentStatus: DppStatusDto.Draft,
          previousStatus: DppStatusDto.Archived,
        },
      },
      status: HTTPCode.OK,
    });
    await restore(p2.id);
  });

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

  it("should delete passport", async () => {
    const { deletePassport } = mountHarness();

    // From template
    mocks.deleteById.mockResolvedValueOnce({
      status: HTTPCode.NO_CONTENT,
    });
    const id = "123";
    const onDelete = vi.fn();
    mocks.confirm.mockImplementation(async (data: ConfirmationOptions) => {
      data.accept!();
    });
    await deletePassport(id, onDelete);
    expect(mocks.deleteById).toHaveBeenCalledWith(id);
    expect(onDelete).toHaveBeenCalled();
  });

  it("should fetch passports", async () => {
    const { passports, fetchPassports } = mountHarness();
    const p1 = passportsPlainFactory.build();
    const passportsResponse = { paging_metadata: { cursor: p1.id }, result: [p1] };
    mocks.fetchPassports.mockResolvedValueOnce({ data: passportsResponse });
    await fetchPassports({ limit: 10, cursor: undefined });

    expect(mocks.fetchPassports).toHaveBeenCalledWith({
      limit: 10,
      cursor: undefined,
      populate: [Populates.assetAdministrationShells],
    });
    expect(passports.value).toEqual(passportsResponse);
  });
});
