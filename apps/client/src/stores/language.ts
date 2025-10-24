import { changeLocale } from "@formkit/i18n";
import dayjs from "dayjs";
import { defineStore } from "pinia";
import { usePrimeVue } from "primevue";
import { ref } from "vue";
import { LAST_SELECTED_LANGUAGE } from "../const.ts";
import { dePrimeVue } from "../translations/primevue/de.ts";
import { enPrimeVue } from "../translations/primevue/en.ts";

export function getShortLocale(localeValue: string) {
  const code = localeValue.toLowerCase();
  if (code.startsWith("de"))
    return "de";
  if (code.startsWith("en"))
    return "en";
  return "en"; // fallback
}

export const useLanguageStore = defineStore("language", () => {
  const primevue = usePrimeVue();
  const shortLocale = ref<"en" | "de">("en");

  const onI18nLocaleChange = (i18nLocale: string) => {
    localStorage.setItem(LAST_SELECTED_LANGUAGE, i18nLocale);
    shortLocale.value = getShortLocale(i18nLocale);
    // update dayjs locale
    dayjs.locale(shortLocale.value);
    // update primevue locale
    primevue.config.locale
      = shortLocale.value === "de" ? dePrimeVue : enPrimeVue;
    changeLocale(shortLocale.value);
  };

  return { shortLocale, onI18nLocaleChange };
});
