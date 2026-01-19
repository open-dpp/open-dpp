<script setup lang="ts">
import type { SubmodelRequestDto } from "@open-dpp/dto";
import type { SubmodelCreateEditorProps } from "../../composables/aas-drawer.ts";
import { toTypedSchema } from "@vee-validate/zod";
import { useForm } from "vee-validate";
import { computed } from "vue";
import { useI18n } from "vue-i18n";
import { z } from "zod";
import {
  submodelBaseFormDefaultValues,
  SubmodelBaseFormSchema,
} from "../../lib/submodel-base-form.ts";
import { convertLocaleToLanguage } from "../../translations/i18n.ts";
import SubmodelBaseForm from "./SubmodelBaseForm.vue";

const props = defineProps<{
  data: SubmodelCreateEditorProps;
  callback: (data: SubmodelRequestDto) => Promise<void>;
}>();

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
  <form class="flex flex-col gap-1 p-2">
    <SubmodelBaseForm :show-errors="showErrors" :errors="errors" />
  </form>
</template>
