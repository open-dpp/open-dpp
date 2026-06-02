import { computed } from "vue";
import { useI18n } from "vue-i18n";
import { useAasUtils } from "./aas-utils";
import type { LanguageTextDto } from "@open-dpp/dto";
import { convertLocaleToLanguage } from "../translations/util";

export function useDisplayName(options: LanguageTextDto[]) {
  const { locale, t } = useI18n();

  const parseDisplayName = computed(() => {
    const { parseDisplayName } = useAasUtils({
      translate: t,
      selectedLanguage: convertLocaleToLanguage(locale.value),
    });
    return parseDisplayName;
  });

  return computed(() => parseDisplayName.value(options));
}
