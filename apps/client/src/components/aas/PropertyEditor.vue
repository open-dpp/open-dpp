<script setup lang="ts">
import type { PropertyModificationDto } from "@open-dpp/dto";
import type { PropertyEditorProps } from "../../composables/aas-drawer.ts";
import type { SharedEditorProps } from "../../lib/aas-editor.ts";
import { PropertyModificationSchema } from "@open-dpp/dto";
import { toTypedSchema } from "@vee-validate/zod";
import { useForm } from "vee-validate";
import { computed } from "vue";
import { z } from "zod";
import { EditorMode } from "../../composables/aas-drawer.ts";
import { useAasPermissionsForm } from "../../composables/aas-permissions-form.ts";

import { SubmodelBaseFormSchema } from "../../lib/submodel-base-form.ts";
import FormContainer from "./form/FormContainer.vue";
import PropertyForm from "./PropertyForm.vue";

const props
  = defineProps<
    SharedEditorProps<PropertyEditorProps, PropertyModificationDto>
  >();

const formSchema = z.object({
  ...SubmodelBaseFormSchema.shape,
  value: z.nullish(z.string()),
});

export type FormValues = z.infer<typeof formSchema>;

const { handleSubmit, meta, submitCount, errors } = useForm<FormValues>({
  validationSchema: toTypedSchema(formSchema),
  initialValues: { ...props.data },
});

const showErrors = computed(() => {
  return meta.value.dirty || submitCount.value > 0;
});

const { getPermissions, editPermissions, savePermissions, resetPermissions }
  = useAasPermissionsForm({
    allAccessPermissionRules: props.getAccessPermissionRules(),
    object: props.path.idShortPathIncludingSubmodel ?? "",
    modifyShell: props.modifyShell,
  });

async function submit() {
  await handleSubmit(async (data) => {
    await props.callback(PropertyModificationSchema.parse({ ...data }));
    await savePermissions();
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
    <PropertyForm
      :data="props.data"
      :show-errors="showErrors"
      :errors="errors"
      :editor-mode="EditorMode.EDIT"
    />
    <PermissionsForm
      :edit-permissions="editPermissions"
      :get-permissions="getPermissions"
      :reset-permissions="resetPermissions"
    />
  </FormContainer>
</template>
