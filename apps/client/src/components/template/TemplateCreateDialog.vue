<script setup lang="ts">
import type { CreateTemplateCallback } from "../../composables/templates.ts";
import { toTypedSchema } from "@vee-validate/zod";
import { Button, Dialog } from "primevue";
import { useForm } from "vee-validate";
import { computed } from "vue";
import { useI18n } from "vue-i18n";
import { z } from "zod";
import {
  displayNameFormDefaultValues,
  LanguageTextFormSchema,
} from "../../lib/submodel-base-form.ts";
import { convertLocaleToLanguage } from "../../translations/i18n.ts";
import DisplayNameForm from "../aas/form/DisplayNameForm.vue";

const props = defineProps<{ createTemplate: CreateTemplateCallback }>();

const { t, locale } = useI18n();

const visible = defineModel<boolean>();

const formSchema = z.object({
  displayName: LanguageTextFormSchema.array(),
});

export type FormValues = z.infer<typeof formSchema>;

const { handleSubmit, meta, submitCount, errors } = useForm<FormValues>({
  validationSchema: toTypedSchema(formSchema),
  initialValues: {
    ...displayNameFormDefaultValues(convertLocaleToLanguage(locale.value)),
  },
});

const showErrors = computed(() => {
  return meta.value.dirty || submitCount.value > 0;
});

function close() {
  visible.value = false;
}

async function submit() {
  await handleSubmit(async (data) => {
    await props.createTemplate({ displayName: data.displayName });
    close();
  })();
}
</script>

<template>
  <Dialog
    v-model:visible="visible"
    modal
    :header="t('templates.create')"
    @hide="close"
  >
    <div class="flex flex-col gap-4">
      <DisplayNameForm :show-errors="showErrors" :errors="errors" />
      <div class="flex justify-end gap-2">
        <Button
          type="button"
          :label="t('common.cancel')"
          severity="secondary"
          @click="close"
        />
        <Button type="button" :label="t('common.add')" @click="submit" />
      </div>
    </div>
  </Dialog>
</template>

<style scoped></style>
