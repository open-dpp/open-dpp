<script setup lang="ts">
import type { FormErrors } from "vee-validate";
import type { EditorModeType } from "../../composables/aas-drawer.ts";
import { useField } from "vee-validate";
import { computed } from "vue";
import { useI18n } from "vue-i18n";
import PropertyValueField from "./form/PropertyValueField.vue";
import SubmodelBaseForm from "./SubmodelBaseForm.vue";

const props = withDefaults(
  defineProps<{
    data: any;
    showErrors: boolean;
    errors: FormErrors<any>;
    editorMode: EditorModeType;
    disabled?: boolean;
    /** Governs only the value field, independent of `disabled` (which governs the
     * metadata fields). Defaults to `disabled` when omitted, so existing callers that
     * don't need the distinction keep their previous all-or-nothing behavior. Explicitly
     * defaulted to `undefined` (not left implicit) since Vue casts an unset Boolean prop
     * to `false`, which would silently defeat the `?? props.disabled` fallback below. */
    disabledValue?: boolean;
  }>(),
  { disabledValue: undefined },
);
const { value } = useField<string | undefined | null>("value");

const { t } = useI18n();

const effectiveDisabledValue = computed(() => props.disabledValue ?? props.disabled);
</script>

<template>
  <SubmodelBaseForm
    :disabled="props.disabled"
    :show-errors="props.showErrors"
    :editor-mode="props.editorMode"
  />
  <div>
    <PropertyValueField
      id="value"
      v-model="value"
      :disabled="effectiveDisabledValue"
      :label="t('aasEditor.formLabels.value')"
      :value-type="props.data.valueType"
      :show-error="showErrors"
      :error="errors.value"
    />
  </div>
</template>
