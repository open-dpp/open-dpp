<script setup lang="ts">
import type { PropertyRequestDto } from "@open-dpp/dto";
import type { AasEditorPath, PropertyCreateEditorProps } from "../../composables/aas-drawer.ts";
import { DataTypeDef, Language, LanguageTextJsonSchema } from "@open-dpp/dto";

import { toTypedSchema } from "@vee-validate/zod";
import { Button, DataView, InputText, Select } from "primevue";
import { useFieldArray, useForm } from "vee-validate";
import { computed, ref } from "vue";
import { z } from "zod";
import FormField from "../basics/form/FormField.vue";
import IdField from "../basics/form/IdField.vue";

const props = defineProps<{
  path: AasEditorPath;
  data: PropertyCreateEditorProps;
  callback: (data: PropertyRequestDto) => Promise<void>;
}>();

const languageOptions = ref([
  { name: "English", language: Language.en },
  { name: "Deutsch", language: Language.de },
]);

const propertyFormSchema = z.object({
  idShort: z.string().min(1, "IdShort is required"),
  value: props.data.valueType === DataTypeDef.Double ? z.number() : z.string().min(1, "Value is required"),
  displayName: LanguageTextJsonSchema.array(),
});

export type FormValues = z.infer<typeof propertyFormSchema>;

const { defineField, handleSubmit, errors, meta, submitCount } = useForm<FormValues>({
  validationSchema: toTypedSchema(propertyFormSchema),
  validateOnInput: true, // Add this line
  initialValues: { idShort: "", value: "", displayName: [{ language: "en" }] },
});

const [idShort] = defineField("idShort");
const [value] = defineField("value");
const { fields: displayName, push, remove } = useFieldArray<FormValues["displayName"]>("displayName");

const showErrors = computed(() => {
  return meta.value.dirty || submitCount.value > 0;
});

const submit
  = handleSubmit(async (data) => {
    console.log(data);
    await props.callback({ ...data, valueType: props.data.valueType });
  });

defineExpose<{
  submit: () => Promise<void>;
}>({
  submit,
});
</script>

<template>
  <div class="flex flex-col">
    <form class="flex flex-col gap-1 p-2" @submit.prevent="onSubmit">
      <div class="grid lg:grid-cols-3 grid-cols-1 gap-2">
        <IdField
          id="idShort"
          v-model="idShort"
          label="Id"
          :show-error="showErrors"
          :error="errors.idShort"
        />
        <FormField
          id="value"
          v-model="value"
          :component="InputText"
          label="Wert"
          :show-error="showErrors"
          :error="errors.value"
        />
      </div>
      <DataView :value="displayName">
        <template #header>
          <div class="flex flex-wrap items-center justify-between gap-2">
            <span class="text-xl font-bold">Name</span>
            <Button icon="pi pi-plus" raised @click="push({ text: '', language: '' })" />
          </div>
        </template>
        <template #list="slotProps">
          <div class="p-1">
            <div v-for="(field, index) in slotProps.items" :key="index" class="grid lg:grid-cols-2 p-2 gap-4">
              <Select v-model="field.value.language" :options="languageOptions" option-value="language" option-label="name" placeholder="Select a Language" />
              <FormField
                :id="`displayName.${index}.text`"
                v-model="field.value.text"
                :component="InputText"
                label="Name"
                :show-error="showErrors"
                :error="errors[`displayName[${index}].text`]"
              />
            </div>
          </div>
        </template>
      </DataView>
    </form>
  </div>
</template>
