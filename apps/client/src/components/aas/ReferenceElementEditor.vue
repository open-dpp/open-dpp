<script setup lang="ts">
import type { ReferenceElementModificationDto } from "@open-dpp/dto";
import type { ReferenceElementEditorProps } from "../../composables/aas-drawer.ts";
import type { SharedEditorProps } from "../../lib/aas-editor.ts";
import {
  KeyTypes,
  Permissions,
  ReferenceElementModificationSchema,
  ReferenceTypes,
} from "@open-dpp/dto";
import { toTypedSchema } from "@vee-validate/zod";

import { useForm } from "vee-validate";
import { computed, ref } from "vue";
import { z } from "zod";
import { useAasAbility } from "../../composables/aas-ability.ts";
import { EditorMode } from "../../composables/aas-drawer.ts";
import { SubmodelBaseFormSchema } from "../../lib/submodel-base-form.ts";
import FormContainer from "./form/FormContainer.vue";
import ReferenceElementForm from "./ReferenceElementForm.vue";

const props =
  defineProps<SharedEditorProps<ReferenceElementEditorProps, ReferenceElementModificationDto>>();
const formSchema = z.object({
  ...SubmodelBaseFormSchema.shape,
  value: z.url().nullable(),
});
export type FormValues = z.infer<typeof formSchema>;

const { handleSubmit, errors, submitCount } = useForm<FormValues>({
  validationSchema: toTypedSchema(formSchema),
  initialValues: {
    ...props.data,
    value:
      props.data.value && props.data.value.keys.length > 0 ? props.data.value.keys[0].value : null,
  },
});

const { can } = useAasAbility({
  getAccessPermissionRules: props.getAccessPermissionRules,
});
const disableEdit = computed(() => {
  return props.isArchived || !can(Permissions.Edit, props.path.idShortPathIncludingSubmodel ?? "");
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

    const body = ReferenceElementModificationSchema.parse({
      ...data,
      value: data.value
        ? {
            type: props.data.value?.type ?? ReferenceTypes.ExternalReference,
            keys: [
              {
                type: props.data.value?.keys[0]?.type ?? KeyTypes.GlobalReference,
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
      :disabled="disableEdit"
      :data="props.data"
      :show-errors="showErrors"
      :errors="errors"
      :editor-mode="EditorMode.EDIT"
    />
    <PermissionsForm
      ref="permissionsFormRef"
      :disabled="disableEdit"
      :ignored-permission-options="[Permissions.Create]"
      :path="props.path"
      :modify-shell="props.modifyShell"
      :get-access-permission-rules="props.getAccessPermissionRules"
      :delete-policy-by-subject-and-object="props.deletePolicyBySubjectAndObject"
    />
  </FormContainer>
</template>
