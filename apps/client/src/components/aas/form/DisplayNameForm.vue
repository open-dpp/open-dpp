<script setup lang="ts">
import type { FormErrors } from "vee-validate";
import { Button, DataView } from "primevue";
import { useFieldArray } from "vee-validate";
import { useI18n } from "vue-i18n";
import LanguageSelect from "../../basics/LanguageSelect.vue";
import TextFieldWithValidation from "../../basics/TextFieldWithValidation.vue";

const props = defineProps<{
  showErrors: boolean;
  errors: FormErrors<any>;
}>();
const { t } = useI18n();
const {
  fields: displayName,
  push: pushDisplayName,
  remove: removeDisplayName,
} = useFieldArray("displayName");
</script>

<template>
  <DataView :value="displayName">
    <template #header>
      <div class="flex flex-wrap items-center justify-between gap-2">
        <span class="text-xl font-bold">{{
          t("aasEditor.formLabels.name")
        }}</span>
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
          <LanguageSelect v-model="field.value.language" />
          <TextFieldWithValidation
            :id="`displayName-${index}`"
            v-model="field.value.text"
            label="Name"
            :show-errors="props.showErrors"
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

<style scoped></style>
