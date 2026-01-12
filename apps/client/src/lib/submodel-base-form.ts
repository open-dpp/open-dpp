import { LanguageTextJsonSchema } from "@open-dpp/dto";
import { z } from "zod";

export const SubmodelBaseFormSchema = z.object({
  idShort: z.string().min(1, "IdShort is required"),
  displayName: LanguageTextJsonSchema.array(),
});

export function submodelBaseFormDefaultValues(language: string) {
  return {
    idShort: "",
    displayName: [{ language }],
  };
}
