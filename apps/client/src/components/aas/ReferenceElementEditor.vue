<script setup lang="ts">
import type { ReferenceElementModificationDto } from "@open-dpp/dto";
import type { ReferenceElementEditorProps } from "../../composables/aas-drawer.ts";
import type { SharedEditorProps } from "../../lib/aas-editor.ts";
import {
  KeyTypes,
  ReferenceElementModificationSchema,
  ReferenceTypes,
} from "@open-dpp/dto";
import { toTypedSchema } from "@vee-validate/zod";

import { useForm } from "vee-validate";
import { computed } from "vue";
import { z } from "zod";
import { EditorMode } from "../../composables/aas-drawer.ts";
import { SubmodelBaseFormSchema } from "../../lib/submodel-base-form.ts";
import FormContainer from "./form/FormContainer.vue";
import ReferenceElementForm from "./ReferenceElementForm.vue";

const props
  = defineProps<
    SharedEditorProps<
      ReferenceElementEditorProps,
      ReferenceElementModificationDto
    >
  >();
const formSchema = z.object({
  ...SubmodelBaseFormSchema.shape,
  value: z.url().nullable(),
});
export type FormValues = z.infer<typeof formSchema>;

const { handleSubmit, errors, meta, submitCount } = useForm<FormValues>({
  validationSchema: toTypedSchema(formSchema),
  initialValues: {
    ...props.data,
    value:
      props.data.value && props.data.value.keys.length > 0
        ? props.data.value.keys[0].value
        : null,
  },
});

const showErrors = computed(() => {
  return meta.value.dirty || submitCount.value > 0;
});

async function submit() {
  await handleSubmit(async (data) => {
    const body = ReferenceElementModificationSchema.parse({
      ...data,
      value: data.value
        ? {
            type: props.data.value?.type ?? ReferenceTypes.ExternalReference,
            keys: [
              {
                type:
                  props.data.value?.keys[0]?.type ?? KeyTypes.GlobalReference,
                value: data.value,
              },
            ],
          }
        : null,
    });
    await props.callback(body);
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
    <ReferenceElementForm
      :data="props.data"
      :show-errors="showErrors"
      :errors="errors"
      :editor-mode="EditorMode.EDIT"
    />
  </FormContainer>
</template>
