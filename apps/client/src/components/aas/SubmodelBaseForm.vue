<script setup lang="ts">
import type { FormErrors } from "vee-validate";
import type { EditorModeType } from "../../composables/aas-drawer.ts";
import { useField } from "vee-validate";
import { computed } from "vue";
import { EditorMode } from "../../composables/aas-drawer.ts";
import DisplayNameForm from "./form/DisplayNameForm.vue";
import IdField from "./form/IdField.vue";

const props = defineProps<{ showErrors: boolean; errors: FormErrors<any>; editorMode: EditorModeType }>();

const { value: idShort, errorMessage } = useField<string | undefined | null>("idShort");

const isEditMode = computed(() => props.editorMode === EditorMode.EDIT);
</script>

<template>
  <div class="grid lg:grid-cols-3 grid-cols-1 gap-2">
    <IdField
      id="idShort"
      v-model="idShort"
      class="col-span-3"
      :disabled="isEditMode"
      label="Id"
      :show-error="showErrors"
      :error="errorMessage"
    />
  </div>
  <DisplayNameForm :show-errors="props.showErrors" :errors="props.errors" />
</template>
