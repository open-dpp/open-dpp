import type { LanguageType } from "@open-dpp/dto";
import type { I18n } from "vue-i18n";
import { Language } from "@open-dpp/dto";
import { createI18n } from "vue-i18n";
import { z } from "zod";

import enZod from "zod-vue-i18n/locales/v4/en.json";
import { makeZodI18nMap } from "zod-vue-i18n/v4";
import { LAST_SELECTED_LANGUAGE } from "../const.ts";
import deDE from "./de-DE.json";
import enUS from "./en-US.json";
import deZod from "./zod.de-DE.json";

export type MessageSchema = typeof deDE;

const storedLocale = localStorage.getItem(LAST_SELECTED_LANGUAGE);

export const i18n = createI18n<[MessageSchema], "en-US" | "de-DE">({
  legacy: false,
  locale: storedLocale ?? undefined,
  fallbackLocale: "en-US",
  messages: {
    "en-US": { ...enUS, ...enZod },
    "de-DE": { ...deDE, ...deZod },
  },
});

z.config({
  localeError: makeZodI18nMap(i18n as I18n),
});

export function convertLocaleToLanguage(locale: string): LanguageType {
  switch (locale) {
    case "de-DE": return Language.de;
    default: return Language.en;
  }
}
