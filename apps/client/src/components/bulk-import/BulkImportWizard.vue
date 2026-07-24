<script lang="ts" setup>
import type { FileUploadSelectEvent } from "primevue";
import type { BulkImportConfigDto, SubmodelResponseDto } from "@open-dpp/dto";
import { AasSubmodelElements } from "@open-dpp/dto";
import { computed, ref } from "vue";
import { useI18n } from "vue-i18n";
import apiClient from "../../lib/api-client.ts";
import { useBulkImportStore } from "../../stores/bulk-import.ts";
import { useErrorHandlingStore } from "../../stores/error.handling.ts";
import IdShortPathSelect from "../aas/IdShortPathSelect.vue";
import JsonPathSelect from "../json/JsonPathSelect.vue";
import TemplateSelect from "../template/TemplateSelect.vue";
import type { IdShortPathOption } from "../../lib/id-short-path-select.ts";

interface MappingRow {
  input: string;
  submodelIdShort: string;
  output: string;
}

// File properties can't be populated from a bulk-import row, and SubmodelElementList entries
// aren't addressable by a stable idShort, so both are excluded as mapping targets.
const excludedTargetModelTypes = [
  AasSubmodelElements.File,
  AasSubmodelElements.SubmodelElementList,
];

const emit = defineEmits<{ (e: "run-triggered", runId: string): void }>();

const { t } = useI18n();
const store = useBulkImportStore();
const errorHandlingStore = useErrorHandlingStore();

const visible = ref(false);
const submitting = ref(false);
const step = ref(1);

const existingConfig = ref<BulkImportConfigDto | null>(null);
const isNewConfig = computed(() => existingConfig.value === null);

const parsedRows = ref<Record<string, unknown>[]>([]);
const fileError = ref<string | null>(null);

const selectedTemplateId = ref<string | null>(null);
const submodels = ref<SubmodelResponseDto[]>([]);
const submodelsLoading = ref(false);

const submodelLabelById = computed(() => {
  const map = new Map<string, string>();
  for (const submodel of submodels.value) {
    map.set(submodel.id, submodel.idShort);
  }
  return map;
});

const firstRow = computed<Record<string, unknown> | null>(() => parsedRows.value[0] ?? null);

const mappings = ref<MappingRow[]>([]);
const draftInput = ref<string | null>(null);
const draftTarget = ref<IdShortPathOption | null>(null);

const idField = ref<string | null>(null);
const configName = ref("");

function resetState() {
  step.value = 1;
  parsedRows.value = [];
  fileError.value = null;
  selectedTemplateId.value = null;
  submodels.value = [];
  mappings.value = [];
  draftInput.value = null;
  draftTarget.value = null;
  idField.value = null;
  configName.value = "";
}

function open(config?: BulkImportConfigDto) {
  resetState();
  existingConfig.value = config ?? null;
  visible.value = true;
}

function close() {
  visible.value = false;
}

defineExpose({ open });

async function onTemplateSelected() {
  submodels.value = [];
  mappings.value = [];
  if (!selectedTemplateId.value) return;
  submodelsLoading.value = true;
  try {
    const response = await apiClient.dpp.templates.aas.getSubmodels(selectedTemplateId.value, {
      limit: 100,
    });
    submodels.value = response.data.result;
  } catch (error) {
    errorHandlingStore.logErrorWithNotification(
      t("integrations.bulkImport.errorLoadSubmodels"),
      error,
    );
  } finally {
    submodelsLoading.value = false;
  }
}

async function onFileSelect(event: FileUploadSelectEvent) {
  fileError.value = null;
  const file = event.files?.[0] as File | undefined;
  if (!file) return;
  try {
    const json: unknown = JSON.parse(await file.text());
    if (
      !Array.isArray(json) ||
      json.length === 0 ||
      !json.every((row) => typeof row === "object" && row !== null && !Array.isArray(row))
    ) {
      fileError.value = t("integrations.bulkImport.invalidFile");
      parsedRows.value = [];
      return;
    }
    parsedRows.value = json as Record<string, unknown>[];
  } catch {
    fileError.value = t("integrations.bulkImport.invalidFile");
    parsedRows.value = [];
  }
}

function addMapping() {
  if (!draftInput.value || !draftTarget.value) return;
  const submodelIdShort =
    submodelLabelById.value.get(draftTarget.value.submodelIdShort) ??
    draftTarget.value.submodelIdShort;
  mappings.value.push({
    input: draftInput.value,
    submodelIdShort,
    output: draftTarget.value.output,
  });
  draftInput.value = null;
  draftTarget.value = null;
}

function removeMapping(index: number) {
  mappings.value.splice(index, 1);
}

const canGoToMapping = computed(() => parsedRows.value.length > 0 && !fileError.value);
const canGoToDetails = computed(
  () => selectedTemplateId.value !== null && mappings.value.length > 0,
);
const canSubmitNewConfig = computed(
  () => configName.value.trim().length > 0 && idField.value !== null && canGoToDetails.value,
);
const canSubmitExistingConfig = computed(() => parsedRows.value.length > 0 && !fileError.value);

function nextStep() {
  step.value++;
}

function previousStep() {
  step.value--;
}

async function submit() {
  submitting.value = true;
  try {
    let configId: string;
    if (existingConfig.value) {
      configId = existingConfig.value.id;
    } else {
      if (!selectedTemplateId.value || !idField.value) return;
      const bySubmodel = new Map<string, { input: string; output: string }[]>();
      for (const mapping of mappings.value) {
        if (!bySubmodel.has(mapping.submodelIdShort)) {
          bySubmodel.set(mapping.submodelIdShort, []);
        }
        bySubmodel
          .get(mapping.submodelIdShort)
          ?.push({ input: mapping.input, output: mapping.output });
      }
      const created = await store.createConfig({
        templateId: selectedTemplateId.value,
        name: configName.value.trim(),
        idField: idField.value,
        submodelMappings: Array.from(bySubmodel.entries()).map(
          ([submodelIdShort, fieldMappings]) => ({
            submodelIdShort,
            fieldMappings,
          }),
        ),
        inputSample: parsedRows.value[0] ?? null,
      });
      if (!created) return;
      configId = created.id;
    }

    const run = await store.triggerRun(configId, parsedRows.value);
    if (run) {
      close();
      emit("run-triggered", run.id);
    }
  } finally {
    submitting.value = false;
  }
}
</script>

<template>
  <Dialog
    v-model:visible="visible"
    modal
    :header="
      isNewConfig ? t('integrations.bulkImport.newConfig') : t('integrations.bulkImport.uploadFile')
    "
    :style="{ width: '48rem' }"
    @hide="close"
  >
    <div v-if="!isNewConfig" class="flex flex-col gap-4">
      <FileUpload
        mode="basic"
        :auto="true"
        accept=".json"
        :choose-label="t('integrations.bulkImport.chooseFile')"
        custom-upload
        @select="onFileSelect"
      />
      <span v-if="fileError" class="text-red-500">{{ fileError }}</span>
      <span v-else-if="parsedRows.length > 0" class="text-surface-500 dark:text-surface-400">
        {{ t("integrations.bulkImport.rowsParsed", { count: parsedRows.length }) }}
      </span>
    </div>

    <div v-else class="flex flex-col gap-4">
      <div v-if="step === 1" class="flex flex-col gap-4">
        <FileUpload
          mode="basic"
          :auto="true"
          accept=".json"
          :choose-label="t('integrations.bulkImport.chooseFile')"
          custom-upload
          @select="onFileSelect"
        />
        <span v-if="fileError" class="text-red-500">{{ fileError }}</span>
        <span v-else-if="parsedRows.length > 0" class="text-surface-500 dark:text-surface-400">
          {{ t("integrations.bulkImport.rowsParsed", { count: parsedRows.length }) }}
        </span>

        <label class="flex flex-col gap-2">
          <span>{{ t("integrations.bulkImport.selectTemplate") }}</span>
          <TemplateSelect v-model="selectedTemplateId" @update:model-value="onTemplateSelected" />
        </label>
      </div>

      <div v-else-if="step === 2" class="flex flex-col gap-4">
        <div class="flex items-end gap-2">
          <label class="flex flex-1 flex-col gap-2">
            <span>{{ t("integrations.bulkImport.inputField") }}</span>
            <JsonPathSelect
              :row="firstRow"
              v-model="draftInput"
              :placeholder="t('integrations.bulkImport.inputField')"
            />
          </label>
          <label class="flex flex-1 flex-col gap-2">
            <span>{{ t("integrations.bulkImport.targetField") }}</span>
            <IdShortPathSelect
              :submodels="submodels"
              :exclude-model-types="excludedTargetModelTypes"
              v-model="draftTarget"
              :placeholder="t('integrations.bulkImport.targetField')"
            />
          </label>
          <Button icon="pi pi-plus" :disabled="!draftInput || !draftTarget" @click="addMapping" />
        </div>

        <DataTable :value="mappings">
          <Column field="input" :header="t('integrations.bulkImport.inputField')" />
          <Column field="submodelIdShort" :header="t('integrations.bulkImport.template')" />
          <Column field="output" :header="t('integrations.bulkImport.targetField')" />
          <Column>
            <template #body="{ index }">
              <Button
                icon="pi pi-trash"
                severity="danger"
                text
                :aria-label="t('integrations.bulkImport.delete')"
                @click="removeMapping(index)"
              />
            </template>
          </Column>
        </DataTable>
      </div>

      <div v-else-if="step === 3" class="flex flex-col gap-4">
        <label class="flex flex-col gap-2">
          <span>{{ t("integrations.bulkImport.configName") }}</span>
          <InputText v-model="configName" />
        </label>
        <label class="flex flex-col gap-2">
          <span>{{ t("integrations.bulkImport.idFieldLabel") }}</span>
          <JsonPathSelect
            :row="firstRow"
            v-model="idField"
            :placeholder="t('integrations.bulkImport.idFieldLabel')"
          />
          <span class="text-surface-500 dark:text-surface-400 text-sm">{{
            t("integrations.bulkImport.idFieldHelp")
          }}</span>
        </label>
      </div>
    </div>

    <div class="mt-6 flex justify-end gap-2">
      <Button type="button" severity="secondary" @click="close">
        {{ t("common.cancel") }}
      </Button>
      <template v-if="isNewConfig">
        <Button v-if="step > 1" severity="secondary" @click="previousStep">
          {{ t("integrations.bulkImport.previous") }}
        </Button>
        <Button v-if="step === 1" :disabled="!canGoToMapping" @click="nextStep">
          {{ t("integrations.bulkImport.next") }}
        </Button>
        <Button v-if="step === 2" :disabled="!canGoToDetails" @click="nextStep">
          {{ t("integrations.bulkImport.next") }}
        </Button>
        <Button v-if="step === 3" :disabled="!canSubmitNewConfig || submitting" @click="submit">
          {{ t("integrations.bulkImport.createAndRun") }}
        </Button>
      </template>
      <Button v-else :disabled="!canSubmitExistingConfig || submitting" @click="submit">
        {{ t("integrations.bulkImport.runNow") }}
      </Button>
    </div>
  </Dialog>
</template>
