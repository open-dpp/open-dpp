import { z } from "zod";
import { LanguageEnum } from "../aas/enums/language-enum";

export const UpdateProfileDtoSchema = z.object({
  // Empty string is a valid "cleared name" — admin-invited users have firstName: "".
  // No .min(1): it would lock empty-name users out of saving any profile change.
  firstName: z.string().trim().max(100).optional(),
  lastName: z.string().trim().max(100).optional(),
  preferredLanguage: LanguageEnum.optional(),
});

export type UpdateProfileDto = z.infer<typeof UpdateProfileDtoSchema>;
