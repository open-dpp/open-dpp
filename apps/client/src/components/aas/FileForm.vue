<script setup lang="ts">
import type { FormErrors } from "vee-validate";
import type {
  EditorModeType,
} from "../../composables/aas-drawer.ts";

import { Message } from "primevue";
import { useField } from "vee-validate";

import { useI18n } from "vue-i18n";
import FileField from "./form/FileField.vue";
import SubmodelBaseForm from "./SubmodelBaseForm.vue";

const props = defineProps<{
  data: any;
  showErrors: boolean;
  errors: FormErrors<any>;
  editorMode: EditorModeType;
}>();

const { t } = useI18n();

const { value, errorMessage } = useField<string | undefined | null>("value");

const { value: contentType } = useField<string | undefined | null>("contentType");

function changeContentType(newContentType: string | undefined | null) {
  contentType.value = newContentType;
}
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
        <FileField
          id="file" v-model="value" :label="t('aasEditor.file')" @change-content-type="changeContentType"
        />
        <Message size="small" severity="error" variant="simple">
          {{ errorMessage }}
        </Message>
      </div>
    </div>
  </form>
</template>
