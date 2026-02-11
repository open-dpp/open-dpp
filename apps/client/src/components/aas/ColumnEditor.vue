<script setup lang="ts">
import type {
  SubmodelElementModificationDto,
} from "@open-dpp/dto";
import type {
  AasEditorPath,
  ColumnEditorProps,
} from "../../composables/aas-drawer.ts";
import { SubmodelElementModificationSchema } from "@open-dpp/dto";
import { toTypedSchema } from "@vee-validate/zod";

import { useForm } from "vee-validate";
import { computed } from "vue";
import { z } from "zod";
import { EditorMode } from "../../composables/aas-drawer.ts";
import { SubmodelBaseFormSchema } from "../../lib/submodel-base-form.ts";
import SubmodelBaseForm from "./SubmodelBaseForm.vue";

const props = defineProps<{
  path: AasEditorPath;
  data: ColumnEditorProps;
  callback: (data: SubmodelElementModificationDto) => Promise<void>;
}>();

const columnFormSchema = z.object({
  ...SubmodelBaseFormSchema.shape,
});
export type FormValues = z.infer<typeof columnFormSchema>;

const { handleSubmit, errors, meta, submitCount } = useForm<FormValues>({
  validationSchema: toTypedSchema(columnFormSchema),
  initialValues: {
    ...props.data,
  },
});

const showErrors = computed(() => {
  return meta.value.dirty || submitCount.value > 0;
});

const submit = handleSubmit(async (data) => {
  await props.callback(
    SubmodelElementModificationSchema.parse({
      ...data,
    }),
  );
});

defineExpose<{
  submit: () => Promise<Promise<void> | undefined>;
}>({
  submit,
});
</script>

<template>
  <div class="flex flex-col gap-4 p-2">
    <SubmodelBaseForm
      :show-errors="showErrors"
      :errors="errors"
      :editor-mode="EditorMode.EDIT"
    />
  </div>
</template>
