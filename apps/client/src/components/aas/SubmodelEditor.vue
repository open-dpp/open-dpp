<script setup lang="ts">
import type { SubmodelModificationDto } from "@open-dpp/dto";
import type { SubmodelEditorProps } from "../../composables/aas-drawer.ts";
import type { SharedEditorProps } from "../../lib/aas-editor.ts";
import { Permissions } from "@open-dpp/dto";
import { toTypedSchema } from "@vee-validate/zod";
import { useForm } from "vee-validate";
import { computed, ref } from "vue";
import { z } from "zod";
import { useAasAbility } from "../../composables/aas-ability.ts";
import { EditorMode } from "../../composables/aas-drawer.ts";
import { SubmodelBaseFormSchema } from "../../lib/submodel-base-form.ts";
import FormContainer from "./form/FormContainer.vue";
import SubmodelBaseForm from "./SubmodelBaseForm.vue";

const props = defineProps<SharedEditorProps<SubmodelEditorProps, SubmodelModificationDto>>();

const formSchema = z.object({
  ...SubmodelBaseFormSchema.shape,
});

export type FormValues = z.infer<typeof formSchema>;

const { handleSubmit, submitCount } = useForm<FormValues>({
  validationSchema: toTypedSchema(formSchema),
  initialValues: { ...props.data },
});

const showErrors = computed(() => submitCount.value > 0);

const permissionsFormRef = ref<{
  savePermissions: () => Promise<void>;
} | null>(null);

async function submit() {
  await handleSubmit(async (data) => {
    if (permissionsFormRef.value) {
      await permissionsFormRef.value.savePermissions();
    }
    await props.callback({ ...data });
  })();
}

const { can } = useAasAbility({
  getAccessPermissionRules: props.getAccessPermissionRules,
});

const disableEdit = computed(() => {
  return props.isArchived || !can(Permissions.Edit, props.path.idShortPathIncludingSubmodel ?? "");
});

defineExpose<{
  submit: () => Promise<void>;
}>({
  submit,
});
</script>

<template>
  <FormContainer>
    <SubmodelBaseForm
      :disabled="disableEdit"
      :show-errors="showErrors"
      :editor-mode="EditorMode.EDIT"
    />
    <PermissionsForm
      ref="permissionsFormRef"
      :disabled="disableEdit"
      :path="props.path"
      :modify-shell="props.modifyShell"
      :get-access-permission-rules="props.getAccessPermissionRules"
      hide-inheritance-toggle
      :delete-policy-by-subject-and-object="props.deletePolicyBySubjectAndObject"
    />
  </FormContainer>
</template>
