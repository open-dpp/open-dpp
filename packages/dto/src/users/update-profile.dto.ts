import { z } from "zod";
import { LanguageEnum } from "../aas/enums/language-enum";

export const UpdateProfileDtoSchema = z.object({
  firstName: z.string().min(1).max(100).optional(),
  lastName: z.string().min(1).max(100).optional(),
  preferredLanguage: LanguageEnum.optional(),
});

export type UpdateProfileDto = z.infer<typeof UpdateProfileDtoSchema>;
