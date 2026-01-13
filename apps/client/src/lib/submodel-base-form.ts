import type { LanguageType } from "@open-dpp/dto";
import { LanguageTextJsonSchema } from "@open-dpp/dto";
import { z } from "zod";

export const SubmodelBaseFormSchema = z.object({
  idShort: z.string().min(1, "IdShort is required"),
  displayName: LanguageTextJsonSchema.array(),
});

export function submodelBaseFormDefaultValues(language: LanguageType) {
  return {
    idShort: "",
    displayName: [{ language, text: "" }],
  };
}
