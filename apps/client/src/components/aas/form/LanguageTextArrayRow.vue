<script setup lang="ts">
import type { LanguageType } from "@open-dpp/dto";
import { useField } from "vee-validate";
import { computed, toRef } from "vue";
import { useI18n } from "vue-i18n";
import LanguageSelect from "../../basics/LanguageSelect.vue";
import TextFieldWithValidation from "../../basics/TextFieldWithValidation.vue";

const props = defineProps<{
  // Name of the vee-validate field array this row belongs to (e.g. "displayName",
  // "description"). Drives the bound field paths and the DOM id / data-cy prefixes.
  fieldName: string;
  dataCyPrefix: string;
  rowLabel: string;
  index: number;
  fieldKey: string | number;
  submitAttempted: boolean;
  ignoreLanguageOptions: LanguageType[];
  disabled?: boolean;
}>();

const emit = defineEmits<{ remove: [] }>();

const { t } = useI18n();

const indexRef = toRef(props, "index");
const textPath = computed(() => `${props.fieldName}[${indexRef.value}].text`);
const languagePath = computed(() => `${props.fieldName}[${indexRef.value}].language`);

const {
  value: text,
  errorMessage: textError,
  meta: textMeta,
  handleBlur: handleTextBlur,
} = useField<string>(textPath);

const { value: language } = useField<LanguageType>(languagePath);

const showError = computed(() => textMeta.touched || props.submitAttempted);
</script>

<template>
  <!-- lg:pb-6 reserves vertical space at desktop widths for the absolutely-
       positioned error Message from TextFieldWithValidation, so the desktop
       row height stays stable when an error appears. Below lg: the grid is
       a single column and the error flows inline — no extra padding needed. -->
  <div class="grid gap-4 lg:grid-cols-3 lg:pb-7">
    <LanguageSelect
      v-model="language"
      :disabled="props.disabled"
      :ignore-options="props.ignoreLanguageOptions"
    />
    <TextFieldWithValidation
      :id="`${props.fieldName}-${fieldKey}`"
      v-model="text"
      :label="t(props.rowLabel)"
      :show-errors="showError"
      :error="textError"
      :disabled="props.disabled"
      error-placement="absolute"
      @blur="handleTextBlur"
    />
    <Button
      :data-cy="`remove-${props.dataCyPrefix}-${index}`"
      :aria-label="t('common.remove')"
      icon="pi pi-trash"
      severity="danger"
      rounded
      :disabled="props.disabled"
      @click="emit('remove')"
    />
  </div>
</template>
