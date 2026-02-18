<script setup lang="ts">
import type { PropertyModificationDto } from "@open-dpp/dto";
import type { PropertyEditorProps } from "../../composables/aas-drawer.ts";
import type { SharedEditorProps } from "../../lib/aas-editor.ts";
import { PropertyModificationSchema } from "@open-dpp/dto";
import { toTypedSchema } from "@vee-validate/zod";
import { useForm } from "vee-validate";
import { computed } from "vue";
import { z } from "zod";
import { EditorMode } from "../../composables/aas-drawer.ts";
import { SubmodelBaseFormSchema } from "../../lib/submodel-base-form.ts";

import PropertyForm from "./PropertyForm.vue";

const props
  = defineProps<
    SharedEditorProps<PropertyEditorProps, PropertyModificationDto>
  >();

const formSchema = z.object({
  ...SubmodelBaseFormSchema.shape,
  value: z.nullish(z.string()),
});

export type FormValues = z.infer<typeof formSchema>;

const { handleSubmit, meta, submitCount, errors } = useForm<FormValues>({
  validationSchema: toTypedSchema(formSchema),
  initialValues: { ...props.data },
});

const showErrors = computed(() => {
  return meta.value.dirty || submitCount.value > 0;
});

async function submit() {
  await handleSubmit(async (data) => {
    await props.callback(PropertyModificationSchema.parse({ ...data }));
  })();
}

defineExpose<{
  submit: () => Promise<void>;
}>({
  submit,
});
</script>

<template>
  <form class="flex flex-col gap-4 p-2">
    <PropertyForm
      :data="props.data"
      :show-errors="showErrors"
      :errors="errors"
      :editor-mode="EditorMode.EDIT"
    />
  </form>
</template>
