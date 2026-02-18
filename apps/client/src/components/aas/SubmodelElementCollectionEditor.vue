<script setup lang="ts">
import type { SubmodelElementCollectionRequestDto } from "@open-dpp/dto";
import type { SubmodelElementCollectionEditorProps } from "../../composables/aas-drawer.ts";
import type { SharedEditorProps } from "../../lib/aas-editor.ts";
import { toTypedSchema } from "@vee-validate/zod";
import { useForm } from "vee-validate";
import { computed } from "vue";
import { z } from "zod";
import { EditorMode } from "../../composables/aas-drawer.ts";
import { SubmodelBaseFormSchema } from "../../lib/submodel-base-form.ts";
import SubmodelBaseForm from "./SubmodelBaseForm.vue";

const props
  = defineProps<
    SharedEditorProps<
      SubmodelElementCollectionEditorProps,
      SubmodelElementCollectionRequestDto
    >
  >();

const propertyFormSchema = z.object({
  ...SubmodelBaseFormSchema.shape,
});

export type FormValues = z.infer<typeof propertyFormSchema>;

const { handleSubmit, errors, meta, submitCount } = useForm<FormValues>({
  validationSchema: toTypedSchema(propertyFormSchema),
  initialValues: {
    ...props.data,
  },
});

const showErrors = computed(() => {
  return meta.value.dirty || submitCount.value > 0;
});

async function submit() {
  await handleSubmit(async (data) => {
    await props.callback({ ...data });
  })();
}

defineExpose<{
  submit: () => Promise<void>;
}>({
  submit,
});
</script>

<template>
  <form class="flex flex-col gap-1 p-2">
    <SubmodelBaseForm
      :show-errors="showErrors"
      :errors="errors"
      :editor-mode="EditorMode.EDIT"
    />
  </form>
</template>
