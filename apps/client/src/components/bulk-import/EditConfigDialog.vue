<script lang="ts" setup>
import { computed, ref } from "vue";
import { useI18n } from "vue-i18n";
import type { BulkImportConfigDto } from "@open-dpp/dto";
import { AasSubmodelElements } from "@open-dpp/dto";
import { useBulkImportConfigDetails } from "../../composables/bulk-import-config-details.ts";
import { useBulkImportConfigRepo } from "../../composables/bulk-import-config-repo.ts";
import { useBulkImportMapping } from "../../composables/bulk-import-mapping.ts";
import IdShortPathSelect from "../aas/IdShortPathSelect.vue";
import JsonPathSelect from "../json/JsonPathSelect.vue";

const emit = defineEmits<{ (e: "saved", config: BulkImportConfigDto): void }>();

const { t } = useI18n();
const configRepo = useBulkImportConfigRepo();

const configDetails = useBulkImportConfigDetails();
const mapping = useBulkImportMapping();

const visible = ref(false);
const loading = ref(false);
const currentConfig = ref<BulkImportConfigDto | null>(null);

// Exclude same model types as MappingStep
const excludedTargetModelTypes = [
  AasSubmodelElements.File,
  AasSubmodelElements.SubmodelElementList,
];

const canSave = computed(() => {
  return (
    !loading.value &&
    configDetails.configName.value.trim().length > 0 &&
    configDetails.idField.value !== null &&
    configDetails.idField.value.trim().length > 0 &&
    mapping.mappings.value.length > 0
  );
});

function close() {
  visible.value = false;
  currentConfig.value = null;
}

function open(config: BulkImportConfigDto) {
  visible.value = true;
  currentConfig.value = config;
  void initializeForm(config);
}

async function initializeForm(config: BulkImportConfigDto) {
  loading.value = true;
  try {
    // Set config details
    configDetails.configName.value = config.name;
    configDetails.idField.value = config.idField;

    // Initialize mapping
    mapping.selectedTemplateId.value = config.templateId;
    await mapping.onTemplateSelected();

    // Transform submodelMappings to mappings format
    mapping.mappings.value = config.submodelMappings.flatMap((sm) =>
      sm.fieldMappings.map((fm) => ({
        input: fm.input,
        submodelIdShort: sm.submodelIdShort,
        output: fm.output,
      })),
    );

    // Reset draft fields
    mapping.draftInput.value = null;
    mapping.draftTarget.value = null;
  } finally {
    loading.value = false;
  }
}

async function save() {
  if (!currentConfig.value || !configDetails.idField.value) return;

  loading.value = true;
  try {
    // Transform mappings back to submodelMappings format
    const submodelMappingsMap = new Map<string, { input: string; output: string }[]>();
    for (const m of mapping.mappings.value) {
      if (!submodelMappingsMap.has(m.submodelIdShort)) {
        submodelMappingsMap.set(m.submodelIdShort, []);
      }
      submodelMappingsMap.get(m.submodelIdShort)!.push({
        input: m.input,
        output: m.output,
      });
    }

    const submodelMappings = Array.from(submodelMappingsMap.entries()).map(
      ([submodelIdShort, fieldMappings]) => ({
        submodelIdShort,
        fieldMappings,
      }),
    );

    const updatedConfig = await configRepo.updateConfig(currentConfig.value.id, {
      name: configDetails.configName.value.trim(),
      idField: configDetails.idField.value.trim(),
      submodelMappings,
    });

    if (updatedConfig) {
      emit("saved", updatedConfig);
      close();
    }
  } finally {
    loading.value = false;
  }
}

defineExpose({ open });
</script>

<template>
  <Dialog
    v-model:visible="visible"
    modal
    :header="t('integrations.bulkImport.editConfig')"
    :style="{ width: '48rem' }"
    @hide="close"
  >
    <div class="flex flex-col gap-6">
      <!-- Configuration Name -->
      <label class="flex flex-col gap-2">
        <span>{{ t("integrations.bulkImport.configName") }}</span>
        <InputText v-model="configDetails.configName.value" />
      </label>

      <!-- ID Field -->
      <label class="flex flex-col gap-2">
        <span>{{ t("integrations.bulkImport.idFieldLabel") }}</span>
        <JsonPathSelect
          :row="currentConfig?.inputSample ?? {}"
          v-model="configDetails.idField.value"
          :placeholder="t('integrations.bulkImport.idFieldLabel')"
        />
        <span class="text-surface-500 dark:text-surface-400 text-sm">{{
          t("integrations.bulkImport.idFieldHelp")
        }}</span>
      </label>

      <!-- Field Mappings -->
      <div class="flex flex-col gap-2">
        <span>{{ t("integrations.bulkImport.mapFields") }}</span>

        <!-- Add Mapping Form -->
        <div class="flex items-end gap-2">
          <label class="flex flex-1 flex-col gap-2">
            <span>{{ t("integrations.bulkImport.inputField") }}</span>
            <JsonPathSelect
              :row="currentConfig?.inputSample ?? {}"
              v-model="mapping.draftInput.value"
              :placeholder="t('integrations.bulkImport.inputField')"
            />
          </label>
          <label class="flex flex-1 flex-col gap-2">
            <span>{{ t("integrations.bulkImport.targetField") }}</span>
            <IdShortPathSelect
              :submodels="mapping.submodels.value"
              :exclude-model-types="excludedTargetModelTypes"
              v-model="mapping.draftTarget.value"
              :placeholder="t('integrations.bulkImport.targetField')"
            />
          </label>
          <Button
            icon="pi pi-plus"
            :disabled="!mapping.draftInput.value || !mapping.draftTarget.value"
            @click="mapping.addMapping"
          />
        </div>

        <!-- Mappings Table -->
        <DataTable :value="mapping.mappings.value" data-key="index">
          <Column field="input" :header="t('integrations.bulkImport.inputField')" />
          <Column field="submodelIdShort" :header="t('integrations.bulkImport.template')" />
          <Column field="output" :header="t('integrations.bulkImport.targetField')" />
          <Column>
            <template #body="{ index }">
              <Button
                icon="pi pi-trash"
                severity="danger"
                text
                :aria-label="t('common.delete')"
                @click="mapping.removeMapping(index)"
              />
            </template>
          </Column>
        </DataTable>
      </div>
    </div>

    <div class="mt-6 flex justify-end gap-2">
      <Button type="button" severity="secondary" @click="close">
        {{ t("common.cancel") }}
      </Button>
      <Button type="button" :disabled="!canSave" :loading="loading" @click="save">
        {{ t("common.save") }}
      </Button>
    </div>
  </Dialog>
</template>
