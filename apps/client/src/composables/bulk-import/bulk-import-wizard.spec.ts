import type { BulkImportConfigDto, BulkImportRunDto } from "@open-dpp/dto";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { computed, ref } from "vue";
import { useBulkImportWizard, type UseBulkImportWizardDeps } from "./bulk-import-wizard.ts";
import type { MappingRow } from "./bulk-import-mapping.ts";

function buildDeps(): UseBulkImportWizardDeps & {
  createConfig: ReturnType<typeof vi.fn>;
  triggerRun: ReturnType<typeof vi.fn>;
} {
  const parsedRows = ref<Record<string, unknown>[]>([]);
  const fileError = ref<string | null>(null);
  const fileUploadReset = vi.fn(() => {
    parsedRows.value = [];
    fileError.value = null;
  });

  const selectedTemplateId = ref<string | null>(null);
  const mappings = ref<MappingRow[]>([]);
  const mappingReset = vi.fn(() => {
    selectedTemplateId.value = null;
    mappings.value = [];
  });

  const configName = ref("");
  const idField = ref<string | null>(null);
  const configDetailsReset = vi.fn(() => {
    configName.value = "";
    idField.value = null;
  });

  const createConfig = vi.fn();
  const triggerRun = vi.fn();

  return {
    fileUpload: {
      parsedRows,
      fileError,
      firstRow: computed(() => parsedRows.value[0] ?? null),
      onFileSelect: vi.fn(),
      reset: fileUploadReset,
    },
    mapping: {
      selectedTemplateId,
      submodels: ref([]),
      submodelsLoading: ref(false),
      submodelLabelById: computed(() => new Map<string, string>()),
      mappings,
      draftInput: ref(null),
      draftTarget: ref(null),
      onTemplateSelected: vi.fn(),
      addMapping: vi.fn(),
      removeMapping: vi.fn(),
      reset: mappingReset,
    },
    configDetails: {
      configName,
      idField,
      reset: configDetailsReset,
    },
    configRepo: {
      fetchConfigs: vi.fn(),
      createConfig,
      updateConfig: vi.fn(),
      deleteConfig: vi.fn(),
    },
    runRepo: {
      fetchRunsForConfig: vi.fn(),
      triggerRun,
      fetchRun: vi.fn(),
      fetchRunItems: vi.fn(),
    },
    createConfig,
    triggerRun,
  };
}

function buildRun(overrides: Partial<BulkImportRunDto> = {}): BulkImportRunDto {
  return {
    id: "run-1",
    bulkImportConfigId: "config-1",
    organizationId: "org-1",
    status: "pending",
    userId: "user-1",
    totalCount: 1,
    succeededCount: 0,
    failedCount: 0,
    startedAt: null,
    finishedAt: null,
    createdAt: new Date().toISOString(),
    ...overrides,
  };
}

function buildConfig(overrides: Partial<BulkImportConfigDto> = {}): BulkImportConfigDto {
  return {
    id: "config-1",
    organizationId: "org-1",
    templateId: "template-1",
    name: "ERP export",
    idField: "sku",
    submodelMappings: [],
    inputSample: null,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    ...overrides,
  };
}

describe("useBulkImportWizard", () => {
  let deps: ReturnType<typeof buildDeps>;

  beforeEach(() => {
    deps = buildDeps();
  });

  it("opens for a new config and resets all sub-composables", () => {
    const wizard = useBulkImportWizard(deps);
    deps.fileUpload.parsedRows.value = [{ sku: "a" }];

    wizard.open();

    expect(wizard.visible.value).toBe(true);
    expect(wizard.isNewConfig.value).toBe(true);
    expect(wizard.currentStep.value).toBe(1);
    expect(deps.fileUpload.reset).toHaveBeenCalled();
    expect(deps.mapping.reset).toHaveBeenCalled();
    expect(deps.configDetails.reset).toHaveBeenCalled();
  });

  it("opens for an existing config", () => {
    const wizard = useBulkImportWizard(deps);
    const config = buildConfig();

    wizard.open(config);

    expect(wizard.isNewConfig.value).toBe(false);
    expect(wizard.existingConfig.value).toEqual(config);
  });

  it("closes the dialog", () => {
    const wizard = useBulkImportWizard(deps);
    wizard.open();

    wizard.close();

    expect(wizard.visible.value).toBe(false);
  });

  it("moves between steps", () => {
    const wizard = useBulkImportWizard(deps);

    wizard.nextStep();
    expect(wizard.currentStep.value).toBe(2);

    wizard.previousStep();
    expect(wizard.currentStep.value).toBe(1);
  });

  it("gates step navigation and submission for a new config", () => {
    const wizard = useBulkImportWizard(deps);

    expect(wizard.canGoToMapping.value).toBe(false);
    deps.fileUpload.parsedRows.value = [{ sku: "a" }];
    expect(wizard.canGoToMapping.value).toBe(true);

    deps.fileUpload.fileError.value = "bad file";
    expect(wizard.canGoToMapping.value).toBe(false);
    deps.fileUpload.fileError.value = null;

    expect(wizard.canGoToDetails.value).toBe(false);
    deps.mapping.selectedTemplateId.value = "template-1";
    deps.mapping.mappings.value = [{ input: "sku", submodelIdShort: "TechnicalData", output: "sku" }];
    expect(wizard.canGoToDetails.value).toBe(true);

    expect(wizard.canSubmitNewConfig.value).toBe(false);
    deps.configDetails.configName.value = "ERP export";
    deps.configDetails.idField.value = "sku";
    expect(wizard.canSubmitNewConfig.value).toBe(true);
  });

  it("gates submission for an existing config on the parsed rows only", () => {
    const wizard = useBulkImportWizard(deps);

    expect(wizard.canSubmitExistingConfig.value).toBe(false);
    deps.fileUpload.parsedRows.value = [{ sku: "a" }];
    expect(wizard.canSubmitExistingConfig.value).toBe(true);

    deps.fileUpload.fileError.value = "bad file";
    expect(wizard.canSubmitExistingConfig.value).toBe(false);
  });

  it("submits a new config: creates it grouped by submodel, then triggers a run and closes", async () => {
    const wizard = useBulkImportWizard(deps);
    wizard.open();
    deps.mapping.selectedTemplateId.value = "template-1";
    deps.mapping.mappings.value = [
      { input: "sku", submodelIdShort: "TechnicalData", output: "properties.sku" },
      { input: "name", submodelIdShort: "TechnicalData", output: "properties.name" },
      { input: "weight", submodelIdShort: "Physical", output: "properties.weight" },
    ];
    deps.configDetails.configName.value = "  ERP export  ";
    deps.configDetails.idField.value = "sku";
    deps.fileUpload.parsedRows.value = [{ sku: "a" }, { sku: "b" }];
    const created = buildConfig({ id: "config-9" });
    deps.createConfig.mockResolvedValue(created);
    const run = buildRun({ id: "run-9" });
    deps.triggerRun.mockResolvedValue(run);

    const result = await wizard.submit();

    expect(deps.createConfig).toHaveBeenCalledWith({
      templateId: "template-1",
      name: "ERP export",
      idField: "sku",
      submodelMappings: [
        {
          submodelIdShort: "TechnicalData",
          fieldMappings: [
            { input: "sku", output: "properties.sku" },
            { input: "name", output: "properties.name" },
          ],
        },
        {
          submodelIdShort: "Physical",
          fieldMappings: [{ input: "weight", output: "properties.weight" }],
        },
      ],
      inputSample: { sku: "a" },
    });
    expect(deps.triggerRun).toHaveBeenCalledWith("config-9", [{ sku: "a" }, { sku: "b" }]);
    expect(result).toEqual(run);
    expect(wizard.visible.value).toBe(false);
  });

  it("does not trigger a run when creating the config fails", async () => {
    const wizard = useBulkImportWizard(deps);
    deps.mapping.selectedTemplateId.value = "template-1";
    deps.configDetails.idField.value = "sku";
    deps.createConfig.mockResolvedValue(undefined);

    const result = await wizard.submit();

    expect(deps.triggerRun).not.toHaveBeenCalled();
    expect(result).toBeUndefined();
  });

  it("submits for an existing config without creating a new one", async () => {
    const wizard = useBulkImportWizard(deps);
    const config = buildConfig({ id: "config-1" });
    wizard.open(config);
    deps.fileUpload.parsedRows.value = [{ sku: "a" }];
    const run = buildRun();
    deps.triggerRun.mockResolvedValue(run);

    const result = await wizard.submit();

    expect(deps.createConfig).not.toHaveBeenCalled();
    expect(deps.triggerRun).toHaveBeenCalledWith("config-1", [{ sku: "a" }]);
    expect(result).toEqual(run);
  });

  it("stays open and returns undefined when triggering the run fails", async () => {
    const wizard = useBulkImportWizard(deps);
    wizard.open(buildConfig());
    deps.fileUpload.parsedRows.value = [{ sku: "a" }];
    deps.triggerRun.mockResolvedValue(undefined);

    const result = await wizard.submit();

    expect(result).toBeUndefined();
    expect(wizard.visible.value).toBe(true);
  });

  it("tracks submitting state across the whole submit call", async () => {
    const wizard = useBulkImportWizard(deps);
    wizard.open(buildConfig());
    deps.fileUpload.parsedRows.value = [{ sku: "a" }];
    let resolveTrigger: (run: BulkImportRunDto) => void = () => {};
    deps.triggerRun.mockReturnValue(
      new Promise<BulkImportRunDto>((resolve) => {
        resolveTrigger = resolve;
      }),
    );

    const submitPromise = wizard.submit();
    expect(wizard.submitting.value).toBe(true);
    resolveTrigger(buildRun());
    await submitPromise;

    expect(wizard.submitting.value).toBe(false);
  });
});
