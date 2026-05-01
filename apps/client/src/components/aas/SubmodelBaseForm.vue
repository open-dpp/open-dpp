<script setup lang="ts">
import type { EditorModeType } from "../../composables/aas-drawer.ts";
import { useField } from "vee-validate";
import { computed } from "vue";
import { EditorMode } from "../../composables/aas-drawer.ts";
import DisplayNameForm from "./form/DisplayNameForm.vue";
import IdField from "./form/IdField.vue";

const props = defineProps<{
  showErrors: boolean;
  editorMode: EditorModeType;
  disabled?: boolean;
}>();

const {
  value: idShort,
  errorMessage,
  meta: idShortMeta,
} = useField<string | undefined | null>("idShort");

const isEditMode = computed(() => props.editorMode === EditorMode.EDIT);

// Per-field gating: show the idShort error once the user has touched/modified
// the field, OR once a submit has been attempted (props.showErrors).
// meta.dirty flips as soon as the user types and stays sticky, so we don't
// need to wire a blur handler down through IdField's children.
const showIdShortError = computed(() => idShortMeta.dirty || props.showErrors);
</script>

<template>
  <div class="grid grid-cols-1 gap-2 lg:grid-cols-3">
    <IdField
      id="idShort"
      v-model="idShort"
      class="col-span-3"
      :disabled="isEditMode"
      label="ID"
      :show-error="showIdShortError"
      :error="errorMessage"
    />
  </div>
  <DisplayNameForm :submit-attempted="props.showErrors" :disabled="props.disabled" />
</template>
