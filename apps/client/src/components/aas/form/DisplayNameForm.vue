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
  <DataView :value="displayName">
    <template #header>
      <div class="flex flex-wrap items-center justify-between gap-2">
        <h3 class="text-xl font-bold">{{ t("aasEditor.formLabels.name") }}</h3>
        <Button
          data-cy="add-display-name"
          :aria-label="t('common.add')"
          icon="pi pi-plus"
          rounded
          raised
          :disabled="remainingLanguages.length === 0 || props.disabled"
          @click="
            pushDisplayName({
              text: '',
              language: nextLanguage(),
            })
          "
        />
      </div>
    </template>
    <template #empty>
      <div class="text-muted-color px-4 py-6 text-sm">{{ t("common.noEntries") }}</div>
    </template>
    <template #list="slotProps">
      <div>
        <DisplayNameRow
          v-for="(field, index) in slotProps.items"
          :key="field.key"
          :index="Number(index)"
          :field-key="field.key"
          :submit-attempted="props.submitAttempted"
          :ignore-language-options="ignoreOptions(field.value.language)"
          :disabled="props.disabled"
          @remove="removeDisplayName(Number(index))"
        />
      </div>
    </template>
  </DataView>
</template>

<style scoped></style>
