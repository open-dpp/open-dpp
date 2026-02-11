<script setup lang="ts">
import type { FileModificationDto } from "@open-dpp/dto";
import type {
  AasEditorPath,
  FileEditorProps,
} from "../../composables/aas-drawer.ts";
import {

  FileModificationSchema,
} from "@open-dpp/dto";
import { toTypedSchema } from "@vee-validate/zod";
import { useForm } from "vee-validate";

import { computed } from "vue";
import { z } from "zod";
import { EditorMode } from "../../composables/aas-drawer.ts";
import { SubmodelBaseFormSchema } from "../../lib/submodel-base-form.ts";
import FileForm from "./FileForm.vue";

const props = defineProps<{
  path: AasEditorPath;
  data: FileEditorProps;
  callback: (data: FileModificationDto) => Promise<void>;
}>();

const formSchema = z.object({
  ...SubmodelBaseFormSchema.shape,
  value: z.nullish(z.string()),
  contentType: z.string().nullish(),
});
export type FormValues = z.infer<typeof formSchema>;

const { handleSubmit, errors, meta, submitCount } = useForm<FormValues>({
  validationSchema: toTypedSchema(formSchema),
  initialValues: {
    ...props.data,
  },
});
const showErrors = computed(() => {
  return meta.value.dirty || submitCount.value > 0;
});

const submit = handleSubmit(async (data) => {
  await props.callback(FileModificationSchema.parse({ ...data }));
});

defineExpose<{
  submit: () => Promise<Promise<void> | undefined>;
}>({
  submit,
});
</script>

<template>
  <div class="flex flex-col gap-4 p-2">
    <FileForm
      :data="props.data"
      :show-errors="showErrors"
      :errors="errors"
      :editor-mode="EditorMode.EDIT"
    />
  </div>
</template>
