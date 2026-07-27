import { computed } from "vue";
import { useI18n } from "vue-i18n";
import type { LanguageTextDto } from "@open-dpp/dto";

export interface DisplayName {
  language: "en" | "de";
  text: string;
}

export function resolveLanguageTexts(
  options: LanguageTextDto[],
  locale: string,
  fallback: string,
): string {
  const shortLocale = locale.split("-")[0];

  let option = options.find((opt) => opt.language === shortLocale);

  if (!option) {
    option = options.find((opt) => opt.language === "en");
  }

  if (!option) {
    option = options[0];
  }

  return option ? option.text : fallback;
}

export function useLanguageTexts(options: DisplayName[]) {
  const { locale, t } = useI18n();

  const text = computed(() => resolveLanguageTexts(options, locale.value, t("common.unknownName")));

  return { text };
}
