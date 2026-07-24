<script lang="ts" setup>
import type { FileUploadSelectEvent } from "primevue";
import type { BulkImportConfigDto, SubmodelResponseDto, TemplateDto } from "@open-dpp/dto";
import { DigitalProductDocumentStatusDto } from "@open-dpp/dto";
import { computed, ref } from "vue";
import { useI18n } from "vue-i18n";
import { useAasUtils } from "../../composables/aas-utils.ts";
import { useBulkImportMappingTree } from "../../composables/bulk-import-mapping-tree.ts";
import apiClient from "../../lib/api-client.ts";
import { useBulkImportStore } from "../../stores/bulk-import.ts";
import { useErrorHandlingStore } from "../../stores/error.handling.ts";

interface MappingRow {
  input: string;
  submodelIdShort: string;
  output: string;
}

interface TargetOption {
  submodelId: string;
  output: string;
}

interface TargetOptionGroup {
  label: string;
  items: TargetOption[];
}

const emit = defineEmits<{ (e: "run-triggered", runId: string): void }>();

const { t } = useI18n();
const store = useBulkImportStore();
const errorHandlingStore = useErrorHandlingStore();
const { parseDisplayNameFromEnvironment } = useAasUtils();

const visible = ref(false);
const submitting = ref(false);
const step = ref(1);

const existingConfig = ref<BulkImportConfigDto | null>(null);
const isNewConfig = computed(() => existingConfig.value === null);

const parsedRows = ref<Record<string, unknown>[]>([]);
const fileError = ref<string | null>(null);

const templateOptions = ref<{ id: string; label: string }[]>([]);
const templatesLoading = ref(false);
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

const { targets } = useBulkImportMappingTree(submodels);

const groupedTargetOptions = computed<TargetOptionGroup[]>(() => {
  const bySubmodel = new Map<string, TargetOptionGroup>();
  for (const target of targets.value) {
    const label = submodelLabelById.value.get(target.submodelId) ?? target.submodelId;
    if (!bySubmodel.has(target.submodelId)) {
      bySubmodel.set(target.submodelId, { label, items: [] });
    }
    bySubmodel.get(target.submodelId)?.items.push({
      submodelId: target.submodelId,
      output: target.idShortPath,
    });
  }
  return Array.from(bySubmodel.values());
});

function flattenInputPaths(row: Record<string, unknown>, prefix = ""): string[] {
  const paths: string[] = [];
  for (const [key, value] of Object.entries(row)) {
    const path = prefix ? `${prefix}.${key}` : key;
    if (value !== null && typeof value === "object" && !Array.isArray(value)) {
      paths.push(...flattenInputPaths(value as Record<string, unknown>, path));
    } else {
      paths.push(path);
    }
  }
  return paths;
}

const inputPathOptions = computed<string[]>(() => {
  const firstRow = parsedRows.value[0];
  return firstRow ? flattenInputPaths(firstRow) : [];
});

const mappings = ref<MappingRow[]>([]);
const draftInput = ref<string | null>(null);
const draftTarget = ref<TargetOption | null>(null);

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

async function open(config?: BulkImportConfigDto) {
  resetState();
  existingConfig.value = config ?? null;
  visible.value = true;
  if (isNewConfig.value) {
    await loadTemplateOptions();
  }
}

function close() {
  visible.value = false;
}

defineExpose({ open });

async function loadTemplateOptions() {
  templatesLoading.value = true;
  try {
    const response = await apiClient.dpp.templates.getAll({
      pagination: { limit: 100 },
      filter: { status: [DigitalProductDocumentStatusDto.Draft, DigitalProductDocumentStatusDto.Published] },
    });
    templateOptions.value = response.data.result
      .filter(
        (template: TemplateDto) =>
          template.lastStatusChange.currentStatus !== DigitalProductDocumentStatusDto.Archived,
      )
      .map((template: TemplateDto) => {
        const label = parseDisplayNameFromEnvironment(template.environment);
        return { id: template.id, label: label !== t("common.untitled") ? label : template.id };
      });
  } catch (error) {
    errorHandlingStore.logErrorWithNotification(t("integrations.bulkImport.errorLoadTemplates"), error);
  } finally {
    templatesLoading.value = false;
  }
}

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
    errorHandlingStore.logErrorWithNotification(t("integrations.bulkImport.errorLoadSubmodels"), error);
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
    submodelLabelById.value.get(draftTarget.value.submodelId) ?? draftTarget.value.submodelId;
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
const canGoToDetails = computed(() => selectedTemplateId.value !== null && mappings.value.length > 0);
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
        bySubmodel.get(mapping.submodelIdShort)?.push({ input: mapping.input, output: mapping.output });
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
    :header="isNewConfig ? t('integrations.bulkImport.newConfig') : t('integrations.bulkImport.uploadFile')"
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
          <Select
            v-model="selectedTemplateId"
            :options="templateOptions"
            option-value="id"
            option-label="label"
            :loading="templatesLoading"
            :placeholder="t('integrations.bulkImport.selectTemplate')"
            @update:model-value="onTemplateSelected"
          />
        </label>
      </div>

      <div v-else-if="step === 2" class="flex flex-col gap-4">
        <div class="flex items-end gap-2">
          <label class="flex flex-1 flex-col gap-2">
            <span>{{ t("integrations.bulkImport.inputField") }}</span>
            <Select
              v-model="draftInput"
              :options="inputPathOptions"
              :placeholder="t('integrations.bulkImport.inputField')"
            />
          </label>
          <label class="flex flex-1 flex-col gap-2">
            <span>{{ t("integrations.bulkImport.targetField") }}</span>
            <Select
              v-model="draftTarget"
              :options="groupedTargetOptions"
              option-group-label="label"
              option-group-children="items"
              option-label="output"
              :loading="submodelsLoading"
              :placeholder="t('integrations.bulkImport.targetField')"
            />
          </label>
          <Button
            icon="pi pi-plus"
            :disabled="!draftInput || !draftTarget"
            @click="addMapping"
          />
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
          <Select
            v-model="idField"
            :options="inputPathOptions"
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
        <Button
          v-if="step === 3"
          :disabled="!canSubmitNewConfig || submitting"
          @click="submit"
        >
          {{ t("integrations.bulkImport.createAndRun") }}
        </Button>
      </template>
      <Button v-else :disabled="!canSubmitExistingConfig || submitting" @click="submit">
        {{ t("integrations.bulkImport.runNow") }}
      </Button>
    </div>
  </Dialog>
</template>
