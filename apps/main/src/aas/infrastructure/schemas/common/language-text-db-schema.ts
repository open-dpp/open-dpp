import { z } from "zod";
import { LanguageEnum } from "../../../domain/common/language-enum";

export const LanguageTextDbSchema = z.object({
  language: LanguageEnum,
  text: z.string(),
});
