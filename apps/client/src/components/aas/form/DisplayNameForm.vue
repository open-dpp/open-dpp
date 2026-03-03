<script setup lang="ts">
import type { LanguageTextDto, LanguageType } from "@open-dpp/dto";
import type { FormErrors } from "vee-validate";
import { Language, LanguageEnum } from "@open-dpp/dto";
import { Button, DataView } from "primevue";
import { useFieldArray } from "vee-validate";
import { computed } from "vue";
import { useI18n } from "vue-i18n";
import { convertLocaleToLanguage } from "../../../translations/i18n.ts";
import LanguageSelect from "../../basics/LanguageSelect.vue";
import TextFieldWithValidation from "../../basics/TextFieldWithValidation.vue";

const props = defineProps<{
  showErrors: boolean;
  errors: FormErrors<any>;
}>();
const { t, locale } = useI18n();
const {
  fields: displayName,
  push: pushDisplayName,
  remove: removeDisplayName,
} = useFieldArray<LanguageTextDto>("displayName");

const remainingLanguages = computed(() =>
  Object.keys(Language).filter(
    l =>
      !displayName.value
        .map(f => f.value.language)
        .includes(LanguageEnum.parse(l)),
  ),
);

function nextLanguage(): LanguageType {
  const bestMatch = remainingLanguages.value.find(
    l => l === convertLocaleToLanguage(locale.value),
  );
  return LanguageEnum.parse(bestMatch ?? remainingLanguages.value[0]);
}

function ignoreOptions(language: string) {
  return displayName.value
    .map(f => f.value.language)
    .filter(l => l !== language);
}
</script>

<template>
  <DataView :value="displayName">
    <template #header>
      <div class="flex flex-wrap items-center justify-between gap-2">
        <span class="text-xl font-bold">{{
          t("aasEditor.formLabels.name")
        }}</span>
        <Button
          icon="pi pi-plus"
          raised
          :disabled="remainingLanguages.length === 0"
          @click="
            pushDisplayName({
              text: '',
              language: nextLanguage(),
            })
          "
        />
      </div>
    </template>
    <template #list="slotProps">
      <div>
        <div
          v-for="(field, index) in slotProps.items"
          :key="field.key"
          class="grid lg:grid-cols-3 gap-4 pt-2"
        >
          <LanguageSelect
            v-model="field.value.language"
            :ignore-options="ignoreOptions(field.value.language)"
          />
          <TextFieldWithValidation
            :id="`displayName-${field.key}`"
            v-model="field.value.text"
            :label="t('aasEditor.formLabels.name')"
            :show-errors="props.showErrors"
            :error="props.errors[`displayName[${index}].text`]"
          />
          <Button
            icon="pi pi-trash"
            severity="danger"
            @click="removeDisplayName(Number(index))"
          />
        </div>
      </div>
    </template>
  </DataView>
</template>

<style scoped></style>
