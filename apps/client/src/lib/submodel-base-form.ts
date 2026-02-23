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
});

export function submodelBaseFormDefaultValues(language: LanguageType) {
  return {
    idShort: "",
    displayName: [{ language, text: "" }],
  };
}
