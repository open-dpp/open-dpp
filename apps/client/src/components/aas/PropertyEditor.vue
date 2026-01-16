<script setup lang="ts">
import type { PropertyModificationDto } from "@open-dpp/dto";
import type { AasEditorPath, PropertyEditorProps } from "../../composables/aas-drawer.ts";

import { toTypedSchema } from "@vee-validate/zod";
import { useForm } from "vee-validate";
import { computed } from "vue";
import { z } from "zod";
import { EditorMode } from "../../composables/aas-drawer.ts";
import { SubmodelBaseFormSchema } from "../../lib/submodel-base-form.ts";
import FormField from "../basics/form/FormField.vue";
import SubmodelBaseForm from "./SubmodelBaseForm.vue";

const props = defineProps<{
  path: AasEditorPath;
  data: PropertyEditorProps;
  callback: (data: PropertyModificationDto) => Promise<void>;
}>();

const formSchema = z.object({
  ...SubmodelBaseFormSchema.shape,
  value: z.nullish(z.string()),
});

export type FormValues = z.infer<typeof formSchema>;

const { defineField, handleSubmit, errors, meta, submitCount } = useForm<FormValues>({
  validationSchema: toTypedSchema(formSchema),
  initialValues: { ...props.data },
});
const [value] = defineField("value");

const showErrors = computed(() => {
  return meta.value.dirty || submitCount.value > 0;
});

const submit = handleSubmit(async (data) => {
  await props.callback({ ...data });
});

defineExpose<{
  submit: () => Promise<Promise<void> | undefined>;
}>({
  submit,
});
</script>

<template>
  <form class="flex flex-col gap-4 p-2">
    <SubmodelBaseForm :show-errors="showErrors" :errors="errors" :editor-mode="EditorMode.EDIT" />
    <div class="grid lg:grid-cols-3 grid-cols-1 gap-2">
      <FormField
        id="value"
        v-model="value"
        label="Wert"
        :value-type="props.data.valueType"
        :show-error="showErrors"
        :error="errors.value"
      />
    </div>
  </form>
</template>
