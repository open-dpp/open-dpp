import type { SubmodelResponseDto } from "@open-dpp/dto";
import { createPinia, setActivePinia } from "pinia";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { useBulkImportMapping } from "./bulk-import-mapping.ts";

const mocks = vi.hoisted(() => {
  return {
    getSubmodels: vi.fn(),
  };
});

vi.mock("../lib/api-client", () => ({
  default: {
    dpp: {
      templates: {
        aas: {
          getSubmodels: mocks.getSubmodels,
        },
      },
    },
  },
}));

vi.mock("vue-i18n", () => ({
  useI18n: () => ({
    t: (key: string) => key,
  }),
}));

function buildSubmodel(overrides: Partial<SubmodelResponseDto> = {}): SubmodelResponseDto {
  return {
    id: "submodel-1",
    idShort: "TechnicalData",
    submodelElements: [],
    ...overrides,
  } as SubmodelResponseDto;
}

describe("useBulkImportMapping", () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    vi.clearAllMocks();
  });

  it("fetches submodels for the selected template", async () => {
    const { selectedTemplateId, onTemplateSelected, submodels, submodelsLoading } =
      useBulkImportMapping();
    const submodel = buildSubmodel();
    mocks.getSubmodels.mockResolvedValue({ data: { result: [submodel] } });

    selectedTemplateId.value = "template-1";
    const promise = onTemplateSelected();
    expect(submodelsLoading.value).toBe(true);
    await promise;

    expect(mocks.getSubmodels).toHaveBeenCalledWith("template-1", { limit: 100 });
    expect(submodels.value).toEqual([submodel]);
    expect(submodelsLoading.value).toBe(false);
  });

  it("clears submodels and mappings when no template is selected", async () => {
    const { selectedTemplateId, onTemplateSelected, submodels, mappings } = useBulkImportMapping();
    mappings.value = [{ input: "sku", submodelIdShort: "TechnicalData", output: "sku" }];
    selectedTemplateId.value = null;

    await onTemplateSelected();

    expect(mocks.getSubmodels).not.toHaveBeenCalled();
    expect(submodels.value).toEqual([]);
    expect(mappings.value).toEqual([]);
  });

  it("clears existing mappings when switching templates", async () => {
    const { selectedTemplateId, onTemplateSelected, mappings } = useBulkImportMapping();
    mockGetSubmodelsResolved([]);
    mappings.value = [{ input: "sku", submodelIdShort: "TechnicalData", output: "sku" }];

    selectedTemplateId.value = "template-2";
    await onTemplateSelected();

    expect(mappings.value).toEqual([]);
  });

  function mockGetSubmodelsResolved(result: SubmodelResponseDto[]) {
    mocks.getSubmodels.mockResolvedValue({ data: { result } });
  }

  it("adds a mapping resolving the submodel id to its idShort", () => {
    const { submodels, draftInput, draftTarget, addMapping, mappings } = useBulkImportMapping();
    submodels.value = [buildSubmodel({ id: "submodel-1", idShort: "TechnicalData" })];
    draftInput.value = "sku";
    draftTarget.value = { submodelIdShort: "submodel-1", output: "properties.sku" };

    addMapping();

    expect(mappings.value).toEqual([
      { input: "sku", submodelIdShort: "TechnicalData", output: "properties.sku" },
    ]);
    expect(draftInput.value).toBeNull();
    expect(draftTarget.value).toBeNull();
  });

  it("falls back to the raw target id when it can't resolve a submodel label", () => {
    const { draftInput, draftTarget, addMapping, mappings } = useBulkImportMapping();
    draftInput.value = "sku";
    draftTarget.value = { submodelIdShort: "unknown-submodel", output: "properties.sku" };

    addMapping();

    expect(mappings.value).toEqual([
      { input: "sku", submodelIdShort: "unknown-submodel", output: "properties.sku" },
    ]);
  });

  it("does not add a mapping when input or target is missing", () => {
    const { draftInput, draftTarget, addMapping, mappings } = useBulkImportMapping();
    draftInput.value = "sku";
    draftTarget.value = null;

    addMapping();

    expect(mappings.value).toEqual([]);
  });

  it("removes a mapping by index", () => {
    const { mappings, removeMapping } = useBulkImportMapping();
    mappings.value = [
      { input: "a", submodelIdShort: "sm1", output: "a" },
      { input: "b", submodelIdShort: "sm1", output: "b" },
    ];

    removeMapping(0);

    expect(mappings.value).toEqual([{ input: "b", submodelIdShort: "sm1", output: "b" }]);
  });

  it("resets all state", () => {
    const {
      selectedTemplateId,
      submodels,
      mappings,
      draftInput,
      draftTarget,
      reset,
    } = useBulkImportMapping();
    selectedTemplateId.value = "template-1";
    submodels.value = [buildSubmodel()];
    mappings.value = [{ input: "a", submodelIdShort: "sm1", output: "a" }];
    draftInput.value = "a";
    draftTarget.value = { submodelIdShort: "sm1", output: "a" };

    reset();

    expect(selectedTemplateId.value).toBeNull();
    expect(submodels.value).toEqual([]);
    expect(mappings.value).toEqual([]);
    expect(draftInput.value).toBeNull();
    expect(draftTarget.value).toBeNull();
  });

  it("reports an error notification when fetching submodels fails", async () => {
    const errorHandlingModule = await import("../stores/error.handling.ts");
    const errorHandlingStore = errorHandlingModule.useErrorHandlingStore();
    const logSpy = vi.spyOn(errorHandlingStore, "logErrorWithNotification");
    mocks.getSubmodels.mockRejectedValue(new Error("boom"));
    const { selectedTemplateId, onTemplateSelected, submodelsLoading } = useBulkImportMapping();

    selectedTemplateId.value = "template-1";
    await onTemplateSelected();

    expect(logSpy).toHaveBeenCalledWith("integrations.bulkImport.errorLoadSubmodels", expect.any(Error));
    expect(submodelsLoading.value).toBe(false);
  });
});
