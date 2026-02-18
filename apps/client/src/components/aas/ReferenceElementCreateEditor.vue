<script setup lang="ts">
import type { ReferenceElementRequestDto } from "@open-dpp/dto";
import type {
  ReferenceElementCreateEditorProps,
} from "../../composables/aas-drawer.ts";
import type { SharedEditorProps } from "../../lib/aas-editor.ts";

import { KeyTypes, ReferenceElementJsonSchema, ReferenceTypes } from "@open-dpp/dto";
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
import ReferenceElementForm from "./ReferenceElementForm.vue";

const props = defineProps<SharedEditorProps<ReferenceElementCreateEditorProps, ReferenceElementRequestDto>>();

const formSchema = z.object({
  ...SubmodelBaseFormSchema.shape,
  value: z.url(),
});
const { locale } = useI18n();
export type FormValues = z.infer<typeof formSchema>;

const { handleSubmit, errors, meta, submitCount } = useForm<FormValues>({
  validationSchema: toTypedSchema(formSchema),
  initialValues: {
    ...submodelBaseFormDefaultValues(convertLocaleToLanguage(locale.value)),
    value: "",
  },
});

const showErrors = computed(() => {
  return meta.value.dirty || submitCount.value > 0;
});

async function submit() {
  await handleSubmit(async (data) => {
    await props.callback(
      ReferenceElementJsonSchema.parse({
        ...data,
        value: {
          type: ReferenceTypes.ExternalReference,
          keys: [{
            type: KeyTypes.GlobalReference,
            value: data.value,
          }],
        },
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
  <form class="flex flex-col gap-4 p-2">
    <ReferenceElementForm
      :data="props.data"
      :show-errors="showErrors"
      :errors="errors"
      :editor-mode="EditorMode.CREATE"
    />
  </form>
</template>
