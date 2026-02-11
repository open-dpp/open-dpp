<script setup lang="ts">
import type { FormErrors } from "vee-validate";
import type { EditorModeType } from "../../composables/aas-drawer.ts";

import { Message } from "primevue";
import { useField } from "vee-validate";

import FileField from "./form/FileField.vue";
import SubmodelBaseForm from "./SubmodelBaseForm.vue";

const props = defineProps<{
  showErrors: boolean;
  errors: FormErrors<any>;
  editorMode: EditorModeType;
}>();

const { value, errorMessage } = useField<string | undefined>("value");

const { value: contentType } = useField<string | undefined>("contentType");
</script>

<template>
  <form class="flex flex-col gap-4 p-2">
    <SubmodelBaseForm
      :show-errors="props.showErrors"
      :errors="errors"
      :editor-mode="props.editorMode"
    />
    <div class="grid lg:grid-cols-3 grid-cols-1 gap-2">
      <div class="flex flex-col gap-2">
        <FileField v-model="value" v-model:change-content-type="contentType" />
        <Message
          v-if="errorMessage"
          size="small"
          severity="error"
          variant="simple"
        >
          {{ errorMessage }}
        </Message>
      </div>
    </div>
  </form>
</template>
