<script lang="ts" setup>
import { isGs1DataAttributeAi, isValidGs1DataAttributeValue } from "@open-dpp/dto";
import { computed, ref, watch } from "vue";
import { useI18n } from "vue-i18n";

/**
 * AI-keyed map editor for GS1 data attributes.
 *
 * Each row holds a (AI, value) pair. Validation is reactive — errors are shown
 * inline as the user types. `update:modelValue` is emitted only when every row
 * has both a valid data-attribute AI and a value that satisfies that AI's
 * format/length rules.
 *
 * Builds all maps immutably; never mutates the modelValue prop.
 */

const props = defineProps<{
  modelValue: Record<string, string>;
}>();

const emit = defineEmits<{
  "update:modelValue": [value: Record<string, string>];
}>();

const { t } = useI18n();

// ---------------------------------------------------------------------------
// Internal row representation
// ---------------------------------------------------------------------------

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

// ---------------------------------------------------------------------------
// Per-row validation helpers
// ---------------------------------------------------------------------------

/**
 * Returns a localized error message for an AI string, or null when valid.
 *
 * - A known data-attribute AI (type 'D') is valid.
 * - A key AI (type 'I' primary identifier or type 'Q' key qualifier) is blocked.
 * - An unknown AI is also rejected.
 * Both invalid cases use the keyAiBlocked message (which embeds the AI string)
 * so the user always sees which AI was rejected.
 */
function computeAiError(ai: string): string | null {
  if (!ai) return null;
  if (isGs1DataAttributeAi(ai)) return null;
  return t("gs1DataAttributes.keyAiBlocked", { ai });
}

/**
 * Returns a localized error message for a value given a validated AI, or null when valid.
 * Returns null when the AI itself is invalid (that error is shown on the AI field).
 */
function computeValueError(ai: string, value: string): string | null {
  if (!ai || !isGs1DataAttributeAi(ai)) return null;
  if (!value) return null;
  if (isValidGs1DataAttributeValue(ai, value)) return null;
  return t("gs1DataAttributes.invalidValue", { ai });
}

// ---------------------------------------------------------------------------
// Computed per-row errors (one entry per row, null = no error)
// ---------------------------------------------------------------------------

const aiErrors = computed<Array<string | null>>(() =>
  rows.value.map((row) => computeAiError(row.ai)),
);

const valueErrors = computed<Array<string | null>>(() =>
  rows.value.map((row) => computeValueError(row.ai, row.value)),
);

// ---------------------------------------------------------------------------
// Emit — builds and emits a new map only when every row is fully valid
// ---------------------------------------------------------------------------

function tryEmit() {
  for (let i = 0; i < rows.value.length; i++) {
    const row = rows.value[i]!;
    if (!row.ai || aiErrors.value[i] !== null) return;
    if (!row.value || valueErrors.value[i] !== null) return;
  }

  const newMap: Record<string, string> = {};
  for (const row of rows.value) {
    newMap[row.ai] = row.value;
  }
  emit("update:modelValue", newMap);
}

// ---------------------------------------------------------------------------
// Row mutations — always replace the array (never mutate in place)
// ---------------------------------------------------------------------------

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
  const surviving = rows.value.filter((_, i) => i !== index);
  rows.value = surviving;

  // Emit the new map built from valid surviving rows.
  const newMap: Record<string, string> = {};
  for (const row of surviving) {
    if (
      row.ai &&
      isGs1DataAttributeAi(row.ai) &&
      row.value &&
      isValidGs1DataAttributeValue(row.ai, row.value)
    ) {
      newMap[row.ai] = row.value;
    }
  }
  emit("update:modelValue", newMap);
}
</script>

<template>
  <div class="flex flex-col gap-2">
    <div v-for="(row, index) in rows" :key="index" class="flex flex-row items-start gap-2">
      <!-- AI input -->
      <div class="flex w-24 flex-col gap-1">
        <InputText
          :id="`gs1-data-attr-ai-${index}`"
          :model-value="row.ai"
          :data-testid="`gs1-data-attr-ai-${index}`"
          :invalid="!!aiErrors[index]"
          :placeholder="t('gs1DataAttributes.aiPlaceholder')"
          autocomplete="off"
          @update:model-value="updateAi(index, $event as string)"
        />
        <small
          v-if="aiErrors[index]"
          :data-testid="`gs1-data-attr-ai-error-${index}`"
          class="text-red-500"
        >
          {{ aiErrors[index] }}
        </small>
      </div>

      <!-- Value input -->
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

      <!-- Remove button -->
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

    <!-- Add row button -->
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
