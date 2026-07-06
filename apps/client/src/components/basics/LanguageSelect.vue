<script setup lang="ts">
import { computed, ref } from "vue";
import { useI18n } from "vue-i18n";
import type { LanguageType } from "@open-dpp/dto";
import { Language } from "@open-dpp/dto";
import { useLanguageSelect } from "../../composables/language";

const { ignoreOptions, disabled = false } = defineProps<{
  ignoreOptions: string[];
  disabled?: boolean;
}>();
const model = defineModel<LanguageType>();
const { t, locale } = useI18n();
const filter = ref("");

const { preferredLanguages } = useLanguageSelect();

const languageNames = computed(() => new Intl.DisplayNames([locale.value], { type: "language" }));

const getLanguageNameSafe = (language: string) => {
  try {
    return languageNames.value.of(language);
  } catch {
    return null;
  }
};

const tagToLanguageTag = (tag: string) => ({
  tag: tag,
  description: getLanguageNameSafe(tag) ?? t("language.unknown"),
});

const options = computed(() => {
  const preferredLanguagesArray = Array.from(preferredLanguages.value.values());
  let preferredItems = preferredLanguagesArray
    .map(tagToLanguageTag)
    .filter((language) => !ignoreOptions.includes(language.tag));

  if (filter.value !== "") {
    preferredItems = preferredItems.filter(
      (item) => item.description.includes(filter.value) || item.tag.includes(filter.value),
    );
  }

  let allItems = Object.values(Language)
    .filter(
      (language) =>
        !ignoreOptions.includes(language) && !preferredLanguagesArray.includes(language),
    )
    .map(tagToLanguageTag);

  if (filter.value !== "") {
    allItems = allItems.filter(
      (item) => item.description.includes(filter.value) || item.tag.includes(filter.value),
    );
  }

  const groups = [];

  if (preferredItems.length > 0) {
    groups.push({
      label: t("language.preferred"),
      items: preferredItems,
    });
  }

  if (allItems.length > 0) {
    groups.push({
      label: t("language.all"),
      items: allItems,
    });
  }

  return groups;
});
</script>

<template>
  <Select
    v-model="model"
    :disabled="disabled"
    :options="options"
    filter
    @filter="filter = $event.value"
    option-value="tag"
    option-label="description"
    option-group-children="items"
    option-group-label="label"
    placeholder="Select a Language"
  />
</template>

<style scoped></style>
