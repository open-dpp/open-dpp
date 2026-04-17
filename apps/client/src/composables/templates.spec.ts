import {
  DigitalProductDocumentStatusDto,
  DigitalProductDocumentStatusModificationMethodDto,
  type LanguageTextDto,
  Populates,
} from "@open-dpp/dto";
import type { ConfirmationOptions } from "primevue/confirmationoptions";
import { templatesPlainFactory } from "@open-dpp/testing";
import { mount } from "@vue/test-utils";
import { createPinia, setActivePinia } from "pinia";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { defineComponent } from "vue";
import { HTTPCode } from "../stores/http-codes.ts";
import { useTemplates } from "./templates.ts";

const mocks = vi.hoisted(() => {
  return {
    createTemplate: vi.fn(),
    fetchTemplates: vi.fn(),
    routerPush: vi.fn(),
    deleteById: vi.fn(),
    confirm: vi.fn(),
    modifyStatus: vi.fn(),
  };
});

vi.mock("../lib/api-client", () => ({
  default: {
    setActiveOrganizationId: vi.fn(),
    dpp: {
      templates: {
        create: mocks.createTemplate,
        getAll: mocks.fetchTemplates,
        deleteById: mocks.deleteById,
        modifyStatus: mocks.modifyStatus,
      },
    },
  },
}));

vi.mock("vue-router", () => ({
  useRoute: () => ({ path: "/templates" }),
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

describe("templates", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    setActivePinia(createPinia());
  });

  const mountedWrappers: Array<ReturnType<typeof mount>> = [];

  function mountHarness() {
    const Harness = defineComponent({
      name: "use-templates-harness",
      setup() {
        const api = useTemplates();
        return { api };
      },
      template: "<div></div>",
    });

    const wrapper = mount(Harness);
    mountedWrappers.push(wrapper);
    return {
      wrapper,
      ...(wrapper.vm.api as ReturnType<typeof useTemplates>),
    };
  }

  it("should create template", async () => {
    const templatesStore = mountHarness();
    const t1 = templatesPlainFactory.build();

    mocks.createTemplate.mockResolvedValueOnce({ data: t1, status: HTTPCode.CREATED });
    const templates = { paging_metadata: { cursor: t1.id }, result: [t1] };
    mocks.fetchTemplates.mockResolvedValueOnce({ data: templates });
    const displayName: LanguageTextDto[] = [{ language: "en", text: "test" }];
    await templatesStore.createTemplate({ displayName });
    expect(mocks.createTemplate).toHaveBeenCalledWith({
      environment: {
        assetAdministrationShells: [
          {
            displayName,
          },
        ],
      },
    });
    expect(mocks.routerPush).toHaveBeenCalledWith(`/templates/${t1.id}`);
  });

  it("should modify passport status", async () => {
    const { publish, archive, restore } = mountHarness();
    const t1 = templatesPlainFactory.build();

    mocks.modifyStatus.mockResolvedValueOnce({
      data: {
        ...t1,
        lastStatusChange: {
          currentStatus: DigitalProductDocumentStatusDto.Published,
          previousStatus: DigitalProductDocumentStatusDto.Draft,
        },
      },
      status: HTTPCode.OK,
    });
    await publish(t1.id);
    expect(mocks.modifyStatus).toHaveBeenCalledWith(t1.id, {
      method: DigitalProductDocumentStatusModificationMethodDto.Publish,
    });

    mocks.modifyStatus.mockResolvedValueOnce({
      data: {
        ...t1,
        lastStatusChange: {
          currentStatus: DigitalProductDocumentStatusDto.Archived,
          previousStatus: DigitalProductDocumentStatusDto.Draft,
        },
      },
      status: HTTPCode.OK,
    });
    await archive(t1.id);
    expect(mocks.modifyStatus).toHaveBeenCalledWith(t1.id, {
      method: DigitalProductDocumentStatusModificationMethodDto.Archive,
    });

    const t2 = templatesPlainFactory.build({
      lastStatusChange: {
        currentStatus: DigitalProductDocumentStatusDto.Archived,
        previousStatus: DigitalProductDocumentStatusDto.Draft,
      },
    });

    mocks.modifyStatus.mockResolvedValueOnce({
      data: {
        ...t2,
        lastStatusChange: {
          currentStatus: DigitalProductDocumentStatusDto.Draft,
          previousStatus: DigitalProductDocumentStatusDto.Archived,
        },
      },
      status: HTTPCode.OK,
    });
    await restore(t2.id);
  });

  it("should delete template", async () => {
    const { deleteTemplate } = mountHarness();

    // From template
    mocks.deleteById.mockResolvedValueOnce({
      status: HTTPCode.NO_CONTENT,
    });
    const id = "123";
    const onDelete = vi.fn();
    mocks.confirm.mockImplementation(async (data: ConfirmationOptions) => {
      data.accept!();
    });
    await deleteTemplate(id, onDelete);
    await vi.waitFor(() => {
      expect(mocks.deleteById).toHaveBeenCalledWith(id);
      expect(onDelete).toHaveBeenCalled();
    });
  });

  it("should fetch templates", async () => {
    const { templates, fetchTemplates } = mountHarness();
    const t1 = templatesPlainFactory.build();
    const templatesResponse = { paging_metadata: { cursor: t1.id }, result: [t1] };
    mocks.fetchTemplates.mockResolvedValueOnce({ data: templatesResponse });
    await fetchTemplates(
      { limit: 10, cursor: undefined },
      { status: DigitalProductDocumentStatusDto.Archived },
    );
    expect(mocks.fetchTemplates).toHaveBeenCalledWith({
      pagination: { limit: 10, cursor: undefined },
      populate: [Populates.assetAdministrationShells],
      filter: { status: DigitalProductDocumentStatusDto.Archived },
    });
    expect(templates.value).toEqual(templatesResponse);
  });
});
