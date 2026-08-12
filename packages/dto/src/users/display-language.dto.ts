import { z } from "zod";

export const DisplayLanguage = {
  en: "en",
  de: "de",
} as const;

export const DisplayLanguageEnum = z.enum(DisplayLanguage);
export type DisplayLanguageType = z.infer<typeof DisplayLanguageEnum>;
