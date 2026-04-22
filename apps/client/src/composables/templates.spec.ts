import { DigitalProductDocumentStatusDto, type LanguageTextDto, Populates } from "@open-dpp/dto";
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
  };
});

vi.mock("../lib/api-client", () => ({
  default: {
    setActiveOrganizationId: vi.fn(),
    dpp: {
      templates: {
        create: mocks.createTemplate,
        getAll: mocks.fetchTemplates,
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

  it("should fetch templates", async () => {
    const { templates, fetchTemplates } = mountHarness();
    const t1 = templatesPlainFactory.build();
    const templatesResponse = { paging_metadata: { cursor: t1.id }, result: [t1] };
    mocks.fetchTemplates.mockResolvedValueOnce({ data: templatesResponse });
    await fetchTemplates(
      { limit: 10, cursor: undefined },
      { status: [DigitalProductDocumentStatusDto.Archived] },
    );
    expect(mocks.fetchTemplates).toHaveBeenCalledWith({
      pagination: { limit: 10, cursor: undefined },
      populate: [Populates.assetAdministrationShells],
      filter: { status: [DigitalProductDocumentStatusDto.Archived] },
    });
    expect(templates.value).toEqual(templatesResponse);
  });
});
