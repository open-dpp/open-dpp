import { LanguageEnum } from "@open-dpp/dto";
import { z } from "zod";

export const LanguageTextDbSchema = z.object({
  language: LanguageEnum,
  text: z.string(),
});
