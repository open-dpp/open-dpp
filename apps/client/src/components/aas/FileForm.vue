<script setup lang="ts">
import type { EditorModeType } from "../../composables/aas-drawer.ts";
import { useField } from "vee-validate";
import { computed, useId } from "vue";
import { useI18n } from "vue-i18n";
import FileField from "./form/FileField.vue";
import SubmodelBaseForm from "./SubmodelBaseForm.vue";

const props = defineProps<{
  id?: string;
  showErrors: boolean;
  editorMode: EditorModeType;
  disabled?: boolean;
}>();

// Vue 3.5+ provides useId() for SSR-safe unique ids per component instance.
// Parents may still pass an explicit `id` to override when they need a
// predictable handle (e.g. for tests or external labelling).
const autoId = useId();
const effectiveId = computed(() => props.id ?? autoId);

const { value, errorMessage } = useField<string | undefined>("value");
const { t } = useI18n();

const { value: contentType } = useField<string | undefined>("contentType");

const labelId = computed(() => `${effectiveId.value}-label`);
const errorMessageId = computed(() => `${effectiveId.value}-error`);
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
