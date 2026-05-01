<script setup lang="ts">
import type { LanguageTextDto, LanguageType } from "@open-dpp/dto";
import { Language, LanguageEnum } from "@open-dpp/dto";
import { useFieldArray } from "vee-validate";
import { computed } from "vue";
import { useI18n } from "vue-i18n";
import { convertLocaleToLanguage } from "../../../translations/i18n.ts";
import DisplayNameRow from "./DisplayNameRow.vue";

const props = defineProps<{
  submitAttempted: boolean;
  disabled?: boolean;
}>();
const { t, locale } = useI18n();
const {
  fields: displayName,
  push: pushDisplayName,
  remove: removeDisplayName,
} = useFieldArray<LanguageTextDto>("displayName");

const remainingLanguages = computed(() =>
  Object.keys(Language).filter(
    (l) => !displayName.value.map((f) => f.value.language).includes(LanguageEnum.parse(l)),
  ),
);

function nextLanguage(): LanguageType {
  const bestMatch = remainingLanguages.value.find(
    (l) => l === convertLocaleToLanguage(locale.value),
  );
  return LanguageEnum.parse(bestMatch ?? remainingLanguages.value[0]);
}

function ignoreOptions(language: LanguageType): LanguageType[] {
  return displayName.value
    .map((f) => f.value.language)
    .filter((l): l is LanguageType => l !== language);
}
</script>

<template>
  <div>
    <h3 class="pb-2 text-xl font-bold">{{ t("aasEditor.formLabels.name") }}</h3>
    <DisplayNameRow
      v-if="displayName.length > 0"
      v-for="(field, index) in displayName"
      :key="field.key"
      :index="Number(index)"
      :field-key="field.key"
      :submit-attempted="props.submitAttempted"
      :ignore-language-options="ignoreOptions(field.value.language)"
      :disabled="props.disabled"
      @remove="removeDisplayName(Number(index))"
    />
    <div>
      <Button
        severity="secondary"
        data-cy="add-display-name"
        :aria-label="t('common.add')"
        icon="pi pi-plus"
        label="Sprache hinzufügen"
        :disabled="remainingLanguages.length === 0 || props.disabled"
        @click="
          pushDisplayName({
            text: '',
            language: nextLanguage(),
          })
        "
      ></Button>
    </div>
  </div>
</template>

<style scoped></style>
