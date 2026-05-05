<script setup lang="ts">
import type { AssetAdministrationShellModificationDto } from "@open-dpp/dto";
import type { AssetAdministrationShellEditorProps } from "../../composables/aas-drawer.ts";
import type { SharedEditorProps } from "../../lib/aas-editor.ts";
import { AssetAdministrationShellModificationSchema } from "@open-dpp/dto";
import { toTypedSchema } from "@vee-validate/zod";
import { useForm } from "vee-validate";
import { computed, onMounted } from "vue";
import { useI18n } from "vue-i18n";
import { z } from "zod";
import { useAasGallery } from "../../composables/aas-gallery.ts";
import { LanguageTextFormSchema } from "../../lib/submodel-base-form.ts";
import { useErrorHandlingStore } from "../../stores/error.handling.ts";
import GalleriaEdit from "../media/GalleriaEdit.vue";
import DisplayNameForm from "./form/DisplayNameForm.vue";

const props =
  defineProps<
    SharedEditorProps<AssetAdministrationShellEditorProps, AssetAdministrationShellModificationDto>
  >();

const { t } = useI18n();
const errorHandlingStore = useErrorHandlingStore();
const {
  files,
  downloadDefaultThumbnails,
  assetInformation,
  addImage,
  removeImage,
  moveImage,
  modifyImage,
} = useAasGallery({ translate: t, errorHandlingStore });

const formSchema = z.object({
  displayName: LanguageTextFormSchema.array(),
});

export type FormValues = z.infer<typeof formSchema>;

const { handleSubmit, submitCount } = useForm<FormValues>({
  validationSchema: toTypedSchema(formSchema),
  initialValues: {
    ...props.data,
  },
});

const showErrors = computed(() => submitCount.value > 0);

async function submit() {
  await handleSubmit(async (data) => {
    await props.callback(
      AssetAdministrationShellModificationSchema.parse({
        ...data,
        assetInformation: assetInformation.value,
      }),
    );
  })();
}

onMounted(async () => {
  await downloadDefaultThumbnails(props.data);
});

defineExpose<{
  submit: () => Promise<void>;
}>({
  submit,
});
</script>

<template>
  <div class="flex flex-col gap-4 p-2">
    <DisplayNameForm :submit-attempted="showErrors" />
    <GalleriaEdit
      v-model="files"
      :title="t('aasEditor.productImages')"
      @add-image="addImage"
      @remove-image="removeImage"
      @modify-image="modifyImage"
      @move-image="moveImage"
    />
  </div>
</template>

<style scoped></style>
