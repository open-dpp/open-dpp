<script setup lang="ts">
import type { EditorModeType } from "../../composables/aas-drawer.ts";
import { useField } from "vee-validate";
import { computed } from "vue";
import { useI18n } from "vue-i18n";
import FileField from "./form/FileField.vue";
import SubmodelBaseForm from "./SubmodelBaseForm.vue";

const props = withDefaults(
  defineProps<{
    id?: string;
    showErrors: boolean;
    editorMode: EditorModeType;
    disabled?: boolean;
  }>(),
  {
    id: "file-value",
  },
);

const { value, errorMessage } = useField<string | undefined>("value");
const { t } = useI18n();

const { value: contentType } = useField<string | undefined>("contentType");

const labelId = computed(() => `${props.id}-label`);
const errorMessageId = computed(() => `${props.id}-error`);
const describedBy = computed(() => (errorMessage.value ? errorMessageId.value : undefined));
</script>

<template>
  <form class="flex flex-col gap-4 p-2">
    <SubmodelBaseForm
      :show-errors="props.showErrors"
      :editor-mode="props.editorMode"
      :disabled="props.disabled"
    />
    <div class="grid grid-cols-1 gap-2 lg:grid-cols-3">
      <div
        role="group"
        :aria-labelledby="labelId"
        :aria-describedby="describedBy"
        class="flex flex-col gap-2"
      >
        <h3 :id="labelId" class="text-xl font-bold">
          {{ t("aasEditor.formLabels.value") }}
        </h3>
        <FileField v-model="value" v-model:content-type="contentType" :disabled="props.disabled" />
        <Message
          v-if="errorMessage"
          :id="errorMessageId"
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
