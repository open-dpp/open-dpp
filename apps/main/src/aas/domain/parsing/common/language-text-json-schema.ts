import { z } from "zod";

import { LanguageEnum } from "../../common/language-enum";

export const LanguageTextJsonSchema = z.object({
  language: LanguageEnum,
  text: z.string(),
});
