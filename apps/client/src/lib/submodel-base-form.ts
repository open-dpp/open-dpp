import type { LanguageType } from "@open-dpp/dto";
import { LanguageEnum } from "@open-dpp/dto";
import { z } from "zod";

export const LanguageTextFormSchema = z.object({
  language: LanguageEnum,
  text: z.string().min(1),
});

export const SubmodelBaseFormSchema = z.object({
  idShort: z.string().min(1, "IdShort is required"),
  displayName: LanguageTextFormSchema.array(),
  // Optional multi-language description, mirroring displayName. Defaults to an empty
  // array (see submodelBaseFormDefaultValues) — the user opts in by adding rows.
  description: LanguageTextFormSchema.array(),
});

export function displayNameFormDefaultValues(language: LanguageType) {
  return {
    displayName: [{ language, text: "" }],
  };
}

export function submodelBaseFormDefaultValues(language: LanguageType) {
  return {
    idShort: "",
    ...displayNameFormDefaultValues(language),
    // Description is optional: start empty so a blank, unfilled row can never block
    // submit (LanguageTextFormSchema requires text.min(1)).
    description: [],
  };
}
