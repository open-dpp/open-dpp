<script setup lang="ts">
import type { PropertyRequestDto } from "@open-dpp/dto";
import type { AasEditorPath, PropertyCreateEditorProps } from "../../composables/aas-drawer.ts";
import { DataTypeDef, PropertyJsonSchema } from "@open-dpp/dto";

import { toTypedSchema } from "@vee-validate/zod";
import { useForm } from "vee-validate";
import { computed } from "vue";
import { useI18n } from "vue-i18n";
import { z } from "zod";
import { EditorMode } from "../../composables/aas-drawer.ts";
import { submodelBaseFormDefaultValues, SubmodelBaseFormSchema } from "../../lib/submodel-base-form.ts";
import { convertLocaleToLanguage } from "../../translations/i18n.ts";
import FormField from "../basics/form/FormField.vue";
import SubmodelBaseForm from "./SubmodelBaseForm.vue";

const props = defineProps<{
  path: AasEditorPath;
  data: PropertyCreateEditorProps;
  callback: (data: PropertyRequestDto) => Promise<void>;
}>();

const propertyFormSchema = z.object({
  ...SubmodelBaseFormSchema.shape,
  value: props.data.valueType === DataTypeDef.Double ? z.number() : z.string().min(1, "Value is required"),
});
const { locale } = useI18n();
export type FormValues = z.infer<typeof propertyFormSchema>;

const { defineField, handleSubmit, errors, meta, submitCount } = useForm<FormValues>({
  validationSchema: toTypedSchema(propertyFormSchema),
  initialValues: { value: "", ...submodelBaseFormDefaultValues(convertLocaleToLanguage(locale.value)) },
});

const [value] = defineField("value");

const showErrors = computed(() => {
  return meta.value.dirty || submitCount.value > 0;
});

const submit
  = handleSubmit(async (data) => {
    await props.callback(PropertyJsonSchema.parse({ ...data, valueType: props.data.valueType }));
  });

defineExpose<{
  submit: () => Promise<Promise<void> | undefined>;
}>({
  submit,
});
</script>

<template>
  <form class="flex flex-col gap-1 p-2">
    <SubmodelBaseForm :show-errors="showErrors" :errors="errors" :editor-mode="EditorMode.CREATE" />
    <div class="grid lg:grid-cols-3 grid-cols-1 gap-2">
      <FormField
        id="value"
        v-model="value"
        label="Wert"
        :show-error="showErrors"
        :error="errors.value"
      />
    </div>
  </form>
</template>
