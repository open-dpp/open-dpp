import { z } from "zod";
import { LanguageEnum } from "../aas/enums/language-enum";

export const UpdateProfileDtoSchema = z.object({
  firstName: z.string().trim().min(1).max(100).optional(),
  lastName: z.string().trim().min(1).max(100).optional(),
  preferredLanguage: LanguageEnum.optional(),
});

export type UpdateProfileDto = z.infer<typeof UpdateProfileDtoSchema>;
