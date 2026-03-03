<script setup lang="ts">
import type { AssetAdministrationShellModificationDto } from "@open-dpp/dto";
import type { AssetAdministrationShellEditorProps } from "../../composables/aas-drawer.ts";
import type { SharedEditorProps } from "../../lib/aas-editor.ts";
import {

  AssetAdministrationShellModificationSchema,
} from "@open-dpp/dto";
import { toTypedSchema } from "@vee-validate/zod";
import { useForm } from "vee-validate";
import { computed } from "vue";
import { z } from "zod";
import { LanguageTextFormSchema } from "../../lib/submodel-base-form.ts";
import DisplayNameForm from "./form/DisplayNameForm.vue";
import FormContainer from "./form/FormContainer.vue";

const props
  = defineProps<
    SharedEditorProps<
      AssetAdministrationShellEditorProps,
      AssetAdministrationShellModificationDto
    >
  >();

const formSchema = z.object({
  displayName: LanguageTextFormSchema.array(),
});

export type FormValues = z.infer<typeof formSchema>;

const { handleSubmit, meta, submitCount, errors } = useForm<FormValues>({
  validationSchema: toTypedSchema(formSchema),
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
      AssetAdministrationShellModificationSchema.parse({
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
  <FormContainer>
    <DisplayNameForm :show-errors="showErrors" :errors="errors" />
  </FormContainer>
</template>

<style scoped></style>
