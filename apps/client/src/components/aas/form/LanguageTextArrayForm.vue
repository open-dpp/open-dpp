<script setup lang="ts">
import type { LanguageTextDto, LanguageType } from "@open-dpp/dto";
import { Language, LanguageEnum } from "@open-dpp/dto";
import { useFieldArray } from "vee-validate";
import { computed } from "vue";
import { useI18n } from "vue-i18n";
import { convertLocaleToLanguage } from "../../../translations/i18n.ts";
import LanguageTextArrayRow from "./LanguageTextArrayRow.vue";

const props = defineProps<{
  // Name of the vee-validate field array to edit (e.g. "displayName", "description").
  fieldName: string;
  // i18n key for the section heading and the per-row text field label.
  heading: string;
  rowLabel: string;
  // Kebab-case prefix for the add/remove data-cy hooks (e.g. "display-name").
  dataCyPrefix: string;
  submitAttempted: boolean;
  disabled?: boolean;
}>();

const { t, locale } = useI18n();
const {
  fields,
  push: pushRow,
  remove: removeRow,
} = useFieldArray<LanguageTextDto>(props.fieldName);

const remainingLanguages = computed(() =>
  Object.keys(Language).filter(
    (l) => !fields.value.map((f) => f.value.language).includes(LanguageEnum.parse(l)),
  ),
);

function nextLanguage(): LanguageType {
  const bestMatch = remainingLanguages.value.find(
    (l) => l === convertLocaleToLanguage(locale.value),
  );
  return LanguageEnum.parse(bestMatch ?? remainingLanguages.value[0]);
}

function ignoreOptions(language: LanguageType): LanguageType[] {
  return fields.value.map((f) => f.value.language).filter((l): l is LanguageType => l !== language);
}
</script>

<template>
  <div>
    <h3 class="pb-2 text-xl font-bold">{{ t(props.heading) }}</h3>
    <LanguageTextArrayRow
      v-if="fields.length > 0"
      v-for="(field, index) in fields"
      :key="field.key"
      :field-name="props.fieldName"
      :data-cy-prefix="props.dataCyPrefix"
      :row-label="props.rowLabel"
      :index="Number(index)"
      :field-key="field.key"
      :submit-attempted="props.submitAttempted"
      :ignore-language-options="ignoreOptions(field.value.language)"
      :disabled="props.disabled"
      @remove="removeRow(Number(index))"
    />
    <div>
      <Button
        severity="secondary"
        :data-cy="`add-${props.dataCyPrefix}`"
        :aria-label="t('common.add')"
        icon="pi pi-plus"
        :label="t('aasEditor.addLanguage')"
        :disabled="remainingLanguages.length === 0 || props.disabled"
        @click="
          pushRow({
            text: '',
            language: nextLanguage(),
          })
        "
      ></Button>
    </div>
  </div>
</template>
