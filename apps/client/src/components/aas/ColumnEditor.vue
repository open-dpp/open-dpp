<script setup lang="ts">
import type { SubmodelElementModificationDto } from "@open-dpp/dto";
import type { ColumnEditorProps } from "../../composables/aas-drawer.ts";
import type { SharedEditorProps } from "../../lib/aas-editor.ts";
import { SubmodelElementModificationSchema } from "@open-dpp/dto";
import { toTypedSchema } from "@vee-validate/zod";

import { useForm } from "vee-validate";
import { computed } from "vue";
import { z } from "zod";
import { EditorMode } from "../../composables/aas-drawer.ts";
import { SubmodelBaseFormSchema } from "../../lib/submodel-base-form.ts";

import SubmodelBaseForm from "./SubmodelBaseForm.vue";

const props
  = defineProps<
    SharedEditorProps<ColumnEditorProps, SubmodelElementModificationDto>
  >();

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

async function submit() {
  await handleSubmit(async (data) => {
    await props.callback(
      SubmodelElementModificationSchema.parse({
        ...data,
      }),
    );
  })();
}

defineExpose<{
  submit: () => Promise<void>;
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
