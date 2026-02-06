<script setup lang="ts">
import type { FormErrors } from "vee-validate";
import type { EditorModeType } from "../../composables/aas-drawer.ts";
import { useField } from "vee-validate";
import { useI18n } from "vue-i18n";
import PropertyValueField from "./form/PropertyValueField.vue";
import SubmodelBaseForm from "./SubmodelBaseForm.vue";

const props = defineProps<{
  data: any;
  showErrors: boolean;
  errors: FormErrors<any>;
  editorMode: EditorModeType;
}>();
const { value } = useField<string | undefined | null>("value");

const { t } = useI18n();
</script>

<template>
  <SubmodelBaseForm :show-errors="props.showErrors" :errors="props.errors" :editor-mode="props.editorMode" />
  <div class="grid lg:grid-cols-3 grid-cols-1 gap-2">
    <PropertyValueField
      id="value"
      v-model="value"
      :label="t('aasEditor.formLabels.value')"
      :value-type="props.data.valueType"
      :show-error="showErrors"
      :error="errors.value"
    />
  </div>
</template>
