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
}>();
const { value } = useField<string | null>("value");
const { t } = useI18n();
</script>

<template>
  <SubmodelBaseForm
    :show-errors="props.showErrors"
    :errors="props.errors"
    :editor-mode="props.editorMode"
  />
  <div class="grid lg:grid-cols-3 grid-cols-1 gap-2">
    <div class="flex flex-col gap-2">
      <span class="text-xl font-bold">{{
        t("aasEditor.formLabels.value")
      }}</span>
      <TextFieldWithValidation
        id="value"
        v-model="value"
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
