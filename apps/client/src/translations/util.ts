import type { LanguageType } from "@open-dpp/dto";
import { Language } from "@open-dpp/dto";

export function convertLocaleToLanguage(locale: string): LanguageType {
  let localeTag = locale;
  if (localeTag.includes("-")) {
    const simpleTag = localeTag.split("-")[0];
    if (simpleTag) localeTag = simpleTag;
  }
  switch (localeTag.toLowerCase()) {
    case "de":
      return Language.de;
    default:
      return Language.en;
  }
}
