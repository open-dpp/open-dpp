<script lang="ts" setup>
import {
  GS1_AI_TABLE,
  isGs1DataAttributeAi,
  isValidGs1DataAttributeValue,
  type Gs1AiTableEntry,
} from "@open-dpp/dto";
import { computed, ref, watch } from "vue";
import { useI18n } from "vue-i18n";
import { gs1AiDescriptionOrTitle, gs1AiOptionLabel } from "../../lib/gs1-ai-option-label";

const props = defineProps<{
  modelValue: Record<string, string>;
}>();

const emit = defineEmits<{
  "update:modelValue": [value: Record<string, string>];
  "update:valid": [valid: boolean];
}>();

const { t, locale } = useI18n();

const aiOptions = Object.values(GS1_AI_TABLE).filter((e) => e.type === "D");

function aiOptionLabel(entry: Gs1AiTableEntry): string {
  return gs1AiOptionLabel(entry, locale.value);
}

interface Row {
  ai: string;
  value: string;
}

function rowsFromModel(model: Record<string, string>): Row[] {
  return Object.entries(model).map(([ai, value]) => ({ ai, value }));
}

const rows = ref<Row[]>(rowsFromModel(props.modelValue));

watch(
  () => props.modelValue,
  (newModel) => {
    rows.value = rowsFromModel(newModel);
  },
);

function isRowEmpty(row: Row): boolean {
  return !row.ai && !row.value;
}

function isRowValid(row: Row): boolean {
  return (
    !!row.ai &&
    isGs1DataAttributeAi(row.ai) &&
    !!row.value &&
    isValidGs1DataAttributeValue(row.ai, row.value)
  );
}

function computeAiError(ai: string, value: string): string | null {
  if (!ai) return value ? t("gs1DataAttributes.aiRequired") : null;
  if (isGs1DataAttributeAi(ai)) return null;
  return t("gs1DataAttributes.keyAiBlocked", { ai });
}

function computeValueError(ai: string, value: string): string | null {
  if (!ai || !isGs1DataAttributeAi(ai)) return null;
  if (!value) return t("gs1DataAttributes.valueRequired");
  if (isValidGs1DataAttributeValue(ai, value)) return null;
  return t("gs1DataAttributes.invalidValue", { ai });
}

const aiErrors = computed<Array<string | null>>(() =>
  rows.value.map((row) => computeAiError(row.ai, row.value)),
);

const valueErrors = computed<Array<string | null>>(() =>
  rows.value.map((row) => computeValueError(row.ai, row.value)),
);

const isValid = computed(() => rows.value.every((row) => isRowEmpty(row) || isRowValid(row)));

watch(isValid, (valid) => emit("update:valid", valid), { immediate: true });

function tryEmit() {
  if (!isValid.value) return;

  const newMap: Record<string, string> = {};
  for (const row of rows.value) {
    if (isRowEmpty(row)) continue;
    newMap[row.ai] = row.value;
  }
  emit("update:modelValue", newMap);
}

function addRow() {
  rows.value = [...rows.value, { ai: "", value: "" }];
}

function updateAi(index: number, ai: string) {
  rows.value = rows.value.map((row, i) => (i === index ? { ...row, ai } : row));
  tryEmit();
}

function updateValue(index: number, value: string) {
  rows.value = rows.value.map((row, i) => (i === index ? { ...row, value } : row));
  tryEmit();
}

function removeRow(index: number) {
  rows.value = rows.value.filter((_, i) => i !== index);
  tryEmit();
}
</script>

<template>
  <div class="flex flex-col gap-2">
    <div v-for="(row, index) in rows" :key="index" class="flex flex-row items-start gap-2">
      <div class="flex w-72 flex-col gap-1">
        <Select
          :id="`gs1-data-attr-ai-${index}`"
          :model-value="row.ai"
          :data-testid="`gs1-data-attr-ai-${index}`"
          :options="aiOptions"
          option-value="ai"
          :option-label="aiOptionLabel"
          :invalid="!!aiErrors[index]"
          :placeholder="t('gs1DataAttributes.aiPlaceholder')"
          filter
          class="w-full"
          @update:model-value="updateAi(index, $event as string)"
        >
          <template #option="{ option }">
            <div class="flex items-center gap-2">
              <span class="font-mono text-sm">{{ option.ai }}</span>
              <span class="truncate">{{ gs1AiDescriptionOrTitle(option, locale) }}</span>
            </div>
          </template>
        </Select>
        <small
          v-if="aiErrors[index]"
          :data-testid="`gs1-data-attr-ai-error-${index}`"
          class="text-red-500"
        >
          {{ aiErrors[index] }}
        </small>
      </div>

      <div class="flex flex-1 flex-col gap-1">
        <InputText
          :id="`gs1-data-attr-value-${index}`"
          :model-value="row.value"
          :data-testid="`gs1-data-attr-value-${index}`"
          :invalid="!!valueErrors[index]"
          :placeholder="t('gs1DataAttributes.valuePlaceholder')"
          autocomplete="off"
          @update:model-value="updateValue(index, $event as string)"
        />
        <small
          v-if="valueErrors[index]"
          :data-testid="`gs1-data-attr-value-error-${index}`"
          class="text-red-500"
        >
          {{ valueErrors[index] }}
        </small>
      </div>

      <Button
        :data-testid="`gs1-data-attr-remove-${index}`"
        icon="pi pi-times"
        severity="secondary"
        variant="text"
        size="small"
        :aria-label="t('gs1DataAttributes.remove')"
        @click="removeRow(index)"
      />
    </div>

    <Button
      data-testid="gs1-data-attr-add-row"
      :label="t('gs1DataAttributes.addRow')"
      severity="secondary"
      variant="text"
      size="small"
      @click="addRow"
    />
  </div>
</template>
