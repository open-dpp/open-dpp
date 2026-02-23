<script setup lang="ts">
import type { SubmodelElementCollectionRequestDto } from "@open-dpp/dto";
import type { SubmodelElementCollectionCreateEditorProps } from "../../composables/aas-drawer.ts";
import type { SharedEditorProps } from "../../lib/aas-editor.ts";
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
import FormContainer from "./form/FormContainer.vue";
import SubmodelBaseForm from "./SubmodelBaseForm.vue";

const props
  = defineProps<
    SharedEditorProps<
      SubmodelElementCollectionCreateEditorProps,
      SubmodelElementCollectionRequestDto
    >
  >();

const propertyFormSchema = z.object({
  ...SubmodelBaseFormSchema.shape,
});

const { locale } = useI18n();

export type FormValues = z.infer<typeof propertyFormSchema>;

const { handleSubmit, errors, meta, submitCount } = useForm<FormValues>({
  validationSchema: toTypedSchema(propertyFormSchema),
  initialValues: {
    ...submodelBaseFormDefaultValues(convertLocaleToLanguage(locale.value)),
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
  <FormContainer>
    <SubmodelBaseForm
      :show-errors="showErrors"
      :errors="errors"
      :editor-mode="EditorMode.CREATE"
    />
  </FormContainer>
</template>
