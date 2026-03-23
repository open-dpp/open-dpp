<script setup lang="ts">
import type { SubmodelModificationDto } from "@open-dpp/dto";
import type { SubmodelEditorProps } from "../../composables/aas-drawer.ts";
import type { SharedEditorProps } from "../../lib/aas-editor.ts";
import { toTypedSchema } from "@vee-validate/zod";
import { useForm } from "vee-validate";
import { computed } from "vue";
import { z } from "zod";
import { EditorMode } from "../../composables/aas-drawer.ts";
import { useAasPermissionsForm } from "../../composables/aas-permissions-form.ts";
import { SubmodelBaseFormSchema } from "../../lib/submodel-base-form.ts";
import FormContainer from "./form/FormContainer.vue";
import SubmodelBaseForm from "./SubmodelBaseForm.vue";

const props
  = defineProps<
    SharedEditorProps<SubmodelEditorProps, SubmodelModificationDto>
  >();

const formSchema = z.object({
  ...SubmodelBaseFormSchema.shape,
});

export type FormValues = z.infer<typeof formSchema>;

const { handleSubmit, errors, meta, submitCount } = useForm<FormValues>({
  validationSchema: toTypedSchema(formSchema),
  initialValues: { ...props.data },
});

const showErrors = computed(() => {
  return meta.value.dirty || submitCount.value > 0;
});

const { getPermissions, editPermissions, savePermissions }
  = useAasPermissionsForm({
    initialAccessPermissionRules: props.getAccessPermissionRules(),
    object: props.path.idShortPathIncludingSubmodel ?? "",
    modifyShell: props.modifyShell,
  });

async function submit() {
  await handleSubmit(async (data) => {
    await props.callback({ ...data });
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
    <SubmodelBaseForm
      :show-errors="showErrors"
      :errors="errors"
      :editor-mode="EditorMode.EDIT"
    />
    <PermissionsForm
      :edit-permissions="editPermissions"
      :get-permissions="getPermissions"
    />
  </FormContainer>
</template>
