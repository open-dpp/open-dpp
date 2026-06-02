<script setup lang="ts">
import { computed, ref } from "vue";
import { useI18n } from "vue-i18n";
import type { LanguageType } from "@open-dpp/dto";
import { Language } from "@open-dpp/dto";

const { ignoreOptions, disabled = false } = defineProps<{
  ignoreOptions: string[];
  disabled?: boolean;
}>();
const model = defineModel<LanguageType>();
const { t, locale } = useI18n();

interface LanguageTag {
  tag: string;
  description: string;
}

const languageFallback: Record<string, LanguageType> = {
  sq: "sq-AL",
  hy: "hy-AM",
  az: "az-AZ",
  eu: "eu-ES",
  be: "be-BY",
  bs: "bs-BA",
  br: "br-FR",
  bg: "bg-BG",
  ca: "ca-ES",
  hr: "hr-HR",
  cs: "cs-CZ",
  da: "da-DK",
  nl: "nl-NL",
  en: "en-GB",
  et: "et-EE",
  fo: "fo-FO",
  fi: "fi-FI",
  fr: "fr-FR",
  fy: "fy-NL",
  gl: "gl-ES",
  de: "de-DE",
  el: "el-GR",
  hu: "hu-HU",
  is: "is-IS",
  ga: "ga-IE",
  it: "it-IT",
  lv: "lv-LV",
  lt: "lt-LT",
  lb: "lb-LU",
  mk: "mk-MK",
  mt: "mt-MT",
  nb: "nb-NO",
  nn: "nn-NO",
  no: "nb-NO",
  pl: "pl-PL",
  pt: "pt-PT",
  ro: "ro-RO",
  rm: "rm-CH",
  ru: "ru-RU",
  gd: "gd-GB",
  sr: "sr-Cyrl-RS",
  sk: "sk-SK",
  sl: "sl-SI",
  es: "es-ES",
  sv: "sv-SE",
  tr: "tr-TR",
  uk: "uk-UA",
  cy: "cy-GB",
  zh: "zh-Hans-CN",
  bn: "bn-BD",
};

const languageNames = computed(() => new Intl.DisplayNames([locale.value], { type: "language" }));

const getLanguageNameSafe = (language: string) => {
  try {
    return languageNames.value.of(language);
  } catch {
    return null;
  }
};

const getUserPreferredLanguage = () => {
  const tags = new Set<LanguageType>(["de-DE", "en-US"]);

  navigator.languages.forEach((lang) => {
    if (lang.length === 2 && languageFallback[lang]) {
      tags.add(languageFallback[lang]);
    } else if (Object.values(Language).includes(lang as LanguageType)) {
      tags.add(lang as LanguageType);
    }
  });

  return Array.from(tags.values());
};

const initialOptions = (): LanguageTag[] => {
  const tags = getUserPreferredLanguage();

  return tags
    .map((tag) => ({
      tag: tag,
      description: getLanguageNameSafe(tag) ?? t("language.unknown"),
    }));
};

const languageOptions = ref(initialOptions());

const availableLanguageOptions = computed(() => languageOptions.value.filter(tag => !ignoreOptions.includes(tag.tag)))

const languagesWithNames = computed(() => {
  return Object.values(Language).map((tag) => ({
    tag: tag,
    description: getLanguageNameSafe(tag) ?? t("language.unknown"),
  }));
});

const searchLanguage = (language: string) => {
  if (language.length === 0) {
    languageOptions.value = initialOptions();
    return;
  }

  languageOptions.value = languagesWithNames.value.filter((t) => {
    return t.description?.includes(language) || t.tag.includes(language);
  });
};

if (model.value) {
  if (model.value === Language.en) {
    model.value = Language["en-US"]
  }
  if (model.value === Language.de) {
    model.value = Language["de-DE"]
  }
}
</script>

<template>
  <Select
    v-model="model"
    :disabled="disabled"
    :options="availableLanguageOptions"
    filter
    @filter="searchLanguage($event.value)"
    option-value="tag"
    option-label="description"
    placeholder="Select a Language"
  />
</template>

<style scoped></style>
