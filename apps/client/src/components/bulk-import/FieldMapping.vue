<script setup lang="ts">
import { useI18n } from "vue-i18n";
import { AasSubmodelElements, type SubmodelResponseDto } from "@open-dpp/dto";
import type { IdShortPathOption } from "../../lib/id-short-path-select.ts";

const { t } = useI18n();
const props = defineProps<{
  submodels: SubmodelResponseDto[];
  selectedJsonRow: Record<string, unknown> | null;
}>();

const excludedTargetModelTypes = [
  AasSubmodelElements.File,
  AasSubmodelElements.SubmodelElementList,
];

const emits = defineEmits<{
  (e: "onAddMapping"): void;
}>();

const selectedInputField = defineModel<string | null>("selectedInputField");
const selectedTargetField = defineModel<IdShortPathOption | null>("selectedTargetField");
</script>

<template>
  <div class="flex flex-col gap-2">
    <span>{{ t("integrations.bulkImport.mapFields") }}</span>
    <!-- Add Mapping Form -->
    <div class="grid grid-cols-11 gap-2">
      <label class="col-span-11 sm:col-span-5">
        <JsonPathSelect
          :row="props.selectedJsonRow"
          :label="t('integrations.bulkImport.inputField')"
          v-model="selectedInputField"
        />
      </label>
      <label class="col-span-11 sm:col-span-5">
        <IdShortPathSelect
          :submodels="props.submodels"
          :exclude-model-types="excludedTargetModelTypes"
          v-model="selectedTargetField"
          :label="t('integrations.bulkImport.targetField')"
        />
      </label>
      <Button
        class="col-span-1"
        icon="pi pi-plus"
        aria-label="Add Mapping"
        :disabled="!selectedInputField || !selectedTargetField"
        @click="emits('onAddMapping')"
      />
    </div>
  </div>
</template>
