import type { BulkImportConfigDto, BulkImportRunDto } from "@open-dpp/dto";
import { computed, ref } from "vue";
import type { useBulkImportConfigDetails } from "./bulk-import-config-details.ts";
import type { useBulkImportConfigRepo } from "./bulk-import-config.repo.ts";
import type { useBulkImportFileUpload } from "./bulk-import-file-upload.ts";
import type { useBulkImportMapping } from "./bulk-import-mapping.ts";
import type { useBulkImportRunRepo } from "./bulk-import-run.repo.ts";

export interface UseBulkImportWizardDeps {
  fileUpload: ReturnType<typeof useBulkImportFileUpload>;
  mapping: ReturnType<typeof useBulkImportMapping>;
  configDetails: ReturnType<typeof useBulkImportConfigDetails>;
  configRepo: ReturnType<typeof useBulkImportConfigRepo>;
  runRepo: ReturnType<typeof useBulkImportRunRepo>;
}

export function useBulkImportWizard(deps: UseBulkImportWizardDeps) {
  const { fileUpload, mapping, configDetails, configRepo, runRepo } = deps;

  const visible = ref(false);
  const submitting = ref(false);
  const currentStep = ref<number>(1);

  const existingConfig = ref<BulkImportConfigDto | null>(null);
  const isNewConfig = computed(() => existingConfig.value === null);

  const canGoToMapping = computed(
    () => fileUpload.parsedRows.value.length > 0 && !fileUpload.fileError.value,
  );
  const canGoToDetails = computed(
    () => mapping.selectedTemplateId.value !== null && mapping.mappings.value.length > 0,
  );
  const canSubmitNewConfig = computed(
    () =>
      configDetails.configName.value.trim().length > 0 &&
      configDetails.idField.value !== null &&
      canGoToDetails.value,
  );
  const canSubmitExistingConfig = computed(
    () => fileUpload.selectedFile.value !== null && !fileUpload.fileError.value,
  );

  function resetState() {
    currentStep.value = 1;
    fileUpload.reset();
    mapping.reset();
    configDetails.reset();
  }

  function open(config?: BulkImportConfigDto) {
    resetState();
    existingConfig.value = config ?? null;
    visible.value = true;
  }

  function close() {
    visible.value = false;
  }

  function nextStep() {
    currentStep.value++;
  }

  function previousStep() {
    currentStep.value--;
  }

  async function submit(): Promise<BulkImportRunDto | undefined> {
    submitting.value = true;
    try {
      let configId: string;
      if (existingConfig.value) {
        configId = existingConfig.value.id;
      } else {
        if (!mapping.selectedTemplateId.value || !configDetails.idField.value) return undefined;
        const bySubmodel = new Map<string, { input: string; output: string }[]>();
        for (const row of mapping.mappings.value) {
          if (!bySubmodel.has(row.submodelIdShort)) {
            bySubmodel.set(row.submodelIdShort, []);
          }
          bySubmodel.get(row.submodelIdShort)?.push({ input: row.input, output: row.output });
        }
        const created = await configRepo.createConfig({
          templateId: mapping.selectedTemplateId.value,
          name: configDetails.configName.value.trim(),
          idField: configDetails.idField.value,
          submodelMappings: Array.from(bySubmodel.entries()).map(
            ([submodelIdShort, fieldMappings]) => ({
              submodelIdShort,
              fieldMappings,
            }),
          ),
          inputSample: fileUpload.parsedRows.value[0] ?? null,
        });
        if (!created) return undefined;
        configId = created.id;
      }

      const run = existingConfig.value && fileUpload.selectedFile.value
        ? await runRepo.triggerRunUpload(configId, fileUpload.selectedFile.value)
        : await runRepo.triggerRun(configId, fileUpload.parsedRows.value);
      if (run) close();
      return run;
    } finally {
      submitting.value = false;
    }
  }

  return {
    visible,
    submitting,
    currentStep,
    existingConfig,
    isNewConfig,
    canGoToMapping,
    canGoToDetails,
    canSubmitNewConfig,
    canSubmitExistingConfig,
    open,
    close,
    nextStep,
    previousStep,
    submit,
  };
}
