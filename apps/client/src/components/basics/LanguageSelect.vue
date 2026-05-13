<script setup lang="ts">
import { computed, ref } from "vue";
import { useI18n } from "vue-i18n";
import { search } from "language-tags";

const props = defineProps<{ ignoreOptions: string[]; disabled?: boolean }>();
const model = defineModel();
const { t, locale } = useI18n();

interface LanguageTag {
  tag: string;
  description: string;
}

const languageNames = new Intl.DisplayNames([locale.value], { type: "language" });

const initialOptions = (): LanguageTag[] => {
  const tags = [...new Set([...navigator.languages, "de-DE", "en-US"])];

  return tags.map((tag) => ({
    tag: tag,
    description: languageNames.of(tag) ?? t("language.unknown"),
  }));
};

const languageOptions = ref(initialOptions());

const searchLanguage = (language: string) => {
  if (language.length === 0) {
    languageOptions.value = initialOptions();
    return;
  }

  const tags = search(language).filter((t) => t.type() === "language");

  languageOptions.value = tags.slice(0, Math.min(tags.length, 5)).map((tag) => ({
    tag: tag.format(),
    description: tag.descriptions()[0] ?? t("language.unknown")
  }));

};
</script>

<template>
  <Select
    v-model="model"
    :disabled="props.disabled"
    :options="languageOptions"
    filter
    @filter="searchLanguage($event.value)"
    option-value="tag"
    option-label="description"
    placeholder="Select a Language"
  />
</template>

<style scoped></style>
