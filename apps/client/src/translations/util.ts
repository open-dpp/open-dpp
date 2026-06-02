import type { LanguageType } from "@open-dpp/dto";
import { Language } from "@open-dpp/dto";

export function convertLocaleToLanguage(locale: string): LanguageType {
  switch (locale) {
    case "de-DE":
      return Language['de-DE'];
    default:
      return Language['en-US'];
  }
}