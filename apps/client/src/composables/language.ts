import { computed } from "vue";
import { useAasUtils } from "./aas-utils";
import { Language, type LanguageType, type LanguageTextDto } from "@open-dpp/dto";
import { usePreferredLanguages } from "@vueuse/core";

export function useLanguageTextList(options: LanguageTextDto[]) {
  const parseDisplayName = computed(() => {
    const { parseDisplayName } = useAasUtils();
    return parseDisplayName;
  });

  const name = computed(() => parseDisplayName.value(options));

  return {
    name,
  };
}

export function useLanguageSelect() {
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

  return {
    preferredLanguages,
  };
}
