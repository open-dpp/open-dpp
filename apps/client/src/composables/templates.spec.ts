import type { LanguageTextDto, PagingParamsDto, TemplateDto } from "@open-dpp/dto";
import {

  Populates,

} from "@open-dpp/dto";
import { templatesPlainFactory } from "@open-dpp/testing";
import { createPinia, setActivePinia } from "pinia";
import { expect, it, vi } from "vitest";
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

describe("templates", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    setActivePinia(createPinia());
  });

  const changeQueryParams = vi.fn();

  it("should create template", async () => {
    const templatesStore = useTemplates({ changeQueryParams });
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

  it("should init templates", async () => {
    const { templates, init } = useTemplates({ changeQueryParams });
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
    const { templates, init, nextPage, previousPage } = useTemplates({ changeQueryParams });
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
