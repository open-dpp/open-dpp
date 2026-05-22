import type { ConfirmationOptions } from "primevue/confirmationoptions";
import {
  DigitalProductDocumentStatusDto,
  DigitalProductDocumentStatusModificationMethodDto,
} from "@open-dpp/dto";
import { passportsPlainFactory } from "@open-dpp/testing";
import { mount } from "@vue/test-utils";
import { createPinia, setActivePinia } from "pinia";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { defineComponent } from "vue";

import { HTTPCode } from "../stores/http-codes.ts";
import { useDigitalProductDocument } from "./digital-product-document.ts";
import {
  DigitalProductDocumentType,
  type DigitalProductDocumentTypeType,
} from "../lib/digital-product-document.ts";

const mocks = vi.hoisted(() => {
  return {
    createPassport: vi.fn(),
    deleteById: vi.fn(),
    fetchPassports: vi.fn(),
    routerPush: vi.fn(),
    confirm: vi.fn(),
    modifyStatus: vi.fn(),
    getActivities: vi.fn(),
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
        getActivities: mocks.getActivities,
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

  function mountHarness(type: DigitalProductDocumentTypeType) {
    const Harness = defineComponent({
      name: "use-passports-harness",
      setup() {
        const api = useDigitalProductDocument(type);
        return { api };
      },
      template: "<div></div>",
    });

    const wrapper = mount(Harness);
    mountedWrappers.push(wrapper);
    return {
      wrapper,
      ...(wrapper.vm.api as ReturnType<typeof useDigitalProductDocument>),
    };
  }

  it("should modify digital product document status", async () => {
    const { publish, archive, restore } = mountHarness(DigitalProductDocumentType.Passport);
    const p1 = passportsPlainFactory.build();

    mocks.modifyStatus.mockResolvedValueOnce({
      data: {
        ...p1,
        lastStatusChange: {
          currentStatus: DigitalProductDocumentStatusDto.Published,
          previousStatus: DigitalProductDocumentStatusDto.Draft,
        },
      },
      status: HTTPCode.OK,
    });
    await publish(p1.id);
    expect(mocks.modifyStatus).toHaveBeenCalledWith(p1.id, {
      method: DigitalProductDocumentStatusModificationMethodDto.Publish,
    });

    mocks.modifyStatus.mockResolvedValueOnce({
      data: {
        ...p1,
        lastStatusChange: {
          currentStatus: DigitalProductDocumentStatusDto.Archived,
          previousStatus: DigitalProductDocumentStatusDto.Draft,
        },
      },
      status: HTTPCode.OK,
    });
    await archive(p1.id);
    expect(mocks.modifyStatus).toHaveBeenCalledWith(p1.id, {
      method: DigitalProductDocumentStatusModificationMethodDto.Archive,
    });

    const p2 = passportsPlainFactory.build({
      lastStatusChange: {
        currentStatus: DigitalProductDocumentStatusDto.Archived,
        previousStatus: DigitalProductDocumentStatusDto.Draft,
      },
    });

    mocks.modifyStatus.mockResolvedValueOnce({
      data: {
        ...p2,
        lastStatusChange: {
          currentStatus: DigitalProductDocumentStatusDto.Draft,
          previousStatus: DigitalProductDocumentStatusDto.Archived,
        },
      },
      status: HTTPCode.OK,
    });
    await restore(p2.id);
    expect(mocks.modifyStatus).toHaveBeenCalledWith(p2.id, {
      method: DigitalProductDocumentStatusModificationMethodDto.Restore,
    });
  });

  it("should delete passport", async () => {
    const { deleteDPD } = mountHarness(DigitalProductDocumentType.Passport);

    // From template
    mocks.deleteById.mockResolvedValueOnce({
      status: HTTPCode.NO_CONTENT,
    });
    const id = "123";
    const onDelete = vi.fn();
    mocks.confirm.mockImplementation(async (data: ConfirmationOptions) => {
      data.accept!();
    });
    await deleteDPD(id, onDelete);
    expect(mocks.deleteById).toHaveBeenCalledWith(id);
    expect(onDelete).toHaveBeenCalled();
  });
});
