import { computed, toValue, type MaybeRefOrGetter } from "vue";
import { useAasUtils } from "./aas-utils";
import { Language, LanguageEnum, type LanguageType, type LanguageTextDto } from "@open-dpp/dto";
import { usePreferredLanguages } from "@vueuse/core";
import { useI18n } from "vue-i18n";
import { convertLocaleToLanguage } from "../translations/util";

export type LanguageOption = { key: string; description: string };

export function useLanguageTextList(options: LanguageTextDto[]) {
  const parseDisplayName = computed(() => {
    const { parseLanguageTexts } = useAasUtils();
    return parseLanguageTexts;
  });

  const name = computed(() => parseDisplayName.value(options));

  return {
    name,
  };
}

export function useLanguageSelect() {
  const { locale, t } = useI18n();
  const preferredLanguages = computed(() => {
    const languages = new Set<LanguageType>();

    const preferredLanguages = usePreferredLanguages();

    Object.values(Language).forEach((lang) => {
      let language = preferredLanguages.value.find((l) => l === lang || l.substring(0, 2) === lang);
      if (language) {
        languages.add(lang);
      }
    });

    return languages;
  });

  const languageNames = computed(() => new Intl.DisplayNames([locale.value], { type: "language" }));

  function toLanguageOption(tag: string): LanguageOption {
    let description: string;
    try {
      description = languageNames.value.of(tag) ?? t("language.unknown");
    } catch {
      description = t("language.unknown");
    }
    return { key: tag, description };
  }

  function languageItems(
    ignoreOptions: MaybeRefOrGetter<string[]>,
    filter: MaybeRefOrGetter<string>,
  ) {
    return computed(() => {
      const ignored = toValue(ignoreOptions);
      const filterVal = toValue(filter);
      const preferredArray = Array.from(preferredLanguages.value.values());

      const matchesFilter = (item: LanguageOption) =>
        filterVal === "" || item.description.includes(filterVal) || item.key.includes(filterVal);

      const preferredItems = preferredArray
        .map(toLanguageOption)
        .filter((item) => !ignored.includes(item.key) && matchesFilter(item));

      const allItems = Object.values(Language)
        .filter((lang) => !ignored.includes(lang) && !preferredArray.includes(lang))
        .map(toLanguageOption)
        .filter(matchesFilter);

      return { preferredItems, allItems };
    });
  }

  function nextLanguage(remainingLanguages: string[]): LanguageType | undefined {
    if (remainingLanguages.length === 0) return undefined;

    let bestMatch = remainingLanguages.find((l) => l === convertLocaleToLanguage(locale.value));

    if (!bestMatch) {
      bestMatch = preferredLanguages.value.values().find((pl) => remainingLanguages.includes(pl));
    }

    return LanguageEnum.parse(bestMatch ?? remainingLanguages[0]);
  }

  return {
    preferredLanguages,
    nextLanguage,
    languageItems,
  };
}
