import type { LanguageType } from "@open-dpp/dto";
import { Language } from "@open-dpp/dto";
import { createI18n } from "vue-i18n";
import { LAST_SELECTED_LANGUAGE } from "../const.ts";
import deDE from "./de-DE.json";
import enUS from "./en-US.json";

export type MessageSchema = typeof deDE;

const storedLocale = localStorage.getItem(LAST_SELECTED_LANGUAGE);

export const i18n = createI18n<[MessageSchema], "en-US" | "de-DE">({
  legacy: false,
  locale: storedLocale ?? "de-DE",
  fallbackLocale: "en-US",
  messages: {
    "en-US": enUS,
    "de-DE": deDE,
  },
});

export function convertLocaleToLanguage(locale: string): LanguageType {
  switch (locale) {
    case "de-DE": return Language.de;
    default: return Language.en;
  }
}
