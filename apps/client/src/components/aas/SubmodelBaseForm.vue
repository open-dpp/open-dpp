<script setup lang="ts">
import { Button, DataView, InputText } from "primevue";
import { useField, useFieldArray } from "vee-validate";
import FormField from "../basics/form/FormField.vue";
import IdField from "../basics/form/IdField.vue";
import LanguageSelect from "../basics/LanguageSelect.vue";

const props = defineProps<{ showErrors: boolean; errors: FormErrors<any> }>();

const { value: idShort, errorMessage } = useField("idShort");

const {
  fields: displayName,
  push: pushDisplayName,
  remove: removeDisplayName,
} = useFieldArray<FormValues["displayName"]>("displayName");
</script>

<template>
  <div class="grid lg:grid-cols-3 grid-cols-1 gap-2">
    <IdField
      id="idShort"
      v-model="idShort"
      label="Id"
      :show-error="showErrors"
      :error="errorMessage"
    />
  </div>
  <DataView :value="displayName">
    <template #header>
      <div class="flex flex-wrap items-center justify-between gap-2">
        <span class="text-xl font-bold">Name</span>
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
            :component="InputText"
            label="Name"
            :show-error="props.showErrors"
            :error="props.errors[`displayName[${index}].text`]"
          />
          <Button
            icon="pi pi-trash"
            severity="danger"
            @click="removeDisplayName(index)"
          />
        </div>
      </div>
    </template>
  </DataView>
</template>
