<script setup lang="ts">
import type { FormErrors } from "vee-validate";
import type { EditorModeType } from "../../composables/aas-drawer.ts";

import { useField } from "vee-validate";
import { useI18n } from "vue-i18n";
import TextFieldWithValidation from "../basics/TextFieldWithValidation.vue";
import SubmodelBaseForm from "./SubmodelBaseForm.vue";

const props = defineProps<{
  data: any;
  showErrors: boolean;
  errors: FormErrors<any>;
  editorMode: EditorModeType;
  disabled?: boolean;
}>();
const { value } = useField<string | null>("value");
const { t } = useI18n();
</script>

<template>
  <SubmodelBaseForm
    :show-errors="props.showErrors"
    :editor-mode="props.editorMode"
    :disabled="props.disabled"
  />
  <div class="grid grid-cols-1 gap-2 lg:grid-cols-3">
    <div class="flex flex-col gap-2">
      <h3 class="text-xl font-bold">{{ t("aasEditor.formLabels.value") }}</h3>
      <TextFieldWithValidation
        id="value"
        v-model="value"
        :disabled="props.disabled"
        :label="t('aasEditor.formLabels.value')"
        :show-errors="props.showErrors"
        :error="props.errors.value"
        :treat-empty-string-as-null="true"
      >
        <template #addonLeft>
          <i class="pi pi-link" />
        </template>
      </TextFieldWithValidation>
    </div>
  </div>
</template>
