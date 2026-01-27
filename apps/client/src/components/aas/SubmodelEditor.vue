<script setup lang="ts">
import type { SubmodelModificationDto, SubmodelResponseDto } from "@open-dpp/dto";
import type { AasEditorPath } from "../../composables/aas-drawer.ts";
import { toTypedSchema } from "@vee-validate/zod";
import { useForm } from "vee-validate";
import { computed } from "vue";
import { z } from "zod";
import { EditorMode } from "../../composables/aas-drawer.ts";
import { SubmodelBaseFormSchema } from "../../lib/submodel-base-form.ts";
import SubmodelBaseForm from "./SubmodelBaseForm.vue";

const props = defineProps<{
  path: AasEditorPath;
  data: SubmodelResponseDto;
  callback: (data: SubmodelModificationDto) => Promise<void>;
}>();

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

const submit = handleSubmit(async (data) => {
  await props.callback({ ...data });
});

defineExpose<{
  submit: () => Promise<Promise<void> | undefined>;
}>({
  submit,
});
</script>

<template>
  <form class="flex flex-col gap-1 p-2">
    <SubmodelBaseForm :show-errors="showErrors" :errors="errors" :editor-mode="EditorMode.EDIT" />
  </form>
</template>
