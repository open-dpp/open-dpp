<script setup lang="ts">
import type { SubmodelElementRequestDto } from "@open-dpp/dto";
import type { ColumnCreateEditorProps } from "../../composables/aas-drawer.ts";
import type { SharedEditorProps } from "../../lib/aas-editor.ts";
import { SubmodelElementSchema } from "@open-dpp/dto";
import { toTypedSchema } from "@vee-validate/zod";
import { useForm } from "vee-validate";
import { computed } from "vue";
import { useI18n } from "vue-i18n";
import { z } from "zod";
import { EditorMode } from "../../composables/aas-drawer.ts";
import {
  submodelBaseFormDefaultValues,
  SubmodelBaseFormSchema,
} from "../../lib/submodel-base-form.ts";
import { convertLocaleToLanguage } from "../../translations/i18n.ts";

import SubmodelBaseForm from "./SubmodelBaseForm.vue";

const props
  = defineProps<
    SharedEditorProps<ColumnCreateEditorProps, SubmodelElementRequestDto>
  >();

const columnFormSchema = z.object({
  ...SubmodelBaseFormSchema.shape,
});
const { locale } = useI18n();
export type FormValues = z.infer<typeof columnFormSchema>;

const { handleSubmit, errors, meta, submitCount } = useForm<FormValues>({
  validationSchema: toTypedSchema(columnFormSchema),
  initialValues: {
    ...submodelBaseFormDefaultValues(convertLocaleToLanguage(locale.value)),
  },
});

const showErrors = computed(() => {
  return meta.value.dirty || submitCount.value > 0;
});

async function submit() {
  await handleSubmit(async (data) => {
    await props.callback(
      SubmodelElementSchema.parse({
        ...data,
        ...props.data,
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
      :editor-mode="EditorMode.CREATE"
    />
  </div>
</template>
