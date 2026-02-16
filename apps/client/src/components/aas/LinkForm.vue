<script setup lang="ts">
import type { FormErrors } from "vee-validate";
import type { EditorModeType } from "../../composables/aas-drawer.ts";

import { FloatLabel, InputGroup, InputGroupAddon, InputText, Message } from "primevue";
import { useField } from "vee-validate";
import { useI18n } from "vue-i18n";
import SubmodelBaseForm from "./SubmodelBaseForm.vue";

const props = defineProps<{
  data: any;
  showErrors: boolean;
  errors: FormErrors<any>;
  editorMode: EditorModeType;
}>();
const { value } = useField<string>("value");
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
      <InputGroup>
        <InputGroupAddon>
          <i class="pi pi-link" />
        </InputGroupAddon>
        <FloatLabel variant="on">
          <InputText
            id="value"
            v-model="value"
            :invalid="props.showErrors && !!props.errors.value"
          />
          <label for="value">{{ t("aasEditor.formLabels.value") }}</label>
        </FloatLabel>
      </InputGroup>
      <Message
        v-if="props.showErrors && props.errors.value"
        size="small"
        severity="error"
        variant="simple"
      >
        {{ props.errors.value }}
      </Message>
    </div>
  </div>
</template>
