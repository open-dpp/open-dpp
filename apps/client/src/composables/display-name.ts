import type { Ref } from "vue";
import { computed } from "vue";
import { useI18n } from "vue-i18n";

export interface DisplayName {
  language: "en" | "de";
  text: string;
}

export function useDisplayName(options: DisplayName[]) {
  const { locale, t } = useI18n();

  const description = computed(() => {
    const shortLocale = locale.value.split("-")[0];

    let option = options.find(opt => opt.language === shortLocale);

    if (!option) {
      option = options.find(opt => opt.language === "en");
    }

    if (!option) {
      option = options[0];
    }

    return option ? option.text : t("unknown name");
  });

  return { description };
}
