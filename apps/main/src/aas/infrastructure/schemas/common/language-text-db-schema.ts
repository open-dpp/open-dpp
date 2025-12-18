import { LanguageEnum } from "@open-dpp/aas";
import { z } from "zod";

export const LanguageTextDbSchema = z.object({
  language: LanguageEnum,
  text: z.string(),
});
