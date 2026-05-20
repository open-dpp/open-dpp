<script setup lang="ts">
import type { PropertyModificationDto } from "@open-dpp/dto";
import type { PropertyEditorProps } from "../../composables/aas-drawer.ts";
import type { SharedEditorProps } from "../../lib/aas-editor.ts";
import { Permissions, PropertyModificationSchema } from "@open-dpp/dto";
import { toTypedSchema } from "@vee-validate/zod";
import { useForm } from "vee-validate";
import { computed, ref } from "vue";
import { z } from "zod";
import { useAasAbility } from "../../composables/aas-ability.ts";
import { EditorMode } from "../../composables/aas-drawer.ts";

import { SubmodelBaseFormSchema } from "../../lib/submodel-base-form.ts";
import FormContainer from "./form/FormContainer.vue";
import PropertyForm from "./PropertyForm.vue";
import AasActivityHistory from "./AasActivityHistory.vue";
import { useI18n } from "vue-i18n";

const props = defineProps<SharedEditorProps<PropertyEditorProps, PropertyModificationDto>>();

const formSchema = z.object({
  ...SubmodelBaseFormSchema.shape,
  value: z.nullish(z.string()),
});

const permissionsFormRef = ref<{
  savePermissions: () => Promise<void>;
} | null>(null);

export type FormValues = z.infer<typeof formSchema>;

const { handleSubmit, submitCount, errors } = useForm<FormValues>({
  validationSchema: toTypedSchema(formSchema),
  initialValues: { ...props.data },
});
const { t } = useI18n();

const showErrors = computed(() => submitCount.value > 0);

const { can } = useAasAbility({
  getAccessPermissionRules: props.getAccessPermissionRules,
});
const disableEdit = computed(() => {
  return props.isArchived || !can(Permissions.Edit, props.path.idShortPathIncludingSubmodel ?? "");
});

async function submit() {
  await handleSubmit(async (data) => {
    if (permissionsFormRef.value) {
      await permissionsFormRef.value.savePermissions();
    }
    await props.callback(PropertyModificationSchema.parse({ ...data }));
  })();
}

defineExpose<{
  submit: () => Promise<void>;
}>({
  submit,
});
</script>

<template>
  <div class="card">
    <Tabs value="0">
      <TabList>
        <Tab value="0">{{ t("aasEditor.data") }}</Tab>
        <Tab value="1">{{ t("activityHistory.label") }}</Tab>
      </TabList>
      <TabPanels>
        <TabPanel value="0">
          <FormContainer>
            <PropertyForm
              :data="props.data"
              :show-errors="showErrors"
              :errors="errors"
              :editor-mode="EditorMode.EDIT"
              :disabled="disableEdit"
            />
            <PermissionsForm
              ref="permissionsFormRef"
              :disabled="disableEdit"
              :ignored-permission-options="[Permissions.Create]"
              :path="props.path"
              :modify-shell="props.modifyShell"
              :delete-policy-by-subject-and-object="props.deletePolicyBySubjectAndObject"
              :get-access-permission-rules="props.getAccessPermissionRules"
            />
          </FormContainer>
        </TabPanel>
        <TabPanel value="1">
          <AasActivityHistory
            :id="props.id"
            :path="props.path"
            :value-type="props.data.valueType"
          />
        </TabPanel>
      </TabPanels>
    </Tabs>
  </div>
</template>
