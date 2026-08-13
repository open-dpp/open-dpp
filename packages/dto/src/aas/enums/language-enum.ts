import { z } from "zod";

export const Language = {
  bg: "bg", // Bulgarian
  cs: "cs", // Czech
  da: "da", // Danish
  de: "de", // German
  el: "el", // Greek
  en: "en", // English
  es: "es", // Spanish
  et: "et", // Estonian
  fi: "fi", // Finnish
  fr: "fr", // French
  hr: "hr", // Croatian
  hu: "hu", // Hungarian
  it: "it", // Italian
  lt: "lt", // Lithuanian
  lv: "lv", // Latvian
  nl: "nl", // Dutch
  no: "no", // Norwegian
  pl: "pl", // Polish
  pt: "pt", // Portuguese
  ro: "ro", // Romanian
  ru: "ru", // Russian
  sk: "sk", // Slovak
  sl: "sl", // Slovenian
  sv: "sv", // Swedish
  tr: "tr", // Turkish
  uk: "uk", // Ukrainian
  bn: "bn", // Bengali
  "zh-Hans": "zh-Hans", // Chinese (Simplified)
  "zh-Hant": "zh-Hant", // Chinese (Traditional)
} as const;
export const LanguageEnum = z.enum(Language);
export type LanguageType = z.infer<typeof LanguageEnum>;

export const BcpLanguageTagSchema = z.string().refine(
  (tag) => {
    try {
      return Intl.getCanonicalLocales(tag).length > 0;
    } catch {
      return false;
    }
  },
  { message: "Invalid BCP 47 language tag" },
);
export type BcpLanguageTagType = z.infer<typeof BcpLanguageTagSchema>;
