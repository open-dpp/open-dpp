import type { PagingParamsDto, TemplateDto } from "@open-dpp/dto";
import { templatesPlainFactory } from "@open-dpp/testing";
import { createPinia, setActivePinia } from "pinia";
import { expect, it, vi } from "vitest";
import { HTTPCode } from "./http-codes.ts";
import { useTemplatesStore } from "./templates.ts";

const mocks = vi.hoisted(() => {
  return {
    createTemplate: vi.fn(),
    fetchTemplates: vi.fn(),
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

describe("templates", () => {
  beforeEach(() => {
    setActivePinia(createPinia());
  });

  it("should create template", async () => {
    const templatesStore = useTemplatesStore();
    const t1 = templatesPlainFactory.build();

    mocks.createTemplate.mockResolvedValueOnce({ data: t1, status: HTTPCode.CREATED });
    const templates = { paging_metadata: { cursor: t1.id }, result: [t1] };
    mocks.fetchTemplates.mockResolvedValueOnce({ data: templates });

    await templatesStore.createTemplate();
    expect(mocks.createTemplate).toHaveBeenCalledWith();
    expect(mocks.fetchTemplates).toHaveBeenCalledWith({ limit: 10, cursor: undefined });

    expect(templatesStore.templates).toEqual(templates);
  });

  it("should fetch templates", async () => {
    const templatesStore = useTemplatesStore();
    const t1 = templatesPlainFactory.build();
    const templates = { paging_metadata: { cursor: t1.id }, result: [t1] };
    mocks.fetchTemplates.mockResolvedValueOnce({ data: templates });
    await templatesStore.nextTemplates();
    expect(mocks.fetchTemplates).toHaveBeenCalledWith({ limit: 10, cursor: undefined });
    expect(templatesStore.templates).toEqual(templates);
  });

  it("should fetch next or previous templates", async () => {
    const templatesStore = useTemplatesStore();
    const templates: TemplateDto[] = [...Array.from({ length: 20 }).keys()].map(
      key => templatesPlainFactory.build({ id: key.toFixed() }),
    );
    const firstBlock = { paging_metadata: { cursor: templates[9]?.id }, result: templates.slice(0, 10) };
    const secondBlock = { paging_metadata: { cursor: templates[19]?.id }, result: templates.slice(10, 20) };

    mocks.fetchTemplates.mockImplementation(({ cursor }: PagingParamsDto) => cursor === undefined ? { data: firstBlock } : { data: secondBlock });
    await templatesStore.nextTemplates();
    await templatesStore.nextTemplates();
    expect(mocks.fetchTemplates).toHaveBeenCalledWith({ limit: 10, cursor: templates[9]?.id });
    expect(templatesStore.templates).toEqual(secondBlock);
    await templatesStore.previousTemplates();
    expect(mocks.fetchTemplates).toHaveBeenCalledWith({ limit: 10, cursor: undefined });
    expect(templatesStore.templates).toEqual(firstBlock);
  });
});
