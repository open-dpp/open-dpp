<script setup lang="ts">
import type { FileModificationDto } from "@open-dpp/dto";
import { FileModificationSchema, Permissions } from "@open-dpp/dto";
import type { FileEditorProps } from "../../composables/aas-drawer.ts";
import { EditorMode } from "../../composables/aas-drawer.ts";
import type { SharedEditorProps } from "../../lib/aas-editor.ts";
import { toTypedSchema } from "@vee-validate/zod";
import { useForm } from "vee-validate";

import { computed, ref } from "vue";
import { z } from "zod";
import { useAasAbility } from "../../composables/aas-ability.ts";
import { SubmodelBaseFormSchema } from "../../lib/submodel-base-form.ts";
import FileForm from "./FileForm.vue";

const props = defineProps<SharedEditorProps<FileEditorProps, FileModificationDto>>();

const formSchema = z.object({
  ...SubmodelBaseFormSchema.shape,
  value: z.nullish(z.string()),
  contentType: z.string().nullish(),
});
export type FormValues = z.infer<typeof formSchema>;

const { can } = useAasAbility({
  getAccessPermissionRules: props.getAccessPermissionRules,
});
const disableEdit = computed(() => {
  return props.isArchived || !can(Permissions.Edit, props.path.idShortPathIncludingSubmodel ?? "");
});

// Metadata (idShort, displayName, description, semanticId, qualifiers) and permissions are
// structural, not the leaf value — stay locked while restricted to data. The value field
// itself deliberately does NOT get this check (see FileForm's `disabled-value` binding
// below) so it stays editable, with submission routed through the value-only endpoint.
const disableMetadata = computed(() => disableEdit.value || props.isEditingRestrictedToData);

const permissionsFormRef = ref<{
  savePermissions: () => Promise<void>;
} | null>(null);

const { handleSubmit, submitCount } = useForm<FormValues>({
  validationSchema: toTypedSchema(formSchema),
  initialValues: {
    ...props.data,
  },
});
const showErrors = computed(() => submitCount.value > 0);

async function submit() {
  await handleSubmit(async (data) => {
    if (permissionsFormRef.value) {
      await permissionsFormRef.value.savePermissions();
    }
    await props.callback(FileModificationSchema.parse({ ...data }));
  })();
}

defineExpose<{
  submit: () => Promise<void>;
}>({
  submit,
});
</script>

<template>
  <div class="flex flex-col gap-4 p-2">
    <FileForm
      :show-errors="showErrors"
      :editor-mode="EditorMode.EDIT"
      :disabled="disableMetadata"
      :disabled-value="disableEdit"
    />
    <PermissionsForm
      ref="permissionsFormRef"
      :disabled="disableMetadata"
      :ignored-permission-options="[Permissions.Create]"
      :path="props.path"
      :modify-shell="props.modifyShell"
      :get-access-permission-rules="props.getAccessPermissionRules"
      :delete-policy-by-subject-and-object="props.deletePolicyBySubjectAndObject"
    />
  </div>
</template>
