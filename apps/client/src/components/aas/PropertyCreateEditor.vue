<script setup lang="ts">
import type { PropertyRequestDto } from "@open-dpp/dto";
import type { AasEditorPath, PropertyCreateEditorProps } from "../../composables/aas-drawer.ts";
import { DataTypeDef } from "@open-dpp/dto";

import { toTypedSchema } from "@vee-validate/zod";
import { Button, InputNumber, InputText } from "primevue";
import { useForm } from "vee-validate";
import { computed } from "vue";
import { z } from "zod";
import FormField from "../basics/form/FormField.vue";
import IdField from "../basics/form/IdField.vue";

const props = defineProps<{
  path: AasEditorPath;
  data: PropertyCreateEditorProps;
  callback: (data: PropertyRequestDto) => Promise<void>;
}>();

const propertyFormSchema = z.object({
  idShort: z.string().min(1, "IdShort is required"),
  value: props.data.valueType === DataTypeDef.Double ? z.number() : z.string().min(1, "Value is required"),
  test: z.number(),
});

export type FormValues = z.infer<typeof propertyFormSchema>;

const { defineField, handleSubmit, errors, meta, submitCount } = useForm<FormValues>({
  validationSchema: toTypedSchema(propertyFormSchema),
  validateOnInput: true, // Add this line
  initialValues: { idShort: "", value: "", test: 123 },
});

const [idShort] = defineField("idShort");
const [value] = defineField("value");
const [test] = defineField("test");

const showErrors = computed(() => {
  return meta.value.dirty || submitCount.value > 0;
});

const onSubmit
  = handleSubmit(async (data) => {
    console.log(data);
    await props.callback({ ...data, valueType: props.data.valueType });
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
          id="test"
          v-model="test"
          :component="InputNumber"
          label="Test"
          :show-error="showErrors"
          :error="errors.test"
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
      <Button class="w-fit" type="submit" label="Submit" />
    </form>
  </div>
</template>
