import type { LanguageTextDto, PagingParamsDto, TemplateDto } from "@open-dpp/dto";
import type { ConfirmationOptions } from "primevue/confirmationoptions";
import type { TemplateProps } from "./templates.ts";
import {

  Populates,

} from "@open-dpp/dto";
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

  function mountHarness(props: TemplateProps) {
    const Harness = defineComponent({
      name: "use-templates-harness",
      setup() {
        const api = useTemplates(props);
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

  const changeQueryParams = vi.fn();

  it("should create template", async () => {
    const templatesStore = mountHarness({ changeQueryParams });
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

  it("should delete template", async () => {
    const { deleteTemplate } = mountHarness({ changeQueryParams });

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

  it("should init templates", async () => {
    const { templates, init } = mountHarness({ changeQueryParams });
    const t1 = templatesPlainFactory.build();
    const templatesResponse = { paging_metadata: { cursor: t1.id }, result: [t1] };
    mocks.fetchTemplates.mockResolvedValueOnce({ data: templatesResponse });
    await init();
    expect(mocks.fetchTemplates).toHaveBeenCalledWith({ limit: 10, cursor: undefined, populate: [
      Populates.assetAdministrationShells,
    ] });
    expect(templates.value).toEqual(templatesResponse);
  });

  it("should fetch next or previous templates", async () => {
    const { templates, init, nextPage, previousPage } = mountHarness({ changeQueryParams });
    const templatesResponse: TemplateDto[] = [...Array.from({ length: 20 }).keys()].map(
      key => templatesPlainFactory.build({ id: key.toFixed() }),
    );
    const firstBlock = { paging_metadata: { cursor: templatesResponse[9]?.id }, result: templatesResponse.slice(0, 10) };
    const secondBlock = { paging_metadata: { cursor: templatesResponse[19]?.id }, result: templatesResponse.slice(10, 20) };

    mocks.fetchTemplates.mockImplementation(({ cursor }: PagingParamsDto) => cursor === undefined ? { data: firstBlock } : { data: secondBlock });
    await init();
    await nextPage();
    expect(mocks.fetchTemplates).toHaveBeenCalledWith({ limit: 10, cursor: templatesResponse[9]?.id, populate: [
      Populates.assetAdministrationShells,
    ] });
    expect(templates.value).toEqual(secondBlock);
    await previousPage();
    expect(mocks.fetchTemplates).toHaveBeenCalledWith({
      limit: 10,
      cursor: undefined,
      populate: [Populates.assetAdministrationShells],
    });
    expect(templates.value).toEqual(firstBlock);
  });
});
