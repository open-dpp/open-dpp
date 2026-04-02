<script setup lang="ts">
import type { FileModificationDto } from "@open-dpp/dto";
import type { FileEditorProps } from "../../composables/aas-drawer.ts";
import type { SharedEditorProps } from "../../lib/aas-editor.ts";
import { FileModificationSchema, Permissions } from "@open-dpp/dto";
import { toTypedSchema } from "@vee-validate/zod";
import { useForm } from "vee-validate";

import { computed } from "vue";
import { z } from "zod";
import { EditorMode } from "../../composables/aas-drawer.ts";
import { useAasPermissionsForm } from "../../composables/aas-permissions-form.ts";
import { SubmodelBaseFormSchema } from "../../lib/submodel-base-form.ts";
import FileForm from "./FileForm.vue";

const props
  = defineProps<SharedEditorProps<FileEditorProps, FileModificationDto>>();

const formSchema = z.object({
  ...SubmodelBaseFormSchema.shape,
  value: z.nullish(z.string()),
  contentType: z.string().nullish(),
});
export type FormValues = z.infer<typeof formSchema>;

const { handleSubmit, errors, meta, submitCount } = useForm<FormValues>({
  validationSchema: toTypedSchema(formSchema),
  initialValues: {
    ...props.data,
  },
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
    await props.callback(FileModificationSchema.parse({ ...data }));
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
  <div class="flex flex-col gap-4 p-2">
    <FileForm
      :show-errors="showErrors"
      :errors="errors"
      :editor-mode="EditorMode.EDIT"
    />
    <PermissionsForm
      :edit-permissions="editPermissions"
      :get-permissions="getPermissions"
      :reset-permissions="resetPermissions"
      :ignored-permission-options="[Permissions.Create]"
    />
  </div>
</template>
