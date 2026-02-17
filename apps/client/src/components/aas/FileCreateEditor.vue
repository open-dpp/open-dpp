<script setup lang="ts">
import type { FileRequestDto } from "@open-dpp/dto";
import type { FileCreateEditorProps } from "../../composables/aas-drawer.ts";
import type { SharedEditorProps } from "../../lib/aas-editor.ts";
import { FileJsonSchema } from "@open-dpp/dto";
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
import FileForm from "./FileForm.vue";

const props
  = defineProps<SharedEditorProps<FileCreateEditorProps, FileRequestDto>>();

const formSchema = z.object({
  ...SubmodelBaseFormSchema.shape,
  value: z.string(),
  contentType: z.string().nullish(),
});
const { locale } = useI18n();
export type FormValues = z.infer<typeof formSchema>;

const { handleSubmit, errors, meta, submitCount } = useForm<FormValues>({
  validationSchema: toTypedSchema(formSchema),
  initialValues: {
    ...submodelBaseFormDefaultValues(convertLocaleToLanguage(locale.value)),
  },
});

const showErrors = computed(() => {
  return meta.value.dirty || submitCount.value > 0;
});

const submit = handleSubmit(async (data) => {
  await props.callback(
    FileJsonSchema.parse({
      ...data,
      contentType: data.contentType ?? "application/octet-stream",
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
    <FileForm
      :data="props.data"
      :show-errors="showErrors"
      :errors="errors"
      :editor-mode="EditorMode.CREATE"
    />
  </div>
</template>
