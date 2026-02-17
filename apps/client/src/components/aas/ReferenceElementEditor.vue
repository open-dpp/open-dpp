<script setup lang="ts">
import type { ReferenceElementModificationDto } from "@open-dpp/dto";
import type {
  ReferenceElementEditorProps,
} from "../../composables/aas-drawer.ts";
import type { SharedEditorProps } from "../../lib/aas-editor.ts";

import {

  ReferenceElementModificationSchema,
} from "@open-dpp/dto";
import { toTypedSchema } from "@vee-validate/zod";
import { useForm } from "vee-validate";
import { computed } from "vue";
import { z } from "zod";
import { EditorMode } from "../../composables/aas-drawer.ts";
import { SubmodelBaseFormSchema } from "../../lib/submodel-base-form.ts";
import ReferenceElementForm from "./ReferenceElementForm.vue";

const props = defineProps<SharedEditorProps<ReferenceElementEditorProps, ReferenceElementModificationDto>>();
const formSchema = z.object({
  ...SubmodelBaseFormSchema.shape,
  value: z.url(),
});
export type FormValues = z.infer<typeof formSchema>;

const { handleSubmit, errors, meta, submitCount } = useForm<FormValues>({
  validationSchema: toTypedSchema(formSchema),
  initialValues: {
    ...props.data,
    value: props.data.value.keys.length ? props.data.value.keys[0].value : "",
  },
});

const showErrors = computed(() => {
  return meta.value.dirty || submitCount.value > 0;
});

const submit = handleSubmit(async (data) => {
  const body = ReferenceElementModificationSchema.parse({
    ...data,
    value: {
      type: props.data.value.type,
      keys: [
        {
          type: props.data.value.keys[0].type,
          value: data.value,
        },
      ],
    },
  });
  await props.callback(body);
});

defineExpose<{
  submit: () => Promise<Promise<void> | undefined>;
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
      :editor-mode="EditorMode.EDIT"
    />
  </form>
</template>
