<script setup lang="ts">
import type { FormErrors } from "vee-validate";
import type { EditorModeType } from "../../composables/aas-drawer.ts";
import { Button, DataView } from "primevue";
import { useField, useFieldArray } from "vee-validate";
import { computed } from "vue";
import { useI18n } from "vue-i18n";
import { EditorMode } from "../../composables/aas-drawer.ts";
import FormField from "../basics/form/FormField.vue";
import IdField from "../basics/form/IdField.vue";
import LanguageSelect from "../basics/LanguageSelect.vue";

const props = defineProps<{ showErrors: boolean; errors: FormErrors<any>; editorMode: EditorModeType }>();

const { value: idShort, errorMessage } = useField<string | undefined | null>("idShort");

const { t } = useI18n();
const isEditMode = computed(() => props.editorMode === EditorMode.EDIT);

const {
  fields: displayName,
  push: pushDisplayName,
  remove: removeDisplayName,
} = useFieldArray("displayName");
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
  <DataView :value="displayName">
    <template #header>
      <div class="flex flex-wrap items-center justify-between gap-2">
        <span class="text-xl font-bold">{{ t('aasEditor.formLabels.name') }}</span>
        <Button
          icon="pi pi-plus"
          raised
          @click="pushDisplayName({ text: '', language: '' })"
        />
      </div>
    </template>
    <template #list="slotProps">
      <div>
        <div
          v-for="(field, index) in slotProps.items"
          :key="index"
          class="grid lg:grid-cols-3 gap-4 pt-2"
        >
          <LanguageSelect
            v-model="field.value.language"
          />
          <FormField
            :id="`displayName.${index}.text`"
            v-model="field.value.text"
            label="Name"
            :show-error="props.showErrors"
            :error="props.errors[`displayName[${index}].text`]"
          />
          <Button
            icon="pi pi-trash"
            severity="danger"
            @click="removeDisplayName(Number(index))"
          />
        </div>
      </div>
    </template>
  </DataView>
</template>
