import type { LanguageType } from "@open-dpp/dto";
import { Language } from "@open-dpp/dto";

export function convertLocaleToLanguage(locale: string): LanguageType {
  switch (locale) {
    case "de":
      return Language.de;
    default:
      return Language.en;
  }
}
